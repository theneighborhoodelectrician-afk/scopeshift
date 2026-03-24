import type { AuthSuccessResponse } from "@/types/auth";

export type ApiError = {
  error: string;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiMessage = {
  success: boolean;
  message?: string;
};

export type AuthResponse = ApiError | AuthSuccessResponse;
