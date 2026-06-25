export type AuthMode = "signin" | "signup";

export type AuthActionSuccess = {
  success: true;
  redirectTo: string;
};

export type AuthActionFailure = {
  success: false;
  message: string;
};

export type AuthActionResult = AuthActionSuccess | AuthActionFailure;

export interface AuthFormState {
  mode: AuthMode;
  email: string;
  password: string;
  error: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
}

export interface AuthFormSubmitPayload {
  email: string;
  password: string;
  redirectTo: string;
}
