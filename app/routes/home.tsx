import type { Route } from "./+types/home";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/auth-context";
import { useRegisterCurrentUser } from "../features/accounts/queries";
import type { AssistantThreadUpdate } from "../features/assistant/api";
import {
  assistantKeys,
  useAssistantConversation,
  useAssistants,
  useSendAssistantMessage,
} from "../features/assistant/queries";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Ramin Starter App" },
    { name: "description", content: "Ramin AWS React/Nest starter stack" },
  ];
}

export default function Home() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [conversationId, setConversationId] = useState<string>();
  const [message, setMessage] = useState("Create a support request for my onboarding issue.");
  const [participantIds, setParticipantIds] = useState("");
  const [updates, setUpdates] = useState<AssistantThreadUpdate[]>([]);

  const assistantsQuery = useAssistants();
  const registerMutation = useRegisterCurrentUser();
  const conversationQuery = useAssistantConversation(conversationId);
  const streamMutation = useSendAssistantMessage();

  function sendMessage() {
    streamMutation.mutate({
      assistantKey: "support",
      request: {
        conversationId,
        message,
        participantUserIds: parseParticipantIds(participantIds),
      },
      onUpdate: (update) => {
        setConversationId(update.conversationId);
        setUpdates((current) => [...current, update]);
      },
    });
  }

  function startNewThread() {
    setConversationId(undefined);
    setUpdates([]);
    queryClient.removeQueries({ queryKey: assistantKeys.conversations });
  }

  function parseParticipantIds(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const visibleUpdates = updates.filter((update) => update.type === "message");

  return (
    <main className="shell">
      <section className="topbar" aria-label="Ramin application header">
        <div>
          <p className="eyebrow">Ramin Starter</p>
          <h1>A service-oriented React app on AWS foundations.</h1>
        </div>
        <div className="session-actions">
          <span className={`status status-${auth.status}`}>{auth.status}</span>
          {auth.status === "authenticated" ? (
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
            <dd>{auth.email ?? "Not signed in"}</dd>
            <dt>Subject</dt>
            <dd>{auth.subject ?? "Unavailable"}</dd>
          </dl>
          <button
            type="button"
            disabled={auth.status !== "authenticated" || registerMutation.isPending}
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
          <div className="panel-title-row">
            <h2>Assistant</h2>
            <button type="button" className="secondary-button" onClick={startNewThread}>
              New thread
            </button>
          </div>
          <p className="muted">
            {assistantsQuery.data?.[0]?.description ??
              "Sign in to load assistant definitions from the Nest API."}
          </p>
          <dl className="conversation-meta">
            <dt>Conversation</dt>
            <dd>{conversationId ?? "New thread"}</dd>
            <dt>Participants</dt>
            <dd>{conversationQuery.data?.participants.length ?? "Not loaded"}</dd>
          </dl>
          <label className="field">
            <span>Additional participant ids</span>
            <input
              value={participantIds}
              onChange={(event) => setParticipantIds(event.currentTarget.value)}
              placeholder="user-2, user-3"
            />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
              rows={4}
            />
          </label>
          <button
            type="button"
            disabled={auth.status !== "authenticated" || streamMutation.isPending}
            onClick={sendMessage}
          >
            {conversationId ? "Continue thread" : "Start thread"}
          </button>
          {streamMutation.error ? <p className="error">{streamMutation.error.message}</p> : null}
          {conversationQuery.error ? <p className="error">{conversationQuery.error.message}</p> : null}
        </div>

        <div className="panel stream-panel">
          <h2>Conversation</h2>
          <ol>
            {visibleUpdates.length === 0 ? (
              <li className="muted">No conversation messages yet.</li>
            ) : (
              visibleUpdates.map((update, index) => (
                <li key={`${update.messageId ?? update.conversationId}-${index}`} className={`role-${update.role}`}>
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
