import nodemailer from 'nodemailer'

const port = parseInt(process.env.SMTP_PORT || '587')
const secure = process.env.SMTP_SECURE === 'true' || port === 465

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

const EMAIL_FROM = process.env.EMAIL_FROM || 'FantaF1 <noreply@fantaf1.com>'

interface SendInvitationEmailParams {
  to: string
  name: string
  token: string
}

export async function sendInvitationEmail({
  to,
  name,
  token
}: SendInvitationEmailParams): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/invitation?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invito FantaF1</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #333;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ef4444; margin: 0; font-size: 28px;">FantaF1</h1>
          </div>

          <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 20px;">
            Ciao${name ? ` ${name}` : ''}!
          </h2>

          <p style="color: #a0a0a0; line-height: 1.6; margin: 0 0 24px 0;">
            Sei stato invitato a partecipare a FantaF1! Clicca il pulsante qui sotto per completare la registrazione.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Completa la registrazione
            </a>
          </div>

          <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
          </p>
          <p style="color: #888888; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
            ${invitationUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #333; margin: 32px 0;">

          <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
            Questo invito scade tra 7 giorni.<br>
            Se non hai richiesto questo invito, puoi ignorare questa email.
          </p>
        </div>
      </body>
    </html>
  `

  const text = `
Ciao${name ? ` ${name}` : ''}!

Sei stato invitato a partecipare a FantaF1!

Completa la registrazione visitando questo link:
${invitationUrl}

Questo invito scade tra 7 giorni.
Se non hai richiesto questo invito, puoi ignorare questa email.
  `.trim()

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Invito a FantaF1',
    text,
    html
  })
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch {
    return false
  }
}
