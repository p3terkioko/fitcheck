'use strict';

const { createClient } = require('@supabase/supabase-js');
const pool = require('../services/db');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Short-lived cache for Supabase token validation results.
// Reduces outbound API calls when the same token hits multiple requests.
// 60s TTL means a revoked token is honoured within one minute.
const TOKEN_CACHE_TTL_MS = 60 * 1000;
const TOKEN_CACHE_MAX_SIZE = 5000;
const tokenCache = new Map();

function getCachedUser(token) {
    const entry = tokenCache.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        tokenCache.delete(token);
        return null;
    }
    return entry.supabaseUser;
}

function setCachedUser(token, supabaseUser) {
    // Evict the oldest entry when the cache is full
    if (tokenCache.size >= TOKEN_CACHE_MAX_SIZE) {
        tokenCache.delete(tokenCache.keys().next().value);
    }
    tokenCache.set(token, { supabaseUser, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}

/**
 * Verifies the Supabase JWT and attaches req.user.
 * Creates user record on first login.
 * Blocks unauthenticated requests with 401.
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'NO_TOKEN'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Check cache before making a Supabase network call
        let supabaseUser = getCachedUser(token);

        if (!supabaseUser) {
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session',
                    code: 'INVALID_TOKEN'
                });
            }

            supabaseUser = user;
            setCachedUser(token, supabaseUser);
        }

        // Look up user in our own database
        let result = await pool.query(
            'SELECT * FROM users WHERE supabase_id = $1',
            [supabaseUser.id]
        );

        if (result.rows.length === 0) {
            // First login — create user record
            result = await pool.query(
                `INSERT INTO users
                    (supabase_id, email, display_name, avatar_url)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    supabaseUser.id,
                    supabaseUser.email,
                    supabaseUser.user_metadata?.full_name || null,
                    supabaseUser.user_metadata?.avatar_url || null,
                ]
            );
        }

        req.user = result.rows[0];
        next();

    } catch (err) {
        console.error('Auth middleware error:', err.constructor.name, err.message, err.stack);
        return res.status(500).json({
            success: false,
            error: 'Authentication service error',
            code: 'AUTH_ERROR'
        });
    }
}

/**
 * Optional auth — attaches req.user if token present,
 * but does not block unauthenticated requests.
 * Used for endpoints that work with or without auth.
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }
    return authenticateToken(req, res, next);
}

module.exports = { authenticateToken, optionalAuth };
