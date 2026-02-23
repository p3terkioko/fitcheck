#!/bin/bash
# Phase 1 Setup Validation Script for FitCheck_Engine

echo "🔍 Validating FitCheck_Engine Phase 1 Setup..."
echo "================================================="

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL connection..."
if pg_isready -h localhost -p 5432; then
    echo "   ✅ PostgreSQL is running on port 5432"
else
    echo "   ❌ PostgreSQL is not running on port 5432"
fi

# Check if database exists
echo "2. Checking if 'fitcheck' database exists..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw fitcheck; then
    echo "   ✅ Database 'fitcheck' exists"
else
    echo "   ❌ Database 'fitcheck' does not exist"
fi

# Check if virtual environment exists
echo "3. Checking Python virtual environment..."
if [ -d "venv" ]; then
    echo "   ✅ Virtual environment 'venv' found"
else
    echo "   ❌ Virtual environment 'venv' not found"
fi

# Check Node.js dependencies
echo "4. Checking Node.js dependencies..."
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo "   ✅ Node.js dependencies installed"
elif [ -f "package.json" ]; then
    echo "   ⚠️  package.json exists but node_modules not found - run 'npm install'"
else
    echo "   ❌ package.json not found"
fi

# Check Python requirements
echo "5. Checking Python requirements..."
if [ -f "requirements.txt" ]; then
    echo "   ✅ requirements.txt found"
    if [ -f "venv/bin/activate" ]; then
        echo "   📝 To install Python dependencies, run:"
        echo "      source venv/bin/activate && pip install -r requirements.txt"
    fi
else
    echo "   ❌ requirements.txt not found"
fi

# Check data files
echo "6. Checking data files..."
if [ -f "data/papers.jsonl" ]; then
    PAPER_COUNT=$(wc -l < data/papers.jsonl)
    echo "   ✅ Found $PAPER_COUNT research papers in data/papers.jsonl"
else
    echo "   ❌ data/papers.jsonl not found"
fi

# Check directory structure
echo "7. Checking project structure..."
for dir in "database" "ml_service" "scripts" "logs"; do
    if [ -d "$dir" ]; then
        echo "   ✅ Directory '$dir' exists"
    else
        echo "   ❌ Directory '$dir' missing"
    fi
done

echo ""
echo "📋 Next Steps:"
echo "1. Ensure PostgreSQL is running: systemctl start postgresql"
echo "2. Create database: createdb -U postgres fitcheck"
echo "3. Run schema: psql -U postgres -d fitcheck -f database/schema.sql"
echo "4. Create virtual env: python -m venv venv"
echo "5. Activate venv: source venv/bin/activate"
echo "6. Install Python deps: pip install -r requirements.txt"
echo "7. Install Node deps: npm install"
echo ""
echo "✨ Ready to proceed to Phase 2: Ingestion Script"