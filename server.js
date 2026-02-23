require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const Joi = require('joi');

const app = express();
const PORT = process.env.NODE_PORT || 3000;
const ML_SERVICE_URL = `http://localhost:${process.env.PYTHON_PORT || 8000}`;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Validation schemas
const verifySchema = Joi.object({
    claim: Joi.string().min(10).max(2000).required().messages({
        'string.min': 'Claim must be at least 10 characters long',
        'string.max': 'Claim cannot exceed 2000 characters',
        'any.required': 'Claim is required'
    }),
    max_results: Joi.number().integer().min(1).max(20).default(5),
    similarity_threshold: Joi.number().min(0).max(1).default(0.5),
    synthesize_response: Joi.boolean().default(true), // New option for LLM synthesis
    llm_provider: Joi.string().valid('groq', 'openai', 'none').default('groq')
});

// Utility functions
function logRequest(req, startTime) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Processing claim: "${req.body.claim?.substring(0, 100)}${req.body.claim?.length > 100 ? '...' : ''}"`);
}

function logResponse(req, results, duration) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Completed in ${duration}ms - Found ${results?.length || 0} results`);
}

/**
 * Synthesize answer using LLM based on search results
 */
async function synthesizeResponse(claim, searchResults, llmProvider = 'ollama') {
    if (!searchResults || searchResults.length === 0) {
        return {
            synthesized_answer: "No relevant research evidence was found for this claim. This might indicate that the claim is either unsupported by current literature, uses terminology not found in the research database, or requires reformulation using different keywords.",
            confidence: "no_evidence",
            sources_used: 0
        };
    }

    try {
        // Prepare context from search results
        const context = searchResults.map((result, index) => {
            return `Source ${index + 1} (Similarity: ${result.similarity_score}):
Title: ${result.title}
Content: ${result.text_chunk.substring(0, 800)}${result.text_chunk.length > 800 ? '...' : ''}
`;
        }).join('\n\n');

        const prompt = `You're a helpful fitness expert who loves explaining science in simple terms. Someone just asked you about this claim, and you have some research to help answer it.

CLAIM: "${claim}"

RESEARCH EVIDENCE:
${context}

Respond with a JSON object containing these exact fields:
{
  "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE",
  "confidence": "high" | "moderate" | "low",
  "summary": "A conversational 2-3 sentence explanation in simple terms",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "sources_analyzed": ${searchResults.length},
  "reliability_note": "Brief note about study quality or limitations"
}

Be conversational and natural in the summary - like you're explaining to a friend, not writing a medical journal.`;

        let synthesizedResponse = '';

        if (llmProvider === 'groq') {
            // Use Groq API for fast Llama inference
            try {
                const GROQ_API_KEY = process.env.GROQ_API_KEY;
                if (!GROQ_API_KEY) {
                    throw new Error('Groq API key not configured. Set GROQ_API_KEY environment variable.');
                }

                const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                    messages: [{ 
                        role: 'user', 
                        content: prompt 
                    }],
                    max_tokens: 400,
                    temperature: 0.7,
                    top_p: 0.9
                }, {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000 // Groq is very fast
                });

                synthesizedResponse = groqResponse.data.choices[0].message.content;
                
                // Try to parse the JSON response from LLM
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(synthesizedResponse);
                } catch (parseError) {
                    console.log('LLM response parsing failed, using fallback format');
                    parsedResponse = {
                        verdict: "INSUFFICIENT_EVIDENCE",
                        confidence: "low",
                        summary: synthesizedResponse.substring(0, 200) + "...",
                        key_points: ["Response format error occurred"],
                        sources_analyzed: searchResults.length,
                        reliability_note: "Technical parsing issue with response"
                    };
                }
            } catch (groqError) {
                console.log('Groq API error:', groqError.response?.data || groqError.message);
                if (groqError.response?.status === 401) {
                    throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY.');
                }
                throw new Error('Groq API unavailable');
            }
        } else if (llmProvider === 'openai') {
            // OpenAI API integration (requires API key)
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) {
                throw new Error('OpenAI API key not configured');
            }

            const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            synthesizedResponse = openaiResponse.data.choices[0].message.content;
        }

        // Determine confidence based on evidence quality
        const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity_score, 0) / searchResults.length;
        const topSimilarity = searchResults[0].similarity_score;
        
        let confidence;
        if (topSimilarity > 0.8 && avgSimilarity > 0.7) {
            confidence = "high";
        } else if (topSimilarity > 0.65 && avgSimilarity > 0.6) {
            confidence = "moderate";
        } else {
            confidence = "low";
        }

        return {
            synthesized_answer: parsedResponse,
            confidence: confidence,
            sources_used: searchResults.length,
            average_similarity: Math.round(avgSimilarity * 1000) / 1000,
            top_similarity: topSimilarity
        };

    } catch (error) {
        console.log('LLM synthesis failed, using fallback:', error.message);
        
        // Fallback to rule-based synthesis
        return generateFallbackResponse(claim, searchResults);
    }
}

/**
 * Fallback response generation when LLM is unavailable
 */
