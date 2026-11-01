/** Stored user record — never includes password or password hash. */
export interface RegisteredUser {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface RegistrationFormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export type FieldErrors = Partial<
  Record<keyof RegistrationFormValues, string>
>
