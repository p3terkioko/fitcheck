/**
 * Transcription Service
 *
 * Pipeline:
 *   Social media URL (TikTok / Instagram)
 *     → yt-dlp  (download audio track)
 *     → ffmpeg  (convert to mp3 ≤ 25 MB, the Whisper file limit)
 *     → OpenAI Whisper API  (speech-to-text)
 *     → transcript string
 */

'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const OpenAI = require('openai');

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Resolve binary paths
// Prefer project-local bin/ over system PATH so no sudo install is needed.
// ---------------------------------------------------------------------------
const PROJECT_BIN = path.join(__dirname, '..', 'bin');

function resolveBin(name, envVar) {
    if (process.env[envVar]) return process.env[envVar];
    const local = path.join(PROJECT_BIN, name);
    if (fs.existsSync(local)) return local;
    return name; // fall back to PATH
}

const YTDLP_BIN  = resolveBin('yt-dlp',  'YTDLP_PATH');
const FFMPEG_BIN = resolveBin('ffmpeg',  'FFMPEG_PATH');

// Whisper supports these domains natively via yt-dlp
const SUPPORTED_DOMAINS = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a URL belongs to a supported social media platform.
 */
function validateUrl(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        if (!SUPPORTED_DOMAINS.some(d => host.endsWith(d))) {
            throw new Error(
                `Unsupported platform. Currently supported: TikTok, Instagram, YouTube. Got: ${host}`
            );
        }
        return parsed.href;
    } catch (err) {
        if (err.message.startsWith('Unsupported')) throw err;
        throw new Error('Invalid URL. Please provide a full URL including https://');
    }
}

/**
 * Download the audio track from a social media URL into a temp directory.
 * Returns the path to the downloaded file.
 */
async function downloadAudio(url, tmpDir) {
    // yt-dlp saves the audio as <title>.ext; we use a fixed template so we
    // know the output filename.
    const outputTemplate = path.join(tmpDir, 'audio.%(ext)s');

    const args = [
        '--no-playlist',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '64K',       // small file → faster Whisper upload
        '--ffmpeg-location', FFMPEG_BIN,
        '--output', outputTemplate,
        '--quiet',
        '--no-warnings',
        url,
    ];

    try {
        await execFileAsync(YTDLP_BIN, args, { timeout: 120_000 });
    } catch (err) {
        const msg = err.stderr || err.message || '';
        if (msg.includes('Private') || msg.includes('Login required')) {
            throw new Error('This video is private or requires login. Please use a public post.');
        }
        if (msg.includes('not found') || msg.includes('No such video')) {
            throw new Error('Video not found. It may have been deleted or the URL is incorrect.');
        }
        throw new Error(`Audio download failed: ${msg.substring(0, 200)}`);
    }

    // Find the downloaded file (yt-dlp writes .mp3 due to --audio-format mp3)
    const files = fs.readdirSync(tmpDir);
    const audio = files.find(f => f.startsWith('audio.'));
    if (!audio) throw new Error('Audio download produced no output file.');

    const audioPath = path.join(tmpDir, audio);

    // Whisper API has a 25 MB file size limit.
    const { size } = fs.statSync(audioPath);
    if (size > 25 * 1024 * 1024) {
        throw new Error(
            'Audio file exceeds the 25 MB Whisper limit. ' +
            'Please use a shorter video (under ~30 minutes).'
        );
    }

    return audioPath;
}

/**
 * Transcribe an audio file using the OpenAI Whisper API.
 * Returns the transcript string.
 */
async function transcribeAudio(audioPath) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error(
            'OPENAI_API_KEY is not set. Add it to your .env file to enable transcription.'
        );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: fs.createReadStream(audioPath),
        response_format: 'text',
        language: 'en',
    });

    // When response_format is 'text', the SDK returns the string directly.
    const text = typeof transcription === 'string'
        ? transcription
        : transcription.text;

    if (!text || text.trim().length === 0) {
        throw new Error(
            'Whisper returned an empty transcript. ' +
            'The video may contain no speech or only music.'
        );
    }

    return text.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Full URL → transcript pipeline.
 *
 * @param {string} url  - Public TikTok / Instagram / YouTube URL
 * @returns {{ transcript: string, audioSizeBytes: number, tmpDir: string }}
 *   tmpDir is returned so the caller can clean up when done.
 */
async function transcribeUrl(url) {
    const cleanUrl = validateUrl(url);

    // Create a unique temp directory for this request.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fitcheck-'));

    try {
        const audioPath = await downloadAudio(cleanUrl, tmpDir);
        const { size: audioSizeBytes } = fs.statSync(audioPath);
        const transcript = await transcribeAudio(audioPath);
        return { transcript, audioSizeBytes, tmpDir };
    } catch (err) {
        // Clean up on error; on success the caller cleans up after processing.
        cleanupDir(tmpDir);
        throw err;
    }
}

/**
 * Remove a temporary directory and all its contents.
 */
function cleanupDir(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {
        // Non-fatal — OS will clean /tmp eventually.
    }
}

module.exports = { transcribeUrl, cleanupDir, validateUrl, SUPPORTED_DOMAINS };
