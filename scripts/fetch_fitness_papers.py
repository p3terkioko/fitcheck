#!/usr/bin/env python3
"""
FitCheck Engine - Targeted Fitness Paper Fetcher
Searches PubMed with focused fitness/nutrition queries, fetches metadata
and body text (from PubMed Central where available, abstract otherwise).

Output : data/papers.jsonl  (old file backed up to papers.jsonl.bak)
Schema : title, abstract, full_text, pmid, authors, journal,
         publication_year, doi, paper_type

Usage:
    python fetch_fitness_papers.py              # fetch up to 1000 papers
    python fetch_fitness_papers.py --limit 500  # fetch fewer
    python fetch_fitness_papers.py --resume     # continue after interruption
    python fetch_fitness_papers.py --stats      # show current output stats
"""

import json, time, logging, sys, re, argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional
import urllib.request, urllib.parse, urllib.error

# ── Paths ─────────────────────────────────────────────────────────────────────
PROJECT_ROOT    = Path(__file__).parent.parent
OUTPUT_FILE     = PROJECT_ROOT / 'data' / 'papers.jsonl'
CHECKPOINT_FILE = PROJECT_ROOT / 'data' / 'fetch_checkpoint.json'
LOG_DIR         = PROJECT_ROOT / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / 'fetch_papers.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ── PubMed config ─────────────────────────────────────────────────────────────
NCBI_BASE     = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
DELAY         = 0.4          # seconds between calls — stay under 3 req/s limit
TOOL          = 'fitcheck_engine'
EMAIL         = 'fitcheck@university.ac.ke'
RETMAX        = 60           # results per query

# ── Targeted search queries ───────────────────────────────────────────────────
# 20 queries × 60 results = 1 200 candidates, deduped to ~1 000 unique papers.
SEARCH_QUERIES = [
    '"resistance training" AND "muscle hypertrophy"',
    '"aerobic exercise" AND "exercise performance"',
    '"sports nutrition" AND "athletes"',
    '"protein supplementation" AND "muscle strength"',
    '"creatine supplementation" AND "exercise performance"',
    '"high-intensity interval training" AND "fitness"',
    '"body composition" AND "exercise training"',
    '"caffeine" AND "athletic performance"',
    '"muscle recovery" AND "exercise"',
    '"strength training" AND "older adults"',
    '"endurance training" AND "fatigue"',
    '"dietary protein" AND "muscle mass"',
    '"VO2max" AND "training adaptation"',
    '"stretching" AND "flexibility" AND "injury prevention"',
    '"overtraining syndrome" AND "athletes"',
    '"whey protein" AND "muscle protein synthesis"',
    '"BCAA" AND "exercise recovery"',
    '"carbohydrate" AND "exercise performance"',
    '"sleep" AND "athletic performance"',
    '"physical activity" AND "metabolic health"',
]


# ── HTTP helper ───────────────────────────────────────────────────────────────
def _get(url: str, timeout: int = 20) -> Optional[bytes]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        logger.warning(f'HTTP {e.code}: {url[:80]}')
    except Exception as e:
        logger.warning(f'Request error: {e}')
    return None


# ── PubMed search ─────────────────────────────────────────────────────────────
def search_pmids(query: str, retmax: int = RETMAX) -> list[str]:
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'term': query,
        'retmax': str(retmax), 'retmode': 'json',
        'tool': TOOL, 'email': EMAIL,
    })
    raw = _get(f'{NCBI_BASE}/esearch.fcgi?{params}')
    if not raw:
        return []
    try:
        return json.loads(raw).get('esearchresult', {}).get('idlist', [])
    except json.JSONDecodeError:
        return []


