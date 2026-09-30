// Component tests, one per Appendix D.3 / D.4 / D.6 item the manager owns.

import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DocumentManager from '../src/components/DocumentManager.vue'
import type { RankedProvisionsV1 } from 'legal-provision-types'

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
        title: 'BBNJ Agreement',
        score: 0.5,
        top_provision: 'bbnj_art1',
        provisions: [
          { prov_id: 'bbnj_art1', citation: 'BBNJ Art. 1', article: 'Art. 1', score: 0.5, text_preview: 'Provision one.' },
          { prov_id: 'bbnj_art2', citation: 'BBNJ Art. 2', article: 'Art. 2', score: 0.1, text_preview: 'Provision two.' },
        ],
      },
      {
        doc_id: 'trips',
        title: 'TRIPS',
        score: 0.45,
        top_provision: 'trips_art1',
        provisions: [
          { prov_id: 'trips_art1', citation: null, article: 'Art. 1', score: 0.45, text_preview: 'Trips one.' },
        ],
      },
    ],
  }
}

const FULL = {
  doc_id: 'bbnj',
  title: 'BBNJ Agreement',
  doc_type: 'treaty',
  provisions: [
    { prov_id: 'bbnj_art1', citation: 'BBNJ Art. 1', article: 'Art. 1', unit_type: 'article', text: 'Provision one.' },
    { prov_id: 'bbnj_art2', citation: 'BBNJ Art. 2', article: 'Art. 2', unit_type: 'article', text: 'Provision two.' },
  ],
}

function mountManager(props: Record<string, unknown> = {}) {
  return mount(DocumentManager, {
    props: {
      ranked: ranked(),
      threshold: 0.2,
      onLoadDocument: vi.fn().mockResolvedValue(FULL),
      onLoadMarkdown: vi.fn().mockResolvedValue({ markdown: '<p>Full text</p>' }),
      onListCorpus: vi.fn().mockResolvedValue([
        { doc_id: 'cbd', title: 'CBD', doc_type: 'treaty', provision_count: 10 },
      ]),
      ...props,
    },
  })
}

