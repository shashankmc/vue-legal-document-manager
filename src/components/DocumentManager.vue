<template>
  <div class="document-manager">
    <h2 v-if="props.title" class="title">{{ props.title }}</h2>

    <div v-if="lowCount" class="guardrail-warning" data-test="guardrail">
      You have selected only {{ selected.length }} document(s). A thorough
      compliance analysis typically requires several legal instruments.
    </div>

    <div class="toolbar">
      <button class="btn-sm" @click="showAddDocModal" data-test="open-add">+ Add document</button>
      <button class="btn-sm btn-primary" @click="proceed" data-test="proceed">Proceed</button>
    </div>
    <div v-if="proceedError" class="error" data-test="proceed-error">{{ proceedError }}</div>

    <div class="columns">
      <!-- Document list -->
      <div class="doc-panel">
        <div class="section-label">Retrieved documents</div>
        <div
          v-for="doc in activeDocuments"
          :key="doc.doc_id"
          class="doc-card"
          :class="{ 'below-threshold': isBelow(doc), 'manually-added': isManual(doc.doc_id), active: doc.doc_id === openDocId }"
          :data-doc-id="doc.doc_id"
          @click="openDocumentById(doc.doc_id)"
        >
          <div class="card-actions">
            <button class="card-action-btn" title="Exclude" @click.stop="askExclude(doc)">✕</button>
          </div>
          <div class="doc-title">
            {{ doc.title }}
            <span v-if="isManual(doc.doc_id)" class="badge manual-badge">manually added</span>
          </div>
          <div class="doc-meta">{{ doc.doc_id }} · {{ doc.provisions.length }} prov</div>
          <div class="score-row">
            <div class="score-bar-bg">
              <div class="score-bar" :style="{ width: scoreWidth(doc.score) + '%', background: scoreColor(doc.score) }"></div>
            </div>
            <div class="score-num">{{ doc.score.toFixed(3) }}</div>
          </div>
          <div class="top-prov">Top: {{ doc.top_provision }}</div>
        </div>

        <div v-if="excludedDocuments.length" class="section-label">Excluded documents</div>
        <div
          v-for="doc in excludedDocuments"
          :key="doc.doc_id"
          class="doc-card excluded"
          :data-excluded-id="doc.doc_id"
        >
          <div class="card-actions">
            <button class="card-action-btn restore-btn" title="Restore" @click.stop="restore(doc.doc_id)">↺</button>
          </div>
          <div class="doc-title">{{ doc.title }}</div>
          <div class="doc-meta">{{ doc.doc_id }} · excluded by student</div>
        </div>
      </div>

      <!-- Viewer -->
      <div class="viewer-panel">
        <div v-if="!openDocId" class="viewer-empty">Click a document to view its contents</div>
        <template v-else>
          <div class="viewer-header">
            <h3>{{ openDocumentData.title }}</h3>
            <div class="viewer-meta">
              {{ openDocumentData.doc_type }} · {{ openDocumentData.provisions.length }} provisions · {{ openDocId }}
            </div>
            <div class="viewer-tabs">
              <button
                class="viewer-tab"
                :class="{ active: tab === 'provisions' }"
                @click="tab = 'provisions'"
              >Provisions</button>
              <button
                class="viewer-tab"
                :class="{ active: tab === 'markdown' }"
                @click="switchToMarkdown"
              >Full document</button>
            </div>
          </div>

          <div v-if="tab === 'provisions'" class="viewer-content">
            <div class="prov-summary">
              <span data-test="prov-count">{{ selectedProvisionCount }} of {{ sortedProvisions.length }} provisions selected</span>
              <button class="btn-sm" @click="selectAll" data-test="select-all">Select all</button>
              <button class="btn-sm" @click="deselectAll" data-test="deselect-all">Deselect all</button>
            </div>
            <div
              v-for="p in sortedProvisions"
              :key="p.prov_id"
              class="prov-card"
              :class="{ highlight: isSelected(p.prov_id), dim: !isSelected(p.prov_id) }"
              :data-prov-id="p.prov_id"
            >
              <div class="prov-header">
                <input
                  type="checkbox"
                  :checked="isSelected(p.prov_id)"
                  @change="toggleProvision(p, ($event.target as HTMLInputElement).checked)"
                />
                <span class="prov-article">{{ p.article }}</span>
                <span class="prov-score-pill">{{ (p.score ?? 0).toFixed(3) }}</span>
                <span class="prov-id">{{ p.prov_id }}</span>
              </div>
              <div class="prov-text">{{ p.text }}</div>
            </div>
          </div>

          <div v-else class="viewer-content">
            <div v-if="markdownLoading" class="muted">Loading…</div>
            <div v-else-if="markdownError" class="muted" data-test="markdown-error">{{ markdownError }}</div>
            <div v-else-if="markdownHtml" class="md-view" v-html="markdownHtml"></div>
            <p v-else class="muted" data-test="no-markdown">No markdown source.</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Exclude modal -->
    <div v-if="excludeTarget" class="modal-overlay" data-test="exclude-modal">
      <div class="modal">
        <h3>Exclude document</h3>
        <p class="muted">{{ excludeTarget.title }}</p>
        <div v-if="excludeWarning" class="warn" data-test="exclude-warning">{{ excludeWarning }}</div>
        <input
          v-model="excludeReason"
          class="modal-input"
          :style="reasonInvalid ? { borderColor: 'var(--red)' } : {}"
          placeholder="Why are you excluding this document? (required for provenance)"
          data-test="exclude-reason"
        />
        <div class="modal-actions">
          <button class="btn-sm" @click="excludeTarget = null">Cancel</button>
          <button class="btn-sm btn-danger" @click="confirmExclude" data-test="confirm-exclude">Exclude</button>
        </div>
      </div>
    </div>

    <!-- Add modal -->
    <div v-if="addOpen" class="modal-overlay" data-test="add-modal">
      <div class="modal">
        <h3>Add a document to the selection</h3>
        <p class="muted">Select a document from the corpus that retrieval missed.</p>
        <div v-for="d in availableToAdd" :key="d.doc_id" class="modal-doc-item" @click="addDoc(d.doc_id)">
          <div><b>{{ d.title }}</b></div>
          <div class="doc-type">{{ d.doc_id }} · {{ d.doc_type }} · {{ d.provision_count }} provisions</div>
        </div>
        <p v-if="availableToAdd.length === 0" class="muted" data-test="add-empty">
          All documents are already selected or excluded.
        </p>
        <div class="modal-actions">
          <button class="btn-sm" @click="addOpen = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { RankedDocumentV1, ProvisionSetV1 } from 'legal-provision-types'
