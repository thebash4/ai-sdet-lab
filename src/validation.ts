import type { FieldErrors, RegistrationFormValues } from './types'
import { findUserByEmail } from './storage'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegistrationForm(
  values: RegistrationFormValues,
): FieldErrors {
  const errors: FieldErrors = {}
  const fullName = values.fullName.trim()
  const email = values.email.trim()

  if (!fullName) {
    errors.fullName = 'Full name is required.'
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  }

  if (!email) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  } else if (findUserByEmail(email)) {
    errors.email = 'An account with this email already exists.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}
