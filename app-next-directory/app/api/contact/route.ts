import { ApiResponseHandler } from '@/utils/api-response';
import { rateLimit } from '@/utils/rate-limit';
import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import type { SentMessageInfo, Transporter } from 'nodemailer';
import { z } from 'zod';
import { sendMail } from '@/lib/email';
import ContactSubmission from '@/models/ContactSubmission';
import dbConnect from '@/lib/dbConnect';

const CONTACT_RECIPIENT = String(
  process.env.CONTACT_EMAIL ??
  process.env.contactEmail ??
  process.env.SMTP_USER ??
  process.env.smtpUser ??
  process.env.gmailUser ??
  ''
);

const MAIL_FROM =
  process.env.SMTP_FROM ??
  process.env.smtpFrom ??
  process.env.SMTP_USER ??
  process.env.smtpUser ??
  process.env.gmailUser ??
  undefined;

const GMAIL_USER = process.env.GMAIL_USER ?? process.env.gmailUser;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ?? process.env.gmailAppPassword;

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
const createTransporter = (): Transporter<SentMessageInfo> | null => {
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
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD, // Use app password for Gmail
      },
    });
  }
  // No email configuration available
  return null;
};

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
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
        validationResult.error.formErrors.fieldErrors
      );
    }

    const { name, email, subject, message, type, listingSlug } = validationResult.data;

    // Basic spam detection
    const spamKeywords = ['casino', 'viagra', 'loan', 'investment', 'crypto', 'bitcoin'];
    const messageText = `${subject} ${message}`.toLowerCase();
    const hasSpam = spamKeywords.some(keyword => messageText.includes(keyword));

    const submission = new ContactSubmission({
      name,
      email,
      subject,
      message,
      type,
      listingSlug,
      ipAddress: ip,
      status: hasSpam ? 'spam' : 'unread',
    });
    await submission.save();

    if (hasSpam) {
      // Log potential spam but don't notify the user
      console.warn('Potential spam detected and saved to database:', { email, subject, ip });
      return ApiResponseHandler.success(
        { messageId: 'spam-filtered', submissionId: submission._id },
        'Your message has been sent successfully!'
      );
    }

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

    let messageInfo: { adminId?: string; autoReplyId?: string } = {};
    let emailSent = false;
    
    if (process.env.RESEND_API_KEY) {
      // Prefer Resend when configured
      const adminRecipient = CONTACT_RECIPIENT;
      const resendJobs = [];
      
      if (adminRecipient) {
        resendJobs.push(
          sendMail({
            to: adminRecipient,
            subject: emailSubject,
            html: emailBody,
          }).then((result) => ({ type: 'admin', result }))
        );
      } else {
        console.warn('No CONTACT_EMAIL configured; skipping admin notification email');
      }
      
      resendJobs.push(
        sendMail({
          to: email,
          subject: autoReplySubject,
          html: autoReplyBody,
        }).then((result) => ({ type: 'autoReply', result }))
      );
      
      const results = await Promise.all(resendJobs);
      
      // Check if emails were actually sent or skipped
      const adminResult = results.find(r => r.type === 'admin');
      
      if (adminResult?.result && 'skipped' in adminResult.result) {
        console.warn('Email sending skipped - RESEND_API_KEY not properly configured');
      } else {
        emailSent = true;
        messageInfo = { 
          adminId: adminRecipient ? 'resend' : undefined, 
          autoReplyId: 'resend' 
        };
      }
    } else {
      // Fallback to nodemailer
      const transporter = createTransporter();
      
      if (!transporter) {
        console.warn('No email service configured. Contact submission saved but emails not sent.');
        console.warn('Please configure either RESEND_API_KEY or SMTP/Gmail credentials.');
        // Continue without sending email - this is not a failure if email wasn't configured
      } else {
        const adminRecipient = CONTACT_RECIPIENT;
        const fromAddress = MAIL_FROM ?? GMAIL_USER ?? undefined;
        
        if (!fromAddress) {
          console.warn('No from address configured for email. Please set SMTP_FROM, RESEND_FROM, or GMAIL_USER.');
          // Continue without sending email
        } else {
          // Email is configured - any errors here should fail the request
          let adminResult: SentMessageInfo | undefined;
          
          if (adminRecipient) {
            adminResult = await transporter.sendMail({
              from: fromAddress,
              to: adminRecipient,
              subject: emailSubject,
              html: emailBody,
              replyTo: email,
            });
          } else {
            console.warn('No CONTACT_EMAIL configured; skipping admin notification email');
          }
          
          const autoReplyResult = await transporter.sendMail({
            from: fromAddress,
            to: email,
            subject: autoReplySubject,
            html: autoReplyBody,
          });
          
          emailSent = true;
          messageInfo = {
            adminId: typeof adminResult?.messageId === 'string' ? adminResult.messageId : undefined,
            autoReplyId: typeof autoReplyResult?.messageId === 'string' ? autoReplyResult.messageId : undefined,
          };
        }
      }
    }

    // Log successful submission
    console.log('Contact form submission processed and saved:', {
      submissionId: submission._id,
      messageId: messageInfo.adminId,
      autoReplyId: messageInfo.autoReplyId,
      emailSent,
      type,
      from: email,
      ip,
    });

    const successMessage = emailSent 
      ? 'Your message has been sent successfully! You should receive a confirmation email shortly.'
      : 'Your message has been received and saved. However, email notifications are currently unavailable. We will respond to your inquiry as soon as possible.';

    return ApiResponseHandler.success(
      {
        messageId: messageInfo.adminId ?? null,
        submissionId: submission._id,
        type,
        timestamp: new Date().toISOString(),
        emailSent
      },
      successMessage
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
  } catch (_error) {
    return ApiResponseHandler.error('Failed to fetch contact form configuration');
  }
}
