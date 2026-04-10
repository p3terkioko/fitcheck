/**
 * Claim Extraction Service
 *
 * Takes a raw transcript from a social media video and uses the Groq LLM
 * to identify all distinct, verifiable fitness and nutrition claims within it.
 *
 * Returns a structured array of claim strings ready for the RAG verifier.
 */

'use strict';

const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are a fitness and nutrition claim extraction specialist. Your task is to read a transcript from a fitness-related social media video and extract every distinct, verifiable factual claim about exercise, nutrition, or health.

IMPORTANT CONTEXT: These transcripts come from spoken social media videos (TikTok, Instagram Reels, YouTube Shorts). They contain:
- Informal speech, filler words ("like", "you know", "basically"), incomplete sentences
- Repeated ideas phrased differently across the video
- Implicit claims stated conversationally rather than as formal assertions

Your job is to SYNTHESIZE the underlying factual claims from the spoken content — do not just copy phrases. Reconstruct what the speaker is asserting as clean declarative sentences even if they said it informally.

Rules for extraction:
- Include specific, verifiable assertions about exercise, nutrition, supplements, or health physiology (e.g. "creatine increases muscle strength", "eating protein within 30 minutes of training builds more muscle").
- Synthesize implicit claims: if a creator says "I stopped eating carbs after 6pm and lost 10 pounds", extract "Avoiding carbohydrates after 6pm promotes fat loss".
- Exclude pure personal anecdotes that cannot be generalised (e.g. "this worked for me personally").
- Exclude promotional language, calls to action, and social media filler (e.g. "follow for more tips", "link in bio").
- Exclude vague generalities that cannot be verified against research (e.g. "exercise is good for you").
- Rephrase each claim as a clean, standalone declarative sentence. Do not copy filler words from the transcript.
- If the same claim appears multiple times, include it only once.
- Aim to find ALL distinct verifiable claims — most fitness videos contain between 3 and 15.
- If truly no verifiable fitness or nutrition claims are found, return an empty array.

You MUST respond with ONLY a raw JSON array of strings. No preamble, no markdown, no explanation. Start your response with [ and end with ].

Example output:
["Squatting below parallel activates more glute muscle than a quarter squat.", "Consuming 1.6 grams of protein per kilogram of body weight maximises muscle protein synthesis.", "HIIT burns more calories in less time than steady-state cardio."]`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip markdown fences and extract the JSON array from anywhere in the
 * LLM response, in case the model does not follow the raw-JSON instruction.
 */
function parseClaimsFromResponse(raw) {
    // Try direct parse first
    try {
        const parsed = JSON.parse(raw.trim());
        if (Array.isArray(parsed)) return parsed;
    } catch (_) {}

    // Strip markdown fences and retry
    const stripped = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();

    try {
        const parsed = JSON.parse(stripped);
        if (Array.isArray(parsed)) return parsed;
    } catch (_) {}

    // Extract the first [...] block found anywhere in the response
    const match = stripped.match(/\[[\s\S]*\]/);
    if (match) {
        try {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) {}
    }

    // Nothing worked — return empty so the pipeline can handle it gracefully
    return [];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract verifiable fitness and nutrition claims from a transcript.
 *
 * @param {string} transcript - Raw text from Whisper transcription
 * @returns {string[]}        - Array of claim strings (may be empty)
 */
async function extractClaims(transcript) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set.');
    }
    if (!transcript || transcript.trim().length === 0) {
        return [];
    }

    // Truncate very long transcripts — Whisper can produce thousands of words
    // for long videos. We cap at ~4000 words to stay within context limits.
    const words = transcript.split(/\s+/);
    const truncated = words.length > 4000
        ? words.slice(0, 4000).join(' ') + ' [transcript truncated]'
        : transcript;

    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            if (attempt > 0) {
                const waitMs = attempt * 12000;
                console.log(`  Claim extraction rate limit — waiting ${waitMs / 1000}s...`);
                await new Promise(r => setTimeout(r, waitMs));
            }
            response = await axios.post(
                GROQ_API_URL,
                {
                    model,
                    messages: [
                        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
                        { role: 'user',   content: `TRANSCRIPT:\n\n${truncated}` },
                    ],
                    temperature: 0.1,
                    max_tokens: 1024,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type':  'application/json',
                    },
                    timeout: 30_000,
                }
            );
            break; // success
        } catch (err) {
            if (err.response?.status === 429 && attempt < 2) continue;
            throw err;
        }
    }

    const raw = response.data.choices[0].message.content;
    const claims = parseClaimsFromResponse(raw);

    // Filter out any non-string entries and empty strings defensively
    return claims
        .filter(c => typeof c === 'string' && c.trim().length > 0)
        .map(c => c.trim());
}

module.exports = { extractClaims };
