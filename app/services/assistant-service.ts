import type { ApiClient } from "./api-client";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export interface AssistantSummary {
  description: string;
  key: string;
  name: string;
}

export interface AssistantThreadUpdate {
  conversationId: string;
  role: "assistant" | "system" | "user";
  text: string;
  type: "message" | "status";
}

export interface SendAssistantMessageRequest {
  conversationId?: string;
  message: string;
}

export class AssistantService {
  constructor(private readonly api: ApiClient) {}

  async listAssistants() {
    return unwrapResponse(
      await this.api.post<BaseResponse<AssistantSummary[]>>("/assistants/list", {}),
    );
  }

  streamMessage(
    assistantKey: string,
    request: SendAssistantMessageRequest,
    onUpdate: (update: AssistantThreadUpdate) => void,
  ) {
    return this.api.stream(`/assistants/${assistantKey}/messages/stream`, { payload: request }, (event) =>
      onUpdate(unwrapResponse(event as BaseResponse<AssistantThreadUpdate>)),
    );
  }
}