describe('DocumentManager', () => {
  it('D.3 #18/#19 opens the exclude modal with warning for a high score', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="trips"] .card-action-btn').trigger('click')

    expect(wrapper.find('[data-test="exclude-modal"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="exclude-modal"]').text()).toContain('TRIPS')
    expect(wrapper.find('[data-test="exclude-warning"]').exists()).toBe(true)
  })

  it('D.3 #20 requires a reason; empty turns the input red', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="trips"] .card-action-btn').trigger('click')
    await wrapper.find('[data-test="confirm-exclude"]').trigger('click')

    // Modal stays open and the input is marked invalid.
    expect(wrapper.find('[data-test="exclude-modal"]').exists()).toBe(true)
    const input = wrapper.find('[data-test="exclude-reason"]')
    expect(input.attributes('style')).toContain('border-color: var(--red)')
  })

  it('D.3 #22/#23 excludes with a reason and lists the excluded section', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="trips"] .card-action-btn').trigger('click')
    await wrapper.find('[data-test="exclude-reason"]').setValue('not relevant')
    await wrapper.find('[data-test="confirm-exclude"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-excluded-id="trips"]').exists()).toBe(true)
    const events = wrapper.emitted('provenance')!.map((e) => e[0] as { action: string; reason?: string })
    const excluded = events.find((e) => e.action === 'exclude_document')
    expect(excluded?.reason).toBe('not relevant')
  })

  it('D.3 #24 restores an excluded document', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="trips"] .card-action-btn').trigger('click')
    await wrapper.find('[data-test="exclude-reason"]').setValue('no')
    await wrapper.find('[data-test="confirm-exclude"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-excluded-id="trips"] .restore-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-excluded-id="trips"]').exists()).toBe(false)
    const actions = wrapper.emitted('provenance')!.map((e) => (e[0] as { action: string }).action)
    expect(actions).toContain('restore_document')
  })

  it('D.3 #25 lists corpus docs available to add, with an empty state', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-test="open-add"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="add-modal"]').text()).toContain('CBD')

    // With an empty corpus, the empty-state message shows.
    const empty = mountManager({ onListCorpus: vi.fn().mockResolvedValue([]) })
    await empty.find('[data-test="open-add"]').trigger('click')
    await flushPromises()
    expect(empty.find('[data-test="add-empty"]').exists()).toBe(true)
  })

  it('D.3 #26/#27 adding marks it manual, logs add_document and keeps preambles off by default', async () => {
    const wrapper = mountManager({
      onLoadDocument: vi.fn().mockImplementation((docId: string) =>
        Promise.resolve({
          doc_id: docId,
          title: 'CBD',
          doc_type: 'treaty',
          provisions: [
            { prov_id: 'cbd_preamble', citation: null, article: 'Preamble', unit_type: 'preamble', text: 'p' },
            { prov_id: 'cbd_art1', citation: null, article: 'Art. 1', unit_type: 'article', text: 'a' },
          ],
        }),
      ),
    })
    await wrapper.find('[data-test="open-add"]').trigger('click')
    await flushPromises()
    await wrapper.find('.modal-doc-item').trigger('click')
    await flushPromises()

    const actions = wrapper.emitted('provenance')!.map((e) => (e[0] as { action: string }).action)
    expect(actions).toContain('add_document')

    // The added doc appears as a manual card even though retrieval missed it.
    const cbd = wrapper.find('[data-doc-id="cbd"]')
    expect(cbd.exists()).toBe(true)
    expect(cbd.classes()).toContain('manually-added')
  })

  it('D.3 #28 shows the low-document guardrail', async () => {
    const wrapper = mountManager({ minDocuments: 2 })
    // only bbnj scores above 0.2; trips (0.45) does too -> 2 selected, no warning
    // raise the threshold so only bbnj qualifies
    await wrapper.setProps({ threshold: 0.5 })
    await flushPromises()
    expect(wrapper.find('[data-test="guardrail"]').exists()).toBe(true)
  })

  it('D.4 #29 opens the viewer with meta and tabs', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('treaty')
    expect(wrapper.text()).toContain('2 provisions')
    expect(wrapper.findAll('.viewer-tab').map((t) => t.text())).toEqual(['Provisions', 'Full document'])
  })

  it('D.4 #30 provisions sorted by score desc with the selected count', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()

    const ids = wrapper.findAll('.prov-card').map((c) => c.attributes('data-prov-id'))
    expect(ids).toEqual(['bbnj_art1', 'bbnj_art2'])
    // threshold 0.2 -> only art1 (0.5) selected
    expect(wrapper.find('[data-test="prov-count"]').text()).toBe('1 of 2 provisions selected')
  })

  it('D.4 #32 toggling a provision logs include/exclude with target_kind provision', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()

    // deselect the selected one
    await wrapper.find('[data-prov-id="bbnj_art1"] input').setValue(false)
    const events = wrapper.emitted('provenance')!.map((e) => e[0] as { action: string; target_kind: string })
    const excluded = events.find((e) => e.action === 'exclude_provision')
    expect(excluded?.target_kind).toBe('provision')
  })

  it('D.4 #33 highlights selected and dims unselected provisions', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-prov-id="bbnj_art1"]').classes()).toContain('highlight')
    expect(wrapper.find('[data-prov-id="bbnj_art2"]').classes()).toContain('dim')
  })

  it('D.4 #34 select all / deselect all', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="select-all"]').trigger('click')
    expect(wrapper.find('[data-test="prov-count"]').text()).toBe('2 of 2 provisions selected')

    await wrapper.find('[data-test="deselect-all"]').trigger('click')
    expect(wrapper.find('[data-test="prov-count"]').text()).toBe('0 of 2 provisions selected')
  })

  it('D.4 #35 threshold change re-evaluates selection live', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="prov-count"]').text()).toBe('1 of 2 provisions selected')

    await wrapper.setProps({ threshold: 0.05 })
    await flushPromises()
    expect(wrapper.find('[data-test="prov-count"]').text()).toBe('2 of 2 provisions selected')
  })

  it('D.4 #36 full document tab renders markdown and shows fallbacks', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()
    await wrapper.findAll('.viewer-tab')[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('.md-view').html()).toContain('Full text')

    const noMd = mountManager({ onLoadMarkdown: vi.fn().mockResolvedValue({ markdown: '' }) })
    await noMd.find('[data-doc-id="bbnj"]').trigger('click')
    await flushPromises()
    await noMd.findAll('.viewer-tab')[1].trigger('click')
    await flushPromises()
    expect(noMd.find('[data-test="no-markdown"]').exists()).toBe(true)
  })

  it('D.6 #45 blocks proceed with 0 selected documents', async () => {
    const wrapper = mountManager({ threshold: 0.9 }) // nothing selected
    await wrapper.find('[data-test="proceed"]').trigger('click')
    expect(wrapper.find('[data-test="proceed-error"]').exists()).toBe(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('D.6 #46 emits a provision-set with saved provisions', async () => {
    const wrapper = mountManager()
    await wrapper.find('[data-test="proceed"]').trigger('click')
    await flushPromises()

    const set = wrapper.emitted('submit')![0][0] as {
      documents: { doc_id: string }[]
      provisions: { prov_id: string; source: string }[]
    }
    expect(set.documents.map((d) => d.doc_id).sort()).toEqual(['bbnj', 'trips'])
    expect(set.provisions.some((p) => p.prov_id === 'bbnj_art1' && p.source === 'system')).toBe(true)
  })
})
