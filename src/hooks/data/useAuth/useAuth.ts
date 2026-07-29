import { useMutation, useQuery } from "@tanstack/react-query";
import {
  signupAction,
  resetPasswordAction,
  getProfileAction,
} from "@/lib/actions/auth";
import type { UserCreateRequest, PasswordResetRequest } from "@/types";

export function useSignup() {
  return useMutation({
    mutationFn: (request: UserCreateRequest) => signupAction(request),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (request: PasswordResetRequest) => resetPasswordAction(request),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileAction(),
    staleTime: 60 * 1000,
  });
}
