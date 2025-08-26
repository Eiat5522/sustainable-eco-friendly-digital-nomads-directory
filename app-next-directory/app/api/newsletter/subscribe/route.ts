import { NextResponse } from 'next/server'
import { z } from 'zod'

const newsletterSubscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validationResult = newsletterSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid email address.',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // Here you would typically add the email to your mailing list
    // (e.g., Mailchimp, SendGrid, or your own database).
    // For this example, we'll just log it to the console.
    console.log('New newsletter subscription:', email)

    return NextResponse.json(
      { message: 'Thank you for subscribing to our newsletter!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}