# ── PubMed fetch ──────────────────────────────────────────────────────────────
def fetch_pubmed_record(pmid: str) -> Optional[dict]:
    """
    Fetch a PubMed record and return a paper dict with all metadata fields.
    Also returns the PMC ID if present, so we can attempt full-text fetch.
    """
    params = urllib.parse.urlencode({
        'db': 'pubmed', 'id': pmid,
        'retmode': 'xml', 'rettype': 'abstract',
        'tool': TOOL, 'email': EMAIL,
    })
    raw = _get(f'{NCBI_BASE}/efetch.fcgi?{params}')
    if not raw:
        return None

    try:
        root = ET.fromstring(raw.decode('utf-8', errors='replace'))
    except ET.ParseError:
        return None

    article = root.find('.//PubmedArticle')
    if article is None:
        return None

    # Title
    title = article.findtext('.//ArticleTitle', '').strip()
    if not title:
        return None

    # Abstract (concatenate all AbstractText sections)
    abstract_parts = []
    for at in article.findall('.//AbstractText'):
        label = at.get('Label')
        text  = (at.text or '').strip()
        if label and text:
            abstract_parts.append(f'{label}: {text}')
        elif text:
            abstract_parts.append(text)
    abstract = ' '.join(abstract_parts)

    # Authors
    authors = []
    for a in article.findall('.//Author'):
        last = a.findtext('LastName', '')
        ini  = a.findtext('Initials', '')
        if last:
            authors.append(f'{last} {ini}'.strip())

    # Journal
    journal = (article.findtext('.//Journal/Title') or
               article.findtext('.//Journal/ISOAbbreviation') or '')

    # Publication year
    year = article.findtext('.//PubDate/Year', '')
    if not year:
        med = article.findtext('.//PubDate/MedlineDate', '')
        year = med[:4] if re.match(r'^\d{4}', med) else ''

    # DOI
    doi = ''
    for aid in article.findall('.//ArticleId'):
        if aid.get('IdType') == 'doi':
            doi = (aid.text or '').strip()
            break

    # PMC ID (for full-text fetch)
    pmc_id = ''
    for aid in article.findall('.//ArticleId'):
        if aid.get('IdType') == 'pmc':
            pmc_id = (aid.text or '').strip()
            break

    # Publication type
    pub_types = [pt.text for pt in article.findall('.//PublicationType') if pt.text]
    paper_type = pub_types[0] if pub_types else 'Journal Article'

    return {
        'title':            title,
        'abstract':         abstract,
        'full_text':        abstract,   # overwritten below if PMC available
        'pmid':             pmid,
        'pmc_id':           pmc_id,     # internal use, stripped before saving
        'authors':          authors,
        'journal':          journal,
        'publication_year': year,
        'doi':              doi,
        'paper_type':       paper_type,
    }


# ── PMC full-text fetch ───────────────────────────────────────────────────────
def fetch_pmc_fulltext(pmc_id: str) -> Optional[str]:
    """
    Fetch body text from PubMed Central.
    Returns a cleaned string of the full article body, or None on failure.
    """
    params = urllib.parse.urlencode({
        'db': 'pmc', 'id': pmc_id,
        'retmode': 'xml',
        'tool': TOOL, 'email': EMAIL,
    })
    raw = _get(f'{NCBI_BASE}/efetch.fcgi?{params}')
    if not raw:
        return None

    try:
        root = ET.fromstring(raw.decode('utf-8', errors='replace'))
    except ET.ParseError:
        return None

    paragraphs = []
    # Walk every <sec> with a <title> and collect <p> text
    for sec in root.iter('sec'):
        sec_title = sec.findtext('title', '').strip()
        for p in sec.findall('p'):
            text = ''.join(p.itertext()).strip()
            if text:
                paragraphs.append(text)

    # Also grab top-level <p> outside sections
    body = root.find('.//body')
    if body is not None:
        for p in body.findall('p'):
            text = ''.join(p.itertext()).strip()
            if text:
                paragraphs.append(text)

    if not paragraphs:
        return None

    full = ' '.join(paragraphs)
    # Clean up whitespace
    full = re.sub(r'\s+', ' ', full).strip()
    return full if len(full) > 200 else None


# ── Checkpoint helpers ────────────────────────────────────────────────────────
def load_checkpoint() -> set:
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE) as f:
                return set(json.load(f))
        except Exception:
            pass
    return set()


def save_checkpoint(done: set):
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(list(done), f)


