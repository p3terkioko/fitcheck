require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const axios      = require('axios');
const Joi        = require('joi');

const pool       = require('./services/db');
const { transcribeUrl, cleanupDir, SUPPORTED_DOMAINS }
                 = require('./services/transcription');
const { extractClaims }
                 = require('./services/claimExtraction');
const { normalizeUrl, hashUrl, detectPlatform }
                 = require('./services/urlUtils');
const { enrichWithUrls }
                 = require('./services/pubmed');
const { authenticateToken, optionalAuth }
                 = require('./middleware/auth');

const app        = express();
const PORT       = process.env.NODE_PORT || 3000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL
    || `http://localhost:${process.env.PYTHON_PORT || 8000}`;

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting — global IP limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Per-user rate limit for expensive AI endpoints (applied after auth middleware)
const verifyRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { success: false, error: 'Too many requests. Please wait a few minutes before verifying another claim.' }
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

// Text claim verification
const verifySchema = Joi.object({
    claim: Joi.string().min(10).max(2000).required().messages({
        'string.min': 'Please enter a full claim (at least 10 characters)',
        'string.max': 'Claim cannot exceed 2000 characters',
        'any.required': 'A claim is required'
    }),
    max_results:          Joi.number().integer().min(1).max(20).default(5),
    similarity_threshold: Joi.number().min(0).max(1).default(0.5),
    llm_provider:         Joi.string().valid('groq', 'none').default('groq')
    // NOTE: userContext is NOT accepted here — it comes from req.user
});

// URL analysis
const analyzeUrlSchema = Joi.object({
    url:         Joi.string().uri().required().messages({
        'string.uri': 'Please provide a valid URL including https://',
        'any.required': 'A video URL is required'
    }),
    max_results: Joi.number().integer().min(1).max(10).default(5)
});

// Onboarding / profile update
const profileSchema = Joi.object({
    age_group: Joi.string()
        .valid('under_18', '18_35', '36_55', '55_plus')
        .optional(),
    biological_sex: Joi.string()
        .valid('male', 'female', 'prefer_not_to_say')
        .optional(),
    conditions: Joi.array()
        .items(Joi.string().valid(
            'pregnant', 'postpartum', 'cardiovascular',
            'diabetes', 'kidney_liver', 'osteoporosis', 'none'
        ))
        .optional(),
    additional_context: Joi.string().max(500).allow('').optional()
});

// Direct search passthrough
const searchSchema = Joi.object({
    query: Joi.string().min(1).max(2000).required(),
    max_results: Joi.number().integer().min(1).max(20).default(5),
    similarity_threshold: Joi.number().min(0).max(1).default(0.5)
});

// ─────────────────────────────────────────────────────────────────────────────
// synthesizeResponse
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls Groq/Llama to synthesise a verdict from claim + RAG results.
 * userContext is read from the authenticated user's profile.
 *
 * Returns the full result object matching the frontend shape:
 * {
 *   verdict, verdictLabel, confidenceScore, confidenceLabel,
 *   oneLineSummary, reasoning, keyPoints,
 *   evidenceCards: [{ title, authors, year, journal, doi, pubmedUrl,
 *                     relevanceScore, stance, finding }],
 *   sourcesCount, reliabilityNote, insufficientEvidenceNote,
 *   profileContext: null | { hasRelevantContext, contextualVerdict,
 *                            warnings, consultProfessional }
 * }
 */
