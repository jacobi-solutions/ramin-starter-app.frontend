import type { ApiClient } from "./api-client";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export interface AccountResponse {
  cognitoSubject: string;
  email: string;
  id: string;
  username: string;
}

export class AccountsService {
  constructor(private readonly api: ApiClient) {}

  async registerCurrentUser() {
    return unwrapResponse(
      await this.api.post<BaseResponse<AccountResponse>>("/accounts/register", {}),
    );
  }
}
