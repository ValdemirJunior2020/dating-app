// src/__tests__/users.test.js
import { isProfileVisible, tagsFrom } from "../services/users";

describe("users service", () => {
  test("isProfileVisible true with photos[]", () => {
    expect(isProfileVisible({ photos: ["https://x/y.jpg"] })).toBe(true);
  });

  test("isProfileVisible true with photoURL", () => {
    expect(isProfileVisible({ photoURL: "https://x/y.jpg" })).toBe(true);
  });

  test("isProfileVisible false without photos", () => {
    expect(isProfileVisible({})).toBe(false);
    expect(isProfileVisible({ photos: [] })).toBe(false);
  });

  test("tagsFrom normalizes shapes", () => {
    expect(tagsFrom("a, b , c")).toEqual(["a", "b", "c"]);
    expect(tagsFrom(["a", "b"])).toEqual(["a", "b"]);
    expect(tagsFrom({ a: true, b: false, c: 1 })).toEqual(["a", "c"]);
  });
});
