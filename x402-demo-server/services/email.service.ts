import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Reusable Email Service
 * Configured with Nodemailer + Gmail SMTP using environment variables.
 * Designed to be easily extended for future admin template editing,
 * enable/disable toggles, test emails, and delivery tracking.
 */
class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (!smtpUser || !smtpPass) {
      console.warn("[EmailService] SMTP_USER or SMTP_PASS not set in environment variables. Email sending will be logged in console mode.");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || "noreply@sikho.ai";
      const fromName = process.env.SMTP_FROM_NAME || "Sikho AI";

      if (!this.transporter) {
        // Re-attempt initialization in case env vars were updated dynamically
        this.initTransporter();
      }

      if (!this.transporter) {
        console.log(`[EmailService - Console Mode] Email to: ${options.to} | Subject: ${options.subject}`);
        return false;
      }

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`[EmailService] Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error(`[EmailService] Failed to send email to ${options.to}:`, error?.message || error);
      return false;
    }
  }

  /**
   * Generates the HTML template for Welcome Emails
   */
  public generateWelcomeEmailTemplate(name: string): { subject: string; html: string; text: string } {
    const subject = "Welcome to Sikho AI 🚀";

    const text = `Hi ${name},

Welcome to Sikho AI! 🎉

Your journey to learn smarter, build skills, and get career-ready starts here.

Explore what’s waiting for you:

• AI Learning Paths — Learn skills through personalized lessons.
• Pay Per Chapter — Learn what you need, pay only for that chapter.
• Resume Intelligence — Discover your strengths and improve your resume.
• Interview Preparation — Practice for the roles you want.
• Job Readiness Spark — Find the gap between your resume and your dream job.
• Hackathon Agent — Discover live hackathon opportunities and updates.

Your next opportunity starts with one step.

Happy Learning! 🌱

Team Sikho AI`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Sikho AI</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; text-decoration: none; }
    .welcome-title { font-size: 22px; color: #111827; margin-top: 0; }
    .feature-list { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #f3f4f6; }
    .feature-item { margin-bottom: 14px; font-size: 15px; }
    .feature-item:last-child { margin-bottom: 0; }
    .cta-container { text-align: center; margin: 32px 0 24px 0; }
    .footer { text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">Sikho AI</span>
    </div>
    
    <p>Hi <strong>${name}</strong>,</p>

    <h2 class="welcome-title">Welcome to Sikho AI! 🎉</h2>

    <p>Your journey to <strong>learn smarter, build skills, and get career-ready</strong> starts here.</p>

    <div class="feature-list">
      <p style="margin-top:0; font-weight:bold; color: #374151;">✨ Explore what’s waiting for you:</p>
      
      <div class="feature-item">📚 <strong>AI Learning Paths</strong> — Learn skills through personalized lessons.</div>
      <div class="feature-item">💳 <strong>Pay Per Chapter</strong> — Learn what you need, pay only for that chapter.</div>
      <div class="feature-item">📄 <strong>Resume Intelligence</strong> — Discover your strengths and improve your resume.</div>
      <div class="feature-item">🎯 <strong>Interview Preparation</strong> — Practice for the roles you want.</div>
      <div class="feature-item">🚀 <strong>Job Readiness Spark</strong> — Find the gap between your resume and your dream job.</div>
      <div class="feature-item">🏆 <strong>Hackathon Agent</strong> — Discover live hackathon opportunities and updates.</div>
    </div>

    <p><strong>Your next opportunity starts with one step.</strong></p>

    <p>Happy Learning! 🌱</p>

    <p><strong>Team Sikho AI</strong></p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Sikho AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return { subject, html, text };
  }

  /**
   * Helper to send Welcome Email to a newly registered user.
   * Runs asynchronously and catches all errors to prevent blocking registration.
   */
  public async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    const { subject, html, text } = this.generateWelcomeEmailTemplate(fullName || "Learner");
    return await this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
