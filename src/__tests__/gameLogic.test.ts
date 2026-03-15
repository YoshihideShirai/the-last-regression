import { describe, expect, it } from "vitest";
import { hasCriticalEvidence, judgeOutcome, type EvidenceKey } from "../gameLogic";

function makeEvidence(keys: EvidenceKey[]): Set<EvidenceKey> {
  return new Set(keys);
}

describe("hasCriticalEvidence", () => {
  it("returns true when log/pr/spec are all present", () => {
    expect(hasCriticalEvidence(makeEvidence(["log", "pr", "spec"]))).toBe(true);
  });

  it("returns false when any required evidence is missing", () => {
    expect(hasCriticalEvidence(makeEvidence(["log", "pr"]))).toBe(false);
  });
});

describe("judgeOutcome", () => {
  it("returns failure for incorrect suspect regardless of evidence", () => {
    expect(judgeOutcome({ suspectIsCorrect: false, evidence: makeEvidence(["log", "pr", "spec"]) })).toBe("failure");
  });

  it("returns warning for correct suspect with insufficient evidence", () => {
    expect(judgeOutcome({ suspectIsCorrect: true, evidence: makeEvidence(["log", "pr"]) })).toBe("warning");
  });

  it("returns success for correct suspect with critical evidence", () => {
    expect(judgeOutcome({ suspectIsCorrect: true, evidence: makeEvidence(["log", "pr", "spec"]) })).toBe("success");
  });
});
