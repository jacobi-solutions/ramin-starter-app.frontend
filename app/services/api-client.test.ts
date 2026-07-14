import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api-client";

describe("ApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds the current access token to requests", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: 1 }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("window", { fetch });
    const getAccessToken = vi.fn().mockResolvedValue("access-token");
    const client = new ApiClient("https://example.test/api", getAccessToken);

    await expect(client.get("/value")).resolves.toEqual({ value: 1 });
    expect(fetch).toHaveBeenCalledWith(
      "https://example.test/api/value",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer access-token" }),
      }),
    );
  });

  it("rejects a stream that ends with an incomplete event", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('data: {"value":1}', {
        headers: { "Content-Type": "text/event-stream" },
        status: 200,
      }),
    );
    vi.stubGlobal("window", { fetch });
    const getAccessToken = vi.fn().mockResolvedValue(null);
    const client = new ApiClient("https://example.test/api", getAccessToken);

    await expect(client.stream("/stream", {}, vi.fn())).rejects.toThrow(
      "The response stream ended with an incomplete event.",
    );
  });
});
