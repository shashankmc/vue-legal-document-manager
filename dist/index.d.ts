import type { DefineComponent, Plugin } from "vue";
import type { RankedProvisionsV1, ProvisionSetV1, ProvenanceEventV1 } from "legal-provision-types";

export type {
  DocumentManagerProps,
  DocumentManagerSelection,
  DocumentManagerProvisionSet,
  DocumentManagerProvenance,
  CorpusDoc,
  DocumentProvision,
  FullDocument,
  SelectionState,
} from "./components/types";
export declare function emptySelection(): import("./components/types").SelectionState;

export declare function selectedDocIds(
  ranked: RankedProvisionsV1,
  threshold: number,
  selection: import("./components/types").SelectionState,
): string[];
export declare function isProvisionSelected(
  provId: string,
  score: number,
  threshold: number,
  selection: import("./components/types").SelectionState,
): boolean;
export declare function provisionScore(ranked: RankedProvisionsV1, provId: string): number;
export declare function shouldWarnOnExclude(score: number, highScoreWarning: number): boolean;
export declare function isLowDocumentCount(count: number, minDocuments: number): boolean;
export declare function provisionsToSelectOnAdd(
  doc: import("./components/types").FullDocument,
  includePreambles: boolean,
): string[];
export declare function buildSelectedProvisions(
  ranked: RankedProvisionsV1,
  docIds: string[],
  threshold: number,
  selection: import("./components/types").SelectionState,
  fullDocs: Record<string, import("./components/types").FullDocument>,
): { prov_id: string; doc_id: string; score: number | null; source: "system" | "manual" }[];
export declare function sanitizeHtml(html: string): string;

export declare const DocumentManager: DefineComponent<
  import("./components/types").DocumentManagerProps,
  {},
  any
>;

export type { RankedProvisionsV1, ProvisionSetV1, ProvenanceEventV1 };

export declare const VueLegalDocumentManagerPlugin: Plugin;

export default VueLegalDocumentManagerPlugin;