import { scoreColor, scoreWidth } from './scores'
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
} from './selection'
import { sanitizeHtml } from './sanitize'
import {
  emptySelection,
  type CorpusDoc,
  type DocumentManagerProps,
  type DocumentProvision,
  type FullDocument,
  type SelectionState,
} from './types'

const props = withDefaults(defineProps<DocumentManagerProps>(), {
  minDocuments: 2,
  highScoreWarning: 0.3,
  requireExclusionReason: true,
  includePreamblesOnAdd: false,
})

// v-model:selection — the host can hold the selection too.
const selection = defineModel<SelectionState>('selection', { default: () => emptySelection() })

const emit = defineEmits<{
  provenance: [event: import('legal-provision-types').ProvenanceEventV1]
  submit: [provisionSet: ProvisionSetV1]
}>()

const threshold = computed(() => props.threshold)
const rankedDocs = computed<RankedDocumentV1[]>(() => props.ranked?.documents ?? [])

const selected = computed(() => selectedDocIds(props.ranked, threshold.value, selection.value))
const lowCount = computed(() => isLowDocumentCount(selected.value.length, props.minDocuments))

// Ranked documents, plus any manually added document that retrieval missed
// (D.3 #26), synthesised from the corpus list or the loaded full document so it
// still appears as a card with provisions.
const allDocuments = computed<RankedDocumentV1[]>(() => {
  const docs = [...rankedDocs.value]
  const known = new Set(docs.map((d) => d.doc_id))
  for (const docId of Object.keys(selection.value.documents)) {
    if (known.has(docId)) continue
    const corpusDoc = corpus.value.find((c) => c.doc_id === docId)
    const full = fullDocs[docId]
    docs.push({
      doc_id: docId,
      title: corpusDoc?.title ?? full?.title ?? docId,
      score: 0,
      top_provision: full?.provisions?.[0]?.prov_id ?? '',
      provisions: (full?.provisions ?? []).map((p) => ({
        prov_id: p.prov_id,
        citation: p.citation,
        article: p.article,
        score: 0,
        text_preview: p.text,
      })),
    })
  }
  return docs
})

