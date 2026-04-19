import { describe, it, expect } from "vitest";
import {
  PREFERENCE_FIELDS,
  PREFERENCE_MODES,
  DEFAULT_PREFERENCES,
  normalizePreferences,
  isPreferenceSet,
  CORE_ONBOARDING_FIELDS,
} from "./preferencesContract";

describe("preferencesContract", () => {
  it("exposes 17 fields in the catalog", () => {
    expect(PREFERENCE_FIELDS).toHaveLength(17);
  });

  it("exposes 6 core onboarding field ids", () => {
    expect(CORE_ONBOARDING_FIELDS).toHaveLength(6);
    const ids = PREFERENCE_FIELDS.map((f) => f.id);
    for (const core of CORE_ONBOARDING_FIELDS) {
      expect(ids).toContain(core);
    }
  });

  it("has three modes: off, soft, hard", () => {
    expect(PREFERENCE_MODES).toEqual(["off", "soft", "hard"]);
  });

  it("DEFAULT_PREFERENCES is an empty object", () => {
    expect(DEFAULT_PREFERENCES).toEqual({});
  });

  it("normalizePreferences drops malformed entries", () => {
    const raw = {
      gender_match: { value: ["women"], mode: "hard" },
      bogus_field: { value: 1, mode: "soft" },
      pace_range: { value: { min_sec: 300, max_sec: 360 }, mode: "soft" },
    };
    const out = normalizePreferences(raw);
    expect(out.gender_match).toEqual(raw.gender_match);
    expect(out.pace_range).toEqual(raw.pace_range);
    expect(out.bogus_field).toBeUndefined();
  });

  it("isPreferenceSet returns true when mode is soft or hard", () => {
    expect(isPreferenceSet({ value: ["women"], mode: "hard" })).toBe(true);
    expect(isPreferenceSet({ value: ["women"], mode: "soft" })).toBe(true);
    expect(isPreferenceSet({ value: ["women"], mode: "off" })).toBe(false);
    expect(isPreferenceSet(undefined)).toBe(false);
    expect(isPreferenceSet(null)).toBe(false);
  });
});
