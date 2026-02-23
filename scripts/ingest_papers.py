#!/usr/bin/env python3
"""
FitCheck Engine - Research Paper Ingestion Script
Processes JSONL papers, chunks text, generates embeddings, and stores in database.
"""

import json
import logging
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import re
from datetime import datetime

import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import pandas as pd
from dotenv import load_dotenv
import os
import psycopg2
import psycopg2.extras
from psycopg2.errors import Error as PostgreSQLError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/ingestion.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv('../.env')

class TextProcessor:
    """Clean and chunk text content for embedding generation."""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        if not text:
            return ""
            
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common PDF artifacts
        text = re.sub(r'\f|\x0c', '', text)  # Form feed characters
        text = re.sub(r'^\s*Page \d+.*$', '', text, flags=re.MULTILINE)  # Page numbers
        text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)  # Standalone numbers
        
        # Remove excessive punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\"\']+', ' ', text)
        
        # Clean up spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def chunk_text(self, text: str, title: str = "") -> List[Dict[str, Any]]:
        """Split text into overlapping chunks."""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence.split())
            
            if current_length + sentence_length > self.chunk_size and current_chunk:
                # Create chunk
                chunk_text = ' '.join(current_chunk)
                chunks.append({
                    'text': chunk_text,
                    'word_count': current_length,
                    'title': title
                })
                
                # Start new chunk with overlap
                if self.chunk_overlap > 0 and len(current_chunk) > 1:
                    overlap_sentences = current_chunk[-self.chunk_overlap:]
                    current_chunk = overlap_sentences
                    current_length = sum(len(s.split()) for s in overlap_sentences)
                else:
                    current_chunk = []
                    current_length = 0
            
            current_chunk.append(sentence)
            current_length += sentence_length
        
        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                'text': chunk_text,
                'word_count': current_length,
                'title': title
            })
        
        return chunks

