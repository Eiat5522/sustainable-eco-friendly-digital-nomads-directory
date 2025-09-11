import { Resend } from 'resend';
import { getBaseUrl } from '@/lib/absolute-url';

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@example.com';

// Basic email validation for configuration safety (allow "Name <email@domain>" too)
const fromAddressForValidation =
  fromAddress.includes('<') && fromAddress.includes('>')
    ? fromAddress.slice(fromAddress.indexOf('<') + 1, fromAddress.indexOf('>')).trim()
    : fromAddress;
const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
if (!emailRegex.test(fromAddressForValidation)) {
  throw new Error(`Invalid from email address: ${fromAddress}`);
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!resendApiKey) {
    console.warn('[email] RESEND_API_KEY not set; skipping send');
    return { skipped: true } as const;
  }
  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromAddress,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { sent: true } as const;
  } catch (error) {
    console.error('[email] Failed to send email:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' } as const;
  }
}

export async function buildVerifyEmail(to: string, token: string) {
  const base = await getBaseUrl();
  const url = new URL('/api/auth/verify', base);
  url.searchParams.set('token', token);
  const link = url.toString();
  const subject = 'Verify your email address';
  const text = `Verify your email\n\nClick the link below to verify your email address:\n${link}\n\nIf you did not sign up, you can ignore this message.`;
  const html = `
    <div>
      <h2>Verify your email</h2>
      <p>Click the link below to verify your email address.</p>
      <p><a href="${encodeURI(link)}" target="_blank" rel="noopener noreferrer">Verify email</a></p>
      <p>If you did not sign up, you can ignore this message.</p>
    </div>
  `;
  return { to, subject, html, text, link };
}

export async function buildResetEmail(to: string, token: string) {
  const base = await getBaseUrl();
  const url = new URL('/auth/reset', base);
  url.searchParams.set('token', token);
  const link = url.toString();
  const subject = 'Reset your password';
  const text = `Password reset\n\nClick the link below to set a new password:\n${link}\n\nIf you did not request this, you can ignore this message.`;
  const html = `
    <div>
      <h2>Password reset</h2>
      <p>Click the link below to set a new password.</p>
      <p><a href="${encodeURI(link)}" target="_blank" rel="noopener noreferrer">Reset password</a></p>
      <p>If you did not request this, you can ignore this message.</p>
    </div>
  `;
  return { to, subject, html, text, link };
}

export async function buildNewsletterConfirmEmail(to: string, token: string) {
  const base = await getBaseUrl();
  const url = new URL('/api/newsletter/confirm', base);
  url.searchParams.set('token', token);
  const link = url.toString();
  const subject = 'Confirm your newsletter subscription';
  const html = `
    <div>
      <h2>Confirm your subscription</h2>
      <p>Click the link below to confirm your subscription to our newsletter.</p>
      <p><a href="${encodeURI(link)}" target="_blank" rel="noopener noreferrer">Confirm subscription</a></p>
      <p>If you did not request this, you can ignore this message.</p>
    </div>
  `;
  return { to, subject, html, link };
}

