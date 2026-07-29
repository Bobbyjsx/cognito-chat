"use server";

import { api } from "@/lib/axios";
import { throwServerActionError } from "../server-error";
import type { AppConfig } from "@/types";

export async function getConfigAction(): Promise<AppConfig> {
  try {
    const { data } = await api.get<AppConfig>("/config");
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as AppConfig;
  }
}
