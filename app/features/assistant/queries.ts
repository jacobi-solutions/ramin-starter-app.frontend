import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../api/use-api-client";
import { useAuth } from "../../auth/auth-context";
import {
  getConversation,
  listAssistants,
  streamAssistantMessage,
  type AssistantThreadUpdate,
  type SendAssistantMessageRequest,
} from "./api";

export const assistantKeys = {
  all: ["assistants"] as const,
  conversations: ["assistant-conversation"] as const,
  conversation: (conversationId?: string) => ["assistant-conversation", conversationId] as const,
};

export function useAssistants() {
  const api = useApiClient();
  const { status } = useAuth();
  return useQuery({
    queryKey: assistantKeys.all,
    queryFn: () => listAssistants(api),
    enabled: status === "authenticated",
  });
}

export function useAssistantConversation(conversationId?: string) {
  const api = useApiClient();
  const { status } = useAuth();
  return useQuery({
    queryKey: assistantKeys.conversation(conversationId),
    queryFn: () => getConversation(api, conversationId as string),
    enabled: status === "authenticated" && !!conversationId,
  });
}

interface SendMessageVariables {
  assistantKey: string;
  request: SendAssistantMessageRequest;
  onUpdate: (update: AssistantThreadUpdate) => void;
}

export function useSendAssistantMessage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assistantKey, request, onUpdate }: SendMessageVariables) =>
      streamAssistantMessage(api, assistantKey, request, onUpdate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assistantKeys.conversations }),
  });
}
