import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SHARED_RESIDENCES } from "./residences";

describe("residence meetingRooms (public venue facts only)", () => {
  const withRooms = SHARED_RESIDENCES.filter((r) => r.meetingRooms);

  it("carries Low Wood Bay's per-room capacities", () => {
    assert.ok(withRooms.map((r) => r.id).includes("low-wood-bay-windermere"));
  });

  it("every entry has primary http(s) sources, a checked date and rooms", () => {
    for (const r of withRooms) {
      const m = r.meetingRooms!;
      assert.ok(m.sources.length > 0, r.id);
      for (const u of m.sources) assert.match(u, /^https?:\/\//, r.id);
      assert.match(m.checked, /^\d{4}-\d{2}-\d{2}$/, r.id);
      assert.ok(m.rooms.length > 0, r.id);
    }
  });
});
