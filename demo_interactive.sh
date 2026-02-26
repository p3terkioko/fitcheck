#!/bin/bash
# FitCheck — Interactive Demo CLI
# Usage: bash demo_interactive.sh
# Assumes both services are already running (start with: bash demo.sh first,
# then open a second terminal and run this script).

set -a; [ -f .env ] && source .env; set +a

NODE_PORT=${NODE_PORT:-3000}
BASE="http://localhost:$NODE_PORT"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Helpers ────────────────────────────────────────────────────────────────────
header() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  $1"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

verdict_color() {
    case "$1" in
        SUPPORTED)            echo "${GREEN}" ;;
        PARTIALLY_SUPPORTED)  echo "${YELLOW}" ;;
        NOT_SUPPORTED)        echo "${RED}" ;;
        INSUFFICIENT_EVIDENCE) echo "${CYAN}" ;;
        *)                    echo "${NC}" ;;
    esac
}

show_single_result() {
    local JSON="$1"
    local CLAIM="$2"

    VERDICT=$(echo "$JSON"    | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('synthesized',{}).get('synthesized_answer',{}); print(a.get('verdict','N/A'))" 2>/dev/null)
    CONFIDENCE=$(echo "$JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('synthesized',{}).get('synthesized_answer',{}); print(a.get('confidence','N/A'))" 2>/dev/null)
    SUMMARY=$(echo "$JSON"    | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('synthesized',{}).get('synthesized_answer',{}); print(a.get('summary','N/A'))" 2>/dev/null)
    MS=$(echo "$JSON"         | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('metadata',{}).get('total_processing_time_ms','N/A'))" 2>/dev/null)

    KEY_POINTS=$(echo "$JSON" | python3 -c "
import json, sys
kp = json.load(sys.stdin).get('synthesized',{}).get('synthesized_answer',{}).get('key_points',[])
for p in kp: print('    •', p)
" 2>/dev/null)

    SOURCES=$(echo "$JSON" | python3 -c "
import json, sys
results = json.load(sys.stdin).get('data',{}).get('results',[])
seen = set()
for r in results:
    t = r.get('title','Unknown'); s = int(r.get('similarity_score',0)*100)
    if t not in seen:
        seen.add(t)
        print(f'    [{s}%] {t[:72]}...' if len(t)>72 else f'    [{s}%] {t}')
" 2>/dev/null)

    VC=$(verdict_color "$VERDICT")
    case $CONFIDENCE in
        high)     CC="${GREEN}" ;;
        moderate) CC="${YELLOW}" ;;
        *)        CC="${RED}" ;;
    esac

    echo ""
    echo -e "  ${BOLD}Claim:${NC}      \"${YELLOW}$CLAIM${NC}\""
    echo ""
    echo -e "  ${BOLD}Verdict:${NC}    ${VC}${BOLD}$VERDICT${NC}"
    echo -e "  ${BOLD}Confidence:${NC} ${CC}${BOLD}$CONFIDENCE${NC}"
    echo ""
    echo -e "  ${BOLD}Summary:${NC}"
    echo "$SUMMARY" | fold -s -w 74 | sed 's/^/    /'
    echo ""
    echo -e "  ${BOLD}Key Points:${NC}"
    echo "$KEY_POINTS"
    echo ""
    echo -e "  ${BOLD}Sources:${NC}"
    echo "$SOURCES"
    echo -e "  ${CYAN}Processed in ${MS}ms${NC}"
}

check_service() {
    curl -s "$BASE/health" 2>/dev/null | grep -q '"status":"healthy"'
}

# ── Startup ────────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}${BLUE}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║            FitCheck — Interactive Demo CLI                  ║"
echo "  ║       AI-Powered Fitness Misinformation Detection            ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

if ! check_service; then
    echo -e "${RED}  ❌ API server not reachable at $BASE${NC}"
    echo -e "${YELLOW}  Start services first:  bash demo.sh${NC}"
    echo -e "  Then open a new terminal and run:  bash demo_interactive.sh"
    exit 1
fi

# Show DB stats
STATS=$(curl -s "$BASE/api/stats")
PAPERS=$(echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('unique_papers','?'))" 2>/dev/null)
CHUNKS=$(echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('total_chunks','?'))" 2>/dev/null)

echo -e "  ${GREEN}✅ Services running${NC}"
echo -e "  📚 Knowledge base: ${BOLD}$PAPERS papers${NC} · ${BOLD}$CHUNKS chunks${NC}"
echo -e "  🤖 Embedding: sentence-transformers/all-MiniLM-L6-v2"
echo -e "  🧠 LLM: Llama 3.1 via Groq"
echo ""

# ── Main loop ──────────────────────────────────────────────────────────────────
while true; do

    echo -e "${BOLD}  What would you like to do?${NC}"
    echo "    1) Verify a fitness claim"
    echo "    2) Analyse a social media URL  (TikTok / Instagram / YouTube)"
    echo "    3) Exit"
    echo ""
    printf "  Choice [1/2/3]: "
    read -r CHOICE

    # ── Option 1: Verify a claim ────────────────────────────────────────────
    if [ "$CHOICE" = "1" ]; then
        echo ""
        printf "  Enter a fitness claim to verify:\n  > "
        read -r CLAIM

        if [ -z "$CLAIM" ]; then
            echo -e "${RED}  No claim entered.${NC}"; continue
        fi

        header "Verifying claim..."
        echo -e "  ${CYAN}Searching 37,455 research chunks and synthesising verdict...${NC}"

        ESCAPED=$(echo "$CLAIM" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))")
        JSON=$(curl -s -X POST "$BASE/api/verify" \
            -H "Content-Type: application/json" \
            -d "{\"claim\": $ESCAPED, \"max_results\": 5}")

        if echo "$JSON" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
            show_single_result "$JSON" "$CLAIM"
        else
            echo -e "${RED}  Request failed. Is the ML service running?${NC}"
        fi

    # ── Option 2: Analyse a URL ─────────────────────────────────────────────
    elif [ "$CHOICE" = "2" ]; then
        echo ""
        printf "  Paste the video URL:\n  > "
        read -r URL

        if [ -z "$URL" ]; then
            echo -e "${RED}  No URL entered.${NC}"; continue
        fi

        header "Analysing social media URL"
        echo -e "  ${CYAN}Step 1/3 — Downloading and transcribing audio...${NC}"

        ESCAPED_URL=$(echo "$URL" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))")
        JSON=$(curl -s --max-time 180 -X POST "$BASE/api/analyze-url" \
            -H "Content-Type: application/json" \
            -d "{\"url\": $ESCAPED_URL}")

        # Check for error
        if echo "$JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('status')=='success' else 1)" 2>/dev/null; then

            CLAIMS_N=$(echo "$JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('claims_found',0))" 2>/dev/null)
            TRANSCRIPT=$(echo "$JSON" | python3 -c "import json,sys; t=json.load(sys.stdin).get('transcript',''); print(t[:300]+'...' if len(t)>300 else t)" 2>/dev/null)

            echo -e "\n  ${GREEN}✅ Transcription complete${NC}"
            echo -e "  ${BOLD}Transcript (preview):${NC}"
            echo "$TRANSCRIPT" | fold -s -w 74 | sed 's/^/    /'
            echo ""
            echo -e "  ${BOLD}Claims found: ${YELLOW}$CLAIMS_N${NC}"
            echo -e "  ${CYAN}Step 2/3 — Extracting claims...${NC}"
            echo -e "  ${CYAN}Step 3/3 — Verifying each claim against research database...${NC}"
            echo ""

            echo "$JSON" | python3 -c "
