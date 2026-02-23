#!/usr/bin/env python3
"""
FitCheck Engine - ML Microservice (FastAPI)
Handles semantic search using PostgreSQL + pgvector for fitness misinformation detection.
Port: 8000
"""

import os
import logging
from typing import List, Dict, Any, Optional
import json
from datetime import datetime

import numpy as np
import psycopg2
import psycopg2.extras
from psycopg2.errors import Error as PostgreSQLError
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv('../.env')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/ml_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FitCheck ML Service",
    description="Semantic search microservice for fitness misinformation detection",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
embedding_model: Optional[SentenceTransformer] = None

# Request/Response models
class SearchRequest(BaseModel):
    query: str = Field(..., description="User claim or question to search for", min_length=1)
    max_results: int = Field(5, description="Maximum number of results to return", ge=1, le=20)
    similarity_threshold: float = Field(0.5, description="Minimum similarity score (0-1)", ge=0, le=1)

class PaperChunk(BaseModel):
    id: int
    title: str
    abstract: Optional[str]
    text_chunk: str
    similarity_score: float
    metadata: Dict[str, Any]
    paper_id: str
    chunk_index: int

class SearchResponse(BaseModel):
    query: str
    results: List[PaperChunk]
    total_results: int
    search_time_ms: float
    
class HealthResponse(BaseModel):
    status: str
    service: str
    database_connected: bool
    model_loaded: bool
    timestamp: str

class DatabaseManager:
    """Handle PostgreSQL operations with pgvector."""
    
    def __init__(self):
        self.connection_params = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD')
        }
        
        # Validate required environment variables
        required_vars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {missing_vars}")
        
    def get_connection(self):
        """Get PostgreSQL connection."""
        return psycopg2.connect(**self.connection_params)
    
    def test_connection(self) -> bool:
        """Test database connection."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False
    
    def semantic_search(self, query_embedding: np.ndarray, max_results: int = 5, 
                       similarity_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """Perform semantic search using cosine similarity with pgvector."""
        conn = self.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Convert numpy array to list for pgvector
            embedding_vector = query_embedding.tolist()
            
            # SQL query for cosine similarity search
            query = """
                SELECT 
                    id,
                    title,
                    abstract,
                    text_chunk,
                    1 - (embedding <=> %s::vector) as similarity_score,
                    metadata,
                    paper_id,
                    chunk_index,
                    chunk_length
                FROM research_papers
                WHERE 1 - (embedding <=> %s::vector) >= %s
                ORDER BY similarity_score DESC
                LIMIT %s
            """
            
            cursor.execute(query, (embedding_vector, embedding_vector, similarity_threshold, max_results))
            results = cursor.fetchall()
            
            return [dict(row) for row in results]
            
        except PostgreSQLError as e:
            logger.error(f"Semantic search failed: {e}")
            raise HTTPException(status_code=500, detail=f"Database search error: {str(e)}")
        finally:
            cursor.close()
            conn.close()

# Initialize database manager
db_manager = DatabaseManager()

@app.on_event("startup")
async def startup_event():
    """Initialize the ML service on startup."""
    global embedding_model
    
    logger.info("🚀 Starting FitCheck ML Service...")
    
    # Test database connection
    if not db_manager.test_connection():
        logger.error("❌ Database connection failed!")
        raise RuntimeError("Database connection failed")
    
    logger.info("✅ Database connection successful")
    
    # Load embedding model
    try:
        model_name = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
        logger.info(f"⏳ Loading embedding model: {model_name}")
        embedding_model = SentenceTransformer(model_name)
        logger.info(f"✅ Model loaded successfully. Embedding dimension: {embedding_model.get_sentence_embedding_dimension()}")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")
        raise RuntimeError(f"Model loading failed: {e}")
    
    logger.info("🎉 FitCheck ML Service ready!")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="FitCheck ML Service",
        database_connected=db_manager.test_connection(),
        model_loaded=embedding_model is not None,
        timestamp=datetime.now().isoformat()
    )

@app.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search for fitness-related claims.
    
    This endpoint converts the user query into embeddings and searches
    for the most similar research paper chunks using cosine similarity.
    """
    start_time = datetime.now()
    
    if not embedding_model:
        raise HTTPException(status_code=500, detail="Embedding model not loaded")
    
    try:
        logger.info(f"🔍 Processing search query: '{request.query[:100]}...'")
        
        # Generate embedding for the query
        query_embedding = embedding_model.encode([request.query])
        query_vector = query_embedding[0]  # Get the first (and only) embedding
        
        # Perform semantic search
        search_results = db_manager.semantic_search(
            query_vector, 
            max_results=request.max_results,
            similarity_threshold=request.similarity_threshold
        )
        
        # Convert to response format
        results = []
        for result in search_results:
            paper_chunk = PaperChunk(
                id=result['id'],
                title=result['title'],
                abstract=result.get('abstract', ''),
                text_chunk=result['text_chunk'],
                similarity_score=round(result['similarity_score'], 4),
                metadata=result.get('metadata', {}),
                paper_id=result['paper_id'],
                chunk_index=result['chunk_index']
            )
            results.append(paper_chunk)
        
        search_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"✅ Search completed: {len(results)} results in {search_time:.1f}ms")
        
        return SearchResponse(
            query=request.query,
            results=results,
            total_results=len(results),
            search_time_ms=round(search_time, 1)
        )
        
    except Exception as e:
        logger.error(f"❌ Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_database_stats():
    """Get database statistics."""
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM research_papers_stats")
        result = cursor.fetchone()
        
        if result:
            stats = {
                'total_chunks': result[0],
                'unique_papers': result[1],
                'avg_chunk_length': float(result[2]) if result[2] else 0,
                'first_ingestion': result[3].isoformat() if result[3] else None,
                'last_ingestion': result[4].isoformat() if result[4] else None
            }
        else:
            stats = {'total_chunks': 0, 'unique_papers': 0, 'avg_chunk_length': 0}
        
        cursor.close()
        conn.close()
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv('PYTHON_PORT', 8000))
    logger.info(f"🚀 Starting ML service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")