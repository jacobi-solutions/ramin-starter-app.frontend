import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "oidc-client-ts";
import type { AppConfig } from "../core/app-config";
import { AuthService } from "./auth-service";

const oidc = vi.hoisted(() => ({
  addUserLoaded: vi.fn(),
  addUserUnloaded: vi.fn(),
  getUser: vi.fn(),
  removeUser: vi.fn(),
  signinRedirectCallback: vi.fn(),
  signinSilent: vi.fn(),
}));

vi.mock("oidc-client-ts", () => ({
  UserManager: class {
    events = {
      addUserLoaded: oidc.addUserLoaded,
      addUserUnloaded: oidc.addUserUnloaded,
    };
    getUser = oidc.getUser;
    removeUser = oidc.removeUser;
    signinRedirect = vi.fn();
    signinRedirectCallback = oidc.signinRedirectCallback;
    signinSilent = oidc.signinSilent;
    signoutRedirect = vi.fn();
  },
}));

const config: AppConfig = {
  apiBaseUrl: "https://example.test/api",
  cognitoAuthority: "https://cognito.example.test/pool",
  cognitoClientId: "client-id",
  cognitoRedirectUri: "https://example.test",
};

function user(overrides: Partial<User> = {}) {
  return {
    access_token: "access-token",
    expired: false,
    profile: { sub: "user-1" },
    ...overrides,
  } as User;
}

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oidc.getUser.mockResolvedValue(null);
    oidc.removeUser.mockResolvedValue(undefined);
  });

  it("silently renews an expired access token", async () => {
    const expiredUser = user({ access_token: "expired", expired: true });
    const renewedUser = user({ access_token: "renewed" });
    oidc.getUser.mockResolvedValueOnce(null).mockResolvedValueOnce(expiredUser);
    oidc.signinSilent.mockResolvedValue(renewedUser);
    const service = new AuthService(config);

    await expect(service.getAccessToken()).resolves.toBe("renewed");
    expect(oidc.signinSilent).toHaveBeenCalledOnce();
    expect(service.getSnapshot().status).toBe("authenticated");
  });

  it("shares one silent renewal across concurrent token requests", async () => {
    const expiredUser = user({ access_token: "expired", expired: true });
    const renewedUser = user({ access_token: "renewed" });
    let resolveRenewal: (value: User) => void = () => undefined;
    const renewal = new Promise<User>((resolve) => {
      resolveRenewal = resolve;
    });
    oidc.getUser.mockResolvedValueOnce(null).mockResolvedValue(expiredUser);
    oidc.signinSilent.mockReturnValue(renewal);
    const service = new AuthService(config);

    const firstToken = service.getAccessToken();
    const secondToken = service.getAccessToken();
    resolveRenewal(renewedUser);

    await expect(Promise.all([firstToken, secondToken])).resolves.toEqual(["renewed", "renewed"]);
    expect(oidc.signinSilent).toHaveBeenCalledOnce();
    expect(oidc.removeUser).not.toHaveBeenCalled();
  });

  it("keeps a session renewed automatically when fallback renewal loses the race", async () => {
    const expiredUser = user({ access_token: "expired", expired: true });
    const automaticallyRenewedUser = user({ access_token: "automatic-renewal" });
    oidc.getUser
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(expiredUser)
      .mockResolvedValueOnce(automaticallyRenewedUser);
    oidc.signinSilent.mockRejectedValue(new Error("renewal already completed"));
    const service = new AuthService(config);

    await expect(service.getAccessToken()).resolves.toBe("automatic-renewal");
    expect(oidc.removeUser).not.toHaveBeenCalled();
    expect(service.getSnapshot().status).toBe("authenticated");
  });

  it("clears an expired session when renewal fails", async () => {
    oidc.getUser.mockResolvedValueOnce(null).mockResolvedValueOnce(user({ expired: true }));
    oidc.signinSilent.mockRejectedValue(new Error("refresh failed"));
    const service = new AuthService(config);

    await expect(service.getAccessToken()).resolves.toBeNull();
    expect(oidc.removeUser).toHaveBeenCalledOnce();
    expect(service.getSnapshot().status).toBe("signed-out");
  });

  it("ignores unrelated query parameters containing code", async () => {
    vi.stubGlobal("window", {
      history: { replaceState: vi.fn() },
      location: { pathname: "/", search: "?discount_code=summer" },
    });
    const service = new AuthService(config);

    await service.completeSignInFromRedirect();

    expect(oidc.signinRedirectCallback).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("completes callbacks that contain both code and state", async () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      history: { replaceState },
      location: { pathname: "/", search: "?code=authorization-code&state=request-state" },
    });
    vi.stubGlobal("document", { title: "Ramin" });
    const callbackUser = user();
    oidc.signinRedirectCallback.mockResolvedValue(callbackUser);
    const service = new AuthService(config);

    await service.completeSignInFromRedirect();

    expect(oidc.signinRedirectCallback).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith({}, "Ramin", "/");
    expect(service.getSnapshot().status).toBe("authenticated");
    vi.unstubAllGlobals();
  });
});
