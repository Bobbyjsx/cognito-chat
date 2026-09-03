import axios from "axios";
import { toast } from "@/components/ui/toast";
import { capitalizeFirstLetter } from "./utils";

const FALLBACK_ERROR_MESSAGE = "An error occurred";

type ValidationError = {
  loc: string[];
  msg: string;
};

export type ServerActionError = {
  isServerActionError: true;
  message: string;
  statusCode?: number;
  detail?: string | ValidationError[];
};

export const transformServerErrorToString = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail ?? error.response?.data?.message;

    return JSON.stringify({
      message: error.message,
      statusCode: error.response?.status,
      detail,
    } satisfies Omit<ServerActionError, "isServerActionError">);
  }

  if (error instanceof Error) {
    return JSON.stringify({
      message: error.message,
    });
  }

  if (typeof error === "string") {
    return JSON.stringify({
      message: error,
    });
  }

  return JSON.stringify({
    message: FALLBACK_ERROR_MESSAGE,
  });
};

export const parseServerActionError = (error: unknown): unknown => {
  if (
    error &&
    typeof error === "object" &&
    "isServerActionError" in error &&
    (error as { isServerActionError?: boolean }).isServerActionError
  ) {
    try {
      return JSON.parse((error as unknown as { error: string }).error) as Omit<
        ServerActionError,
        "isServerActionError"
      >;
    } catch {
      return {
        message: FALLBACK_ERROR_MESSAGE,
      };
    }
  }

  return error;
};

export const throwServerActionError = (
  error: unknown,
): {
  error: string;
  isServerActionError: true;
} => {
  return {
    error: transformServerErrorToString(error),
    isServerActionError: true,
  };
};

export const isServerError = (
  error: unknown,
): error is { error: string; isServerActionError: true } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isServerActionError" in error &&
    (error as { isServerActionError?: boolean }).isServerActionError === true
  );
};

export const getErrorMessage = (
  e: unknown,
  fallbackErrorMessage = FALLBACK_ERROR_MESSAGE,
): string | string[] => {
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail ?? e.response?.data?.message;
    const statusCode = e.response?.status;
    if (typeof detail === "string") {
      return detail;
    }
    if (statusCode === 422 && Array.isArray(detail) && detail.length) {
      return detail.map((err: any) => {
        const errorField = err.loc?.[err.loc.length - 1]?.replace(/_/g, " ");
        return capitalizeFirstLetter(`${errorField} ${err.msg}.`);
      });
    }
    if (e.message) {
      return e.message;
    }
  }

  const error = parseServerActionError(e);
  if (error && typeof error === "object" && "statusCode" in error) {
    const serverError = error as {
      statusCode?: number;
      detail?: string | ValidationError[];
      message?: string;
    };

    const { statusCode, detail, message } = serverError;

    if (typeof detail === "string") {
      return detail;
    }

    if (statusCode === 422 && Array.isArray(detail) && detail.length) {
      return detail.map(({ loc, msg }) => {
        const errorField = loc[loc.length - 1]?.replace(/_/g, " ");

        return capitalizeFirstLetter(`${errorField} ${msg}.`);
      });
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallbackErrorMessage;
};

const TOAST_DURATION = 7000;

export const notifyServerError = (
  error: unknown,
  fallbackErrorMessage = "An error occurred",
) => {
  const messages = getErrorMessage(error, fallbackErrorMessage);
  if (Array.isArray(messages)) {
    messages.forEach((message) => {
      toast.error(message, { duration: TOAST_DURATION });
    });
    return messages;
  }
  toast.error(messages, { duration: TOAST_DURATION });
  return messages;
};
