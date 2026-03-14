export type EvidenceKey = "log" | "pr" | "spec" | "test";

export function hasCriticalEvidence(evidence: Set<EvidenceKey>): boolean {
  return evidence.has("log") && evidence.has("pr") && evidence.has("spec");
}

export function judgeOutcome(params: { suspectIsCorrect: boolean; evidence: Set<EvidenceKey> }): "success" | "warning" | "failure" {
  if (!params.suspectIsCorrect) {
    return "failure";
  }

  return hasCriticalEvidence(params.evidence) ? "success" : "warning";
}
