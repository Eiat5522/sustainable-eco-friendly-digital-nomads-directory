import { rateLimitStore } from '@/utils/rate-limit'

const savedDocs: any[] = []

class MockContactSubmission {
  static docs = savedDocs
  _id: string
  [key: string]: any

  constructor(data: Record<string, any>) {
    Object.assign(this, data)
    this._id = `mock-${MockContactSubmission.docs.length + 1}`
  }

  async save() {
    MockContactSubmission.docs.push(this)
    return this
  }
}

const sendMailMock = jest.fn(async () => ({ sent: true } as const))
const transportSendMailMock = jest.fn(async () => ({ messageId: 'mocked-id' }))
const createTransportMock = jest.fn(() => ({ sendMail: transportSendMailMock }))

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}))

jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(async () => undefined),
}))

jest.mock('@/models/ContactSubmission', () => ({
  __esModule: true,
  default: MockContactSubmission,
}))

jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendMail: sendMailMock,
}))

function makeRequest(body: Record<string, any>, headers: Record<string, string> = {}) {
  const serialized = JSON.stringify(body)
  return {
    json: async () => JSON.parse(serialized),
    headers: {
      get: (key: string) => headers[key] ?? headers[key.toLowerCase()] ?? null,
    },
  } as unknown as Request
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.resetModules()
    savedDocs.length = 0
    sendMailMock.mockClear()
    transportSendMailMock.mockClear()
    createTransportMock.mockClear()
    rateLimitStore.clear()

    delete process.env.RESEND_API_KEY
    delete process.env.CONTACT_EMAIL
    delete process.env.SMTP_FROM
    delete process.env.MONGODB_URI
    delete process.env.GMAIL_USER
    delete process.env.GMAIL_APP_PASSWORD
  })

  it('saves submissions with listing context and triggers notifications', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com'
    process.env.SMTP_FROM = 'noreply@example.com'
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder'
    process.env.GMAIL_USER = 'mailer@example.com'
    process.env.GMAIL_APP_PASSWORD = 'app-pass'

    const { POST } = await import('../../../../app/api/contact/route')

    const request = makeRequest(
      {
        name: 'Test User',
        email: 'user@example.com',
        subject: 'Interested in listing',
        message: 'Please tell me more about this eco-friendly space.',
        type: 'listing',
        listingSlug: 'eco-stay',
      },
      { 'x-forwarded-for': '203.0.113.5' }
    )

    const response = await POST(request as any)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.message).toBe('Your message has been sent successfully!')
    expect(savedDocs).toHaveLength(1)

    const saved = savedDocs[0]
    expect(saved.name).toBe('Test User')
    expect(saved.email).toBe('user@example.com')
    expect(saved.listingSlug).toBe('eco-stay')
    expect(saved.type).toBe('listing')
    expect(saved.ipAddress).toBe('203.0.113.5')

    expect(createTransportMock).toHaveBeenCalledTimes(1)
    expect(transportSendMailMock).toHaveBeenCalledTimes(2)
    const [adminCall, autoReplyCall] = transportSendMailMock.mock.calls
    expect(adminCall[0].to).toBe('team@example.com')
    expect(autoReplyCall[0].to).toBe('user@example.com')
    expect(sendMailMock).not.toHaveBeenCalled()
  })
})
