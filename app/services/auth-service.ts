import { UserManager, type User } from "oidc-client-ts";
import type { AppConfig } from "../core/app-config";

export interface AuthSnapshot {
  email: string | null;
  status: "authenticated" | "loading" | "signed-out";
  subject: string | null;
}

type Listener = () => void;

export class AuthService {
  private readonly listeners = new Set<Listener>();
  private readonly manager: UserManager | null;
  private tokenRenewal: Promise<string | null> | null = null;
  private snapshot: AuthSnapshot = {
    email: null,
    status: "loading",
    subject: null,
  };

  constructor(config: AppConfig) {
    this.manager =
      config.cognitoAuthority && config.cognitoClientId
        ? new UserManager({
            authority: config.cognitoAuthority,
            client_id: config.cognitoClientId,
            redirect_uri: config.cognitoRedirectUri,
            post_logout_redirect_uri: config.cognitoRedirectUri,
            response_type: "code",
            scope: "openid email profile",
            automaticSilentRenew: true,
          })
        : null;

    if (!this.manager) {
      this.setSnapshot({ email: null, status: "signed-out", subject: null });
      return;
    }

    this.manager.events.addUserLoaded((user) => this.applyUser(user));
    this.manager.events.addUserUnloaded(() =>
      this.setSnapshot({ email: null, status: "signed-out", subject: null }),
    );

    void this.loadUser();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.snapshot;
  }

  async completeSignInFromRedirect() {
    const search = new URLSearchParams(window.location.search);
    if (!this.manager || !search.has("code") || !search.has("state")) {
      return;
    }

    const user = await this.manager.signinRedirectCallback();
    this.applyUser(user);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  async getAccessToken() {
    if (!this.manager) {
      return null;
    }

    const user = await this.manager.getUser();
    if (!user) {
      return null;
    }

    if (!user.expired) {
      return user.access_token;
    }

    this.tokenRenewal ??= this.renewAccessToken().finally(() => {
      this.tokenRenewal = null;
    });

    return this.tokenRenewal;
  }

  async signIn() {
    if (!this.manager) {
      throw new Error("Cognito OIDC settings are not configured.");
    }

    await this.manager.signinRedirect();
  }

  async signOut() {
    if (!this.manager) {
      this.setSnapshot({ email: null, status: "signed-out", subject: null });
      return;
    }

    await this.manager.signoutRedirect();
  }

  private async loadUser() {
    const user = await this.manager?.getUser();
    this.applyUser(user ?? null);
  }

  private async renewAccessToken() {
    try {
      const renewedUser = await this.manager?.signinSilent();
      if (renewedUser) {
        this.applyUser(renewedUser);
        return renewedUser.access_token;
      }
    } catch {
      // Automatic silent renewal may have completed while this fallback was running.
      const currentUser = await this.manager?.getUser();
      if (currentUser && !currentUser.expired) {
        this.applyUser(currentUser);
        return currentUser.access_token;
      }
    }

    await this.manager?.removeUser();
    this.applyUser(null);
    return null;
  }

  private applyUser(user: User | null) {
    if (!user || user.expired) {
      this.setSnapshot({ email: null, status: "signed-out", subject: null });
      return;
    }

    this.setSnapshot({
      email: typeof user.profile.email === "string" ? user.profile.email : null,
      status: "authenticated",
      subject: user.profile.sub ?? null,
    });
  }

  private setSnapshot(snapshot: AuthSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener();
    }
  }
}
