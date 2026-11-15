import { test as base } from '@playwright/test'
import { RegistrationPage } from '../pages/RegistrationPage'

// The callback parameter is named `provide` rather than `use` so React lint
// rules do not mistake it for the React `use` hook.
export const test = base.extend<{ registration: RegistrationPage }>({
  registration: async ({ page }, provide) => {
    await provide(new RegistrationPage(page))
  },
})

export { expect } from '@playwright/test'
