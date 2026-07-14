import type { components } from "../../api/generated/ramin-api";
import type { ApiClient } from "../../services/api-client";
import type { BaseResponse } from "../../services/base-contracts";
import { unwrapResponse } from "../../services/base-contracts";

export type Account = components["schemas"]["AccountResponseDto"];

export async function registerCurrentUser(api: ApiClient) {
  return unwrapResponse(
    await api.post<BaseResponse<Account>>("/accounts/register", {}),
  );
}
