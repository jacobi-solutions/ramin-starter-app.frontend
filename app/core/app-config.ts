export interface AppConfig {
  apiBaseUrl: string;
  cognitoAuthority: string;
  cognitoClientId: string;
  cognitoRedirectUri: string;
}

export function readAppConfig(): AppConfig {
  const origin = typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;

  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
    cognitoAuthority: import.meta.env.VITE_COGNITO_AUTHORITY ?? "",
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
    cognitoRedirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI ?? origin,
  };
}
