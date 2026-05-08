import type { ApiClient } from "./api-client";

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

  listAssistants() {
    return this.api.get<AssistantSummary[]>("/assistants");
  }

  streamMessage(
    assistantKey: string,
    request: SendAssistantMessageRequest,
    onUpdate: (update: AssistantThreadUpdate) => void,
  ) {
    return this.api.stream(`/assistants/${assistantKey}/messages/stream`, request, (event) =>
      onUpdate(event as AssistantThreadUpdate),
    );
  }
}
