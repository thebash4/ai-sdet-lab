import { expect, type Locator, type Page } from '@playwright/test'
import { STORAGE_KEY, VALID_PASSWORD } from '../fixtures/data'

export interface RegistrationInput {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export class RegistrationPage {
  readonly page: Page
  readonly heading: Locator
  readonly fullName: Locator
  readonly email: Locator
  readonly password: Locator
  readonly confirmPassword: Locator
  readonly registerButton: Locator
  readonly clearButton: Locator
  readonly status: Locator
  readonly userCount: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'User Registration' })
    // exact: true is required; 'Password' would otherwise also match 'Confirm password'.
    this.fullName = page.getByLabel('Full name', { exact: true })
    this.email = page.getByLabel('Email', { exact: true })
    this.password = page.getByLabel('Password', { exact: true })
    this.confirmPassword = page.getByLabel('Confirm password', { exact: true })
    this.registerButton = page.getByRole('button', {
      name: 'Register',
      exact: true,
    })
    this.clearButton = page.getByRole('button', {
      name: 'Clear practice registration data',
    })
    this.status = page.getByRole('status')
    this.userCount = page.getByText(/^Practice users stored:/)
  }

  get inputs(): Locator[] {
    return [this.fullName, this.email, this.password, this.confirmPassword]
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
    await expect(this.heading).toBeVisible()
  }

  async fill(input: RegistrationInput): Promise<void> {
    if (input.fullName !== undefined) await this.fullName.fill(input.fullName)
    if (input.email !== undefined) await this.email.fill(input.email)
    if (input.password !== undefined) await this.password.fill(input.password)
    if (input.confirmPassword !== undefined) {
      await this.confirmPassword.fill(input.confirmPassword)
    }
  }

  async submit(): Promise<void> {
    await this.registerButton.click()
  }

  /** Fills a complete valid form for `email` and submits it. */
  async register(email: string, fullName = 'Ada Lovelace'): Promise<void> {
    await this.fill({
      fullName,
      email,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    })
    await this.submit()
  }

  async expectUserCount(count: number): Promise<void> {
    await expect(this.userCount).toHaveText(`Practice users stored: ${count}`)
  }

  /** Raw value of the registration storage key, or null when absent. */
  async rawStoredUsers(): Promise<string | null> {
    return this.page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  }

  async storedUsers(): Promise<unknown> {
    const raw = await this.rawStoredUsers()
    return raw === null ? null : JSON.parse(raw)
  }

  /**
   * Seeds the storage key before every document load. Call before goto().
   * Not for reload tests: the init script re-runs on reload.
   */
  async seedRawStorage(raw: string): Promise<void> {
    await this.page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, raw] as const,
    )
  }
}
