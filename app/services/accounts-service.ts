import type { ApiClient } from "./api-client";

export interface AccountResponse {
  cognitoSubject: string;
  email: string;
  id: string;
  username: string;
}

export class AccountsService {
  constructor(private readonly api: ApiClient) {}

  registerCurrentUser() {
    return this.api.post<AccountResponse>("/accounts/register");
  }
}
