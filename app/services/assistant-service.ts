import type { ApiClient } from "./api-client";
import type { components } from "../api/generated/ramin-api";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export type AssistantSummary = components["schemas"]["AssistantSummaryDto"];

export type AssistantThreadUpdate = components["schemas"]["AssistantThreadUpdateDto"];

export type SendAssistantMessageRequest = components["schemas"]["SendAssistantMessagePayloadDto"];

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
