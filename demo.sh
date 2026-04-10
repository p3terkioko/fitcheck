#!/bin/bash
# FitCheck Engine - Supervisor Demo Script
# Starts both services and runs live claim verifications

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

NODE_PORT=${NODE_PORT:-3000}
PYTHON_PORT=${PYTHON_PORT:-8000}
NODE_PID=""
PYTHON_PID=""

# ── Cleanup ─────────────────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    [ -n "$NODE_PID" ]   && kill "$NODE_PID"   2>/dev/null
    [ -n "$PYTHON_PID" ] && kill "$PYTHON_PID" 2>/dev/null
    echo -e "${GREEN}Services stopped.${NC}"
}
trap cleanup EXIT INT TERM

# ── Header ──────────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}${BLUE}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║            FitCheck Engine  —  Live Demo                    ║"
echo "  ║       AI-Powered Fitness Misinformation Detection            ║"
echo "  ║                  University of Nairobi  BSc CS              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Prerequisites ───────────────────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}[1/5] Checking prerequisites...${NC}"

fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

[ -f ".env" ]          || fail ".env file missing. Copy .env.example and fill in credentials."
[ -d "node_modules" ]  || fail "Node modules missing. Run: npm install"
[ -d "venv" ]          || fail "Python venv missing. Run: python -m venv venv && pip install -r requirements.txt"
[ -d "logs" ]          || mkdir -p logs

# Check PostgreSQL is reachable using the .env credentials
set -a; source .env; set +a
pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q \
    || fail "PostgreSQL is not running on port ${DB_PORT:-5432}. Start it first."

echo -e "${GREEN}✅ Prerequisites OK${NC}\n"

# ── Start ML Service ────────────────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}[2/5] Starting ML Service (FastAPI · port $PYTHON_PORT)...${NC}"

# Kill any stale process on the port
lsof -ti ":$PYTHON_PORT" | xargs kill -9 2>/dev/null || true

(cd ml_service && ../venv/bin/python -m uvicorn main:app \
    --port "$PYTHON_PORT" --log-level warning) \
    > logs/ml_service_demo.log 2>&1 &
PYTHON_PID=$!

echo -n "   Loading embedding model (this takes ~30 seconds on first run)"
for i in $(seq 1 45); do
    if curl -s "http://localhost:$PYTHON_PORT/health" 2>/dev/null | grep -q '"status":"healthy"'; then
        echo -e " ${GREEN}✅ Ready${NC}"
        break
    fi
    printf "."
    sleep 2
    if [ "$i" -eq 45 ]; then
        echo -e " ${RED}❌ Timed out. Check logs/ml_service_demo.log${NC}"
        exit 1
    fi
done

# ── Start Node.js API ───────────────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}[3/5] Starting API Server (Node.js · port $NODE_PORT)...${NC}"

lsof -ti ":$NODE_PORT" | xargs kill -9 2>/dev/null || true

node server.js > logs/api_demo.log 2>&1 &
NODE_PID=$!

echo -n "   Waiting for API server"
for i in $(seq 1 15); do
    if curl -s "http://localhost:$NODE_PORT/health" 2>/dev/null | grep -q '"status":"healthy"'; then
        echo -e " ${GREEN}✅ Ready${NC}"
        break
    fi
    printf "."
    sleep 1
    if [ "$i" -eq 15 ]; then
        echo -e " ${RED}❌ Timed out. Check logs/api_demo.log${NC}"
        exit 1
    fi
done

# ── Database Stats ──────────────────────────────────────────────────────────────
echo -e "\n${CYAN}${BOLD}[4/5] Research Database${NC}"

STATS=$(curl -s "http://localhost:$NODE_PORT/api/stats")
TOTAL_CHUNKS=$(echo "$STATS"  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('total_chunks','N/A'))" 2>/dev/null)
UNIQUE_PAPERS=$(echo "$STATS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('unique_papers','N/A'))" 2>/dev/null)

echo -e "   📚 Peer-reviewed papers indexed : ${BOLD}$UNIQUE_PAPERS${NC}"
echo -e "   🔢 Searchable text chunks        : ${BOLD}$TOTAL_CHUNKS${NC}"
echo -e "   🤖 Embedding model               : ${BOLD}sentence-transformers/all-MiniLM-L6-v2${NC}"
echo -e "   🧠 LLM synthesis                 : ${BOLD}Llama 3.1 (via Groq)${NC}"

