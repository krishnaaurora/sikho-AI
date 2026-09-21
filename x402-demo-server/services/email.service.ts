import nodemailer from "nodemailer";
import EmailTemplate from "../models/EmailTemplate.model";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Default Fallback Welcome Email Template Constants
export const DEFAULT_WELCOME_SUBJECT = "Welcome to Sikho AI 🚀";

export const DEFAULT_WELCOME_HTML = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; margin-bottom: 16px;">Hi {{name}},</h2>
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
</div>`;

export const DEFAULT_WELCOME_TEXT = `Hi {{name}},

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
 * Generic email sending function.
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
    const fromName = process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || "Sikho AI";
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
    const from = `"${fromName}" <${fromAddress}>`;

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
 * Fetch or Seed Welcome Email Template from Database
 */
export const getWelcomeEmailTemplate = async () => {
  try {
    let template = await EmailTemplate.findOne({ templateKey: "welcome_email" });
    if (!template) {
      template = await EmailTemplate.create({
        templateKey: "welcome_email",
        subject: DEFAULT_WELCOME_SUBJECT,
        bodyHtml: DEFAULT_WELCOME_HTML,
        bodyText: DEFAULT_WELCOME_TEXT,
        variables: ["{{name}}", "{{email}}"],
        updatedBy: "system",
      });
      console.log("🌱 Default Welcome Email Template seeded into database.");
    }
    return template;
  } catch (error: any) {
    console.error("⚠️ Error reading welcome email template from DB, fallback to default:", error?.message || error);
    return {
      templateKey: "welcome_email",
      subject: DEFAULT_WELCOME_SUBJECT,
      bodyHtml: DEFAULT_WELCOME_HTML,
      bodyText: DEFAULT_WELCOME_TEXT,
      variables: ["{{name}}", "{{email}}"],
      updatedBy: "system",
    };
  }
};

/**
 * Update Welcome Email Template in Database
 */
export const updateWelcomeEmailTemplate = async (
  subject: string,
  bodyHtml: string,
  bodyText: string,
  updatedBy: string = "admin"
) => {
  const template = await EmailTemplate.findOneAndUpdate(
    { templateKey: "welcome_email" },
    {
      subject,
      bodyHtml,
      bodyText,
      variables: ["{{name}}", "{{email}}"],
      updatedBy,
    },
    { new: true, upsert: true }
  );
  return template;
};

/**
 * Process template placeholders: {{name}}, {{email}}
 */
export const processTemplatePlaceholders = (
  templateStr: string,
  userEmail: string,
  userName: string
): string => {
  const name = userName || "Learner";
  return templateStr
    .replace(/\{\{\s*name\s*\}\}/gi, name)
    .replace(/\{\{\s*email\s*\}\}/gi, userEmail);
};

/**
 * Send Welcome Email to newly registered user using current dynamic template from Database.
 */
export const sendWelcomeEmail = async (userEmail: string, userName: string): Promise<boolean> => {
  const template = await getWelcomeEmailTemplate();

  const finalSubject = processTemplatePlaceholders(template.subject, userEmail, userName);
  const finalHtml = processTemplatePlaceholders(template.bodyHtml, userEmail, userName);
  const finalText = processTemplatePlaceholders(template.bodyText, userEmail, userName);

  return await sendEmail({
    to: userEmail,
    subject: finalSubject,
    text: finalText,
    html: finalHtml,
  });
};

/**
 * Send Test Welcome Email for Admin Preview
 */
export const sendTestWelcomeEmail = async (recipientEmail: string, recipientName: string = "Test Admin"): Promise<boolean> => {
  return await sendWelcomeEmail(recipientEmail, recipientName);
};
