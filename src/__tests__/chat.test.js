import { threadIdFor } from "../services/chat";

describe("chat helpers", () => {
  test("threadIdFor is stable regardless of order", () => {
    const a = "userA";
    const b = "userB";
    const t1 = threadIdFor(a, b);
    const t2 = threadIdFor(b, a);
    expect(t1).toBe(t2);
    expect(t1).toMatch(/^t_/);
  });
});
