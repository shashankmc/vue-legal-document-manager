# vue-legal-document-manager

Document manager: review what retrieval (or other methods) found — exclude instruments
with a reason, add ones it missed, tick provisions in or out, read the full
text. Every decision is logged as provenance. Takes **`ranked-provisions@1`**
in, gives **`provision-set@1`** out.

It never calls an API: the host supplies `onLoadDocument`, `onLoadMarkdown` and
`onListCorpus`, and holds the credential.

```bash
npm install vue-legal-document-manager vue
```

```vue
<template>
  <DocumentManager
    :ranked="ranked"
    :threshold="0.2"
    v-model:selection="selection"
    :on-load-document="loadDocument"
    :on-load-markdown="loadMarkdown"
    :on-list-corpus="listCorpus"
    :min-documents="2"
    :high-score-warning="0.3"
    @provenance="onProvenance"
    @submit="onSubmit"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DocumentManager, emptySelection } from 'vue-legal-document-manager'
import 'vue-legal-document-manager/style.css'

const selection = ref(emptySelection())
const loadDocument = (id: string) => fetch(`/api/document?doc_id=${id}`).then((r) => r.json())
const loadMarkdown = (id: string) => fetch(`/api/markdown?doc_id=${id}`).then((r) => r.json())
const listCorpus = () => fetch('/api/corpus').then((r) => r.json())
const onProvenance = (event: unknown) => console.log(event)
const onSubmit = (provisionSet: unknown) => console.log(provisionSet)
</script>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `ranked` | `RankedProvisionsV1` | — | The retriever's output. |
| `threshold` | `number` | — | Applied to decide the default selection. |
| `onLoadDocument` | `(docId) => Promise<FullDocument>` | — | Loads a document's provisions. |
| `onLoadMarkdown` | `(docId) => Promise<{ markdown }>` | — | Loads the raw markdown. |
| `onListCorpus` | `() => Promise<CorpusDoc[]>` | — | Lists the corpus for the add dialog. |
| `minDocuments` | `number` | `2` | Low-document guardrail. `0` disables. |
| `highScoreWarning` | `number` | `0.3` | Warn when excluding at or above this score. |
| `requireExclusionReason` | `boolean` | `true` | Require a reason to exclude. |
| `includePreamblesOnAdd` | `boolean` | `false` | Select a document's preamble when adding it. |
| `title` | `string` | — | Optional heading. |

`v-model:selection` holds the selection state (`SelectionState`), so the host
can persist or reset it.

## Events

| Event | Payload | Description |
|---|---|---|
| `@provenance` | `ProvenanceEventV1` | Emitted for add/exclude/restore/include/exclude-provision. |
| `@submit` | `ProvisionSetV1` | Emitted from "Proceed", ready for `selection/save`. |

## Types

| Type | Shape |
|---|---|
| `RankedProvisionsV1` (`ranked-provisions@1`) | from `legal-provision-types` |
| `ProvisionSetV1` (`provision-set@1`) | from `legal-provision-types` |
| `SelectionState` | `{ documents, provisionOverrides, provisionDeselections, excluded }` |
| `FullDocument` | `{ doc_id, title, doc_type, provisions }` |
| `CorpusDoc` | `{ doc_id, title, doc_type, provision_count }` |

Pure helpers are exported too: `selectedDocIds`, `isProvisionSelected`,
`excludeDocument`, `restoreDocument`, `addDocument`,
`provisionsToSelectOnAdd`, `buildSelectedProvisions`, `sanitizeHtml`, and more.

## Development

```bash
npm install
npm test        # vitest component + helper tests
npm run build   # library build to dist/
```
