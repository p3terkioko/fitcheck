-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create research_papers table
CREATE TABLE research_papers (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT,
    text_chunk TEXT NOT NULL,
    embedding vector(384),  -- 384 dimensions for all-MiniLM-L6-v2 model
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search (HNSW for better performance)
CREATE INDEX IF NOT EXISTS research_papers_embedding_idx ON research_papers 
USING hnsw (embedding vector_cosine_ops);

-- Create index for text search
CREATE INDEX IF NOT EXISTS research_papers_title_idx ON research_papers USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS research_papers_chunk_idx ON research_papers USING gin(to_tsvector('english', text_chunk));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_research_papers_updated_at 
    BEFORE UPDATE ON research_papers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();