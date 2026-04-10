'use strict';

const { createClient } = require('@supabase/supabase-js');
const pool = require('../services/db');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        // Verify token with Supabase
        const { data: { user: supabaseUser }, error } =
            await supabase.auth.getUser(token);

        if (error || !supabaseUser) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session',
                code: 'INVALID_TOKEN'
            });
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
