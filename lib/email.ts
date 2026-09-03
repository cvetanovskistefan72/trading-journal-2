import { Resend } from "resend";
import { routes } from "@/config/routes";

const apiKey = process.env.RESEND_API_KEY;
const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${siteUrl}${routes.setPassword}?token=${token}`;

  if (!resend) {
    // Dev fallback: no Resend key configured — log the link so you can still test.
    console.log(`\n[dev email] Password reset link for ${email}:\n${link}\n`);
    return;
  }

  await resend.emails.send({
    from: "Trading Journal <noreply@resend.dev>",
    to: email,
    subject: "Set your password",
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
        <h2>Hi 👋</h2>
        <p>Use the link below to set or reset the password on your Trading Journal account.</p>
        <a href="${link}"
           style="display:inline-block;padding:12px 18px;background:#059669;color:white;text-decoration:none;border-radius:6px;margin-top:10px;font-weight:500;">
          Set password
        </a>
        <p style="margin-top:20px;">This link expires shortly for security reasons.</p>
        <p style="margin-top:16px;font-size:12px;color:gray;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
