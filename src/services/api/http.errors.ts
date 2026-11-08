import { isAxiosError } from "axios"
import type { ApiErrorResponse } from "./http.types"

export class ApiError extends Error {
  statusCode: number
  errors?: Record<string, string[]>

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.errors = errors
  }
}

export const normalizeApiError = (error: unknown): ApiError => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const axiosError = error

    return new ApiError(
      axiosError.response?.data?.message || "Something went wrong",
      axiosError.response?.status || 500,
      axiosError.response?.data?.errors,
    )
  }

  return new ApiError("Unexpected error", 500)
}