function generateFallbackResponse(claim, searchResults) {
    const topResult = searchResults[0];
    const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity_score, 0) / searchResults.length;
    
    let verdict;
    if (topResult.similarity_score > 0.8) {
        verdict = "SUPPORTED";
    } else if (topResult.similarity_score > 0.65) {
        verdict = "PARTIALLY_SUPPORTED";
    } else {
        verdict = "INSUFFICIENT_EVIDENCE";
    }

    const fallbackResponse = {
        verdict: verdict,
        confidence: avgSimilarity > 0.7 ? "moderate" : "low",
        summary: `Based on ${searchResults.length} research sources, this claim shows ${verdict.toLowerCase().replace('_', ' ')} evidence. The research similarity was ${Math.round(avgSimilarity * 100)}% on average.`,
        key_points: [
            `Found ${searchResults.length} relevant research studies`,
            `Similarity scores range from ${Math.round(searchResults[searchResults.length - 1].similarity_score * 100)}% to ${Math.round(topResult.similarity_score * 100)}%`,
            `Most relevant study: "${topResult.title.substring(0, 80)}..."`
        ],
        sources_analyzed: searchResults.length,
        reliability_note: `Fallback analysis - recommend expert review for comprehensive assessment`
    };

    return {
        synthesized_answer: fallbackResponse,
        confidence: avgSimilarity > 0.7 ? "moderate" : "low",
        sources_used: searchResults.length,
        average_similarity: Math.round(avgSimilarity * 1000) / 1000,
        top_similarity: topResult.similarity_score,
        synthesis_method: "rule_based_fallback"
    };
}

// Routes

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
    try {
        // Check ML service health
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
 * Get database statistics
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
 * Main verification endpoint
 * POST /api/verify
 * 
 * Input: { claim: string, max_results?: number, similarity_threshold?: number }
 * Output: { success: boolean, data: SearchResults, metadata: object }
 */
app.post('/api/verify', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate request
        const { error, value } = verifySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                details: error.details[0].message
            });
        }

        const { claim, max_results, similarity_threshold, synthesize_response, llm_provider } = value;
        
        logRequest(req, startTime);

        // Call ML service for semantic search
        const searchResponse = await axios.post(`${ML_SERVICE_URL}/search`, {
            query: claim,
            max_results,
            similarity_threshold
        }, { 
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const searchResults = searchResponse.data;
        
        // Synthesize response if requested
        let synthesis = null;
        if (synthesize_response && searchResults.results.length > 0) {
            console.log(`Synthesizing response using ${llm_provider} for ${searchResults.results.length} sources...`);
            synthesis = await synthesizeResponse(claim, searchResults.results, llm_provider);
        }

        const duration = Date.now() - startTime;
        
        logResponse(req, searchResults.results, duration);

        // Format response for client
        const response = {
            success: true,
            synthesized: synthesis,
            data: {
                query: searchResults.query,
                results: searchResults.results.map(result => ({
                    id: result.id,
                    title: result.title,
                    abstract: result.abstract,
                    text_chunk: result.text_chunk,
                    similarity_score: result.similarity_score,
                    paper_id: result.paper_id,
                    chunk_index: result.chunk_index,
                    metadata: result.metadata
                })),
                total_results: searchResults.total_results
            },
            metadata: {
                search_time_ms: searchResults.search_time_ms,
                total_processing_time_ms: duration,
                similarity_threshold: similarity_threshold,
                max_results: max_results,
                synthesis_enabled: synthesize_response,
                llm_provider: llm_provider,
                timestamp: new Date().toISOString()
            }
        };

        // Add interpretation based on results
        if (searchResults.results.length === 0) {
            response.interpretation = {
                status: "no_matches",
                message: "No similar research papers found. This claim may be novel or require different search terms.",
                confidence: "low"
            };
        } else {
            const avgSimilarity = searchResults.results.reduce((sum, r) => sum + r.similarity_score, 0) / searchResults.results.length;
            const topSimilarity = searchResults.results[0].similarity_score;
            
            let status, message, confidence;
            
            if (topSimilarity > 0.8) {
                status = "high_match";
                message = "Strong evidence found in research literature.";
                confidence = "high";
            } else if (topSimilarity > 0.65) {
                status = "moderate_match"; 
                message = "Relevant research found with good similarity.";
                confidence = "moderate";
            } else {
                status = "low_match";
                message = "Some related research found, but similarities are weak.";
                confidence = "low";
            }
            
            response.interpretation = {
                status,
                message,
                confidence,
                top_similarity: topSimilarity,
                average_similarity: Math.round(avgSimilarity * 1000) / 1000
            };
        }

        res.json(response);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] Verification failed after ${duration}ms:`, error.message);
        
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({
                success: false,
                error: 'ML service unavailable',
                details: 'The machine learning service is not responding. Please try again later.',
                timestamp: new Date().toISOString()
            });
        } else if (error.response) {
            // ML service returned an error
            res.status(error.response.status || 500).json({
                success: false,
                error: 'Search processing failed',
                details: error.response.data?.detail || error.response.data || error.message,
                timestamp: new Date().toISOString()
            });
        } else {
            // Other errors
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
});

/**
 * Direct search endpoint (alternative interface)
 * POST /api/search
 */
app.post('/api/search', async (req, res) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/search`, req.body, {
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            'GET /health',
            'GET /api/stats', 
            'POST /api/verify',
            'POST /api/search'
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FitCheck Engine API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Main endpoint: POST http://localhost:${PORT}/api/verify`);
    console.log(`🔗 ML Service URL: ${ML_SERVICE_URL}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app;