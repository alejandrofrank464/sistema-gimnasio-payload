import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

const appUser = {
  email: 'auth-e2e@payloadcms.com',
  password: 'test',
  role: 'staff' as const,
  active: true,
}

async function seedAppUser() {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: appUser.email,
      },
    },
  })

  await payload.create({
    collection: 'users',
    data: appUser,
    draft: false,
  })
}

async function cleanupAppUser() {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: appUser.email,
      },
    },
  })
}

test.describe('Auth Guards', () => {
  test.beforeAll(async () => {
    await seedAppUser()
  })

  test.afterAll(async () => {
    await cleanupAppUser()
  })

  test('permite acceder al root sin autenticacion', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    await expect(page).toHaveURL('http://localhost:3000/')
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
  })

  test('redirige paginas protegidas al root cuando no hay sesion', async ({ page }) => {
    await page.goto('http://localhost:3000/clientes')

    await expect(page).toHaveURL('http://localhost:3000/')
  })

  test('bloquea APIs protegidas cuando no hay sesion', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/configuraciones/nombre')

    expect(response.status()).toBe(401)
  })

  test('redirige del root a home con sesion activa y no usa sessionStorage para auth', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/')
    await page.locator('input#email').fill(appUser.email)
    await page.locator('input#password').fill(appUser.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL('http://localhost:3000/home')

    await page.goto('http://localhost:3000/')
    await expect(page).toHaveURL('http://localhost:3000/home')

    const storageState = await page.evaluate(() => ({
      gymToken: window.sessionStorage.getItem('gym_token'),
      gymUser: window.sessionStorage.getItem('gym_user'),
    }))

    expect(storageState.gymToken).toBeNull()
    expect(storageState.gymUser).toBeNull()
  })
})
