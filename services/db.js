'use strict';

const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // TCP keepalives prevent idle connections from being silently dropped
    // by the DB server or network after long idle periods (same fix as ml_service).
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

module.exports = pool;
