import { useMemo } from "react";
import { useAuth } from "../auth/auth-context";
import { readAppConfig } from "../core/app-config";
import { ApiClient } from "../services/api-client";

export function useApiClient() {
  const { getAccessToken } = useAuth();
  const baseUrl = readAppConfig().apiBaseUrl;

  return useMemo(() => new ApiClient(baseUrl, getAccessToken), [baseUrl, getAccessToken]);
}