const activeDocuments = computed(() =>
  allDocuments.value.filter((d) => !(d.doc_id in selection.value.excluded)),
)
const excludedDocuments = computed(() =>
  allDocuments.value.filter((d) => d.doc_id in selection.value.excluded),
)

function isManual(docId: string): boolean {
  return selection.value.documents[docId]?.origin === 'manual'
}
function isBelow(doc: RankedDocumentV1): boolean {
  return doc.score < threshold.value && !isManual(doc.doc_id)
}

// --- viewer ---
const openDocId = ref<string | null>(null)
const fullDocs = reactive<Record<string, FullDocument>>({})
const tab = ref<'provisions' | 'markdown'>('provisions')
const markdownHtml = ref('')
const markdownLoading = ref(false)
const markdownError = ref<string | null>(null)

const openDocumentData = computed<FullDocument>(() =>
  openDocId.value ? fullDocs[openDocId.value] ?? placeholderDoc(openDocId.value) : placeholderDoc(''),
)

const sortedProvisions = computed(() => {
  const doc = openDocumentData.value
  return [...(doc.provisions ?? [])].sort(
    (a, b) => provisionScoreOf(b.prov_id) - provisionScoreOf(a.prov_id),
  )
})

function provisionScoreOf(provId: string): number {
  for (const d of rankedDocs.value) {
    for (const p of d.provisions) if (p.prov_id === provId) return p.score
  }
  return 0
}

function provisionWithScore(p: DocumentProvision) {
  return { ...p, score: provisionScoreOf(p.prov_id) }
}

function isSelected(provId: string): boolean {
  return isProvisionSelected(provId, provisionScoreOf(provId), threshold.value, selection.value)
}

const selectedProvisionCount = computed(
  () => sortedProvisions.value.filter((p) => isSelected(p.prov_id)).length,
)

function placeholderDoc(docId: string): FullDocument {
  const ranked = rankedDocs.value.find((d) => d.doc_id === docId)
  return {
    doc_id: docId,
    title: ranked?.title ?? docId,
    doc_type: '',
    provisions: [],
  }
}

async function openDoc(docId: string) {
  openDocId.value = docId
  tab.value = 'provisions'
  markdownHtml.value = ''
  markdownError.value = null
  if (!fullDocs[docId] && props.onLoadDocument) {
    try {
      fullDocs[docId] = await props.onLoadDocument(docId)
    } catch {
      // Fall back to the ranked provisions so the viewer still works.
      const ranked = rankedDocs.value.find((d) => d.doc_id === docId)
      fullDocs[docId] = {
        doc_id: docId,
        title: ranked?.title ?? docId,
        doc_type: '',
        provisions: (ranked?.provisions ?? []).map((p) => ({
          prov_id: p.prov_id,
          citation: p.citation,
          article: p.article,
          text: p.text_preview,
        })),
      }
    }
  }
}

function openDocumentById(docId: string) {
  void openDoc(docId)
}

