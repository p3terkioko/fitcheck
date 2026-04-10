#!/usr/bin/env python3
"""
FitCheck Engine - PubMed Metadata Enrichment Script
Looks up each paper by title on PubMed E-utilities and adds:
  authors, journal, publication_year, doi, paper_type, pmid
Writes output to data/papers_enriched.jsonl with checkpoint support
so the run can be interrupted and resumed safely.

Usage:
    python enrich_papers.py              # enrich all papers
    python enrich_papers.py --reset      # ignore checkpoint, start fresh
    python enrich_papers.py --stats      # show enrichment stats and exit

Rate limit: NCBI allows 3 req/s without an API key.
We send 2 requests per paper (esearch + efetch), so at 0.4 s delay
between each call we stay well under the limit (~2.5 req/s effective).
1 000 papers ≈ 13 minutes total runtime.
"""

import json
import time
import logging
import sys
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional
import urllib.request
import urllib.parse
import urllib.error
import argparse

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_FILE       = PROJECT_ROOT / 'data' / 'papers.jsonl'
OUTPUT_FILE      = PROJECT_ROOT / 'data' / 'papers_enriched.jsonl'
CHECKPOINT_FILE  = PROJECT_ROOT / 'data' / 'enrichment_checkpoint.json'
LOG_DIR          = PROJECT_ROOT / 'logs'

LOG_DIR.mkdir(exist_ok=True)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / 'enrichment.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ── PubMed API ────────────────────────────────────────────────────────────────
NCBI_BASE     = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
REQUEST_DELAY = 0.4   # seconds between each HTTP call (stay under 3 req/s limit)
TOOL_NAME     = 'fitcheck_engine'
CONTACT_EMAIL = 'fitcheck@university.ac.ke'   # required by NCBI policy


def _get(url: str, timeout: int = 15) -> Optional[bytes]:
    """Simple HTTP GET with basic error handling."""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        logger.warning(f'HTTP {e.code} for {url[:80]}')
    except Exception as e:
        logger.warning(f'Request failed: {e}')
    return None


def search_pubmed(title: str) -> Optional[str]:
    """
    Search PubMed by exact title and return the PMID of the first result.
    Returns None if not found or on error.
    """
    # Exact title field search — most reliable strategy
    params = urllib.parse.urlencode({
        'db':      'pubmed',
        'term':    f'"{title}"[ti]',
        'retmax':  '1',
        'retmode': 'json',
        'tool':    TOOL_NAME,
        'email':   CONTACT_EMAIL,
    })
    raw = _get(f'{NCBI_BASE}/esearch.fcgi?{params}')
    if raw is None:
        return None

    try:
        data = json.loads(raw.decode())
        ids = data.get('esearchresult', {}).get('idlist', [])
        return ids[0] if ids else None
    except (json.JSONDecodeError, KeyError):
        return None


def fetch_metadata(pmid: str) -> dict:
    """
    Fetch full metadata for a PMID via efetch XML.
    Returns a dict with: pmid, authors, journal, publication_year, doi, paper_type.
    Returns {} on any failure.
    """
    params = urllib.parse.urlencode({
        'db':      'pubmed',
        'id':      pmid,
        'retmode': 'xml',
        'rettype': 'abstract',
        'tool':    TOOL_NAME,
        'email':   CONTACT_EMAIL,
    })
    raw = _get(f'{NCBI_BASE}/efetch.fcgi?{params}')
    if raw is None:
        return {}

    try:
        root = ET.fromstring(raw.decode())
    except ET.ParseError as e:
        logger.warning(f'XML parse error for PMID {pmid}: {e}')
        return {}

    article = root.find('.//PubmedArticle')
    if article is None:
        return {}

    meta: dict = {'pmid': pmid}

    # Authors (up to 6, then "et al." style is handled at display time)
    authors = []
    for author in article.findall('.//Author'):
        last     = author.findtext('LastName', '')
        initials = author.findtext('Initials', '')
        if last:
            authors.append(f'{last} {initials}'.strip())
    meta['authors'] = authors

    # Journal (prefer full title, fallback to abbreviation)
    meta['journal'] = (
        article.findtext('.//Journal/Title') or
        article.findtext('.//Journal/ISOAbbreviation') or
        ''
    )

    # Publication year
    pub_year = article.findtext('.//PubDate/Year', '')
    if not pub_year:
        # MedlineDate e.g. "2023 Jan-Feb" — take first 4 chars
        medline = article.findtext('.//PubDate/MedlineDate', '')
        pub_year = medline[:4] if re.match(r'^\d{4}', medline) else ''
    meta['publication_year'] = pub_year

    # DOI
    doi = ''
    for id_elem in article.findall('.//ArticleId'):
        if id_elem.get('IdType') == 'doi':
            doi = (id_elem.text or '').strip()
            break
    meta['doi'] = doi

    # Publication type (first entry is most specific, e.g. "Randomized Controlled Trial")
    pub_types = [pt.text for pt in article.findall('.//PublicationType') if pt.text]
    meta['paper_type'] = pub_types[0] if pub_types else 'Journal Article'

    return meta


