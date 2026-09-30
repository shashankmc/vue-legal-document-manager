import type { App, Plugin } from 'vue'

import DocumentManager from './components/DocumentManager.vue'
export { DocumentManager }

export type {
  DocumentManagerProps,
  DocumentManagerSelection,
  DocumentManagerProvisionSet,
  DocumentManagerProvenance,
  CorpusDoc,
  DocumentProvision,
  FullDocument,
  SelectionState,
} from './components/types'
export { emptySelection } from './components/types'

// Pure helpers, exported so a host can reuse them without the component.
export {
  addDocument,
  buildSelectedProvisions,
  excludeDocument,
  isLowDocumentCount,
  isProvisionSelected,
  provisionScore,
  provisionsToSelectOnAdd,
  restoreDocument,
  selectedDocIds,
  shouldWarnOnExclude,
} from './components/selection'
export { sanitizeHtml } from './components/sanitize'

// The port contract this package reads and emits.
export type {
  RankedProvisionsV1,
  ProvisionSetV1,
  ProvenanceEventV1,
} from 'legal-provision-types'

export const VueLegalDocumentManagerPlugin: Plugin = {
  install(app: App) {
    app.component('DocumentManager', DocumentManager)
  },
}

export default VueLegalDocumentManagerPlugin
