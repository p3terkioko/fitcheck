import os
import sys
import json
from pathlib import Path

def validate_data_structure():
    """Validate the research papers data structure."""
    print("🔍 Validating data structure...")
    
    data_file = Path("data/papers.jsonl")
    if not data_file.exists():
        print("❌ data/papers.jsonl not found!")
        return False
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        print(f"✅ Found {len(lines)} papers in JSONL format")
        
        # Check first few papers structure
        sample_size = min(3, len(lines))
        required_fields = ['title', 'abstract', 'full_text']
        
        for i in range(sample_size):
            try:
                paper = json.loads(lines[i])
                missing_fields = [field for field in required_fields if field not in paper]
                
                if missing_fields:
                    print(f"⚠️  Paper {i+1} missing fields: {missing_fields}")
                else:
                    print(f"✅ Paper {i+1} structure valid")
                    
                # Show sample data
                if i == 0:
                    print(f"📄 Sample paper title: {paper['title'][:100]}...")
                    print(f"📄 Abstract length: {len(paper.get('abstract', '')) if paper.get('abstract') else 0} chars")
                    print(f"📄 Full text length: {len(paper.get('full_text', '')) if paper.get('full_text') else 0} chars")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing paper {i+1}: {e}")
                return False
    
        return True
        
    except Exception as e:
        print(f"❌ Error reading data file: {e}")
        return False

def check_environment_files():
    """Check if all required configuration files exist."""
    print("\n🔧 Checking environment files...")
    
    files_to_check = {
        '.env': 'Environment configuration',
        'package.json': 'Node.js dependencies',
        'requirements.txt': 'Python dependencies',
        'database/schema.sql': 'Database schema'
    }
    
    all_good = True
    for file_path, description in files_to_check.items():
        if Path(file_path).exists():
            print(f"✅ {description}: {file_path}")
        else:
            print(f"❌ Missing {description}: {file_path}")
            all_good = False
    
    return all_good

if __name__ == "__main__":
    print("🚀 FitCheck_Engine Data Validation")
    print("=" * 40)
    
    data_valid = validate_data_structure()
    env_valid = check_environment_files()
    
    print(f"\n📊 Validation Summary:")
    print(f"Data structure: {'✅ Valid' if data_valid else '❌ Invalid'}")
    print(f"Environment files: {'✅ Complete' if env_valid else '❌ Incomplete'}")
    
    if data_valid and env_valid:
        print("\n🎉 Phase 1 validation successful! Ready for Phase 2.")
        sys.exit(0)
    else:
        print("\n⚠️  Please fix the issues above before proceeding to Phase 2.")
        sys.exit(1)