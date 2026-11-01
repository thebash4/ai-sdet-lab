import type { RegisteredUser } from './types'

const STORAGE_KEY = 'practice_registered_users'

function readUsers(): RegisteredUser[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed as RegisteredUser[]
  } catch {
    return []
  }
}

function writeUsers(users: RegisteredUser[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function getRegisteredUsers(): RegisteredUser[] {
  return readUsers()
}

export function findUserByEmail(email: string): RegisteredUser | undefined {
  const normalized = email.trim().toLowerCase()
  return readUsers().find((user) => user.email.toLowerCase() === normalized)
}

/** Persists name/email only — passwords are never written to localStorage. */
export function registerUser(name: string, email: string): RegisteredUser {
  const users = readUsers()
  const user: RegisteredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  writeUsers(users)
  return user
}

export function clearPracticeRegistrationData(): void {
  localStorage.removeItem(STORAGE_KEY)
}
