import nodemailer from "nodemailer";

/** שולח אימייל. בלי SMTP_URL מוגדר, ההודעה נרשמת ללוג בלבד. אף פעם לא זורק שגיאה. */
export async function sendMail(opts: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!opts.to) return false;
  const url = process.env.SMTP_URL;
  if (!url) {
    console.log(`[mail not configured] to=${opts.to} subject=${opts.subject}`);
    return false;
  }
  try {
    await nodemailer.createTransport(url).sendMail({ from: process.env.MAIL_FROM || "no-reply@localhost", ...opts });
    return true;
  } catch (e) {
    console.error("[mail failed]", e);
    return false;
  }
}

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