# ── Live Claim Verification ─────────────────────────────────────────────────────
echo -e "\n${CYAN}${BOLD}[5/5] Live Claim Verification${NC}"
echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

verify_claim() {
    local CLAIM="$1"
    local NUM="$2"

    echo -e "${BOLD}Claim $NUM:${NC} \"${YELLOW}$CLAIM${NC}\""
    echo -e "${CYAN}Verifying against research database...${NC}"

    RESPONSE=$(curl -s -X POST "http://localhost:$NODE_PORT/api/verify" \
        -H "Content-Type: application/json" \
        -d "{\"claim\": \"$CLAIM\", \"max_results\": 3}")

    # Parse fields
    VERDICT=$(echo "$RESPONSE"     | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('synthesized',{}).get('synthesized_answer',{}); print(a.get('verdict','N/A'))" 2>/dev/null)
    CONFIDENCE=$(echo "$RESPONSE"  | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('synthesized',{}).get('synthesized_answer',{}); print(a.get('confidence','N/A'))" 2>/dev/null)
    SUMMARY=$(echo "$RESPONSE"     | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('synthesized',{}).get('synthesized_answer',{}); print(a.get('summary','N/A'))" 2>/dev/null)
    PROC_MS=$(echo "$RESPONSE"     | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('metadata',{}).get('total_processing_time_ms','N/A'))" 2>/dev/null)

    # Key points
    KEY_POINTS=$(echo "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
kp = d.get('synthesized',{}).get('synthesized_answer',{}).get('key_points',[])
for p in kp:
    print('  •', p)
" 2>/dev/null)

    # Source titles
    SOURCES=$(echo "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
results = d.get('data',{}).get('results',[])
seen = set()
for r in results:
    t = r.get('title','Unknown')
    if t not in seen:
        seen.add(t)
        score = r.get('similarity_score', 0)
        print(f'  [{int(score*100)}%] {t[:75]}...' if len(t) > 75 else f'  [{int(score*100)}%] {t}')
" 2>/dev/null)

    # Colour-code verdict
    case $VERDICT in
        "SUPPORTED")           VCOL="${GREEN}"  ; VICON="✅"  ;;
        "PARTIALLY_SUPPORTED") VCOL="${YELLOW}" ; VICON="⚠️ " ;;
        "NOT_SUPPORTED")       VCOL="${RED}"    ; VICON="❌"  ;;
        "INSUFFICIENT_EVIDENCE") VCOL="${CYAN}" ; VICON="❓"  ;;
        *)                     VCOL="${NC}"     ; VICON="❓"  ;;
    esac

    # Confidence colour
    case $CONFIDENCE in
        "high")     CCOL="${GREEN}"  ;;
        "moderate") CCOL="${YELLOW}" ;;
        *)          CCOL="${RED}"    ;;
    esac

    echo ""
    echo -e "  ${VICON}  Verdict    : ${VCOL}${BOLD}$VERDICT${NC}"
    echo -e "  📊 Confidence : ${CCOL}${BOLD}$CONFIDENCE${NC}"
    echo -e "  📝 Summary    :"
    echo -e "     $SUMMARY" | fold -s -w 72 | sed '2,$s/^/     /'
    echo -e "  🔑 Key Points :"
    echo "$KEY_POINTS"
    echo -e "  📖 Sources    :"
    echo "$SOURCES"
    echo -e "  ⏱️  Processed  : ${PROC_MS}ms"
    echo ""
    echo -e "${BLUE}  ──────────────────────────────────────────────────────────────${NC}\n"

    sleep 1
}

verify_claim "Creatine supplementation improves high-intensity exercise performance" "1"
verify_claim "Stretching before exercise prevents muscle injury" "2"
verify_claim "You need to consume protein within 30 minutes after a workout for muscle growth" "3"

# ── Done ────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}${GREEN}  Demo complete. Both services are running.${NC}"
echo -e "  🌐 API Server  : http://localhost:$NODE_PORT"
echo -e "  🤖 ML Service  : http://localhost:$PYTHON_PORT"
echo -e "  📊 Stats       : http://localhost:$NODE_PORT/api/stats"
echo -e "  ❤️  Health      : http://localhost:$NODE_PORT/health"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop all services.${NC}\n"

# Keep alive until Ctrl+C
wait "$NODE_PID" "$PYTHON_PID"