async function synthesizeResponse(claim, searchResults, userContext = null) {

    // ── Empty results ────────────────────────────────────────────────────
    if (!searchResults || searchResults.length === 0) {
        return {
            verdict: 'UNCLEAR_LIMITED_RESEARCH',
            verdictLabel: 'Unclear — limited research',
            confidenceScore: 0,
            confidenceLabel: 'Very little evidence',
            oneLineSummary: 'No peer-reviewed research was found that relates to this claim.',
            reasoning: 'This does not mean the claim is true or false. FitCheck could not find relevant studies in its current database. The claim may use terminology not present in the research corpus, or may be too specific or recent to have been studied.',
            keyPoints: [],
            evidenceCards: [],
            sourcesCount: 0,
            reliabilityNote: null,
            insufficientEvidenceNote: 'Not enough research to verify. This does not mean the claim is false — it means we could not find peer-reviewed evidence specifically about it. Treat with caution.',
            profileContext: null
        };
    }

    // ── Build context block ──────────────────────────────────────────────
    const enriched = enrichWithUrls(searchResults);

    const context = enriched.map((r, i) => `
Source ${i + 1}:
Title: ${r.title}
Similarity: ${Math.round(r.similarity_score * 100)}%
Year: ${r.metadata?.year || 'unknown'}
Journal: ${r.metadata?.journal || 'unknown'}
Authors: ${r.metadata?.authors || 'unknown'}
Content: ${r.text_chunk.substring(0, 700)}${r.text_chunk.length > 700 ? '...' : ''}
`).join('\n---\n');

    // ── Build profile context block ──────────────────────────────────────
    let profileBlock = '';
    if (userContext && (
        userContext.age_group ||
        userContext.biological_sex ||
        (userContext.conditions && userContext.conditions.length > 0 &&
         !userContext.conditions.includes('none'))
    )) {
        profileBlock = `
ADDITIONAL USER CONTEXT:
Age group: ${userContext.age_group || 'not specified'}
Biological sex: ${userContext.biological_sex || 'not specified'}
Conditions: ${(userContext.conditions || []).filter(c => c !== 'none').join(', ') || 'none'}
Additional context: ${userContext.additional_context || 'none'}

Add a "profileContext" field to your JSON:
"profileContext": {
  "hasRelevantContext": <true ONLY if this profile genuinely and meaningfully
                         changes the safety or interpretation of this specific
                         claim. False if the general findings apply without
                         significant differences.>,
  "contextualVerdict": "<If hasRelevantContext true: one plain-English sentence
                         explaining how evidence applies differently for this
                         profile. If false: 'The general findings above apply
                         to your profile without significant differences.'>",
  "warnings": [
    "<Only include a warning string when this specific claim + condition
     creates a genuine safety concern. Reference established guidelines:
     ACOG for pregnancy/postpartum, WHO for 55+, ADA for diabetes, AHA
     for cardiovascular. Max 40 words per warning. Empty array if none.>"
  ],
  "consultProfessional": <true ONLY when this specific claim + condition
                          combination genuinely warrants professional input.>
}

CRITICAL RULES FOR profileContext:
- Only set hasRelevantContext: true when context genuinely changes things
- Do NOT warn on every result — only when safety is actually affected
- Do NOT suggest stopping prescribed treatment or make a diagnosis
- For under_18: flag extreme caloric restriction, heavy unsupervised lifting,
  stimulant supplements, body composition claims
- For pregnant: flag HIIT, core exercises post-first-trimester, ALL supplements,
  caloric restriction, hot environments, contact sports, supine position post-16wks
- For postpartum: flag core work (diastasis recti), pelvic floor, return-to-running
- For cardiovascular: flag HIIT, stimulant supplements, breath-holding, extreme endurance
- For diabetes: flag fasted training, low-carb protocols, exercise timing, blood
  glucose-affecting supplements
- For kidney_liver: flag high-protein diets, creatine, ALL fat burners,
  hepatotoxic supplements
- For 55_plus: check whether age-specific evidence differs from general adult evidence.
  Sarcopenia, bone density, balance, fall prevention are meaningfully different.
`;
    }

    // ── Build full prompt ────────────────────────────────────────────────
    const prompt = `You are FitCheck, a fitness misinformation verification system.
Analyse the following claim against the provided peer-reviewed research evidence
and return a precise structured JSON verdict.

CLAIM: "${claim}"

RESEARCH EVIDENCE:
${context}

VERDICT VALUES — use exactly one:
- BACKED_BY_RESEARCH: evidence consistently supports the claim
- PARTLY_TRUE: evidence partially supports, or supports with important caveats
- NOT_SUPPORTED_BY_EVIDENCE: evidence contradicts or does not support the claim
- UNCLEAR_LIMITED_RESEARCH: insufficient specific evidence to reach a conclusion

CONFIDENCE SCORE — integer 0-100, map to labels exactly:
85-100 → "Strong consensus"
65-84  → "Reasonable evidence"
45-64  → "Mixed evidence"
25-44  → "Weak evidence"
0-24   → "Very little evidence"

LANGUAGE RULES:
- Short sentences. Max 20 words per sentence.
- No jargon. Plain English throughout.
- Name the mechanism, not just the conclusion.
- oneLineSummary must state what IS true, not just what is not.
  BAD: "This claim is not supported."
  GOOD: "Spot reduction does not work — fat loss happens body-wide and no
         exercise can target a specific area."
- Never say: "as an AI", "clearly", "it is important to note that",
  "studies suggest", "research indicates"
- Do not end with "consult a professional" — that belongs in profileContext only
${profileBlock}

Respond with ONLY this raw JSON object. No markdown. No preamble.
Start with { and end with }:

{
  "verdict": "<verdict value>",
  "verdictLabel": "<Backed by research | Partly true | Not supported by evidence | Unclear — limited research>",
  "confidenceScore": <integer 0-100>,
  "confidenceLabel": "<label from mapping>",
  "oneLineSummary": "<one sentence, plain English, states what IS true>",
  "reasoning": "<2-4 short sentences. No jargon. Name mechanism. Acknowledge nuance briefly.>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "evidenceCards": [
    {
      "title": "<paper title max 80 chars>",
      "authors": "<First Author et al.>",
      "year": <year integer or null>,
      "journal": "<journal name or null>",
      "doi": "<doi string or null>",
      "relevanceScore": <similarity * 100 rounded>,
      "stance": "SUPPORTS" | "CONTRADICTS" | "NEUTRAL",
      "finding": "<one plain-English sentence on what this source contributes>"
    }
  ],
  "sourcesCount": <integer>,
  "reliabilityNote": "<one honest sentence on study quality or limitations>",
  "insufficientEvidenceNote": null
}`;

    // ── Call Groq ────────────────────────────────────────────────────────
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    let parsedResponse;
    try {
        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model:       process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                messages:    [{ role: 'user', content: prompt }],
                max_tokens:  1500,
                temperature: 0.2,
                top_p:       0.9
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type':  'application/json'
                },
                timeout: 20000
            }
        );

        const raw = groqResponse.data.choices[0].message.content;
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const clean = jsonMatch ? jsonMatch[0] : raw.trim();
        parsedResponse = JSON.parse(clean);

    } catch (err) {
        console.error('Groq synthesis failed:', err.message);
        return generateFallbackResponse(enriched, userContext);
    }

    // ── Enrich evidenceCards with pubmedUrl from metadata ────────────────
    if (Array.isArray(parsedResponse.evidenceCards)) {
        parsedResponse.evidenceCards = parsedResponse.evidenceCards.map(
            (card, i) => ({
                ...card,
                pubmedUrl: enriched[i]?.pubmedUrl || null
            })
        );
    }

    // ── Ensure profileContext is present ─────────────────────────────────
    if (!parsedResponse.profileContext) {
        parsedResponse.profileContext = null;
    }

    return parsedResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateFallbackResponse
