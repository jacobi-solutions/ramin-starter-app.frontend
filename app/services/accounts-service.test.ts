import { describe, expect, it, vi } from "vitest";
import { AccountsService } from "./accounts-service";
import type { ApiClient } from "./api-client";

describe("AccountsService", () => {
  it("registers the current user through the API client", async () => {
    const response = {
      cognitoSubject: "subject-123",
      email: "user@example.com",
      id: "account-1",
      username: "user@example.com",
    };
    const api = {
      post: vi.fn().mockResolvedValue(response),
    } as unknown as ApiClient;
    const service = new AccountsService(api);

    await expect(service.registerCurrentUser()).resolves.toEqual(response);
    expect(api.post).toHaveBeenCalledWith("/accounts/register");
  });
});
