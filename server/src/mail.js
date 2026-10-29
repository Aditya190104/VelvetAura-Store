import nodemailer from 'nodemailer';
export function createMailer(c) {
  const transport = c.mailEnabled ? nodemailer.createTransport({ host: c.SMTP_HOST, port: c.SMTP_PORT, secure: c.SMTP_SECURE === 'true', requireTLS: c.SMTP_SECURE !== 'true', auth: { user: c.SMTP_USER, pass: c.SMTP_PASS }, connectionTimeout: 10000, socketTimeout: 15000 }) : null;
  return { enabled: Boolean(transport), async send(to, kind, value) {
    if (!transport) throw new Error('Email delivery is not configured.');
    const url = `${c.APP_ORIGIN}/${kind === 'reset' ? 'reset-password' : 'verify-email'}#token=${value}`;
    await transport.sendMail({ from: c.MAIL_FROM, to, subject: kind === 'reset' ? 'Reset your VelvetAura password' : 'Verify your VelvetAura email', text: `Use this single-use link:\n\n${url}\n\nIt expires ${kind === 'reset' ? 'in 30 minutes' : 'in 24 hours'}. If you did not request this, ignore this email.` });
  } };
}