async function switchToMarkdown() {
  tab.value = 'markdown'
  if (!openDocId.value || markdownHtml.value || !props.onLoadMarkdown) return
  markdownLoading.value = true
  markdownError.value = null
  try {
    const { markdown } = await props.onLoadMarkdown(openDocId.value)
    markdownHtml.value = markdown ? sanitizeHtml(markdown) : ''
  } catch {
    markdownError.value = 'Could not load.'
  } finally {
    markdownLoading.value = false
  }
}

// --- provision toggles (D.4 #32) ---
function toggleProvision(p: DocumentProvision & { score?: number }, checked: boolean) {
  const provId = p.prov_id
  const score = p.score ?? provisionScoreOf(provId)
  const next: SelectionState = {
    documents: { ...selection.value.documents },
    provisionOverrides: { ...selection.value.provisionOverrides },
    provisionDeselections: { ...selection.value.provisionDeselections },
    excluded: { ...selection.value.excluded },
  }
  if (checked) {
    delete next.provisionDeselections[provId]
    if (score < threshold.value) next.provisionOverrides[provId] = 'manual'
    selection.value = next
    emitProvenance('include_provision', 'provision', provId, 'Manually included by student')
  } else {
    delete next.provisionOverrides[provId]
    if (score >= threshold.value) next.provisionDeselections[provId] = 'manual'
    selection.value = next
    emitProvenance('exclude_provision', 'provision', provId, 'Excluded by student')
  }
}

function selectAll() {
  const next = cloneSelection()
  for (const p of sortedProvisions.value) {
    delete next.provisionDeselections[p.prov_id]
    if (provisionScoreOf(p.prov_id) < threshold.value) next.provisionOverrides[p.prov_id] = 'manual'
  }
  selection.value = next
}

function deselectAll() {
  const next = cloneSelection()
  for (const p of sortedProvisions.value) {
    delete next.provisionOverrides[p.prov_id]
    if (provisionScoreOf(p.prov_id) >= threshold.value) next.provisionDeselections[p.prov_id] = 'manual'
  }
  selection.value = next
}

function cloneSelection(): SelectionState {
  return {
    documents: { ...selection.value.documents },
    provisionOverrides: { ...selection.value.provisionOverrides },
    provisionDeselections: { ...selection.value.provisionDeselections },
    excluded: { ...selection.value.excluded },
  }
}

// --- exclude / restore (D.3) ---
const excludeTarget = ref<RankedDocumentV1 | null>(null)
const excludeReason = ref('')
const reasonInvalid = ref(false)
const excludeWarning = computed(() =>
  excludeTarget.value && shouldWarnOnExclude(excludeTarget.value.score, props.highScoreWarning)
    ? `⚠ This document scored ${excludeTarget.value.score.toFixed(3)}, above average. Are you sure it is not relevant?`
    : '',
)

function askExclude(doc: RankedDocumentV1) {
  excludeTarget.value = doc
  excludeReason.value = ''
  reasonInvalid.value = false
}

function confirmExclude() {
  const doc = excludeTarget.value
  if (!doc) return
  const reason = excludeReason.value.trim()
  if (props.requireExclusionReason && !reason) {
    reasonInvalid.value = true
    return
  }
  const next = excludeDocument(selection.value, doc.doc_id, reason)
  // D.3 #21: deselect all the document's provisions.
  for (const p of rankedDocs.value.find((d) => d.doc_id === doc.doc_id)?.provisions ?? []) {
    next.provisionDeselections[p.prov_id] = 'manual'
    delete next.provisionOverrides[p.prov_id]
  }
  selection.value = next
  emitProvenance('exclude_document', 'document', doc.doc_id, reason)
  excludeTarget.value = null
}