# ── Stats ─────────────────────────────────────────────────────────────────────
def print_stats():
    if not OUTPUT_FILE.exists():
        print('Output file does not exist yet.')
        return
    total = pmc = 0
    years: dict = {}
    with open(OUTPUT_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            p = json.loads(line)
            total += 1
            if len(p.get('full_text', '')) > len(p.get('abstract', '')) + 50:
                pmc += 1
            yr = p.get('publication_year', '?')
            years[yr] = years.get(yr, 0) + 1
    print(f'\nFetch stats for {OUTPUT_FILE}')
    print(f'  Total papers       : {total}')
    print(f'  With PMC full text : {pmc}  ({pmc/total*100:.1f}%)')
    print(f'  Abstract-only      : {total - pmc}')
    if years:
        top = sorted(years.items(), key=lambda x: -x[1])[:10]
        print('\n  By year (top 10):')
        for yr, cnt in top:
            print(f'    {yr:>6}  {cnt}')


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit',  type=int, default=1000,
                        help='Max papers to collect (default 1000)')
    parser.add_argument('--resume', action='store_true',
                        help='Continue an interrupted run')
    parser.add_argument('--stats',  action='store_true',
                        help='Print stats and exit')
    args = parser.parse_args()

    if args.stats:
        print_stats()
        return

    # ── Step 1: collect unique PMIDs ─────────────────────────────────────────
    logger.info('🔍 Searching PubMed for fitness/nutrition papers...')
    all_pmids: list[str] = []
    seen_pmids: set[str] = set()

    for i, query in enumerate(SEARCH_QUERIES, 1):
        logger.info(f'  [{i}/{len(SEARCH_QUERIES)}] {query}')
        pmids = search_pmids(query)
        time.sleep(DELAY)
        new = [p for p in pmids if p not in seen_pmids]
        seen_pmids.update(new)
        all_pmids.extend(new)
        logger.info(f'    → {len(new)} new PMIDs (total unique: {len(all_pmids)})')
        if len(all_pmids) >= args.limit + 200:   # buffer for failed fetches
            break

    logger.info(f'✅ {len(all_pmids)} unique PMIDs collected across all queries')

    # ── Step 2: load checkpoint ───────────────────────────────────────────────
    done: set[str] = load_checkpoint() if args.resume else set()
    if not args.resume and OUTPUT_FILE.exists():
        bak = OUTPUT_FILE.with_suffix('.jsonl.bak')
        OUTPUT_FILE.rename(bak)
        logger.info(f'📦 Backed up existing papers to {bak.name}')
    if CHECKPOINT_FILE.exists() and not args.resume:
        CHECKPOINT_FILE.unlink()

    to_fetch = [p for p in all_pmids if p not in done]
    logger.info(f'📥 Papers to fetch: {len(to_fetch)}  (already done: {len(done)})')

    # ── Step 3: fetch each paper ──────────────────────────────────────────────
    fetched = 0
    pmc_hits = 0

    with open(OUTPUT_FILE, 'a', encoding='utf-8') as out_f:
        try:
            for i, pmid in enumerate(to_fetch, 1):
                if fetched >= args.limit:
                    logger.info(f'✅ Reached limit of {args.limit} papers')
                    break

                # Fetch PubMed record
                record = fetch_pubmed_record(pmid)
                time.sleep(DELAY)

                if not record:
                    logger.warning(f'  [{i}] PMID {pmid}: no record returned')
                    done.add(pmid)
                    continue

                if not record.get('abstract'):
                    logger.info(f'  [{i}] PMID {pmid}: no abstract, skipping')
                    done.add(pmid)
                    continue

                # Try PMC full text
                pmc_id = record.pop('pmc_id', '')
                if pmc_id:
                    fulltext = fetch_pmc_fulltext(pmc_id)
                    time.sleep(DELAY)
                    if fulltext:
                        record['full_text'] = fulltext
                        pmc_hits += 1
                        src = f'PMC:{pmc_id}'
                    else:
                        src = 'abstract (PMC parse failed)'
                else:
                    src = 'abstract (no PMC)'

                out_f.write(json.dumps(record, ensure_ascii=False) + '\n')
                out_f.flush()
                done.add(pmid)
                fetched += 1

                logger.info(
                    f'  [{fetched}/{args.limit}] {record["title"][:65]}'
                    f'\n    {src} | {record.get("journal","?")[:35]} {record.get("publication_year","")}'
                )

                if fetched % 50 == 0:
                    save_checkpoint(done)
                    logger.info(f'💾 Checkpoint saved ({fetched} papers written)')

        except KeyboardInterrupt:
            logger.info('\n⏹️  Interrupted — re-run with --resume to continue')
        finally:
            save_checkpoint(done)
            logger.info('💾 Final checkpoint saved')

    # ── Summary ───────────────────────────────────────────────────────────────
    logger.info(f'\n📊 Fetch complete:')
    logger.info(f'  Papers written     : {fetched}')
    logger.info(f'  With PMC full text : {pmc_hits}  ({pmc_hits/fetched*100:.1f}% if fetched else 0)')
    logger.info(f'  Abstract-only      : {fetched - pmc_hits}')
    logger.info(f'  Output             : {OUTPUT_FILE}')
    logger.info('')
    logger.info('Next steps:')
    logger.info('  psql $DATABASE_URL -c "TRUNCATE TABLE research_papers RESTART IDENTITY;"')
    logger.info('  npm run ingest')


if __name__ == '__main__':
    main()
