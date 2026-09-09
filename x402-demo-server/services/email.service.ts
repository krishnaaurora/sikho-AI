import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create Nodemailer Transporter using Gmail SMTP credentials from backend env
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";

  const secureEnv = process.env.SMTP_SECURE;
  const isSecure = secureEnv !== undefined ? secureEnv === "true" : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: user && pass ? { user, pass } : undefined,
  });
};

/**
 * Generic email sending function. Reusable for future admin functionality (templates, test emails, etc.)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
    
    if (!user || !pass) {
      console.warn("⚠️ SMTP Credentials missing (GMAIL_USER / GMAIL_APP_PASSWORD or SMTP_USER / SMTP_PASS). Skipping email dispatch.");
      return false;
    }

    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || `"Sikho AI" <${user}>`;

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✉️ Email sent successfully to ${options.to}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    return false;
  }
};

/**
 * Send Welcome Email to newly registered user.
 */
export const sendWelcomeEmail = async (userEmail: string, userName: string): Promise<boolean> => {
  const subject = "Welcome to Sikho AI 🚀";
  const name = userName || "Learner";

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Hi ${name},</h2>
      <p style="font-size: 16px; line-height: 1.6; font-weight: 600; color: #2563eb;">Welcome to Sikho AI! 🎉</p>
      <p style="font-size: 15px; line-height: 1.6;">Your journey to <strong>learn smarter, build skills, and get career-ready</strong> starts here.</p>
      
      <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
        <p style="font-weight: 600; font-size: 15px; margin-top: 0; margin-bottom: 12px; color: #0f172a;">✨ Explore what’s waiting for you:</p>
        <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.8;">
          <li>📚 <strong>AI Learning Paths</strong> — Learn skills through personalized lessons.</li>
          <li>💳 <strong>Pay Per Chapter</strong> — Learn what you need, pay only for that chapter.</li>
          <li>📄 <strong>Resume Intelligence</strong> — Discover your strengths and improve your resume.</li>
          <li>🎯 <strong>Interview Preparation</strong> — Practice for the roles you want.</li>
          <li>🚀 <strong>Job Readiness Spark</strong> — Find the gap between your resume and your dream job.</li>
          <li>🏆 <strong>Hackathon Agent</strong> — Discover live hackathon opportunities and updates.</li>
        </ul>
      </div>

      <p style="font-size: 15px; font-weight: 600; color: #0f172a;">Your next opportunity starts with one step.</p>
      <p style="font-size: 15px; color: #16a34a; font-weight: 600;">Happy Learning! 🌱</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 14px; font-weight: bold; color: #475569; margin: 0;">Team Sikho AI</p>
    </div>
  `;

  const text = `Hi ${name},

Welcome to Sikho AI! 🎉

Your journey to learn smarter, build skills, and get career-ready starts here.

✨ Explore what’s waiting for you:

📚 AI Learning Paths — Learn skills through personalized lessons.
💳 Pay Per Chapter — Learn what you need, pay only for that chapter.
📄 Resume Intelligence — Discover your strengths and improve your resume.
🎯 Interview Preparation — Practice for the roles you want.
🚀 Job Readiness Spark — Find the gap between your resume and your dream job.
🏆 Hackathon Agent — Discover live hackathon opportunities and updates.

Your next opportunity starts with one step.

Happy Learning! 🌱

Team Sikho AI`;

  return await sendEmail({
    to: userEmail,
    subject,
    text,
    html,
  });
};