function restore(docId: string) {
  const next = restoreDocument(selection.value, docId)
  // D.3 #24: clear the deselections the exclusion made.
  const doc = fullDocs[docId] ?? rankedDocs.value.find((d) => d.doc_id === docId)
  const provs: { prov_id: string }[] =
    (doc as FullDocument)?.provisions ?? (doc as RankedDocumentV1)?.provisions ?? []
  for (const p of provs) delete next.provisionDeselections[p.prov_id]
  selection.value = next
  emitProvenance('restore_document', 'document', docId, 'Restored by student')
}

// --- add (D.3 #25/#26/#27) ---
const addOpen = ref(false)
const corpus = ref<CorpusDoc[]>([])

async function showAddDocModal() {
  addOpen.value = true
  if (props.onListCorpus) {
    try {
      corpus.value = await props.onListCorpus()
    } catch {
      corpus.value = []
    }
  }
}

const availableToAdd = computed(() =>
  corpus.value.filter(
    (d) =>
      !selected.value.includes(d.doc_id) &&
      !(d.doc_id in selection.value.excluded) &&
      !rankedDocs.value.some((r) => r.doc_id === d.doc_id),
  ),
)

async function addDoc(docId: string) {
  let next = addDocument(selection.value, docId)
  // D.3 #26: select all its provisions, honouring includePreamblesOnAdd (#27).
  if (!fullDocs[docId] && props.onLoadDocument) {
    try {
      fullDocs[docId] = await props.onLoadDocument(docId)
    } catch {
      /* leave it; provisions stay score-based */
    }
  }
  const doc = fullDocs[docId]
  if (doc) {
    for (const provId of provisionsToSelectOnAdd(doc, props.includePreamblesOnAdd)) {
      next.provisionOverrides[provId] = 'manual'
      delete next.provisionDeselections[provId]
    }
  }
  selection.value = next
  emitProvenance('add_document', 'document', docId, 'Manually added by student')
  addOpen.value = false
  await openDoc(docId)
}

// --- proceed (D.6 #45/#46) ---
const proceedError = ref('')

function proceed() {
  if (selected.value.length === 0) {
    proceedError.value = 'No documents selected. Please select at least one document.'
    return
  }
  proceedError.value = ''
  const provisions = buildSelectedProvisions(
    props.ranked,
    selected.value,
    threshold.value,
    selection.value,
    fullDocs,
  )
  const provisionSet: ProvisionSetV1 = {
    case_id: props.ranked.case_id,
    corpus_version: props.ranked.corpus_version ?? null,
    method: props.ranked.method,
    threshold: threshold.value,
    documents: selected.value.map((docId) => ({
      doc_id: docId,
      title: rankedDocs.value.find((d) => d.doc_id === docId)?.title ?? docId,
      origin: isManual(docId) ? 'manual' : 'system',
    })),
    provisions: provisions.map((p) => ({
      prov_id: p.prov_id,
      doc_id: p.doc_id,
      citation: fullDocs[p.doc_id]?.provisions.find((x) => x.prov_id === p.prov_id)?.citation ?? null,
      text: fullDocs[p.doc_id]?.provisions.find((x) => x.prov_id === p.prov_id)?.text ?? null,
      score: p.score,
      source: p.source,
    })),
    excluded: Object.entries(selection.value.excluded).map(([docId, reason]) => ({
      doc_id: docId,
      reason: reason || null,
    })),
    provenance: [],
  }
  emit('submit', provisionSet)
}

function emitProvenance(action: string, targetKind: string, targetId: string, reason: string | null) {
  emit('provenance', {
    timestamp: new Date().toISOString(),
    action,
    target_kind: targetKind as 'case' | 'document' | 'provision' | 'retrieval',
    target_id: targetId,
    reason,
    method: props.ranked.method,
    threshold: threshold.value,
  })
}
</script>

