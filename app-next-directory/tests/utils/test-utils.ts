import type { Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'
import type { Role } from '@/models/User'
import {
  TEST_SESSION_COOKIE_NAME,
  getSessionForRole,
  createTestData
} from '@/tests/helpers/test-data'

const baseUrl = new URL(process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000')

async function applySession(page: Page, role: Role) {
  const session = getSessionForRole(role)
  if (!session) {
    throw new Error(`Test session not found for role: ${role}`)
  }

  const cookie = {
    name: TEST_SESSION_COOKIE_NAME,
    value: session.token,
    domain: baseUrl.hostname,
    path: '/',
    httpOnly: true,
    secure: baseUrl.protocol === 'https:',
    sameSite: 'Lax' as const
  }

  await page.context().addCookies([cookie])

  const serialisableUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    plan: session.user.plan,
    image: session.user.image ?? null
  }

  await page.context().addInitScript(({ token, user }) => {
    window.localStorage.setItem('token', token)
    window.localStorage.setItem('currentUser', JSON.stringify(user))
    window.sessionStorage.setItem('token', token)
  }, {
    token: session.token,
    user: serialisableUser
  })

  const origin = baseUrl.origin
  const currentUrl = page.url()
  if (!currentUrl.startsWith(origin)) {
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' }).catch(() => undefined)
  } else {
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
  }

  return session
}

async function loginViaForm(page: Page, email: string, password: string, redirectPattern: RegExp) {
  await page.goto('/auth/signin')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  const submit = page.locator('button[type="submit"]')
  await Promise.all([
    page.waitForURL(redirectPattern, { timeout: 10_000 }).catch(() => undefined),
    submit.click()
  ])
}

export async function loginAs(page: Page, role: Role, options: { redirectTo?: string } = {}) {
  const session = await applySession(page, role)
  if (options.redirectTo) {
    const target = options.redirectTo.startsWith('http')
      ? options.redirectTo
      : `${baseUrl.origin}${options.redirectTo.startsWith('/') ? options.redirectTo : `/${options.redirectTo}`}`
    await page.goto(target, { waitUntil: 'domcontentloaded' }).catch(() => undefined)
  }
  return session
}

export const test = base.extend<{ authenticatedPage: Page; adminPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, 'user', { redirectTo: '/dashboard' })
    await use(page)
  },
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'admin', { redirectTo: '/admin/dashboard' })
    await use(page)
  }
})

export { expect }

async function loginByRole(page: Page, role: Role, fallbackPath: string, email?: string, password?: string) {
  if (email && password) {
    await loginViaForm(page, email, password, new RegExp(fallbackPath))
    return
  }
  await loginAs(page, role, { redirectTo: fallbackPath })
}

export const TestHelpers = {
  async fillListingForm(page: Page, data: any = {}) {
    const defaultData = {
      name: 'Test Eco Space',
      description: 'A sustainable coworking space',
      category: 'coworking',
      city: 'Bangkok',
      address: '123 Green Street',
      ...data
    }

    await page.fill('input[name="name"]', defaultData.name)
    await page.fill('textarea[name="description"]', defaultData.description)
    await page.selectOption('select[name="category"]', defaultData.category)
    await page.fill('input[name="city"]', defaultData.city)
    await page.fill('input[name="address"]', defaultData.address)
  },

  async verifyListingCard(page: Page, data: any) {
    const card = page.locator('[data-testid="listing-card"]').filter({ hasText: data.name })
    await expect(card).toBeVisible()
    await expect(card.locator('[data-testid="listing-category"]')).toHaveText(data.category)
    await expect(card.locator('[data-testid="listing-city"]')).toHaveText(data.city)
  },

  async submitReview(page: Page, data: any = {}) {
    const defaultData = {
      rating: 5,
      comment: 'Great eco-friendly space!',
      ...data
    }

    await page.click('button[data-testid="write-review-button"]')
    await page.fill('input[name="rating"]', String(defaultData.rating))
    await page.fill('textarea[name="comment"]', defaultData.comment)
    await page.click('button[type="submit"]')
  },

  async checkToast(page: Page, message: string) {
    const toast = page.locator('[data-testid="toast"]')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText(message)
  },

  async loginAsUser(page: Page, email?: string, password?: string) {
    await loginByRole(page, 'user', '/dashboard', email, password)
  },

  async loginAsVenueOwner(page: Page, email?: string, password?: string) {
    await loginByRole(page, 'venueOwner', '/dashboard/venues', email, password)
  },

  async loginAsPremium(page: Page, email?: string, password?: string) {
    await TestHelpers.loginAsVenueOwner(page, email, password)
  },

  async loginAsAdmin(page: Page, email?: string, password?: string) {
    await loginByRole(page, 'admin', '/admin/dashboard', email, password)
  },

  async createListing(page: Page, data: any = {}) {
    await page.goto('/dashboard/listings/new')
    await TestHelpers.fillListingForm(page, data)
    await page.click('button[type="submit"]')
    await TestHelpers.checkToast(page, 'Listing created successfully')
    const urlPath = new URL(page.url()).pathname
    const listingId = urlPath.split('/').filter(segment => segment.length > 0).pop()
    if (!listingId) {
      throw new Error(`Failed to extract listing ID from URL: ${page.url()}`)
    }
    const response = await TestHelpers.makeAuthenticatedRequest(page, `/api/listings/manage/${listingId}`)
    const response = await TestHelpers.makeAuthenticatedRequest(page, `/api/listings/manage/${listingId}`)
    if (!response.ok()) {
      throw new Error(`Failed to fetch listing: ${response.status()} ${response.statusText()}`)
    }
    const listing = await response.json()
    return listing
  },

  async makeAuthenticatedRequest(page: Page, endpoint: string, options: any = {}) {
    const token = await page.evaluate(() => window.localStorage.getItem('token'))
    return page.request.fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : undefined
      }
    })
  },

  getSeededData() {
    return createTestData()
  }
}

export const CustomAssertions = {
  async assertPagination(
    page: Page,
    { currentPage, totalPages }: { currentPage: number; totalPages: number }
  ) {
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-page"]')).toHaveText(String(currentPage))
    await expect(page.locator('[data-testid="total-pages"]')).toHaveText(String(totalPages))
  },

  async assertFormError(page: Page, fieldName: string, errorMessage: string) {
    const errorElement = page.locator(`[data-testid="error-${fieldName}"]`)
    await expect(errorElement).toBeVisible()
    await expect(errorElement).toHaveText(errorMessage)
  },

  async assertAuthenticated(page: Page) {
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  },

  async assertAdminAccess(page: Page) {
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
  }
}
