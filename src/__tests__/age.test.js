import { calcAge, parseDob } from "../utils/age";

describe("age utils", () => {
  test("parseDob handles ISO string", () => {
    expect(parseDob("2000-01-15")).toBeInstanceOf(Date);
  });

  test("calcAge returns number for 1990-01-01 and >= 18", () => {
    const age = calcAge("1990-01-01");
    expect(typeof age).toBe("number");
    expect(age).toBeGreaterThanOrEqual(18);
  });

  test("calcAge returns null for invalid", () => {
    expect(calcAge("not-a-date")).toBeNull();
    expect(calcAge(null)).toBeNull();
  });
});
