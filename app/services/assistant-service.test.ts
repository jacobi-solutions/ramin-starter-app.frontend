import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "./api-client";
import { AssistantService } from "./assistant-service";

describe("AssistantService", () => {
  it("lists assistants through the API client", async () => {
    const assistants = [
      {
        description: "Support assistant",
        key: "support",
        name: "Support",
      },
    ];
    const api = {
      post: vi.fn().mockResolvedValue({
        data: assistants,
        errors: [],
        isSuccess: true,
      }),
    } as unknown as ApiClient;
    const service = new AssistantService(api);

    await expect(service.listAssistants()).resolves.toEqual(assistants);
    expect(api.post).toHaveBeenCalledWith("/assistants/list", {});
  });

  it("streams assistant updates through the API client", async () => {
    const update = {
      conversationId: "conversation-1",
      role: "assistant",
      text: "Hello",
      type: "message",
    };
    const api = {
      stream: vi.fn(async (_path, _body, onEvent) =>
        onEvent({
          data: update,
          errors: [],
          isSuccess: true,
        }),
      ),
    } as unknown as ApiClient;
    const service = new AssistantService(api);
    const onUpdate = vi.fn();

    await service.streamMessage("support", { message: "hello" }, onUpdate);

    expect(api.stream).toHaveBeenCalledWith(
      "/assistants/support/messages/stream",
      { payload: { message: "hello" } },
      expect.any(Function),
    );
    expect(onUpdate).toHaveBeenCalledWith(update);
  });
});
