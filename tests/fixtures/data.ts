import type { TestInfo } from '@playwright/test'

export const STORAGE_KEY = 'practice_registered_users'

export const VALID_PASSWORD = 'Passw0rd!'
export const MISMATCHED_PASSWORD = 'Passw0rd?'
export const PASSWORD_MARKER = 'Zq9-NOSTORE-7x'

/** Shape of a stored record, redefined here so tests do not import app internals. */
export interface StoredUser {
  id: string
  name: string
  email: string
  createdAt: string
}

export const STORED_USER_KEYS = ['createdAt', 'email', 'id', 'name']

export const MESSAGES = {
  fullNameRequired: 'Full name is required.',
  fullNameTooShort: 'Full name must be at least 2 characters.',
  emailRequired: 'Email is required.',
  emailInvalid: 'Enter a valid email address.',
  emailDuplicate: 'An account with this email already exists.',
  passwordRequired: 'Password is required.',
  passwordTooShort: 'Password must be at least 8 characters.',
  confirmRequired: 'Please confirm your password.',
  passwordMismatch: 'Passwords do not match.',
  cleared: 'Practice registration data cleared from localStorage.',
} as const

/** Success banner text; `name` must be the trimmed name. The dash is U+2014. */
export function successMessage(name: string): string {
  return `Registration successful. Welcome, ${name}! (Practice data only — password was not stored.)`
}

/** Lowercase email unique to this test, retry and tag. */
export function uniqueEmail(testInfo: TestInfo, tag: string): string {
  return `${tag}-${testInfo.testId}-r${testInfo.retry}@example.test`.toLowerCase()
}
