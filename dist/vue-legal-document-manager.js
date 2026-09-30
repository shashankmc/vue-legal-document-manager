import { defineComponent as he, useModel as xe, computed as y, ref as b, reactive as ye, openBlock as v, createElementBlock as p, toDisplayString as c, createCommentVNode as O, createElementVNode as s, Fragment as W, renderList as V, normalizeClass as H, withModifiers as I, createTextVNode as be, normalizeStyle as ee, unref as oe, withDirectives as ke, vModelText as ge, mergeModels as te } from "vue";
function we(i) {
  return i > 0.5 ? "#2e7d5b" : i > 0.3 ? "#1b6b93" : "#e8a838";
}
function De(i) {
  return Math.max(i * 100, 2);
}
function Ce() {
  return {
    documents: {},
    provisionOverrides: {},
    provisionDeselections: {},
    excluded: {}
  };
}
function Oe(i, r, n) {
  const l = (i.documents ?? []).filter((a) => a.score >= r && !(a.doc_id in n.excluded)).map((a) => a.doc_id), k = Object.entries(n.documents).filter(([, a]) => a.origin === "manual").map(([a]) => a).filter((a) => !(a in n.excluded));
  return [.../* @__PURE__ */ new Set([...l, ...k])];
}
function se(i, r, n, l) {
  return l.provisionOverrides[i] ? !0 : l.provisionDeselections[i] ? !1 : r >= n;
}
function Se(i, r) {
  for (const n of i.documents ?? [])
    for (const l of n.provisions ?? [])
      if (l.prov_id === r) return l.score;
  return 0;
}
function Le(i, r) {
  return r > 0 && i >= r;
}
function Ae(i, r) {
  return r > 0 && i < r;
}
function Me(i, r, n) {
  const l = {
    documents: { ...i.documents },
    provisionOverrides: { ...i.provisionOverrides },
    provisionDeselections: { ...i.provisionDeselections },
    excluded: { ...i.excluded, [r]: n }
  };
  return delete l.documents[r], l;
}
function Ee(i, r) {
  const n = {
    documents: { ...i.documents },
    provisionOverrides: { ...i.provisionOverrides },
    provisionDeselections: { ...i.provisionDeselections },
    excluded: { ...i.excluded }
  };
  return delete n.excluded[r], n;
}
function Te(i, r) {
  const n = {
    documents: { ...i.documents, [r]: { origin: "manual" } },
    provisionOverrides: { ...i.provisionOverrides },
    provisionDeselections: { ...i.provisionDeselections },
    excluded: { ...i.excluded }
  };
  return delete n.excluded[r], n;
}
function Pe(i, r) {
  return i.provisions.filter((n) => r || n.unit_type !== "preamble").map((n) => n.prov_id);
}
function $e(i, r, n, l, k) {
  var m;
  const a = [];
  for (const f of r) {
    const w = k[f], A = (i.documents ?? []).find((_) => _.doc_id === f), Z = (w == null ? void 0 : w.provisions) ?? ((m = A == null ? void 0 : A.provisions) == null ? void 0 : m.map((_) => ({
      prov_id: _.prov_id,
      citation: _.citation,
      article: _.article,
      text: _.text_preview
    }))) ?? [];
    for (const _ of Z) {
      const L = Se(i, _.prov_id);
      se(_.prov_id, L, n, l) && a.push({
        prov_id: _.prov_id,
        doc_id: f,
        score: L,
        source: l.provisionOverrides[_.prov_id] ? "manual" : "system"
      });
    }
  }
  return a;
}
const Re = /* @__PURE__ */ new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
]), We = /* @__PURE__ */ new Set(["href", "title", "colspan", "rowspan"]);
function je(i) {
  let r = i.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "");
  return r = r.replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, ""), r = r.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (n, l, k) => {
    const a = String(l).toLowerCase(), m = n.startsWith("</");
    if (!Re.has(a)) return "";
    if (m) return `</${a}>`;
    const f = (String(k).match(/([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g) ?? []).filter((w) => We.has(w.split("=")[0].trim().toLowerCase())).filter((w) => !/^href\s*=\s*["']?\s*javascript:/i.test(w)).join(" ");
    return `<${a}${f ? " " + f : ""}>`;
  }), r;
}
const ze = { class: "document-manager" }, Be = {
  key: 0,
  class: "title"
}, qe = {
  key: 1,
  class: "guardrail-warning",
  "data-test": "guardrail"
}, Fe = {
  key: 2,
  class: "error",
  "data-test": "proceed-error"
}, Ne = { class: "columns" }, Ve = { class: "doc-panel" }, He = ["data-doc-id", "onClick"], Ze = { class: "card-actions" }, Ge = ["onClick"], Ue = { class: "doc-title" }, Ye = {
  key: 0,
  class: "badge manual-badge"
}, Je = { class: "doc-meta" }, Ke = { class: "score-row" }, Qe = { class: "score-bar-bg" }, Xe = { class: "score-num" }, Ie = { class: "top-prov" }, eo = {
  key: 0,
  class: "section-label"
}, oo = ["data-excluded-id"], to = { class: "card-actions" }, so = ["onClick"], no = { class: "doc-title" }, io = { class: "doc-meta" }, lo = { class: "viewer-panel" }, ro = {
  key: 0,
  class: "viewer-empty"
}, ao = { class: "viewer-header" }, co = { class: "viewer-meta" }, uo = { class: "viewer-tabs" }, vo = {
  key: 0,
  class: "viewer-content"
}, po = { class: "prov-summary" }, _o = { "data-test": "prov-count" }, mo = ["data-prov-id"], fo = { class: "prov-header" }, ho = ["checked", "onChange"], xo = { class: "prov-article" }, yo = { class: "prov-score-pill" }, bo = { class: "prov-id" }, ko = { class: "prov-text" }, go = {
  key: 1,
  class: "viewer-content"
}, wo = {
  key: 0,
  class: "muted"
}, Do = {
  key: 1,
  class: "muted",
  "data-test": "markdown-error"
}, Co = ["innerHTML"], Oo = {
  key: 3,
  class: "muted",
  "data-test": "no-markdown"
}, So = {
  key: 3,
  class: "modal-overlay",
  "data-test": "exclude-modal"
}, Lo = { class: "modal" }, Ao = { class: "muted" }, Mo = {
  key: 0,
  class: "warn",
  "data-test": "exclude-warning"
}, Eo = { class: "modal-actions" }, To = {
  key: 4,
  class: "modal-overlay",
  "data-test": "add-modal"
}, Po = { class: "modal" }, $o = ["onClick"], Ro = { class: "doc-type" }, Wo = {
  key: 0,
  class: "muted",
  "data-test": "add-empty"
}, jo = { class: "modal-actions" }, zo = /* @__PURE__ */ he({
  __name: "DocumentManager",
  props: /* @__PURE__ */ te({
    ranked: {},
    threshold: {},
    onLoadDocument: {},
    onLoadMarkdown: {},
    onListCorpus: {},
    minDocuments: { default: 2 },
    highScoreWarning: { default: 0.3 },
    requireExclusionReason: { type: Boolean, default: !0 },
    includePreamblesOnAdd: { type: Boolean, default: !1 },
    title: {}
  }, {
    selection: { default: () => Ce() },
    selectionModifiers: {}
  }),
  emits: /* @__PURE__ */ te(["provenance", "submit"], ["update:selection"]),
  setup(i, { emit: r }) {
    const n = i, l = xe(i, "selection"), k = r, a = y(() => n.threshold), m = y(() => {
      var o;
      return ((o = n.ranked) == null ? void 0 : o.documents) ?? [];
    }), f = y(() => Oe(n.ranked, a.value, l.value)), w = y(() => Ae(f.value.length, n.minDocuments)), A = y(() => {
      var e, d;
      const o = [...m.value], t = new Set(o.map((u) => u.doc_id));
      for (const u of Object.keys(l.value.documents)) {
        if (t.has(u)) continue;
        const S = F.value.find((g) => g.doc_id === u), x = h[u];
        o.push({
          doc_id: u,
          title: (S == null ? void 0 : S.title) ?? (x == null ? void 0 : x.title) ?? u,
          score: 0,
          top_provision: ((d = (e = x == null ? void 0 : x.provisions) == null ? void 0 : e[0]) == null ? void 0 : d.prov_id) ?? "",
          provisions: ((x == null ? void 0 : x.provisions) ?? []).map((g) => ({
            prov_id: g.prov_id,
            citation: g.citation,
            article: g.article,
            score: 0,
            text_preview: g.text
          }))
        });
      }
      return o;
    }), Z = y(
      () => A.value.filter((o) => !(o.doc_id in l.value.excluded))
    ), _ = y(
      () => A.value.filter((o) => o.doc_id in l.value.excluded)
    );
    function L(o) {
      var t;
      return ((t = l.value.documents[o]) == null ? void 0 : t.origin) === "manual";
    }
    function ne(o) {
      return o.score < a.value && !L(o.doc_id);
    }
    const D = b(null), h = ye({}), M = b("provisions"), T = b(""), G = b(!1), P = b(null), j = y(
      () => D.value ? h[D.value] ?? Y(D.value) : Y("")
    ), $ = y(() => [...j.value.provisions ?? []].sort(
      (t, e) => E(e.prov_id) - E(t.prov_id)
    ));
    function E(o) {
      for (const t of m.value)
        for (const e of t.provisions) if (e.prov_id === o) return e.score;
      return 0;
    }
    function z(o) {
      return se(o, E(o), a.value, l.value);
    }
    const ie = y(
      () => $.value.filter((o) => z(o.prov_id)).length
    );
    function Y(o) {
      const t = m.value.find((e) => e.doc_id === o);
      return {
        doc_id: o,
        title: (t == null ? void 0 : t.title) ?? o,
        doc_type: "",
        provisions: []
      };
    }
    async function J(o) {
      if (D.value = o, M.value = "provisions", T.value = "", P.value = null, !h[o] && n.onLoadDocument)
        try {
          h[o] = await n.onLoadDocument(o);
        } catch {
          const t = m.value.find((e) => e.doc_id === o);
          h[o] = {
            doc_id: o,
            title: (t == null ? void 0 : t.title) ?? o,
            doc_type: "",
            provisions: ((t == null ? void 0 : t.provisions) ?? []).map((e) => ({
              prov_id: e.prov_id,
              citation: e.citation,
              article: e.article,
              text: e.text_preview
            }))
          };
        }
    }
    function le(o) {
      J(o);
    }
    async function re() {
      if (M.value = "markdown", !(!D.value || T.value || !n.onLoadMarkdown)) {
        G.value = !0, P.value = null;
        try {
          const { markdown: o } = await n.onLoadMarkdown(D.value);
          T.value = o ? je(o) : "";
        } catch {
          P.value = "Could not load.";
        } finally {
          G.value = !1;
        }
      }
    }
    function de(o, t) {
      const e = o.prov_id, d = o.score ?? E(e), u = {
        documents: { ...l.value.documents },
        provisionOverrides: { ...l.value.provisionOverrides },
        provisionDeselections: { ...l.value.provisionDeselections },
        excluded: { ...l.value.excluded }
      };
      t ? (delete u.provisionDeselections[e], d < a.value && (u.provisionOverrides[e] = "manual"), l.value = u, R("include_provision", "provision", e, "Manually included by student")) : (delete u.provisionOverrides[e], d >= a.value && (u.provisionDeselections[e] = "manual"), l.value = u, R("exclude_provision", "provision", e, "Excluded by student"));
    }
    function ae() {
      const o = K();
      for (const t of $.value)
        delete o.provisionDeselections[t.prov_id], E(t.prov_id) < a.value && (o.provisionOverrides[t.prov_id] = "manual");
      l.value = o;
    }
    function ce() {
      const o = K();
      for (const t of $.value)
        delete o.provisionOverrides[t.prov_id], E(t.prov_id) >= a.value && (o.provisionDeselections[t.prov_id] = "manual");
      l.value = o;
    }
    function K() {
      return {
        documents: { ...l.value.documents },
        provisionOverrides: { ...l.value.provisionOverrides },
        provisionDeselections: { ...l.value.provisionDeselections },
        excluded: { ...l.value.excluded }
      };
    }
    const C = b(null), B = b(""), U = b(!1), Q = y(
      () => C.value && Le(C.value.score, n.highScoreWarning) ? `⚠ This document scored ${C.value.score.toFixed(3)}, above average. Are you sure it is not relevant?` : ""
    );
    function ue(o) {
      C.value = o, B.value = "", U.value = !1;
    }
    function ve() {
      var d;
      const o = C.value;
      if (!o) return;
      const t = B.value.trim();
      if (n.requireExclusionReason && !t) {
        U.value = !0;
        return;
      }
      const e = Me(l.value, o.doc_id, t);
      for (const u of ((d = m.value.find((S) => S.doc_id === o.doc_id)) == null ? void 0 : d.provisions) ?? [])
        e.provisionDeselections[u.prov_id] = "manual", delete e.provisionOverrides[u.prov_id];
      l.value = e, R("exclude_document", "document", o.doc_id, t), C.value = null;
    }
    function pe(o) {
      const t = Ee(l.value, o), e = h[o] ?? m.value.find((u) => u.doc_id === o), d = (e == null ? void 0 : e.provisions) ?? (e == null ? void 0 : e.provisions) ?? [];
      for (const u of d) delete t.provisionDeselections[u.prov_id];
      l.value = t, R("restore_document", "document", o, "Restored by student");
    }
    const q = b(!1), F = b([]);
    async function _e() {
      if (q.value = !0, n.onListCorpus)
        try {
          F.value = await n.onListCorpus();
        } catch {
          F.value = [];
        }
    }
    const X = y(
      () => F.value.filter(
        (o) => !f.value.includes(o.doc_id) && !(o.doc_id in l.value.excluded) && !m.value.some((t) => t.doc_id === o.doc_id)
      )
    );
    async function me(o) {
      let t = Te(l.value, o);
      if (!h[o] && n.onLoadDocument)
        try {
          h[o] = await n.onLoadDocument(o);
        } catch {
        }
      const e = h[o];
      if (e)
        for (const d of Pe(e, n.includePreamblesOnAdd))
          t.provisionOverrides[d] = "manual", delete t.provisionDeselections[d];
      l.value = t, R("add_document", "document", o, "Manually added by student"), q.value = !1, await J(o);
    }
    const N = b("");
    function fe() {
      if (f.value.length === 0) {
        N.value = "No documents selected. Please select at least one document.";
        return;
      }
      N.value = "";
      const o = $e(
        n.ranked,
        f.value,
        a.value,
        l.value,
        h
      ), t = {
        case_id: n.ranked.case_id,
        corpus_version: n.ranked.corpus_version ?? null,
        method: n.ranked.method,
        threshold: a.value,
        documents: f.value.map((e) => {
          var d;
          return {
            doc_id: e,
            title: ((d = m.value.find((u) => u.doc_id === e)) == null ? void 0 : d.title) ?? e,
            origin: L(e) ? "manual" : "system"
          };
        }),
        provisions: o.map((e) => {
          var d, u, S, x;
          return {
            prov_id: e.prov_id,
            doc_id: e.doc_id,
            citation: ((u = (d = h[e.doc_id]) == null ? void 0 : d.provisions.find((g) => g.prov_id === e.prov_id)) == null ? void 0 : u.citation) ?? null,
            text: ((x = (S = h[e.doc_id]) == null ? void 0 : S.provisions.find((g) => g.prov_id === e.prov_id)) == null ? void 0 : x.text) ?? null,
            score: e.score,
            source: e.source
          };
        }),
        excluded: Object.entries(l.value.excluded).map(([e, d]) => ({
          doc_id: e,
          reason: d || null
        })),
        provenance: []
      };
      k("submit", t);
    }
    function R(o, t, e, d) {
      k("provenance", {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: o,
        target_kind: t,
        target_id: e,
        reason: d,
        method: n.ranked.method,
        threshold: a.value
      });
    }
    return (o, t) => (v(), p("div", ze, [
      n.title ? (v(), p("h2", Be, c(n.title), 1)) : O("", !0),
      w.value ? (v(), p("div", qe, " You have selected only " + c(f.value.length) + " document(s). A thorough compliance analysis typically requires several legal instruments. ", 1)) : O("", !0),
      s("div", { class: "toolbar" }, [
        s("button", {
          class: "btn-sm",
          onClick: _e,
          "data-test": "open-add"
        }, "+ Add document"),
        s("button", {
          class: "btn-sm btn-primary",
          onClick: fe,
          "data-test": "proceed"
        }, "Proceed")
      ]),
      N.value ? (v(), p("div", Fe, c(N.value), 1)) : O("", !0),
      s("div", Ne, [
        s("div", Ve, [
          t[4] || (t[4] = s("div", { class: "section-label" }, "Retrieved documents", -1)),
          (v(!0), p(W, null, V(Z.value, (e) => (v(), p("div", {
            key: e.doc_id,
            class: H(["doc-card", { "below-threshold": ne(e), "manually-added": L(e.doc_id), active: e.doc_id === D.value }]),
            "data-doc-id": e.doc_id,
            onClick: (d) => le(e.doc_id)
          }, [
            s("div", Ze, [
              s("button", {
                class: "card-action-btn",
                title: "Exclude",
                onClick: I((d) => ue(e), ["stop"])
              }, "✕", 8, Ge)
            ]),
            s("div", Ue, [
              be(c(e.title) + " ", 1),
              L(e.doc_id) ? (v(), p("span", Ye, "manually added")) : O("", !0)
            ]),
            s("div", Je, c(e.doc_id) + " · " + c(e.provisions.length) + " prov", 1),
            s("div", Ke, [
              s("div", Qe, [
                s("div", {
                  class: "score-bar",
                  style: ee({ width: oe(De)(e.score) + "%", background: oe(we)(e.score) })
                }, null, 4)
              ]),
              s("div", Xe, c(e.score.toFixed(3)), 1)
            ]),
            s("div", Ie, "Top: " + c(e.top_provision), 1)
          ], 10, He))), 128)),
          _.value.length ? (v(), p("div", eo, "Excluded documents")) : O("", !0),
          (v(!0), p(W, null, V(_.value, (e) => (v(), p("div", {
            key: e.doc_id,
            class: "doc-card excluded",
            "data-excluded-id": e.doc_id
          }, [
            s("div", to, [
              s("button", {
                class: "card-action-btn restore-btn",
                title: "Restore",
                onClick: I((d) => pe(e.doc_id), ["stop"])
              }, "↺", 8, so)
            ]),
            s("div", no, c(e.title), 1),
            s("div", io, c(e.doc_id) + " · excluded by student", 1)
          ], 8, oo))), 128))
        ]),
        s("div", lo, [
          D.value ? (v(), p(W, { key: 1 }, [
            s("div", ao, [
              s("h3", null, c(j.value.title), 1),
              s("div", co, c(j.value.doc_type) + " · " + c(j.value.provisions.length) + " provisions · " + c(D.value), 1),
              s("div", uo, [
                s("button", {
                  class: H(["viewer-tab", { active: M.value === "provisions" }]),
                  onClick: t[0] || (t[0] = (e) => M.value = "provisions")
                }, "Provisions", 2),
                s("button", {
                  class: H(["viewer-tab", { active: M.value === "markdown" }]),
                  onClick: re
                }, "Full document", 2)
              ])
            ]),
            M.value === "provisions" ? (v(), p("div", vo, [
              s("div", po, [
                s("span", _o, c(ie.value) + " of " + c($.value.length) + " provisions selected", 1),
                s("button", {
                  class: "btn-sm",
                  onClick: ae,
                  "data-test": "select-all"
                }, "Select all"),
                s("button", {
                  class: "btn-sm",
                  onClick: ce,
                  "data-test": "deselect-all"
                }, "Deselect all")
              ]),
              (v(!0), p(W, null, V($.value, (e) => (v(), p("div", {
                key: e.prov_id,
                class: H(["prov-card", { highlight: z(e.prov_id), dim: !z(e.prov_id) }]),
                "data-prov-id": e.prov_id
              }, [
                s("div", fo, [
                  s("input", {
                    type: "checkbox",
                    checked: z(e.prov_id),
                    onChange: (d) => de(e, d.target.checked)
                  }, null, 40, ho),
                  s("span", xo, c(e.article), 1),
                  s("span", yo, c((e.score ?? 0).toFixed(3)), 1),
                  s("span", bo, c(e.prov_id), 1)
                ]),
                s("div", ko, c(e.text), 1)
              ], 10, mo))), 128))
            ])) : (v(), p("div", go, [
              G.value ? (v(), p("div", wo, "Loading…")) : P.value ? (v(), p("div", Do, c(P.value), 1)) : T.value ? (v(), p("div", {
                key: 2,
                class: "md-view",
                innerHTML: T.value
              }, null, 8, Co)) : (v(), p("p", Oo, "No markdown source."))
            ]))
          ], 64)) : (v(), p("div", ro, "Click a document to view its contents"))
        ])
      ]),
      C.value ? (v(), p("div", So, [
        s("div", Lo, [
          t[5] || (t[5] = s("h3", null, "Exclude document", -1)),
          s("p", Ao, c(C.value.title), 1),
          Q.value ? (v(), p("div", Mo, c(Q.value), 1)) : O("", !0),
          ke(s("input", {
            "onUpdate:modelValue": t[1] || (t[1] = (e) => B.value = e),
            class: "modal-input",
            style: ee(U.value ? { borderColor: "var(--red)" } : {}),
            placeholder: "Why are you excluding this document? (required for provenance)",
            "data-test": "exclude-reason"
          }, null, 4), [
            [ge, B.value]
          ]),
          s("div", Eo, [
            s("button", {
              class: "btn-sm",
              onClick: t[2] || (t[2] = (e) => C.value = null)
            }, "Cancel"),
            s("button", {
              class: "btn-sm btn-danger",
              onClick: ve,
              "data-test": "confirm-exclude"
            }, "Exclude")
          ])
        ])
      ])) : O("", !0),
      q.value ? (v(), p("div", To, [
        s("div", Po, [
          t[6] || (t[6] = s("h3", null, "Add a document to the selection", -1)),
          t[7] || (t[7] = s("p", { class: "muted" }, "Select a document from the corpus that retrieval missed.", -1)),
          (v(!0), p(W, null, V(X.value, (e) => (v(), p("div", {
            key: e.doc_id,
            class: "modal-doc-item",
            onClick: (d) => me(e.doc_id)
          }, [
            s("div", null, [
              s("b", null, c(e.title), 1)
            ]),
            s("div", Ro, c(e.doc_id) + " · " + c(e.doc_type) + " · " + c(e.provision_count) + " provisions", 1)
          ], 8, $o))), 128)),
          X.value.length === 0 ? (v(), p("p", Wo, " All documents are already selected or excluded. ")) : O("", !0),
          s("div", jo, [
            s("button", {
              class: "btn-sm",
              onClick: t[3] || (t[3] = (e) => q.value = !1)
            }, "Cancel")
          ])
        ])
      ])) : O("", !0)
    ]));
  }
}), Bo = (i, r) => {
  const n = i.__vccOpts || i;
  for (const [l, k] of r)
    n[l] = k;
  return n;
}, qo = /* @__PURE__ */ Bo(zo, [["__scopeId", "data-v-66be0429"]]), No = {
  install(i) {
    i.component("DocumentManager", qo);
  }
};
export {
  qo as DocumentManager,
  No as VueLegalDocumentManagerPlugin,
  Te as addDocument,
  $e as buildSelectedProvisions,
  No as default,
  Ce as emptySelection,
  Me as excludeDocument,
  Ae as isLowDocumentCount,
  se as isProvisionSelected,
  Se as provisionScore,
  Pe as provisionsToSelectOnAdd,
  Ee as restoreDocument,
  je as sanitizeHtml,
  Oe as selectedDocIds,
  Le as shouldWarnOnExclude
};
