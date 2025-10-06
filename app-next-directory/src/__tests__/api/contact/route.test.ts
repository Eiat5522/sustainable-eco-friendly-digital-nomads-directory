import dbConnect from '@/lib/dbConnect';
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
}));

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
    jest.useFakeTimers();
    jest.resetModules();
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
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder'; // Set MONGODB_URI for all tests
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('should rate-limit requests from the same IP', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';
    process.env.GMAIL_USER = 'mailer@example.com';
    process.env.GMAIL_APP_PASSWORD = 'app-pass';

    const { POST } = await import('../../../../app/api/contact/route');

    const commonBody = {
      name: 'Rate Limit Test',
      email: 'ratelimit@example.com',
      subject: 'Rate Limit Subject',
      message: 'This is a message for rate limit testing.',
      type: 'general',
    };
    const ip = '192.168.1.1';
    const headers = { 'x-forwarded-for': ip };

    // Send 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      const request = makeRequest(commonBody, headers);
      const response = await POST(request as any);
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.success).toBe(true);
    }

    // Send 6th request (should be rate-limited)
    const request = makeRequest(commonBody, headers);
    const response = await POST(request as any);
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Too many requests. Please try again later.');
  });

  it('should reset rate limit after windowMs', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';
    process.env.GMAIL_USER = 'mailer@example.com';
    process.env.GMAIL_APP_PASSWORD = 'app-pass';

    const { POST } = await import('../../../../app/api/contact/route');

    const commonBody = {
      name: 'Rate Limit Reset Test',
      email: 'ratelimitreset@example.com',
      subject: 'Rate Limit Reset Subject',
      message: 'This is a message for rate limit reset testing.',
      type: 'general',
    };
    const ip = '192.168.1.2';
    const headers = { 'x-forwarded-for': ip };

    // Send 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      const request = makeRequest(commonBody, headers);
      const response = await POST(request as any);
      expect(response.status).toBe(200);
    }

    // Send 6th request (should be rate-limited)
    const requestBlocked = makeRequest(commonBody, headers);
    const responseBlocked = await POST(requestBlocked as any);
    expect(responseBlocked.status).toBe(429);

    // Advance timers by more than 1 minute (60 * 1000 ms)
    jest.advanceTimersByTime(61 * 1000);

    // Send 7th request (should succeed after reset)
    const requestAfterReset = makeRequest(commonBody, headers);
    const responseAfterReset = await POST(requestAfterReset as any);
    expect(responseAfterReset.status).toBe(200);
    const payloadAfterReset = await responseAfterReset.json();
    expect(payloadAfterReset.success).toBe(true);
  });

  it('should rate-limit different IPs independently', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';
    process.env.GMAIL_USER = 'mailer@example.com';
    process.env.GMAIL_APP_PASSWORD = 'app-pass';

    const { POST } = await import('../../../../app/api/contact/route');

    const commonBody = {
      name: 'Independent IP Test',
      email: 'independent@example.com',
      subject: 'Independent IP Subject',
      message: 'This is a message for independent IP testing.',
      type: 'general',
    };

    const ip1 = '192.168.1.3';
    const ip2 = '192.168.1.4';

    // Send 5 requests from IP1 (should succeed)
    for (let i = 0; i < 5; i++) {
      const request = makeRequest(commonBody, { 'x-forwarded-for': ip1 });
      const response = await POST(request as any);
      expect(response.status).toBe(200);
    }

    // Send 1 request from IP2 (should succeed, as IP2 is not rate-limited)
    const requestIp2 = makeRequest(commonBody, { 'x-forwarded-for': ip2 });
    const responseIp2 = await POST(requestIp2 as any);
    expect(responseIp2.status).toBe(200);
    expect(await responseIp2.json()).toHaveProperty('success', true);

    // Send 6th request from IP1 (should be rate-limited)
    const requestIp1Blocked = makeRequest(commonBody, { 'x-forwarded-for': ip1 });
    const responseIp1Blocked = await POST(requestIp1Blocked as any);
    expect(responseIp1Blocked.status).toBe(429);
    expect(await responseIp1Blocked.json()).toHaveProperty('success', false);
  });

  it('should return 400 for invalid email format', async () => {
    const { POST } = await import('../../../../app/api/contact/route');
    const request = makeRequest({
      name: 'Test User',
      email: 'invalid-email',
      subject: 'Test Subject',
      message: 'Test Message',
      type: 'general',
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Invalid form data');
    expect(payload.details).toHaveProperty('email');
    expect(payload.details.email[0]).toContain('Please enter a valid email address');
  });

  it('should return 400 for missing required fields', async () => {
    const { POST } = await import('../../../../app/api/contact/route');
    const request = makeRequest({
      name: 'Test User',
      email: 'user@example.com',
      // Missing subject and message
      type: 'general',
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Invalid form data');
    expect(payload.details.subject).toContain('Subject must be at least 5 characters');
    expect(payload.details.message).toContain('Message must be at least 10 characters');
  });

  it('should return 400 for fields that are too short or too long', async () => {
    const { POST } = await import('../../../../app/api/contact/route');
    const request = makeRequest({
      name: 'A', // Too short
      email: 'user@example.com',
      subject: 'Sub', // Too short
      message: 'Msg', // Too short
      type: 'general',
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Invalid form data');
    expect(payload.details.name).toContain('Name must be at least 2 characters');
    expect(payload.details.subject).toContain('Subject must be at least 5 characters');
    expect(payload.details.message).toContain('Message must be at least 10 characters');

    const longString = 'a'.repeat(201); // Too long for subject
    const requestLong = makeRequest({
      name: 'Test User',
      email: 'user@example.com',
      subject: longString,
      message: 'This is a valid message length.',
      type: 'general',
    });
    const responseLong = await POST(requestLong as any);
    expect(responseLong.status).toBe(400);
    const payloadLong = await responseLong.json();
    expect(payloadLong.error).toContain('Subject too long');
  });

  it('should mark submission as spam if spam keywords are present', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';
    process.env.GMAIL_USER = 'mailer@example.com';
    process.env.GMAIL_APP_PASSWORD = 'app-pass';

    const { POST } = await import('../../../../app/api/contact/route');

    const request = makeRequest({
      name: 'Spam User',
      email: 'spam@example.com',
      subject: 'Buy Viagra Now',
      message: 'This is a message with viagra keyword.',
      type: 'general',
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.messageId).toBe('spam-filtered');
    expect(savedDocs).toHaveLength(1);
    expect(savedDocs[0].status).toBe('spam');
    expect(sendMailMock).not.toHaveBeenCalled(); // No email should be sent for spam
    expect(transportSendMailMock).not.toHaveBeenCalled();
  });

  it('should not mark legitimate submission as spam', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';
    process.env.GMAIL_USER = 'mailer@example.com';
    process.env.GMAIL_APP_PASSWORD = 'app-pass';

    const { POST } = await import('../../../../app/api/contact/route');

    const request = makeRequest({
      name: 'Legit User',
      email: 'legit@example.com',
      subject: 'Legit Inquiry',
      message: 'This is a legitimate message without spam keywords.',
      type: 'general',
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.messageId).not.toBe('spam-filtered');
    expect(savedDocs).toHaveLength(1);
    expect(savedDocs[0].status).toBe('unread');
    expect(transportSendMailMock).toHaveBeenCalled(); // Email should be sent via Nodemailer fallback
  });

  it('should handle Resend email sending failure gracefully', async () => {
    process.env.RESEND_API_KEY = 'test_resend_key';
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';

    sendMailMock.mockImplementation(async (opts) => {
      if (opts.to === 'team@example.com') return Promise.reject(new Error('Resend admin error'));
      if (opts.to === 'user@example.com') return Promise.reject(new Error('Resend auto-reply error'));
      return Promise.reject(new Error('Unknown Resend error'));
    });

    const { POST } = await import('../../../../app/api/contact/route');

    const request = makeRequest({
      name: 'Test User',
      email: 'user@example.com',
      subject: 'Test Subject',
      message: 'Test Message',
      type: 'general',
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Failed to send message. Please try again later.');
    expect(sendMailMock).toHaveBeenCalledTimes(2); // Admin and auto-reply attempts
  });

  it('should handle Nodemailer email sending failure gracefully', async () => {
    process.env.CONTACT_EMAIL = 'team@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/placeholder';
    process.env.GMAIL_USER = 'mailer@example.com';
    process.env.GMAIL_APP_PASSWORD = 'app-pass';

    transportSendMailMock.mockImplementationOnce(() => {
      throw new Error('SMTP error');
    });

    const { POST } = await import('../../../../app/api/contact/route');

    const request = makeRequest({
      name: 'Test User',
      email: 'user@example.com',
      subject: 'Test Subject',
      message: 'Test Message',
      type: 'general',
    });

    const response = await POST(request as any);
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Email service temporarily unavailable. Please try again later.');
  });

  it('should handle database connection failure gracefully', async () => {
    const dbConnect = (await import('@/lib/dbConnect')).default as jest.Mock;
    dbConnect.mockRejectedValueOnce(new Error('DB Connection Failed'));
 
     const { POST } = await import('../../../../app/api/contact/route');
 
     const request = makeRequest({
       name: 'Test User',
       email: 'user@example.com',
       subject: 'Test Subject',
       message: 'Test Message',
       type: 'general',
     });
 
     const response = await POST(request as any);
     expect(response.status).toBe(500);
     const payload = await response.json();
     expect(payload.success).toBe(false);
     expect(payload.error).toBe('Failed to send message. Please try again later.');
   });

  it('should handle database save failure gracefully', async () => {
    jest.mock('@/models/ContactSubmission', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        save: jest.fn(async () => { throw new Error('DB Save Failed'); }),
      })),
    }));

    const { POST } = await import('../../../../app/api/contact/route');

    const request = makeRequest({
      name: 'Test User',
      email: 'user@example.com',
      subject: 'Test Subject',
      message: 'Test Message',
      type: 'general',
    });

    const response = await POST(request as any);
    const payload = await response.json(); // Moved inside
    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('Failed to send message. Please try again later.');
  });

})