<style scoped>
.document-manager {
  font-family: inherit;
}
.title {
  margin: 0 0 8px;
  font-size: 18px;
}
.guardrail-warning {
  background: #fff3e0;
  border: 1px solid #e8a838;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 10px;
  font-size: 12px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.btn-sm {
  padding: 5px 12px;
  border: 1px solid #d8e3eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}
.btn-primary {
  background: #1b6b93;
  color: #fff;
  border-color: #1b6b93;
}
.btn-danger {
  color: #c0392b;
  border-color: #c0392b;
}
.columns {
  display: flex;
  gap: 12px;
}
.doc-panel {
  width: 380px;
  flex: none;
}
.viewer-panel {
  flex: 1;
  min-width: 0;
}
.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #9aacb8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px 0 4px;
}
.doc-card {
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 4px;
  background: #fff;
  cursor: pointer;
  position: relative;
}
.doc-card.active {
  border-color: #1b6b93;
  background: #e8f4fd;
}
.doc-card.below-threshold {
  opacity: 0.35;
}
.doc-card.excluded {
  opacity: 0.5;
  border-left: 3px solid #c0392b;
}
.doc-card.manually-added {
  border-left: 3px solid #2e7d5b;
}
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
}
.card-action-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #d8e3eb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.restore-btn {
  color: #2e7d5b;
  border-color: #2e7d5b;
}
.doc-title {
  font-size: 13px;
  font-weight: 600;
  padding-right: 30px;
}
.doc-meta {
  font-size: 11px;
  color: #9aacb8;
  font-family: monospace;
  margin-bottom: 5px;
}
.score-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-bar-bg {
  flex: 1;
  height: 5px;
  background: #edf5fa;
  border-radius: 3px;
  overflow: hidden;
}
.score-bar {
  height: 100%;
  border-radius: 3px;
}
.score-num {
  font-size: 11px;
  font-family: monospace;
  min-width: 36px;
  text-align: right;
}
.top-prov {
  font-size: 10px;
  color: #9aacb8;
  margin-top: 3px;
}
.badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 4px;
}
.manual-badge {
  background: #e8f5e9;
  color: #2e7d5b;
}
.viewer-empty {
  color: #9aacb8;
  padding: 24px;
}
.viewer-header h3 {
  margin: 0 0 2px;
  font-size: 16px;
}
.viewer-meta {
  font-size: 12px;
  color: #5a6a7a;
}
.viewer-tabs {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
.viewer-tab {
  padding: 4px 14px;
  font-size: 12px;
  border: 1px solid #d8e3eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.viewer-tab.active {
  background: #1b6b93;
  color: #fff;
  border-color: #1b6b93;
}
.viewer-content {
  padding-top: 10px;
}
.prov-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #5a6a7a;
  margin-bottom: 10px;
}
.prov-card {
  border: 1px solid #d8e3eb;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 6px;
  background: #fff;
}
.prov-card.highlight {
  border-left: 3px solid #1b6b93;
}
.prov-card.dim {
  opacity: 0.4;
}
.prov-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.prov-article {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
}
.prov-score-pill {
  font-size: 10px;
  font-family: monospace;
  padding: 1px 8px;
  border-radius: 10px;
  background: #edf5fa;
}
.prov-id {
  font-size: 10px;
  color: #9aacb8;
  font-family: monospace;
  margin-left: auto;
}
.prov-text {
  font-size: 13px;
  line-height: 1.5;
}
.md-view {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
}
.muted {
  color: #9aacb8;
  font-size: 13px;
}
.error {
  color: #c0392b;
  font-size: 12px;
  margin-bottom: 8px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  width: 500px;
  max-height: 70vh;
  overflow-y: auto;
}
.modal h3 {
  margin: 0 0 8px;
  font-size: 16px;
}
.modal-doc-item {
  padding: 8px 10px;
  border: 1px solid #d8e3eb;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}
.modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d8e3eb;
  border-radius: 6px;
  margin-top: 8px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}
.warn {
  color: #e8a838;
  font-size: 12px;
  margin-top: 8px;
}
.doc-type {
  font-size: 11px;
  color: #9aacb8;
  font-family: monospace;
}
</style>