// ─────────────────────────────────────────────────────────────────────────────
function generateFallbackResponse(searchResults, userContext = null) {
    if (!searchResults || searchResults.length === 0) {
        return {
            verdict: 'UNCLEAR_LIMITED_RESEARCH',
            verdictLabel: 'Unclear — limited research',
            confidenceScore: 0,
            confidenceLabel: 'Very little evidence',
            oneLineSummary: 'No relevant research found for this claim.',
            reasoning: 'FitCheck could not find peer-reviewed evidence in its database for this specific claim.',
            keyPoints: [],
            evidenceCards: [],
            sourcesCount: 0,
            reliabilityNote: null,
            insufficientEvidenceNote: 'Not enough research to verify. Treat with caution.',
            profileContext: null,
            _fallback: true
        };
    }

    const enriched = enrichWithUrls(searchResults);
    const top = enriched[0];
    const avg = enriched.reduce((s, r) => s + r.similarity_score, 0) / enriched.length;

    let verdict, verdictLabel, confidenceScore;
    if (top.similarity_score > 0.8) {
        verdict = 'BACKED_BY_RESEARCH'; verdictLabel = 'Backed by research'; confidenceScore = 72;
    } else if (top.similarity_score > 0.65) {
        verdict = 'PARTLY_TRUE'; verdictLabel = 'Partly true'; confidenceScore = 52;
    } else {
        verdict = 'UNCLEAR_LIMITED_RESEARCH'; verdictLabel = 'Unclear — limited research'; confidenceScore = 28;
    }

    const confidenceLabel = confidenceScore >= 85 ? 'Strong consensus'
        : confidenceScore >= 65 ? 'Reasonable evidence'
        : confidenceScore >= 45 ? 'Mixed evidence'
        : confidenceScore >= 25 ? 'Weak evidence'
        : 'Very little evidence';

    return {
        verdict, verdictLabel, confidenceScore, confidenceLabel,
        oneLineSummary: `Based on ${enriched.length} research source${enriched.length > 1 ? 's' : ''}, this claim shows ${verdictLabel.toLowerCase()} in the available literature.`,
        reasoning: `${enriched.length} peer-reviewed sources were found with an average relevance of ${Math.round(avg * 100)}%. This is a rule-based fallback — LLM synthesis was temporarily unavailable.`,
        keyPoints: [
            `${enriched.length} relevant research source${enriched.length > 1 ? 's' : ''} found`,
            `Highest relevance: ${Math.round(top.similarity_score * 100)}%`,
            `Average relevance: ${Math.round(avg * 100)}%`
        ],
        evidenceCards: enriched.slice(0, 5).map(r => ({
            title:          r.title.length > 80 ? r.title.substring(0, 77) + '...' : r.title,
            authors:        r.metadata?.authors || null,
            year:           r.metadata?.year    || null,
            journal:        r.metadata?.journal || null,
            doi:            r.metadata?.doi     || null,
            pubmedUrl:      r.pubmedUrl          || null,
            relevanceScore: Math.round(r.similarity_score * 100),
            stance:         'NEUTRAL',
            finding:        r.text_chunk.substring(0, 150) + '...'
        })),
        sourcesCount: enriched.length,
        reliabilityNote: 'Rule-based fallback — LLM synthesis unavailable. Evidence cards show raw similarity without semantic interpretation.',
        insufficientEvidenceNote: null,
        profileContext: null,
        _fallback: true
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// saveVerification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves a completed verification to the verifications table.
 * Returns the inserted id, or null on failure.
 */
async function saveVerification(userId, claim, result, inputType, sourceUrl = null, transcriptId = null) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO verifications
                (user_id, claim, result, input_type, source_url, transcript_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [userId, claim, JSON.stringify(result), inputType, sourceUrl, transcriptId]
        );
        return rows[0].id;
    } catch (err) {
        console.error('Failed to save verification:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// mergeEvidence — combines original evidence cards with new ML search results
// ─────────────────────────────────────────────────────────────────────────────
function mergeEvidence(originalCards, newSearchResults) {
    const enrichedNew = enrichWithUrls(newSearchResults).map(r => ({
        title:          r.title,
        authors:        r.metadata?.authors || null,
        year:           r.metadata?.year    || null,
        journal:        r.metadata?.journal || null,
        doi:            r.metadata?.doi     || null,
        pubmedUrl:      r.pubmedUrl          || null,
        relevanceScore: Math.round(r.similarity_score * 100),
        stance:         'NEUTRAL',
        finding:        r.text_chunk.substring(0, 200)
    }));

    const seen = new Set(originalCards.map(c => c.title?.toLowerCase().trim()));
    const unique = enrichedNew.filter(c => !seen.has(c.title?.toLowerCase().trim()));
    return [...originalCards, ...unique].slice(0, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// answerFollowUp — LLM synthesis for follow-up questions
// ─────────────────────────────────────────────────────────────────────────────
async function answerFollowUp(originalClaim, originalResult, question, evidence) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return { answer: 'LLM service not configured.', relatedEvidence: [] };
    }

    const evidenceBlock = evidence.slice(0, 5).map((card, i) =>
        `Evidence ${i + 1}: ${card.title}\nFinding: ${card.finding}\nStance: ${card.stance}`
    ).join('\n\n');

    const prompt = `You are FitCheck, answering a follow-up question about a verified fitness claim.

Original claim: "${originalClaim}"
Original verdict: ${originalResult.verdictLabel || originalResult.verdict}
Original summary: ${originalResult.oneLineSummary || ''}

Research evidence:
${evidenceBlock}

Follow-up question: "${question}"

Answer in 2-3 plain-English sentences. Be specific and cite evidence where relevant.
If the evidence does not directly address this question, say so clearly.
Do not mention being an AI. Keep language simple and direct.

Respond with ONLY this JSON (no markdown, no preamble):
{
  "answer": "<2-3 sentence answer>",
  "relatedEvidence": [
    { "title": "<paper title>", "finding": "<one sentence>", "stance": "SUPPORTS|CONTRADICTS|NEUTRAL", "pubmedUrl": null }
  ]
}`;

    try {
        const resp = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model:       process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                messages:    [{ role: 'user', content: prompt }],
                max_tokens:  600,
                temperature: 0.2
            },
            {
                headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 20000
            }
        );
        const raw = resp.data.choices[0].message.content;
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : raw.trim());
    } catch (err) {
        console.error('Follow-up synthesis failed:', err.message);
        return { answer: 'Unable to generate an answer at this time. Please try again.', relatedEvidence: [] };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeUser helper
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeUser(user) {
    return {
        id:                   user.id,
        email:                user.email,
        displayName:          user.display_name,
        avatarUrl:            user.avatar_url,
        ageGroup:             user.age_group,
        biologicalSex:        user.biological_sex,
        conditions:           user.conditions || [],
        additionalContext:    user.additional_context,
        onboardingCompleted:  user.onboarding_completed,
        createdAt:            user.created_at
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /health — no auth required
 */
app.get('/health', async (req, res) => {
    try {
        const mlHealthResponse = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
        res.json({
            status: 'healthy',
            service: 'FitCheck Engine API',
            timestamp: new Date().toISOString(),
            ml_service: {
                status: mlHealthResponse.data.status,
                database_connected: mlHealthResponse.data.database_connected,
                model_loaded: mlHealthResponse.data.model_loaded
            }
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({
            status: 'unhealthy',
            service: 'FitCheck Engine API',
            timestamp: new Date().toISOString(),
            error: 'ML service unavailable',
            ml_service: {
                status: 'error',
                error: error.message
            }
        });
    }
});

/**
 * GET /api/stats — no auth required
 */
app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/stats`, { timeout: 10000 });
        res.json({
            success: true,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Stats request failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch database statistics',
            details: error.response?.data || error.message
        });
    }
});

/**
 * GET /api/auth/me — authenticated
 * Returns the current user's profile.
 */
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        user: sanitizeUser(req.user)
    });
});

/**
 * POST /api/auth/profile — authenticated
 * Saves or updates the user's health profile after onboarding.
 */
app.post('/api/auth/profile', authenticateToken, async (req, res) => {
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    try {
        const updates = [];
        const params = [];
        let i = 1;

        if (value.age_group !== undefined) {
            updates.push(`age_group = $${i++}`);
            params.push(value.age_group);
        }
        if (value.biological_sex !== undefined) {
            updates.push(`biological_sex = $${i++}`);
            params.push(value.biological_sex);
        }
        if (value.conditions !== undefined) {
            updates.push(`conditions = $${i++}`);
            params.push(value.conditions);
        }
        if (value.additional_context !== undefined) {
            updates.push(`additional_context = $${i++}`);
            params.push(value.additional_context);
        }

        // Mark onboarding complete whenever profile is saved
        updates.push(`onboarding_completed = true`);
        updates.push(`updated_at = NOW()`);

        params.push(req.user.id);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`,
            params
        );

        const updated = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [req.user.id]
        );

        res.json({
            success: true,
            user: sanitizeUser(updated.rows[0])
        });

    } catch (err) {
        console.error('Profile update error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
});

/**
 * POST /api/verify — authenticated
 */
app.post('/api/verify', authenticateToken, verifyRateLimit, async (req, res) => {
    const startTime = Date.now();

    const { error, value } = verifySchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    const { claim, max_results, similarity_threshold, llm_provider } = value;

    // Build userContext from authenticated user's stored profile
    const userContext = req.user.onboarding_completed ? {
        age_group:          req.user.age_group,
        biological_sex:     req.user.biological_sex,
        conditions:         req.user.conditions || [],
        additional_context: req.user.additional_context
    } : null;

    try {
        // RAG search
        const searchResponse = await axios.post(
            `${ML_SERVICE_URL}/search`,
            { query: claim, max_results, similarity_threshold },
            { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
        );

        const searchResults = searchResponse.data.results || [];

        // LLM synthesis
        const result = await synthesizeResponse(claim, searchResults, userContext);

        // Save to history and get verificationId
        const verificationId = await saveVerification(req.user.id, claim, result, 'text');

        res.json({
            success: true,
            claim,
            result,
            verificationId,
            metadata: {
                searchTimeMs:          searchResponse.data.search_time_ms,
                totalProcessingTimeMs: Date.now() - startTime,
                similarityThreshold:   similarity_threshold,
                maxResults:            max_results,
                llmProvider:           llm_provider,
                modelUsed:             process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                userContextProvided:   !!userContext,
                timestamp:             new Date().toISOString()
            }
        });

    } catch (err) {
        console.error('Verify error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Research search service unavailable. Please try again.'
            });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/analyze-url — authenticated
 * Full URL pipeline with transcript caching.
 * Audio is deleted immediately after transcription.
 */
app.post('/api/analyze-url', authenticateToken, verifyRateLimit, async (req, res) => {
    const { error, value } = analyzeUrlSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    const { url, max_results } = value;
    const pipelineStart = Date.now();

    // Build userContext from authenticated user's profile
    const userContext = req.user.onboarding_completed ? {
        age_group:          req.user.age_group,
        biological_sex:     req.user.biological_sex,
        conditions:         req.user.conditions || [],
        additional_context: req.user.additional_context
    } : null;

    try {
        // ── Step 1: Transcript (cache or fresh) ───────────────────────────
        const normalizedUrl  = normalizeUrl(url);
        const urlHash        = hashUrl(normalizedUrl);
        const platform       = detectPlatform(url);

        let transcript, fromCache = false, transcriptId = null;
        const transcriptStart = Date.now();

        const cached = await pool.query(
            'SELECT id, transcript FROM transcripts WHERE url_hash = $1',
            [urlHash]
        );

        if (cached.rows.length > 0) {
            // Cache hit — reuse transcript, skip download
            transcript   = cached.rows[0].transcript;
            transcriptId = cached.rows[0].id;
            fromCache    = true;

            // Update access stats (non-blocking)
            pool.query(
                `UPDATE transcripts
                 SET last_accessed = NOW(),
                     access_count  = access_count + 1
                 WHERE url_hash = $1`,
                [urlHash]
            ).catch(e => console.error('Transcript access update failed:', e.message));

        } else {
            // Cache miss — download audio, transcribe, delete audio immediately
            let tmpDir = null;
            try {
                const result = await transcribeUrl(url);
                tmpDir     = result.tmpDir;
                transcript = result.transcript;
            } finally {
                // Audio deleted immediately regardless of success or failure
                if (tmpDir) cleanupDir(tmpDir);
            }

            // Store transcript
            const wordCount = transcript.split(/\s+/).length;
            const inserted  = await pool.query(
                `INSERT INTO transcripts
                    (url, url_hash, transcript, platform, word_count)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [normalizedUrl, urlHash, transcript, platform, wordCount]
            );
            transcriptId = inserted.rows[0].id;
        }

        const transcribeMs = Date.now() - transcriptStart;

        // ── Step 2: Extract claims ─────────────────────────────────────────
        const extractStart = Date.now();
        const claims       = await extractClaims(transcript);
        const extractMs    = Date.now() - extractStart;

        if (claims.length === 0) {
            return res.json({
                success: true,
                data: {
                    url,
                    platform,
                    fromCache,
                    transcript,
                    claimsFound: 0,
                    claims: [],
                    message: 'No verifiable fitness or nutrition claims were identified in this video.'
                },
                metadata: {
                    transcriptionMs:   transcribeMs,
                    extractionMs:      extractMs,
                    totalProcessingMs: Date.now() - pipelineStart,
                    timestamp:         new Date().toISOString()
                }
            });
        }

        // ── Step 3: Verify each claim ──────────────────────────────────────
        const verifyStart    = Date.now();
        const verifiedClaims = await Promise.all(
            claims.map(async (claim, idx) => {
                try {
                    const searchResp = await axios.post(
                        `${ML_SERVICE_URL}/search`,
                        { query: claim, max_results, similarity_threshold: 0.4 },
                        { timeout: 30000 }
                    );
                    const searchResults = searchResp.data.results || [];
                    const result = await synthesizeResponse(
                        claim, searchResults, userContext
                    );

                    // Save each claim and capture its ID for follow-up Q&A
                    const verificationId = await saveVerification(
                        req.user.id, claim, result, 'url', url, transcriptId
                    );

                    return { claimIndex: idx + 1, claim, result, verificationId };

                } catch (claimErr) {
                    return {
                        claimIndex: idx + 1,
                        claim,
                        result: generateFallbackResponse([], userContext)
                    };
                }
            })
        );
        const verifyMs = Date.now() - verifyStart;

        res.json({
            success: true,
            data: {
                url,
                platform,
                fromCache,
                transcript,
                claimsFound: claims.length,
                claims: verifiedClaims
            },
            metadata: {
                transcriptionMs:   transcribeMs,
                extractionMs:      extractMs,
                verificationMs:    verifyMs,
                totalProcessingMs: Date.now() - pipelineStart,
                timestamp:         new Date().toISOString()
            }
        });

    } catch (err) {
        console.error('analyze-url error:', err.message);
        res.status(422).json({
            success: false,
            error: err.message,
            supportedPlatforms: SUPPORTED_DOMAINS,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/history — authenticated
 * Paginated verification history for the authenticated user.
 */
app.get('/api/history', authenticateToken, async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const offset = (page - 1) * limit;

    try {
        const [rows, countResult] = await Promise.all([
            pool.query(
                `SELECT id, claim, result, input_type, source_url, created_at
                 FROM verifications
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT $2 OFFSET $3`,
                [req.user.id, limit, offset]
            ),
            pool.query(
                'SELECT COUNT(*) FROM verifications WHERE user_id = $1',
                [req.user.id]
            )
        ]);

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: {
                verifications: rows.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: offset + limit < total
                }
            }
        });

    } catch (err) {
        console.error('History error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
});

/**
 * GET /api/history/stats — authenticated
 * Summary stats for the history dashboard.
 */
app.get('/api/history/stats', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*)                                            AS total,
                COUNT(*) FILTER (WHERE result->>'verdict'
                    = 'BACKED_BY_RESEARCH')                        AS backed,
                COUNT(*) FILTER (WHERE result->>'verdict'
                    = 'PARTLY_TRUE')                               AS partly_true,
                COUNT(*) FILTER (WHERE result->>'verdict'
                    = 'NOT_SUPPORTED_BY_EVIDENCE')                 AS not_supported,
                COUNT(*) FILTER (WHERE result->>'verdict'
                    = 'UNCLEAR_LIMITED_RESEARCH')                  AS unclear
             FROM verifications
             WHERE user_id = $1`,
            [req.user.id]
        );

        const row = result.rows[0];
        res.json({
            success: true,
            data: {
                total:            parseInt(row.total),
                backedByResearch: parseInt(row.backed),
                partlyTrue:       parseInt(row.partly_true),
                notSupported:     parseInt(row.not_supported),
                unclear:          parseInt(row.unclear)
            }
        });

    } catch (err) {
        console.error('History stats error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

/**
 * POST /api/verify/followup — authenticated
 * Answer a follow-up question about an existing verification using original
 * context + fresh RAG search for the question.
 */
app.post('/api/verify/followup', authenticateToken, async (req, res) => {
    const { verificationId, question } = req.body;

    if (!verificationId || typeof verificationId !== 'string') {
        return res.status(400).json({ success: false, error: 'verificationId is required' });
    }
    if (!question || typeof question !== 'string' || question.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'question must be at least 5 characters' });
    }

    try {
        // Load original verification (scoped to this user)
        const { rows } = await pool.query(
            'SELECT claim, result FROM verifications WHERE id = $1 AND user_id = $2',
            [verificationId, req.user.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, error: 'Verification not found' });
        }
        const { claim: originalClaim, result: originalResult } = rows[0];

        // Run semantic search on the follow-up question
        const searchResp = await axios.post(
            `${ML_SERVICE_URL}/search`,
            { query: question.trim(), max_results: 5, similarity_threshold: 0.45 },
            { timeout: 15000 }
        );
        const newEvidence = searchResp.data.results || [];

        // Merge with original evidence cards
        const allEvidence = mergeEvidence(originalResult.evidenceCards || [], newEvidence);

        // LLM synthesis
        const answer = await answerFollowUp(originalClaim, originalResult, question.trim(), allEvidence);

        res.json({ success: true, data: answer });

    } catch (err) {
        console.error('Follow-up error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, error: 'Research service unavailable. Please try again.' });
        }
        res.status(500).json({ success: false, error: 'Failed to generate follow-up answer' });
    }
});

/**
 * POST /api/search — no auth required
 * Direct ML service passthrough for testing.
 */
app.post('/api/search', async (req, res) => {
    try {
        const { error, value } = searchSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                details: error.details[0].message
            });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/search`, value, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });

        res.json({
            success: true,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Direct search failed:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: 'Search failed',
            details: error.response?.data || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Error and 404 handlers
// ─────────────────────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            'GET  /health',
            'GET  /api/stats',
            'GET  /api/auth/me',
            'POST /api/auth/profile',
            'POST /api/verify',
            'POST /api/verify/followup',
            'POST /api/analyze-url',
            'GET  /api/history',
            'GET  /api/history/stats',
            'POST /api/search'
        ],
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 FitCheck API running on port ${PORT}`);
    console.log(`🔐 Auth: Supabase JWT`);
    console.log(`📋 Endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /api/stats`);
    console.log(`   GET  /api/auth/me`);
    console.log(`   POST /api/auth/profile`);
    console.log(`   POST /api/verify`);
    console.log(`   POST /api/analyze-url`);
    console.log(`   GET  /api/history`);
    console.log(`   GET  /api/history/stats`);
    console.log(`   POST /api/search`);
    console.log(`🤖 ML Service: ${ML_SERVICE_URL}`);
});

module.exports = app;
