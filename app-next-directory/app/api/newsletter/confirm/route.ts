import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { verifyNewsletterConfirmToken } from '@/lib/newsletterTokens'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/newsletter/confirmed?status=missing', url.origin))
    }
    const { email } = await verifyNewsletterConfirmToken(token)
    if (!process.env.MONGODB_URI) {
      const status = process.env.NODE_ENV === 'production' ? 'server' : 'success'
      return NextResponse.redirect(new URL(`/newsletter/confirmed?status=${status}`, url.origin))
    }
    await dbConnect()
    const normalizedEmail = email.trim().toLowerCase()
    await NewsletterSubscriber.updateOne(
      { email: normalizedEmail },
      { $set: { email: normalizedEmail, confirmedAt: new Date() } },
      { upsert: true }
    )
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=success', url.origin))
  } catch (_error) {
    try {
      const url = new URL(request.url)
      return NextResponse.redirect(new URL('/newsletter/confirmed?status=invalid', url.origin))
    } catch {
      return NextResponse.redirect('/newsletter/confirmed?status=invalid')
    }
  }
}
