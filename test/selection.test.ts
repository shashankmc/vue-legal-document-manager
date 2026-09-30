import { describe, expect, it } from 'vitest'
import type { RankedProvisionsV1 } from 'legal-provision-types'
import {
  addDocument,
  buildSelectedProvisions,
  excludeDocument,
  isLowDocumentCount,
  isProvisionSelected,
  provisionsToSelectOnAdd,
  restoreDocument,
  selectedDocIds,
  shouldWarnOnExclude,
} from '../src/components/selection'
import { emptySelection, type FullDocument } from '../src/components/types'
import { sanitizeHtml } from '../src/components/sanitize'

function ranked(): RankedProvisionsV1 {
  return {
    case_id: 'halden',
    query: 'x',
    method: 'bm25',
    threshold: 0.2,
    corpus_version: '1.0',
    documents: [
      {
        doc_id: 'bbnj',
        title: 'BBNJ',
        score: 0.5,
        top_provision: 'bbnj_art1',
        provisions: [
          { prov_id: 'bbnj_art1', citation: null, article: 'Art. 1', score: 0.5, text_preview: 'a' },
          { prov_id: 'bbnj_art2', citation: null, article: 'Art. 2', score: 0.1, text_preview: 'b' },
        ],
      },
      {
        doc_id: 'trips',
        title: 'TRIPS',
        score: 0.1,
        top_provision: 'trips_art1',
        provisions: [
          { prov_id: 'trips_art1', citation: null, article: 'Art. 1', score: 0.1, text_preview: 'c' },
        ],
      },
    ],
  }
}

function fullDoc(): FullDocument {
  return {
    doc_id: 'nagoya',
    title: 'Nagoya',
    doc_type: 'treaty',
    provisions: [
      { prov_id: 'nagoya_preamble', citation: null, article: 'Preamble', unit_type: 'preamble', text: 'p' },
      { prov_id: 'nagoya_art1', citation: null, article: 'Art. 1', unit_type: 'article', text: 'a' },
    ],
  }
}

describe('selection helpers', () => {
  it('D.3 #17 selected = score>=threshold not excluded, plus manual', () => {
    const sel = emptySelection()
    expect(selectedDocIds(ranked(), 0.2, sel)).toEqual(['bbnj'])

    const withManual = addDocument(sel, 'trips')
    expect(selectedDocIds(ranked(), 0.2, withManual).sort()).toEqual(['bbnj', 'trips'])

    const withExcluded = excludeDocument(withManual, 'bbnj', 'no')
    expect(selectedDocIds(ranked(), 0.2, withExcluded)).toEqual(['trips'])
  })

  it('D.3 #19 warns on excluding a high-scoring document', () => {
    expect(shouldWarnOnExclude(0.42, 0.3)).toBe(true)
    expect(shouldWarnOnExclude(0.2, 0.3)).toBe(false)
    expect(shouldWarnOnExclude(0.9, 0)).toBe(false)
  })

  it('D.3 #21 exclude removes the manual marker and records the reason', () => {
    const sel = excludeDocument(addDocument(emptySelection(), 'trips'), 'trips', 'irrelevant')
    expect(sel.documents.trips).toBeUndefined()
    expect(sel.excluded.trips).toBe('irrelevant')
  })

  it('D.3 #24 restore clears the reason', () => {
    const sel = restoreDocument(excludeDocument(emptySelection(), 'trips', 'x'), 'trips')
    expect(sel.excluded.trips).toBeUndefined()
  })

  it('D.3 #27 preambles are excluded on add unless asked for', () => {
    expect(provisionsToSelectOnAdd(fullDoc(), false)).toEqual(['nagoya_art1'])
    expect(provisionsToSelectOnAdd(fullDoc(), true)).toEqual(['nagoya_preamble', 'nagoya_art1'])
  })

  it('D.3 #28 low-document guardrail', () => {
    expect(isLowDocumentCount(1, 2)).toBe(true)
    expect(isLowDocumentCount(2, 2)).toBe(false)
    expect(isLowDocumentCount(0, 0)).toBe(false)
  })

  it('D.4 #31 selection precedence: manual include, then manual exclude, then score', () => {
    const sel = emptySelection()
    expect(isProvisionSelected('bbnj_art1', 0.5, 0.2, sel)).toBe(true)
    expect(isProvisionSelected('bbnj_art2', 0.1, 0.2, sel)).toBe(false)

    const included = { ...sel, provisionOverrides: { bbnj_art2: 'manual' as const } }
    expect(isProvisionSelected('bbnj_art2', 0.1, 0.2, included)).toBe(true)

    const excluded = { ...sel, provisionDeselections: { bbnj_art1: 'manual' as const } }
    expect(isProvisionSelected('bbnj_art1', 0.5, 0.2, excluded)).toBe(false)
  })

  it('D.6 #46 builds saved provisions with source', () => {
    const sel = { ...emptySelection(), provisionOverrides: { bbnj_art2: 'manual' as const } }
    const out = buildSelectedProvisions(ranked(), ['bbnj'], 0.2, sel, {})
    expect(out).toEqual([
      { prov_id: 'bbnj_art1', doc_id: 'bbnj', score: 0.5, source: 'system' },
      { prov_id: 'bbnj_art2', doc_id: 'bbnj', score: 0.1, source: 'manual' },
    ])
  })

  it('D.4 #38 sanitises scripts, handlers and javascript: URLs', () => {
    const dirty = '<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><b>ok</b>'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('script')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('javascript:')
    expect(clean).toContain('<b>ok</b>')
  })
})
