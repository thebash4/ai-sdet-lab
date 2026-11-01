import { useState, type FormEvent } from 'react'
import {
  clearPracticeRegistrationData,
  getRegisteredUsers,
  registerUser,
} from '../storage'
import type { FieldErrors, RegistrationFormValues } from '../types'
import { validateRegistrationForm } from '../validation'

const emptyValues: RegistrationFormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegistrationForm() {
  const [values, setValues] = useState<RegistrationFormValues>(emptyValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [clearedMessage, setClearedMessage] = useState<string | null>(null)
  const [userCount, setUserCount] = useState(() => getRegisteredUsers().length)

  function updateField<K extends keyof RegistrationFormValues>(
    field: K,
    value: RegistrationFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) {
        return prev
      }
      const next = { ...prev }
      delete next[field]
      return next
    })
    setSuccessMessage(null)
    setClearedMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setClearedMessage(null)

    const nextErrors = validateRegistrationForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage(null)
      return
    }

    const user = registerUser(values.fullName, values.email)
    setValues(emptyValues)
    setErrors({})
    setUserCount(getRegisteredUsers().length)
    setSuccessMessage(
      `Registration successful. Welcome, ${user.name}! (Practice data only — password was not stored.)`,
    )
  }

  function handleClearPracticeData() {
    clearPracticeRegistrationData()
    setUserCount(0)
    setSuccessMessage(null)
    setErrors({})
    setClearedMessage('Practice registration data cleared from localStorage.')
  }

  return (
    <section className="registration" aria-labelledby="registration-heading">
      <header className="registration__header">
        <h1 id="registration-heading">User Registration</h1>
        <p className="registration__subtitle">
          Local practice app. Passwords are validated in the browser and never
          saved to localStorage.
        </p>
      </header>

      <form className="registration__form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName ? (
            <p id="fullName-error" className="field__error" role="alert">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="field__error" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password ? (
            <p id="password-error" className="field__error" role="alert">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) =>
              updateField('confirmPassword', event.target.value)
            }
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? 'confirmPassword-error' : undefined
            }
          />
          {errors.confirmPassword ? (
            <p id="confirmPassword-error" className="field__error" role="alert">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        <button type="submit" className="button button--primary">
          Register
        </button>
      </form>

      {successMessage ? (
        <p className="banner banner--success" role="status">
          {successMessage}
        </p>
      ) : null}

      {clearedMessage ? (
        <p className="banner banner--info" role="status">
          {clearedMessage}
        </p>
      ) : null}

      <footer className="registration__footer">
        <p className="registration__meta">
          Practice users stored: <strong>{userCount}</strong>
        </p>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleClearPracticeData}
        >
          Clear practice registration data
        </button>
      </footer>
    </section>
  )
}
