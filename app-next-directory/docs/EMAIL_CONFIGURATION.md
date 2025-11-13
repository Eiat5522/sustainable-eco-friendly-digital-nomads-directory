# Email Configuration Guide

This guide explains how to configure email services for the contact form and notification system.

## Overview

The application supports three email service options:
1. **Resend** (Recommended for production)
2. **SMTP** (Generic SMTP server)
3. **Gmail** (For development only)

## Configuration Options

### Option 1: Resend (Recommended)

Resend is the recommended email service for production environments due to its reliability and ease of use.

1. Sign up for a [Resend account](https://resend.com)
2. Obtain your API key from the dashboard
3. Add to your `.env.local` or `.env.production`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com
CONTACT_EMAIL=admin@yourdomain.com
```

**Notes:**
- `RESEND_FROM` must be a verified domain in your Resend account
- `CONTACT_EMAIL` is where contact form submissions will be sent

### Option 2: SMTP Server

For organizations with existing SMTP infrastructure:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
CONTACT_EMAIL=admin@yourdomain.com
```

**Common SMTP Providers:**
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Amazon SES**: `email-smtp.us-east-1.amazonaws.com:587`

### Option 3: Gmail (Development Only)

For local development and testing:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
CONTACT_EMAIL=admin@yourdomain.com
```

**Setting up Gmail App Password:**
1. Enable 2-factor authentication on your Google account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Under "Signing in to Google", select "App passwords"
4. Generate a new app password for "Mail"
5. Use the generated 16-character password as `GMAIL_APP_PASSWORD`

⚠️ **Warning**: Gmail has sending limits and is not suitable for production use.

## Fallback Behavior

The email system follows this priority order:

1. If `RESEND_API_KEY` is set → Use Resend
2. Else if SMTP credentials are set → Use SMTP
3. Else if Gmail credentials are set → Use Gmail
4. Else → Save contact submission without sending emails

When email is not configured, the system will:
- ✅ Save the contact submission to the database
- ⚠️ Log a warning to the console
- ℹ️ Inform the user that their message was received but email notifications are unavailable

## Testing Email Configuration

### Test with curl:

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "This is a test message to verify email configuration.",
    "type": "general"
  }'
```

### Check the response:

```json
{
  "success": true,
  "message": "Your message has been sent successfully! You should receive a confirmation email shortly.",
  "data": {
    "submissionId": "...",
    "emailSent": true,
    "type": "general"
  }
}
```

- If `emailSent: true` → Email was sent successfully
- If `emailSent: false` → Message saved but email not configured

## Troubleshooting

### Email not sending

1. **Check environment variables**: Ensure your `.env.local` file exists and contains the correct values
2. **Verify API keys**: Test your Resend API key or SMTP credentials independently
3. **Check logs**: Look for warnings in the console output
4. **Test email**: Try sending a test email using your provider's test tools

### Common errors

#### "SMTP timeout occurred"
- Check your SMTP host and port
- Verify firewall settings allow outbound SMTP connections
- Ensure SMTP credentials are correct

#### "Authentication credentials invalid"
- For Gmail: Ensure you're using an app password, not your regular password
- For SMTP: Verify username and password are correct
- Check if 2FA is enabled (some providers require app passwords)

#### "Email service temporarily unavailable"
- Check if your email service is experiencing downtime
- Verify your API rate limits haven't been exceeded
- Check your account status with your email provider

### Production Checklist

Before deploying to production:

- [ ] Email service is configured (Resend or SMTP)
- [ ] `CONTACT_EMAIL` is set to a monitored inbox
- [ ] `RESEND_FROM` or `SMTP_FROM` is set to a verified domain
- [ ] Test the contact form submission
- [ ] Verify both admin notification and user auto-reply emails are received
- [ ] Check spam folders if emails aren't arriving

## Related Files

- Contact form UI: `app/contact-us/page.tsx`
- Contact API route: `app/api/contact/route.ts`
- Email service: `src/lib/email.ts`
- Environment template: `.env.sample`

## Support

If you encounter issues with email configuration:

1. Check the console logs for detailed error messages
2. Review the [Resend documentation](https://resend.com/docs)
3. Consult your SMTP provider's documentation
4. Open an issue in the repository with error logs
