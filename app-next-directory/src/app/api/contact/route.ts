import { ApiResponseHandler } from '@/utils/api-response';
import { rateLimit } from '@/utils/rate-limit';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  type: z.enum(['general', 'listing', 'partnership', 'support', 'feedback']).optional().default('general'),
  listingSlug: z.string().optional(), // For listing-specific inquiries
});

// Rate limiting configuration
const limiter = rateLimit({
  max: 5, // Maximum 5 requests per window
  windowMs: 60 * 1000, // 1 minute window
});

// Email configuration
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Fallback to Gmail SMTP for development
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use app password for Gmail
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await limiter(request);
    if (!rateLimitResult.success) {
      return ApiResponseHandler.error('Too many requests. Please try again later.', 429);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseHandler.error(
        'Invalid form data',
        400,
        validationResult.error.errors
      );
    }

    const { name, email, subject, message, type, listingSlug } = validationResult.data;

    // Basic spam detection
    const spamKeywords = ['casino', 'viagra', 'loan', 'investment', 'crypto', 'bitcoin'];
    const messageText = `${subject} ${message}`.toLowerCase();
    const hasSpam = spamKeywords.some(keyword => messageText.includes(keyword));

    if (hasSpam) {
      // Log potential spam but don't notify the user
      console.warn('Potential spam detected:', { email, subject, ip });
      return ApiResponseHandler.success(
        { messageId: 'spam-filtered' },
        'Thank you for your message. We will get back to you soon.'
      );
    }

    // Create email transporter
    const transporter = createTransporter();

    // Email content
    const emailSubject = `[Sustainable Nomads] ${type.charAt(0).toUpperCase() + type.slice(1)} Inquiry: ${subject}`;
    const emailBody = `
      <h2>New Contact Form Submission</h2>

      <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      ${listingSlug ? `<p><strong>Related Listing:</strong> ${listingSlug}</p>` : ''}

      <h3>Message:</h3>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>

      <hr>
      <p style="color: #666; font-size: 12px;">
        This message was sent from the Sustainable Digital Nomads Directory contact form.<br>
        IP Address: ${ip}<br>
        Timestamp: ${new Date().toISOString()}
      </p>
    `;

    // Auto-reply content
    const autoReplySubject = `Thank you for contacting Sustainable Digital Nomads Directory`;
    const autoReplyBody = `
      <h2>Thank you for your message!</h2>

      <p>Hi ${name},</p>

      <p>Thank you for reaching out to the Sustainable Digital Nomads Directory. We have received your ${type} inquiry regarding "${subject}" and will get back to you within 24-48 hours.</p>

      <p>Here's a copy of your message:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>

      <p>In the meantime, feel free to explore our directory of eco-friendly spaces and sustainable travel resources.</p>

      <p>Best regards,<br>
      The Sustainable Digital Nomads Team</p>

      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated response. Please do not reply to this email directly.
      </p>
    `;

    // Send emails
    const [adminEmail, autoReply] = await Promise.all([
      // Email to admin/support team
      transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.GMAIL_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER,
        subject: emailSubject,
        html: emailBody,
        replyTo: email,
      }),

      // Auto-reply to user
      transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.GMAIL_USER,
        to: email,
        subject: autoReplySubject,
        html: autoReplyBody,
      }),
    ]);

    // Log successful submission
    console.log('Contact form submission processed:', {
      messageId: adminEmail.messageId,
      autoReplyId: autoReply.messageId,
      type,
      from: email,
      ip,
    });

    return ApiResponseHandler.success(
      {
        messageId: adminEmail.messageId,
        type,
        timestamp: new Date().toISOString()
      },
      'Thank you for your message. We will get back to you soon!'
    );

  } catch (error) {
    console.error('Contact form error:', error);

    // Handle specific nodemailer errors
    if (error instanceof Error) {
      if (error.message.includes('SMTP')) {
        return ApiResponseHandler.error('Email service temporarily unavailable. Please try again later.', 503);
      }
      if (error.message.includes('Authentication')) {
        return ApiResponseHandler.error('Email configuration error. Please contact support.', 500);
      }
    }

    return ApiResponseHandler.error('Failed to send message. Please try again later.', 500);
  }
}

// GET endpoint for retrieving contact form configuration
export async function GET() {
  try {
    const config = {
      types: [
        { value: 'general', label: 'General Inquiry' },
        { value: 'listing', label: 'About a Listing' },
        { value: 'partnership', label: 'Partnership Opportunity' },
        { value: 'support', label: 'Technical Support' },
        { value: 'feedback', label: 'Feedback' },
      ],
      limits: {
        nameMax: 100,
        subjectMax: 200,
        messageMax: 2000,
        rateLimit: '5 requests per minute',
      },
    };

    return ApiResponseHandler.success(config);
  } catch (error) {
    return ApiResponseHandler.error('Failed to fetch contact form configuration');
  }
}
