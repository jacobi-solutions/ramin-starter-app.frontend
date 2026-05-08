import type { Route } from "./+types/home";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth, useServices } from "../services/service-context";
import type { AssistantThreadUpdate } from "../services/assistant-service";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Ramin Starter App" },
    { name: "description", content: "Ramin AWS React/Nest starter stack" },
  ];
}

export default function Home() {
  const { accounts, assistant, auth } = useServices();
  const authState = useAuth();
  const [message, setMessage] = useState("Create a support request for my onboarding issue.");
  const [updates, setUpdates] = useState<AssistantThreadUpdate[]>([]);

  const assistantsQuery = useQuery({
    queryKey: ["assistants"],
    queryFn: () => assistant.listAssistants(),
    enabled: authState.status === "authenticated",
  });

  const registerMutation = useMutation({
    mutationFn: () => accounts.registerCurrentUser(),
  });

  const streamMutation = useMutation({
    mutationFn: async () => {
      setUpdates([]);
      await assistant.streamMessage("support", { message }, (update) => {
        setUpdates((current) => [...current, update]);
      });
    },
  });

  return (
    <main className="shell">
      <section className="topbar" aria-label="Ramin application header">
        <div>
          <p className="eyebrow">Ramin Starter</p>
          <h1>A service-oriented React app on AWS foundations.</h1>
        </div>
        <div className="session-actions">
          <span className={`status status-${authState.status}`}>{authState.status}</span>
          {authState.status === "authenticated" ? (
            <button type="button" onClick={() => void auth.signOut()}>
              Sign out
            </button>
          ) : (
            <button type="button" onClick={() => void auth.signIn()}>
              Sign in
            </button>
          )}
        </div>
      </section>

      <section className="workspace" aria-label="Ramin starter workspace">
        <div className="panel account-panel">
          <h2>Account</h2>
          <dl>
            <dt>Email</dt>
            <dd>{authState.email ?? "Not signed in"}</dd>
            <dt>Subject</dt>
            <dd>{authState.subject ?? "Unavailable"}</dd>
          </dl>
          <button
            type="button"
            disabled={authState.status !== "authenticated" || registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
          >
            Register API account
          </button>
          {registerMutation.data ? (
            <p className="result">Registered {registerMutation.data.email}</p>
          ) : null}
          {registerMutation.error ? (
            <p className="error">{registerMutation.error.message}</p>
          ) : null}
        </div>

        <div className="panel assistant-panel">
          <h2>Assistant</h2>
          <p className="muted">
            {assistantsQuery.data?.[0]?.description ??
              "Sign in to load assistant definitions from the Nest API."}
          </p>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
            rows={4}
          />
          <button
            type="button"
            disabled={authState.status !== "authenticated" || streamMutation.isPending}
            onClick={() => streamMutation.mutate()}
          >
            Stream message
          </button>
          {streamMutation.error ? <p className="error">{streamMutation.error.message}</p> : null}
        </div>

        <div className="panel stream-panel">
          <h2>Stream</h2>
          <ol>
            {updates.length === 0 ? (
              <li className="muted">No stream updates yet.</li>
            ) : (
              updates.map((update, index) => (
                <li key={`${update.conversationId}-${index}`}>
                  <span>{update.role}</span>
                  <p>{update.text}</p>
                </li>
              ))
            )}
          </ol>
        </div>
      </section>
    </main>
  );
}
