import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../../services/api-client";
import { registerCurrentUser } from "./api";

describe("accounts API", () => {
  it("registers the current user through the API client", async () => {
    const account = {
      cognitoSubject: "subject-123",
      email: "user@example.com",
      id: "account-1",
      username: "user@example.com",
    };
    const api = {
      post: vi.fn().mockResolvedValue({
        data: account,
        errors: [],
        isSuccess: true,
      }),
    } as unknown as ApiClient;
    await expect(registerCurrentUser(api)).resolves.toEqual(account);
    expect(api.post).toHaveBeenCalledWith("/accounts/register", {});
  });
});
