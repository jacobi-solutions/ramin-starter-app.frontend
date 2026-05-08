import { QueryClient } from "@tanstack/react-query";
import { readAppConfig } from "../core/app-config";
import { AccountsService } from "./accounts-service";
import { ApiClient } from "./api-client";
import { AssistantService } from "./assistant-service";
import { AuthService } from "./auth-service";

export interface RaminServices {
  accounts: AccountsService;
  api: ApiClient;
  assistant: AssistantService;
  auth: AuthService;
  queryClient: QueryClient;
}

export function createServices(): RaminServices {
  const config = readAppConfig();
  const auth = new AuthService(config);
  const api = new ApiClient(config.apiBaseUrl, auth);

  return {
    accounts: new AccountsService(api),
    api,
    assistant: new AssistantService(api),
    auth,
    queryClient: new QueryClient(),
  };
}
