```typescript
// Supabase Edge Function - send-email
// Sends emails via Gmail SMTP
// Required env vars:
// - GMAIL_SMTP_USER: Gmail email address
// - GMAIL_SMTP_PASSWORD: Gmail app-specific password (not regular password)
// - GMAIL_SMTP_HOST: Optional, defaults to smtp.gmail.com
// - GMAIL_SMTP_PORT: Optional, defaults to 587

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// SMTPClient from deno smtp library
// @ts-ignore
import { SmtpClient } from "https://deno.land/x/smtp@0.16.0/mod.ts"
// @ts-ignore
import { authenticateRequest } from '../_shared/auth.ts'
// @ts-ignore
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

interface EmailRequest {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const normalizeEmails = (emails: string | string[]) => {
  return Array.isArray(emails) ? emails : [emails]
}

const createSmtpClient = () => {
  return new SmtpClient()
}

const connectToSmtpServer = async (client: SmtpClient, host: string, port: number, username: string, password: string) => {
  try {
    await client.connectTLS({
      hostname: host,
      port: port,
      username: username,
      password: password,
    })
  } catch (error) {
    throw new Error(`Failed to connect to SMTP server: ${error.message}`)
  }
}

const sendEmail = async (client: SmtpClient, from: string, to: string[], cc: string[] | undefined, bcc: string[] | undefined, subject: string, text: string, html: string | undefined) => {
  try {
    await client.send({
      from: from,
      to: to,
      cc: cc?.length > 0 ? cc : undefined,
      bcc: bcc?.length > 0 ? bcc : undefined,
      subject: subject,
      content: text,
      html: html,
    })
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

const closeSmtpConnection = async (client: SmtpClient) => {
  try {
    await client.close()
  } catch (error) {
    throw new Error(`Failed to close SMTP connection: ${error.message}`)
  }
}

serve(async (req: any) => {
  // Handle CORS preflight
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    // 1. AUTHENTICATION CHECK
    const { user, error: authError, status: authStatus } = await authenticateRequest(req)
    if (authError) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: authError }), { status: authStatus, headers: corsHeaders })
    }

    // Optional: Log who is sending the email
    console.log(`[send-email] User ${user.email} (${user.id}) is sending an email`)

    // 2. PROCEED TO SMTP LOGIC
    // @ts-ignore
    const env = (globalThis as any).Deno?.env?.toObject() || {}
    const SMTP_USER = env?.SMTP_USER || env?.GMAIL_SMTP_USER
    const SMTP_PASSWORD = env?.SMTP_PASSWORD || env?.GMAIL_SMTP_PASSWORD
    const SMTP_HOST = env?.SMTP_HOST || env?.GMAIL_SMTP_HOST || "smtp.gmail.com"
    const SMTP_PORT = Number(env?.SMTP_PORT || env?.GMAIL_SMTP_PORT || 587)
    const SMTP_FROM = env?.SMTP_FROM || SMTP_USER

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error("SMTP credentials not configured")
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          message: "SMTP_USER and SMTP_PASSWORD environment variables are required",
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    const body: EmailRequest = await req.json()
    const { to, cc, bcc, subject, html, text, from } = body

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          message: "to, subject, and html/text are required",
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Normalize email arrays
    const recipients = normalizeEmails(to)
    const ccList = cc ? normalizeEmails(cc) : []
    const bccList = bcc ? normalizeEmails(bcc) : []

    // Validate email format
    const allEmails = [...recipients, ...ccList, ...bccList]
    for (const email of allEmails) {
      if (!validateEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format", email }),
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Create SMTP client
    const client = createSmtpClient()

    try {
      // Connect to Gmail SMTP server
      await connectToSmtpServer(client, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD)

      // Send email
      await sendEmail(client, from || SMTP_FROM, recipients, ccList.length > 0 ? ccList : undefined, bccList.length > 0 ? bccList : undefined, subject, text || "", html)

      // Close connection
      await closeSmtpConnection(client)

      console.log(`Email sent successfully to ${recipients.join(", ")}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          recipients: recipients.length,
        }),
        { status: 200, headers: corsHeaders }
      )
    } catch (error) {
      console.error("SMTP error:", error)

      // If SMTP fails, try to provide helpful error message
      let errorMessage = "Failed to send email via SMTP"

      if (error instanceof Error) {
        if (error.message.includes("authentication failed")) {
          errorMessage = "SMTP authentication failed. Check credentials."
        } else if (error.message.includes("connection refused")) {
          errorMessage = "SMTP server connection failed"
        } else {
          errorMessage = error.message
        }
      }

      console.error("SMTP Error Message:", errorMessage)

      return new Response(
        JSON.stringify({
          error: "SMTP error",
          message: errorMessage,
        }),
        { status: 500, headers: corsHeaders }
      )
    }
  } catch (err) {
    console.error("send-email error:", err)

    const errorMessage = err instanceof Error ? err.message : String(err)

    return new Response(
      JSON.stringify({
        error: "Server error",
        message: errorMessage,
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
```