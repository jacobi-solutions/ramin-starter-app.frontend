import type { components } from "../../api/generated/ramin-api";
import type { ApiClient } from "../../services/api-client";
import type { BaseResponse } from "../../services/base-contracts";
import { unwrapResponse } from "../../services/base-contracts";

export type AssistantSummary = components["schemas"]["AssistantSummaryDto"];
export type AssistantThreadUpdate = components["schemas"]["AssistantThreadUpdateDto"];
export type AssistantConversation = components["schemas"]["AssistantConversationDto"];
export type SendAssistantMessageRequest = components["schemas"]["SendAssistantMessagePayloadDto"];

export async function listAssistants(api: ApiClient) {
  return unwrapResponse(
    await api.post<BaseResponse<AssistantSummary[]>>("/assistants/list", {}),
  );
}

export async function getConversation(api: ApiClient, conversationId: string) {
  return unwrapResponse(
    await api.post<BaseResponse<AssistantConversation>>("/assistants/conversation/get", {
      payload: { conversationId },
    }),
  );
}

export function streamAssistantMessage(
  api: ApiClient,
  assistantKey: string,
  request: SendAssistantMessageRequest,
  onUpdate: (update: AssistantThreadUpdate) => void,
) {
  return api.stream(`/assistants/${assistantKey}/messages/stream`, { payload: request }, (event) =>
    onUpdate(unwrapResponse(event as BaseResponse<AssistantThreadUpdate>)),
  );
}
