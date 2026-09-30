import type {
  RankedProvisionsV1,
  ProvisionSetV1,
  ProvenanceEventV1,
} from 'legal-provision-types'

/** A corpus document, as `onListCorpus` returns it. */
export interface CorpusDoc {
  doc_id: string
  title: string
  doc_type: string
  provision_count: number
}

/** One provision of a document, as `onLoadDocument` returns it. */
export interface DocumentProvision {
  prov_id: string
  citation: string | null
  article: string
  title?: string | null
  unit_type?: string
  section?: string | null
  chapeau?: string | null
  text: string
}

/** A full document, as `onLoadDocument` returns it. */
export interface FullDocument {
  doc_id: string
  title: string
  doc_type: string
  provisions: DocumentProvision[]
}

/** The selection state, driven with `v-model:selection`. */
export interface SelectionState {
  /** doc_id -> origin. A doc is "manual" when added by hand. */
  documents: Record<string, { origin: 'system' | 'manual' }>
  /** prov_id -> "manual" when the user overrode the score-based default. */
  provisionOverrides: Record<string, 'manual'>
  /** prov_id -> "manual" when the user explicitly deselected it. */
  provisionDeselections: Record<string, 'manual'>
  /** doc_id -> reason, for excluded documents. */
  excluded: Record<string, string>
}

export interface DocumentManagerProps {
  /** ranked-provisions@1: the retriever's output. */
  ranked: RankedProvisionsV1
  /** The current threshold, so the manager can apply selection precedence. */
  threshold: number
  /** Loads one document's provisions. */
  onLoadDocument?: (docId: string) => Promise<FullDocument>
  /** Loads one document's raw markdown. */
  onLoadMarkdown?: (docId: string) => Promise<{ markdown: string }>
  /** Lists the whole corpus, for the add-document dialog. */
  onListCorpus?: () => Promise<CorpusDoc[]>
  /** Warn below this many selected documents. 0 turns it off. */
  minDocuments?: number
  /** Ask for confirmation when excluding a document scoring at least this much. */
  highScoreWarning?: number
  /** Require a non-empty reason to exclude. */
  requireExclusionReason?: boolean
  /** Whether adding a document also selects its preamble. */
  includePreamblesOnAdd?: boolean
  /** Title shown above the panel. */
  title?: string
}

export type DocumentManagerSelection = SelectionState
export type DocumentManagerProvisionSet = ProvisionSetV1
export type DocumentManagerProvenance = ProvenanceEventV1

export function emptySelection(): SelectionState {
  return {
    documents: {},
    provisionOverrides: {},
    provisionDeselections: {},
    excluded: {},
  }
}
