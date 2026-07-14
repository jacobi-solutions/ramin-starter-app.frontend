import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "../../api/use-api-client";
import { registerCurrentUser } from "./api";

export function useRegisterCurrentUser() {
  const api = useApiClient();
  return useMutation({ mutationFn: () => registerCurrentUser(api) });
}
