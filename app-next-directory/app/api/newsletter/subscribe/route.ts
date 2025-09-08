import { z } from 'zod'
import { ApiResponseHandler } from '@/utils/api-response'

const newsletterSubscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validationResult = newsletterSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return ApiResponseHandler.error('Invalid email address.', 400, validationResult.error.errors)
    }

    const { email } = validationResult.data

    // Here you would typically add the email to your mailing list
    // (e.g., Mailchimp, SendGrid, or your own database).
    // For this example, we'll just log it to the console.
    console.log('New newsletter subscription:', email)

    return ApiResponseHandler.success({ message: 'Thank you for subscribing to our newsletter!' })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return ApiResponseHandler.error('An internal server error occurred.', 500)
  }
}
