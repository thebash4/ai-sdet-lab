import { expect, test } from '../fixtures/test'
import {
  MESSAGES,
  MISMATCHED_PASSWORD,
  PASSWORD_MARKER,
  STORED_USER_KEYS,
  successMessage,
  uniqueEmail,
  VALID_PASSWORD,
  type StoredUser,
} from '../fixtures/data'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

test.describe('Registration', () => {
  test('T1 valid registration shows success, empties the form and saves the user', async ({
    registration,
  }, testInfo) => {
    const email = uniqueEmail(testInfo, 't1')
    const [local] = email.split('@')
    await registration.goto()
    await registration.expectUserCount(0)

    await registration.fill({
      fullName: '  Ada Lovelace  ',
      email: `${local}@EXAMPLE.TEST`,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    })
    await registration.submit()

    await expect(registration.status).toHaveText(successMessage('Ada Lovelace'))
    for (const input of registration.inputs) {
      await expect(input).toHaveValue('')
      await expect(input).toHaveAttribute('aria-invalid', 'false')
    }
    await registration.expectUserCount(1)
    const stored = (await registration.storedUsers()) as StoredUser[]
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Ada Lovelace')
    expect(stored[0].email).toBe(email)
  })

  test('T2 password is never saved to browser storage', async ({
    page,
    registration,
  }, testInfo) => {
    await registration.goto()
    await registration.fill({
      fullName: 'Ada Lovelace',
      email: uniqueEmail(testInfo, 't2'),
      password: PASSWORD_MARKER,
      confirmPassword: PASSWORD_MARKER,
    })
    await registration.submit()
    await expect(registration.status).toHaveText(successMessage('Ada Lovelace'))

    const stored = (await registration.storedUsers()) as StoredUser[]
    expect(stored).toHaveLength(1)
    const [record] = stored
    expect(Object.keys(record).sort()).toEqual(STORED_USER_KEYS)
    expect(record.id).toMatch(UUID_PATTERN)
    expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt)

    const allStorage = await page.evaluate(() =>
      [localStorage, sessionStorage].flatMap((store) =>
        Object.keys(store).flatMap((key) => [key, store.getItem(key) ?? '']),
      ),
    )
    for (const entry of allStorage) {
      expect(entry).not.toContain(PASSWORD_MARKER)
    }
  })

  test('T3 empty submit flags every field with an accessible error', async ({
    registration,
  }) => {
    await registration.goto()
    for (const input of registration.inputs) {
      await expect(input).toHaveAttribute('aria-invalid', 'false')
    }

    await registration.submit()

    const expected = [
      [registration.fullName, MESSAGES.fullNameRequired, 'fullName-error'],
      [registration.email, MESSAGES.emailRequired, 'email-error'],
      [registration.password, MESSAGES.passwordRequired, 'password-error'],
      [
        registration.confirmPassword,
        MESSAGES.confirmRequired,
        'confirmPassword-error',
      ],
    ] as const
    for (const [input, message, errorId] of expected) {
      await expect(input).toHaveAccessibleDescription(message)
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(input).toHaveAttribute('aria-describedby', errorId)
    }
    await expect(registration.status).toHaveCount(0)
    await registration.expectUserCount(0)
    expect(await registration.rawStoredUsers()).toBeNull()
  })

  test('T4 duplicate email is rejected regardless of letter case', async ({
    registration,
  }, testInfo) => {
    const email = uniqueEmail(testInfo, 't4')
    await registration.goto()
    await registration.register(email)
    await expect(registration.status).toHaveText(successMessage('Ada Lovelace'))

    await registration.register(email.toUpperCase(), 'Grace Hopper')

    await expect(registration.email).toHaveAccessibleDescription(
      MESSAGES.emailDuplicate,
    )
    for (const input of [
      registration.fullName,
      registration.password,
      registration.confirmPassword,
    ]) {
      await expect(input).toHaveAttribute('aria-invalid', 'false')
    }
    await expect(registration.status).toHaveCount(0)
    await registration.expectUserCount(1)
    expect(await registration.storedUsers()).toHaveLength(1)
  })

  test('T5 mismatched passwords are rejected on the confirm field', async ({
    registration,
  }, testInfo) => {
    await registration.goto()
    await registration.fill({
      fullName: 'Ada Lovelace',
      email: uniqueEmail(testInfo, 't5'),
      password: VALID_PASSWORD,
      confirmPassword: MISMATCHED_PASSWORD,
    })
    await registration.submit()

    await expect(registration.confirmPassword).toHaveAccessibleDescription(
      MESSAGES.passwordMismatch,
    )
    await expect(registration.password).toHaveAttribute('aria-invalid', 'false')
    await registration.expectUserCount(0)
    expect(await registration.rawStoredUsers()).toBeNull()
  })

  test('T6 registered users persist across a page reload', async ({
    page,
    registration,
  }, testInfo) => {
    const email = uniqueEmail(testInfo, 't6')
    await registration.goto()
    await registration.register(email)
    await registration.expectUserCount(1)

    await page.reload()
    await expect(registration.heading).toBeVisible()
    await registration.expectUserCount(1)
    expect(await registration.storedUsers()).toHaveLength(1)

    await registration.register(email)
    await expect(registration.email).toHaveAccessibleDescription(
      MESSAGES.emailDuplicate,
    )
  })

  test('T7 clearing practice data removes saved users', async ({
    page,
    registration,
  }, testInfo) => {
    const email = uniqueEmail(testInfo, 't7')
    const success = page.getByText(successMessage('Ada Lovelace'))
    await registration.goto()
    await registration.register(email)
    await expect(success).toBeVisible()
    await registration.expectUserCount(1)

    await registration.clearButton.click()

    await expect(registration.status).toHaveText(MESSAGES.cleared)
    await expect(success).toHaveCount(0)
    expect(await registration.rawStoredUsers()).toBeNull()
    await registration.expectUserCount(0)

    await registration.register(email)
    await expect(registration.status).toHaveText(successMessage('Ada Lovelace'))
    await registration.expectUserCount(1)
  })

  test('T8 malformed email address is rejected', async ({ registration }) => {
    await registration.goto()
    await registration.register('a@b')

    await expect(registration.email).toHaveAccessibleDescription(
      MESSAGES.emailInvalid,
    )
    expect(await registration.rawStoredUsers()).toBeNull()
  })

  test('T9 HTML in the name is shown as plain text', async ({
    page,
    registration,
  }, testInfo) => {
    const htmlName = '<img src=x onerror=alert(1)>'
    const dialogs: string[] = []
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message())
      await dialog.dismiss()
    })
    await registration.goto()

    await registration.register(uniqueEmail(testInfo, 't9'), htmlName)

    await expect(registration.status).toHaveText(successMessage(htmlName))
    await expect(registration.status.locator('img')).toHaveCount(0)
    expect(dialogs).toEqual([])
  })

  test('T10 editing a field clears only that field error', async ({
    registration,
  }) => {
    await registration.goto()
    await registration.submit()
    await expect(registration.fullName).toHaveAccessibleDescription(
      MESSAGES.fullNameRequired,
    )

    await registration.fullName.fill('Ada')

    await expect(registration.fullName).toHaveAttribute('aria-invalid', 'false')
    await expect(registration.fullName).toHaveAccessibleDescription('')
    const remaining = [
      [registration.email, MESSAGES.emailRequired],
      [registration.password, MESSAGES.passwordRequired],
      [registration.confirmPassword, MESSAGES.confirmRequired],
    ] as const
    for (const [input, message] of remaining) {
      await expect(input).toHaveAccessibleDescription(message)
      await expect(input).toHaveAttribute('aria-invalid', 'true')
    }
  })

  test.fixme(
    'T13 mismatch error after fixing Password',
    {
      annotation: {
        type: 'product-decision',
        description:
          'SST-6 open question 5 — should editing Password clear a "Passwords do not match." error?',
      },
    },
    async ({ registration }, testInfo) => {
      await registration.goto()
      await registration.fill({
        fullName: 'Ada Lovelace',
        email: uniqueEmail(testInfo, 't13'),
        password: VALID_PASSWORD,
        confirmPassword: MISMATCHED_PASSWORD,
      })
      await registration.submit()
      await registration.password.fill(MISMATCHED_PASSWORD)
      // Expected assertion intentionally not written until the decision is made.
    },
  )
})