# ── Checkpoint helpers ────────────────────────────────────────────────────────

def load_checkpoint() -> set:
    """Return set of already-enriched paper titles."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, encoding='utf-8') as f:
                return set(json.load(f))
        except (json.JSONDecodeError, OSError):
            pass
    return set()


def save_checkpoint(processed_titles: set):
    """Persist the set of processed titles."""
    with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
        json.dump(list(processed_titles), f)


# ── Stats helper ──────────────────────────────────────────────────────────────

def print_stats():
    if not OUTPUT_FILE.exists():
        print('Output file does not exist yet.')
        return
    total = matched = 0
    years: dict = {}
    with open(OUTPUT_FILE, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            p = json.loads(line)
            total += 1
            if p.get('pmid'):
                matched += 1
                yr = p.get('publication_year', 'unknown')
                years[yr] = years.get(yr, 0) + 1

    print(f'\nEnrichment stats for {OUTPUT_FILE}')
    print(f'  Total papers      : {total}')
    print(f'  PubMed matched    : {matched}  ({matched/total*100:.1f}%)')
    print(f'  Without match     : {total - matched}')
    if years:
        print('\n  By publication year (top 10):')
        for yr, cnt in sorted(years.items(), key=lambda x: -x[1])[:10]:
            print(f'    {yr:>6}  {cnt}')


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Enrich papers.jsonl with PubMed metadata')
    parser.add_argument('--reset', action='store_true',
                        help='Ignore existing checkpoint and start fresh')
    parser.add_argument('--stats', action='store_true',
                        help='Print enrichment statistics and exit')
    args = parser.parse_args()

    if args.stats:
        print_stats()
        return

    if not INPUT_FILE.exists():
        logger.error(f'Input file not found: {INPUT_FILE}')
        sys.exit(1)

    # Load source papers
    papers = []
    with open(INPUT_FILE, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    papers.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    logger.info(f'Loaded {len(papers)} papers from {INPUT_FILE.name}')

    # Checkpoint
    done: set = set() if args.reset else load_checkpoint()
    if args.reset and OUTPUT_FILE.exists():
        OUTPUT_FILE.unlink()
        logger.info('Reset: removed existing output file and checkpoint')
    if done:
        logger.info(f'Resuming: {len(done)} papers already enriched')

    # Papers remaining
    to_process = [p for p in papers if p.get('title', '') not in done]
    logger.info(f'Papers to enrich: {len(to_process)}')

    if not to_process:
        logger.info('All papers already enriched. Run with --reset to start over.')
        print_stats()
        return

    total_papers = len(to_process)
    matched_count = 0

    with open(OUTPUT_FILE, 'a', encoding='utf-8') as out_f:
        try:
            for i, paper in enumerate(to_process, 1):
                title = paper.get('title', '')
                logger.info(f'[{i}/{total_papers}] {title[:72]}')

                # ── Step 1: search by title ──────────────────────────────────
                pmid = search_pubmed(title)
                time.sleep(REQUEST_DELAY)

                enriched = dict(paper)

                if pmid:
                    # ── Step 2: fetch full metadata ──────────────────────────
                    meta = fetch_metadata(pmid)
                    time.sleep(REQUEST_DELAY)
                    enriched.update(meta)
                    matched_count += 1
                    logger.info(
                        f'  ✅ PMID {pmid} | '
                        f'{enriched.get("journal","?")[:40]} | '
                        f'{enriched.get("publication_year","?")}'
                    )
                else:
                    # Provide empty fields so ingest_papers.py always finds them
                    enriched.update({
                        'pmid': None,
                        'authors': [],
                        'journal': '',
                        'publication_year': '',
                        'doi': '',
                        'paper_type': '',
                    })
                    logger.info('  ❓ No PubMed match')

                out_f.write(json.dumps(enriched, ensure_ascii=False) + '\n')
                out_f.flush()
                done.add(title)

                # Save checkpoint every 50 papers
                if i % 50 == 0:
                    save_checkpoint(done)
                    logger.info(f'💾 Checkpoint saved ({len(done)} done)')

        except KeyboardInterrupt:
            logger.info('\n⏹️  Interrupted — progress saved, re-run to resume')
        finally:
            save_checkpoint(done)
            logger.info('💾 Checkpoint saved on exit')

    # Final summary
    enriched_total = len(done)
    logger.info('\n📊 Enrichment complete:')
    logger.info(f'  Papers enriched this run : {i}')
    logger.info(f'  PubMed matches this run  : {matched_count}  ({matched_count/i*100:.1f}%)')
    logger.info(f'  Total enriched overall   : {enriched_total}')
    logger.info(f'  Output                   : {OUTPUT_FILE}')
    logger.info('')
    logger.info('Next step: re-run ingestion to load enriched data into the database.')
    logger.info('  psql $DATABASE_URL -c "TRUNCATE TABLE research_papers RESTART IDENTITY;"')
    logger.info('  npm run ingest')


if __name__ == '__main__':
    main()
