"use server";

import { api } from "@/lib/axios";
import { throwServerActionError } from "../server-error";
import type { UserCreateRequest, PasswordResetRequest, UserProfile } from "@/types";

export async function signupAction(request: UserCreateRequest): Promise<UserProfile> {
  try {
    const { data } = await api.post<UserProfile>("/auth/signup", request);
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as UserProfile;
  }
}

export async function resetPasswordAction(
  request: PasswordResetRequest
): Promise<{ message: string }> {
  try {
    const { data } = await api.post<{ message: string }>(
      "/auth/reset-password",
      request
    );
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as { message: string };
  }
}

export async function getProfileAction(): Promise<UserProfile> {
  try {
    const { data } = await api.get<UserProfile>("/auth/me");
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as UserProfile;
  }
}
