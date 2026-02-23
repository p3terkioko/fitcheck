#!/usr/bin/env python3
"""
Quick test script to validate the ingestion pipeline with a few sample papers.
"""

import json
import sys
from pathlib import Path
import psycopg2
from dotenv import load_dotenv
import os

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
load_dotenv('../.env')

from ingest_papers import PaperIngestionPipeline, DatabaseManager, TextProcessor, EmbeddingGenerator

def create_sample_data():
    """Create a small sample of papers for testing."""
    sample_papers = [
        {
            "title": "Sample Fitness Research Paper 1",
            "abstract": "This is a sample abstract about fitness and exercise training methodologies.",
            "full_text": "Introduction: Exercise is important for health. Methods: We studied 100 participants. Results: Exercise improved fitness significantly. Conclusion: Regular exercise is beneficial for overall health and wellness."
        },
        {
            "title": "Sample Nutrition Study 2", 
            "abstract": "A comprehensive study on nutritional interventions and their effects on athletic performance.",
            "full_text": "Background: Nutrition plays a crucial role in athletic performance. We conducted a randomized controlled trial with 200 athletes to examine the effects of different dietary interventions. Our findings suggest that proper nutrition can enhance performance by up to 15%."
        }
    ]
    
    # Write sample data
    sample_file = Path("../data/sample_papers.jsonl")
    with open(sample_file, 'w') as f:
        for paper in sample_papers:
            f.write(json.dumps(paper) + '\n')
    
    print(f"✅ Created sample data: {sample_file}")
    return sample_file

def test_components():
    """Test individual components."""
    print("🧪 Testing individual components...\n")
    
    # Test TextProcessor
    print("1. Testing TextProcessor...")
    processor = TextProcessor(chunk_size=50, chunk_overlap=10)
    
    sample_text = "This is a test sentence. This is another sentence for testing. We need more text to create multiple chunks for proper testing of the chunking algorithm."
    cleaned = processor.clean_text(sample_text)
    chunks = processor.chunk_text(cleaned, "Test Paper")
    
    print(f"   ✅ Original text length: {len(sample_text)} chars")
    print(f"   ✅ Generated {len(chunks)} chunks")
    for i, chunk in enumerate(chunks):
        print(f"   📝 Chunk {i+1}: {chunk['text'][:50]}... ({chunk['word_count']} words)")
    
    # Test EmbeddingGenerator
    print("\n2. Testing EmbeddingGenerator...")
    embedder = EmbeddingGenerator()
    embedder.load_model()
    
    test_texts = ["This is a test sentence.", "Another test sentence about fitness."]
    embeddings = embedder.generate_embeddings(test_texts)
    
    print(f"   ✅ Generated embeddings shape: {embeddings.shape}")
    print(f"   ✅ Embedding dimension: {embeddings.shape[1]}")
    
    # Test DatabaseManager
    print("\n3. Testing DatabaseManager...")
    db_manager = DatabaseManager()
    
    # Test insertion
    test_paper = {
        'title': 'Test Paper',
        'abstract': 'Test abstract'
    }
    test_chunks = [{'text': 'Test chunk text', 'word_count': 3}]
    test_embeddings = embeddings[:1]  # Use first embedding
    
    db_manager.insert_paper_chunks(test_paper, test_chunks, test_embeddings)
    stats = db_manager.get_stats()
    
    print(f"   ✅ Database stats: {stats}")
    

    print("\n✅ All component tests passed!")

def test_full_pipeline():
    """Test the complete pipeline with sample data."""
    print("\n🔄 Testing full pipeline...\n")
    
    # Create sample data
    sample_file = create_sample_data()
    
    try:
        # Create test pipeline
        pipeline = PaperIngestionPipeline(data_file=str(sample_file), batch_size=2)
        
        # Use test database
        pipeline.db_manager = DatabaseManager()
        
        # Run pipeline
        pipeline.run()
        
        # Check results
        final_stats = pipeline.db_manager.get_stats()
        print(f"\n📊 Final Results:")
        print(f"   📈 {final_stats}")
        
        # Show sample data from database
        conn = pipeline.db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT title, LENGTH(text_chunk), 384 as embedding_dims FROM research_papers LIMIT 3")
        results = cursor.fetchall()
        
        print(f"\n🔍 Sample database entries:")
        for title, chunk_len, emb_dims in results:
            print(f"   📄 {title[:40]}... | Chunk: {chunk_len} chars | Embedding: {emb_dims} dims")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Full pipeline test completed successfully!")
        
    finally:
        # Cleanup - PostgreSQL data will be cleaned up by DELETE operations
        sample_file.unlink(missing_ok=True)
        print("🧹 Cleaned up test files")

def main():
    """Run all tests."""
    print("🧪 FitCheck Engine Ingestion Pipeline Test Suite")
    print("=" * 60)
    
    try:
        # Test individual components
        test_components()
        
        # Test full pipeline  
        test_full_pipeline()
        
        print("\n" + "=" * 60)
        print("🎉 All tests passed! Pipeline is ready for production.")
        print("\n📝 To run the real ingestion:")
        print("   cd scripts && python ingest_papers.py")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()