import json, sys

d = json.load(sys.stdin)
claims = d.get('claims', [])

colours = {
    'SUPPORTED':             '\033[0;32m',
    'PARTIALLY_SUPPORTED':   '\033[1;33m',
    'NOT_SUPPORTED':         '\033[0;31m',
    'INSUFFICIENT_EVIDENCE': '\033[0;36m',
}
BOLD = '\033[1m'; NC = '\033[0m'; BLUE = '\033[0;34m'

for c in claims:
    verdict = c.get('verdict', 'N/A')
    conf    = c.get('confidence', 'N/A')
    summary = c.get('summary', '')
    claim   = c.get('claim', '')
    vc      = colours.get(verdict, NC)

    print(f'  {BOLD}Claim {c[\"claim_index\"]+1}:{NC} \"{claim}\"')
    print(f'  {BOLD}Verdict:{NC}    {vc}{BOLD}{verdict}{NC}   ({conf} confidence)')
    print(f'  {BOLD}Summary:{NC}')
    words = summary.split()
    line = '    '
    for w in words:
        if len(line) + len(w) > 76:
            print(line); line = '    ' + w + ' '
        else:
            line += w + ' '
    if line.strip(): print(line)
    print()
    srcs = c.get('sources', [])[:3]
    if srcs:
        print(f'  {BOLD}Sources:{NC}')
        for s in srcs:
            t = s.get(\"title\", \"\")
            score = int(s.get(\"similarity_score\",0)*100)
            t = (t[:70]+'...') if len(t)>70 else t
            print(f'    [{score}%] {t}')
    print()
    print('  ' + '-'*62)
    print()
"
        else
            ERR=$(echo "$JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('message', d.get('error','Unknown error')))" 2>/dev/null)
            echo -e "\n  ${RED}❌ $ERR${NC}"
        fi

    elif [ "$CHOICE" = "3" ]; then
        echo -e "\n  ${GREEN}Done.${NC}\n"
        exit 0
    else
        echo -e "${RED}  Invalid choice.${NC}"
    fi

    echo ""
    printf "  Press Enter to continue..."
    read -r
    clear
    echo -e "${BOLD}${BLUE}  FitCheck — Interactive Demo${NC}  (${PAPERS} papers · ${CHUNKS} chunks)\n"

done
