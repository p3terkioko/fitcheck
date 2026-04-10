'use strict';

const crypto = require('crypto');

/**
 * Strips tracking and session parameters from social media URLs
 * so that the same video always produces the same cache key
 * regardless of how the URL was shared.
 */
function normalizeUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);

        // Parameters to strip (tracking, session, referral)
        const stripParams = [
            'si', 'igshid', 'utm_source', 'utm_medium', 'utm_campaign',
            'utm_content', 'utm_term', 'feature', 'app', 'fbclid',
            'ref', 'referer', 's', 'share_app_id'
        ];

        stripParams.forEach(p => url.searchParams.delete(p));

        // Normalize YouTube Shorts: always use full youtu.be form
        // youtube.com/shorts/ID → youtu.be/ID
        if (url.hostname.includes('youtube.com')) {
            const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
            if (shortsMatch) {
                return `https://youtu.be/${shortsMatch[1]}`;
            }
        }

        return url.toString().replace(/\/$/, ''); // remove trailing slash
    } catch {
        return rawUrl.trim();
    }
}

/**
 * Returns SHA256 hex hash of the normalized URL.
 * Used as the unique cache key in the transcripts table.
 */
function hashUrl(normalizedUrl) {
    return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
}

/**
 * Detects which platform a URL belongs to.
 */
function detectPlatform(url) {
    const lower = url.toLowerCase();
    if (lower.includes('tiktok.com'))    return 'tiktok';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('youtube.com') || lower.includes('youtu.be'))
        return 'youtube';
    return 'unknown';
}

module.exports = { normalizeUrl, hashUrl, detectPlatform };
