import { useMutation, useQuery } from "@tanstack/react-query";
import {
  signupAction,
  resetPasswordAction,
  getProfileAction,
} from "@/lib/actions/auth";
import { isServerError } from "@/lib/server-error";
import type { UserCreateRequest, PasswordResetRequest } from "@/types";

export function useSignup() {
  return useMutation({
    mutationFn: async (request: UserCreateRequest) => {
      const res = await signupAction(request);
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (request: PasswordResetRequest) => {
      const res = await resetPasswordAction(request);
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await getProfileAction();
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
    staleTime: 60 * 1000,
  });
}