class EmbeddingGenerator:
    """Generate embeddings using sentence-transformers."""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        
    def load_model(self):
        """Load the embedding model."""
        logger.info(f"Loading embedding model: {self.model_name}")
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"✅ Model loaded successfully. Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise
    
    def generate_embeddings(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings for a list of texts."""
        if self.model is None:
            self.load_model()
        
        try:
            embeddings = self.model.encode(texts, batch_size=batch_size, show_progress_bar=True)
            return embeddings
        except Exception as e:
            logger.error(f"❌ Failed to generate embeddings: {e}")
            raise

class DatabaseManager:
    """Handle database operations for storing research papers and embeddings with PostgreSQL + pgvector."""
    
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
    
    def insert_paper_chunks(self, paper_data: Dict[str, Any], chunks: List[Dict[str, Any]], embeddings: np.ndarray):
        """Insert paper chunks and embeddings into PostgreSQL database."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Generate unique paper ID
            paper_id = f"{paper_data['title'][:50].replace(' ', '_').lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                # Prepare metadata
                metadata = {
                    'chunk_index': i,
                    'total_chunks': len(chunks),
                    'word_count': chunk['word_count'],
                    'source_file': paper_data.get('source', 'papers.jsonl'),
                    'processed_at': datetime.now().isoformat()
                }
                
                # Convert embedding to list for pgvector
                embedding_vector = embedding.tolist()
                
                cursor.execute("""
                    INSERT INTO research_papers 
                    (title, abstract, text_chunk, embedding, metadata, paper_id, chunk_index, chunk_length)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    paper_data['title'],
                    paper_data.get('abstract', ''),
                    chunk['text'],
                    embedding_vector,  # pgvector will handle the conversion
                    json.dumps(metadata),
                    paper_id,
                    i,
                    len(chunk['text'])
                ))
            
            conn.commit()
            logger.info(f"✅ Inserted {len(chunks)} chunks for paper: {paper_data['title'][:50]}...")
            
        except PostgreSQLError as e:
            logger.error(f"❌ Database insertion failed: {e}")
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM research_papers_stats")
            result = cursor.fetchone()
            
            if result:
                return {
                    'total_chunks': result[0],
                    'unique_papers': result[1], 
                    'avg_chunk_length': round(float(result[2]) if result[2] else 0, 2)
                }
            else:
                return {'total_chunks': 0, 'unique_papers': 0, 'avg_chunk_length': 0}
                
        except PostgreSQLError as e:
            logger.error(f"❌ Failed to get stats: {e}")
            return {'total_chunks': 0, 'unique_papers': 0, 'avg_chunk_length': 0}
        finally:
            cursor.close()
            conn.close()
    
    def get_processed_papers(self) -> set:
        """Get set of already processed paper titles."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT DISTINCT title FROM research_papers")
            results = cursor.fetchall()
            return {title[0] for title in results}
            
        except PostgreSQLError as e:
            logger.error(f"❌ Failed to get processed papers: {e}")
            return set()
        finally:
            cursor.close()
            conn.close()

class PaperIngestionPipeline:
    """Main pipeline for processing research papers."""
    
    def __init__(self, data_file: str = "../data/papers.jsonl", batch_size: int = 10):
        self.data_file = Path(data_file)
        self.batch_size = batch_size
        self.failed_papers = []
        
        # Initialize components
        self.text_processor = TextProcessor(
            chunk_size=int(os.getenv('CHUNK_SIZE', 500)),
            chunk_overlap=int(os.getenv('CHUNK_OVERLAP', 50))
        )
        self.embedding_generator = EmbeddingGenerator(
            model_name=os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
        )
        self.db_manager = DatabaseManager()
        
    def load_papers(self) -> List[Dict[str, Any]]:
        """Load papers from JSONL file."""
        papers = []
        
        if not self.data_file.exists():
            raise FileNotFoundError(f"Data file not found: {self.data_file}")
        
        logger.info(f"📖 Loading papers from: {self.data_file}")
        
        with open(self.data_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    paper = json.loads(line.strip())
                    papers.append(paper)
                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ Skipping malformed JSON on line {line_num}: {e}")
                    self.failed_papers.append(f"Line {line_num}: JSON decode error")
        
        logger.info(f"✅ Loaded {len(papers)} papers successfully")
        return papers
    
    def process_paper(self, paper: Dict[str, Any]) -> Optional[int]:
        """Process a single paper: clean, chunk, embed, store."""
        try:
            title = paper.get('title', 'Untitled')
            
            # Combine abstract and full text
            text_content = ""
            if paper.get('abstract'):
                text_content += paper['abstract'] + "\n\n"
            if paper.get('full_text'):
                text_content += paper['full_text']
            
            if not text_content.strip():
                logger.warning(f"⚠️ No text content found for paper: {title[:50]}...")
                self.failed_papers.append(f"No content: {title}")
                return 0
            
            # Clean and chunk text
            clean_text = self.text_processor.clean_text(text_content)
            chunks = self.text_processor.chunk_text(clean_text, title)
            
            if not chunks:
                logger.warning(f"⚠️ No chunks generated for paper: {title[:50]}...")
                self.failed_papers.append(f"No chunks: {title}")
                return 0
            
            # Generate embeddings
            chunk_texts = [chunk['text'] for chunk in chunks]
            embeddings = self.embedding_generator.generate_embeddings(chunk_texts)
            
            # Store in database
            self.db_manager.insert_paper_chunks(paper, chunks, embeddings)
            
            return len(chunks)
            
        except Exception as e:
            logger.error(f"❌ Failed to process paper '{paper.get('title', 'Unknown')}': {e}")
            self.failed_papers.append(f"Processing error: {paper.get('title', 'Unknown')}")
            return 0
    
    def run(self):
        """Run the complete ingestion pipeline."""
        logger.info("🚀 Starting FitCheck Engine paper ingestion pipeline")
        
        # Load papers
        papers = self.load_papers()
        
        if not papers:
            logger.error("❌ No papers to process!")
            return
        
        # Get already processed papers  
        logger.info("🔍 Checking for already processed papers...")
        processed_titles = self.db_manager.get_processed_papers()
        logger.info(f"📊 Found {len(processed_titles)} already processed papers")
        
        # Filter out already processed papers
        papers_to_process = []
        for paper in papers:
            if paper.get('title') not in processed_titles:
                papers_to_process.append(paper)
        
        skipped_count = len(papers) - len(papers_to_process)
        logger.info(f"⏭️ Skipping {skipped_count} already processed papers")
        logger.info(f"🎯 Processing {len(papers_to_process)} remaining papers")
        
        if not papers_to_process:
            logger.info("✅ All papers already processed!")
            return
        
        # Load embedding model
        self.embedding_generator.load_model()
        
        # Process papers in batches
        total_chunks = 0
        processed_papers = 0
        
        with tqdm(total=len(papers_to_process), desc="Processing papers") as pbar:
            for i in range(0, len(papers_to_process), self.batch_size):
                batch = papers_to_process[i:i + self.batch_size]
                
                for paper in batch:
                    chunk_count = self.process_paper(paper)
                    if chunk_count > 0:
                        total_chunks += chunk_count
                        processed_papers += 1
                    
                    pbar.update(1)
        
        # Final statistics
        logger.info("📊 Ingestion completed!")
        logger.info(f"✅ Processed: {processed_papers}/{len(papers_to_process)} new papers")
        logger.info(f"✅ Total chunks: {total_chunks}")
        logger.info(f"❌ Failed papers: {len(self.failed_papers)}")
        
        # Database stats
        db_stats = self.db_manager.get_stats()
        logger.info(f"📈 Database stats: {db_stats}")
        
        # Log failed papers
        if self.failed_papers:
            failed_log_path = '../logs/failed_papers.log'
            with open(failed_log_path, 'w') as f:
                f.write("Failed Papers:\n")
                for failure in self.failed_papers:
                    f.write(f"{failure}\n")
            logger.info(f"📝 Failed papers logged to: {failed_log_path}")

def main():
    """Main entry point."""
    try:
        pipeline = PaperIngestionPipeline()
        pipeline.run()
        
    except KeyboardInterrupt:
        logger.info("⏹️ Ingestion interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()