-- SQLite Schema for FitCheck_Engine (Development)
-- Note: SQLite doesn't support vector extensions, but we can store embeddings as JSON/BLOB

-- Create research_papers table
CREATE TABLE IF NOT EXISTS research_papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    abstract TEXT,
    text_chunk TEXT NOT NULL,
    embedding_json TEXT,  -- Store embeddings as JSON string for SQLite
    metadata TEXT,        -- Changed from JSON to TEXT for SQLite compatibility
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for text search
CREATE INDEX IF NOT EXISTS research_papers_title_idx ON research_papers(title);
CREATE INDEX IF NOT EXISTS research_papers_chunk_idx ON research_papers(text_chunk);