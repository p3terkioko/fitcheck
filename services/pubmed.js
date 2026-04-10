'use strict';

const axios = require('axios');

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const API_KEY = process.env.PUBMED_API_KEY || null;

/**
 * Given a PMID, returns the canonical PubMed URL.
 * Fast — just constructs the URL, no API call needed.
 */
function pmidToUrl(pmid) {
    if (!pmid) return null;
    return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

/**
 * Given a DOI, returns the doi.org resolver URL.
 */
function doiToUrl(doi) {
    if (!doi) return null;
    return `https://doi.org/${doi}`;
}

/**
 * Resolves a pubmedUrl for a single research paper result.
 * Priority: pmid → doi → null
 * No API call needed — URLs are deterministic from IDs.
 */
function resolveEvidenceUrl(metadata) {
    if (!metadata) return null;
    if (metadata.pmid)      return pmidToUrl(metadata.pmid);
    if (metadata.doi)       return doiToUrl(metadata.doi);
    if (metadata.pubmed_id) return pmidToUrl(metadata.pubmed_id);
    return null;
}

/**
 * Enriches a batch of paper metadata objects with pubmedUrl.
 * Does not make API calls — resolves from stored IDs only.
 * Returns the same array with pubmedUrl added to each item.
 */
function enrichWithUrls(papers) {
    return papers.map(paper => ({
        ...paper,
        pubmedUrl: resolveEvidenceUrl(paper.metadata)
    }));
}

module.exports = { pmidToUrl, doiToUrl, resolveEvidenceUrl, enrichWithUrls };