test.describe('Stored data robustness', () => {
  test('T11 corrupt JSON in storage is recovered on next registration', async ({
    registration,
  }, testInfo) => {
    await registration.seedRawStorage('not json')
    await registration.goto()
    await registration.expectUserCount(0)

    await registration.register(uniqueEmail(testInfo, 't11'))

    await expect(registration.status).toHaveText(successMessage('Ada Lovelace'))
    await registration.expectUserCount(1)
    const stored = await registration.storedUsers()
    expect(Array.isArray(stored)).toBe(true)
    expect(stored).toHaveLength(1)
    expect(Object.keys((stored as object[])[0]).sort()).toEqual(
      STORED_USER_KEYS,
    )
  })

  for (const [id, seed] of [
    ['T12a', '[{}]'],
    ['T12b', '[null]'],
  ] as const) {
    // Known defect, reproduced 2026-11-01: submit throws an uncaught TypeError
    // at storage.ts:32 and the user sees no feedback. Must fail in the
    // 'expected behavior' step; a failure in an earlier step is a test bug.
    test.fail(
      `${id} malformed stored entry ${seed} still gives feedback on submit`,
      {
        annotation: {
          type: 'issue',
          description:
            'SST-6 R1 / open question 1 (M5) — malformed stored entry crashes submit',
        },
      },
      async ({ page, registration }, testInfo) => {
        const pageErrors: string[] = []

        await test.step('precondition', async () => {
          page.on('pageerror', (error) => pageErrors.push(error.message))
          await registration.seedRawStorage(seed)
          await registration.goto()
          await registration.expectUserCount(1)
        })

        await test.step('submit', async () => {
          await registration.fill({
            fullName: 'Ada Lovelace',
            email: uniqueEmail(testInfo, id.toLowerCase()),
            password: VALID_PASSWORD,
            confirmPassword: VALID_PASSWORD,
          })
          await registration.submit()
        })

        await test.step('expected behavior', async () => {
          const feedback = registration.status
            .or(page.getByRole('alert'))
            .first()
          // Soft so both symptoms (no feedback, uncaught error) are reported.
          await expect.soft(feedback).toBeVisible()
          // Barrier: an evaluate after the next frame returns only once earlier
          // page events (including a late pageerror) have been delivered.
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(resolve)),
          )
          expect(pageErrors).toEqual([])
        })
      },
    )
  }
})
