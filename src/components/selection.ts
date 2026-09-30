// Pure selection logic for the document manager. Kept free of Vue: this is
// where the Appendix D.3/D.4 selection rules live, so they are easy to test.

import type { RankedDocumentV1, RankedProvisionsV1 } from 'legal-provision-types'
import { emptySelection, type FullDocument, type SelectionState } from './types'

/**
 * D.3 #17: selected documents are those scoring at or above the threshold and
 * not excluded, plus every manually added document.
 */
export function selectedDocIds(
  ranked: RankedProvisionsV1,
  threshold: number,
  selection: SelectionState,
): string[] {
  const fromRetrieval = (ranked.documents ?? [])
    .filter((d) => d.score >= threshold && !(d.doc_id in selection.excluded))
    .map((d) => d.doc_id)
  const manual = Object.entries(selection.documents)
    .filter(([, v]) => v.origin === 'manual')
    .map(([id]) => id)
    .filter((id) => !(id in selection.excluded))
  return [...new Set([...fromRetrieval, ...manual])]
}

/**
 * D.4 #31: a provision is selected if manually included, else not if manually
 * excluded, else by score >= threshold.
 */
export function isProvisionSelected(
  provId: string,
  score: number,
  threshold: number,
  selection: SelectionState,
): boolean {
  if (selection.provisionOverrides[provId]) return true
  if (selection.provisionDeselections[provId]) return false
  return score >= threshold
}

/** Score of a provision by id from the ranked data, defaulting to 0. */
export function provisionScore(ranked: RankedProvisionsV1, provId: string): number {
  for (const doc of ranked.documents ?? []) {
    for (const p of doc.provisions ?? []) {
      if (p.prov_id === provId) return p.score
    }
  }
  return 0
}

/** D.3 #19: whether excluding this document should warn. */
export function shouldWarnOnExclude(score: number, highScoreWarning: number): boolean {
  return highScoreWarning > 0 && score >= highScoreWarning
}

/** D.3 #28: whether the low-document guardrail should show. */
export function isLowDocumentCount(count: number, minDocuments: number): boolean {
  return minDocuments > 0 && count < minDocuments
}

/** Apply an exclusion: D.3 #21 removes any manual marker (and, for provision
 * deselections, the caller adds them). Returns a new selection. */
export function excludeDocument(
  selection: SelectionState,
  docId: string,
  reason: string,
): SelectionState {
  const next: SelectionState = {
    documents: { ...selection.documents },
    provisionOverrides: { ...selection.provisionOverrides },
    provisionDeselections: { ...selection.provisionDeselections },
    excluded: { ...selection.excluded, [docId]: reason },
  }
  delete next.documents[docId]
  return next
}

/** Restore an excluded document; D.3 #24 clears the reason. Provision
 * deselections are cleared by the caller from the loaded document. */
export function restoreDocument(selection: SelectionState, docId: string): SelectionState {
  const next: SelectionState = {
    documents: { ...selection.documents },
    provisionOverrides: { ...selection.provisionOverrides },
    provisionDeselections: { ...selection.provisionDeselections },
    excluded: { ...selection.excluded },
  }
  delete next.excluded[docId]
  return next
}

/** D.3 #26: mark a document as manually added. */
export function addDocument(selection: SelectionState, docId: string): SelectionState {
  const next: SelectionState = {
    documents: { ...selection.documents, [docId]: { origin: 'manual' } },
    provisionOverrides: { ...selection.provisionOverrides },
    provisionDeselections: { ...selection.provisionDeselections },
    excluded: { ...selection.excluded },
  }
  delete next.excluded[docId]
  return next
}

/**
 * D.3 #27: the provisions to select when a document is added. With
 * `includePreamblesOnAdd` false, preambles are left out; the choice is explicit
 * and the selection is always kept on save (the old dashboard dropped them).
 */
export function provisionsToSelectOnAdd(
  doc: FullDocument,
  includePreambles: boolean,
): string[] {
  return doc.provisions
    .filter((p) => includePreambles || p.unit_type !== 'preamble')
    .map((p) => p.prov_id)
}

/**
 * D.6 #46: the saved provision list - one entry per selected provision of each
 * selected document, with source "manual" for overrides and "system" otherwise.
 */
export function buildSelectedProvisions(
  ranked: RankedProvisionsV1,
  docIds: string[],
  threshold: number,
  selection: SelectionState,
  fullDocs: Record<string, FullDocument>,
): { prov_id: string; doc_id: string; score: number | null; source: 'system' | 'manual' }[] {
  const out: { prov_id: string; doc_id: string; score: number | null; source: 'system' | 'manual' }[] = []
  for (const docId of docIds) {
    const full = fullDocs[docId]
    const rankedDoc = (ranked.documents ?? []).find((d) => d.doc_id === docId)
    const provisions = full?.provisions ?? rankedDoc?.provisions?.map((p) => ({
      prov_id: p.prov_id,
      citation: p.citation,
      article: p.article,
      text: p.text_preview,
    })) ?? []
    for (const p of provisions) {
      const score = provisionScore(ranked, p.prov_id)
      if (isProvisionSelected(p.prov_id, score, threshold, selection)) {
        out.push({
          prov_id: p.prov_id,
          doc_id: docId,
          score,
          source: selection.provisionOverrides[p.prov_id] ? 'manual' : 'system',
        })
      }
    }
  }
  return out
}

/** A fresh selection (re-exported for callers). */
export { emptySelection }
