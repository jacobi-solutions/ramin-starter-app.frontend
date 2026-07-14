import { describe, expect, it } from "vitest";
import { unwrapResponse } from "./base-contracts";

describe("unwrapResponse", () => {
  it("returns data from successful responses", () => {
    expect(unwrapResponse({ data: { id: "item-1" }, errors: [], isSuccess: true })).toEqual({
      id: "item-1",
    });
  });

  it("rejects successful responses that omit data", () => {
    expect(() => unwrapResponse({ errors: [], isSuccess: true })).toThrow(
      "The API returned a successful response without data.",
    );
  });

  it("surfaces failure messages", () => {
    expect(() =>
      unwrapResponse({
        errors: [{ errorMessage: "Request failed." }],
        isSuccess: false,
      }),
    ).toThrow("Request failed.");
  });
});
