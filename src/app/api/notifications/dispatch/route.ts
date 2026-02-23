import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { NotificationTypeSchema, type NotificationType } from '@/lib/schemas/notification'

const DispatchRequestSchema = z.object({
  type: NotificationTypeSchema,
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  context: z.record(z.string(), z.string()),
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeContext(context: Record<string, string>, key: string): string {
  return escapeHtml(context[key] ?? '')
}

function buildEmailHtml(type: NotificationType, context: Record<string, string>): string {
  let content: string

  switch (type) {
    case 'study_reminder':
      content = `📚 Study Session Reminder: ${safeContext(context, 'title')} starts at ${safeContext(context, 'startTime')}`
      break
    case 'task_deadline':
      content = `✅ Task Deadline: ${safeContext(context, 'taskTitle')} is due ${safeContext(context, 'dueDate')}`
      break
    case 'streak_alert':
      content = `🔥 Streak Alert: Don't lose your ${safeContext(context, 'currentStreak')}-day streak!`
      break
    case 'weekly_digest':
      content = `📊 Weekly Progress: ${safeContext(context, 'studyMinutes')} minutes studied this week`
      break
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">DeepTerm</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#18181b;">${content}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;">
              <p style="margin:0;">You received this email from DeepTerm. If you no longer wish to receive these notifications, you can update your notification preferences in your account settings.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = DispatchRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { type, recipientEmail, subject, scheduledAt, context } = parsed.data

    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = buildEmailHtml(type, context)

    const { data, error } = await resend.emails.send({
      from: 'DeepTerm <notifications@deepterm.io>',
      to: [recipientEmail],
      subject,
      html,
      ...(scheduledAt ? { scheduledAt } : {}),
    })

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, emailId: data?.id })
  } catch (error) {
    console.error('Notification dispatch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
