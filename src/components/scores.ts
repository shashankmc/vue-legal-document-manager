// Score-bar presentation, mirroring Appendix D.2 #13 so the document manager
// matches the retriever's cards (same colours, same width rule).

export function scoreColor(score: number): string {
  if (score > 0.5) return '#2e7d5b'
  if (score > 0.3) return '#1b6b93'
  return '#e8a838'
}

export function scoreWidth(score: number): number {
  return Math.max(score * 100, 2)
}
