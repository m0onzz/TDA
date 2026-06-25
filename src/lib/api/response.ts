export type ApiSuccess<T> = {
  data: T;
};

export type ApiError = {
  error: {
    message: string;
    code?: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { data };
}

export function apiError(message: string, code?: string): ApiError {
  return { error: { message, code } };
}
