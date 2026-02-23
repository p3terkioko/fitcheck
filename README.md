# FitCheck Engine

A fitness misinformation detection system backend built with Node.js and Python.

## Architecture
- **Main API (Node.js):** Express.js on port 3000
- **ML Service (Python):** FastAPI on port 8000  
- **Database:** PostgreSQL with pgvector extension on port 5432

## Setup Instructions

### 1. Database Setup
```bash
# Create database
createdb -U postgres fitcheck

# Run schema
npm run setup:db
```

### 2. Python Environment
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Node.js Dependencies
```bash
npm install
```

### 4. Configure Environment
Update `.env` file with your database credentials.

## Development

### Run both services
```bash
npm run dev
```

### Ingest research papers
```bash
npm run ingest
```

## Project Structure
```
├── data/                    # Research papers (PDFs/JSONL)
├── database/               # SQL schemas
├── ml_service/             # Python FastAPI service
├── scripts/                # Utility scripts
├── logs/                   # Application logs
└── server.js               # Node.js Express API
```

## Phase Development
- ✅ Phase 1: Database & Environment Setup
- 🔄 Phase 2: PDF Ingestion Pipeline
- ⏳ Phase 3: Verification Engine (RAG)# fitcheck
