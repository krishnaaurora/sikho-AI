import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import mongoose from "mongoose";
import EmailTemplate from "../models/EmailTemplate.model";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Default Professional Sikho AI Welcome Email Template Constants
export const DEFAULT_WELCOME_SUBJECT = "Welcome to Sikho AI 🚀 Your Journey to Learn, Build & Grow Starts Here!";

export const DEFAULT_WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sikho AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 36px 32px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.2); border: 1px solid rgba(165, 180, 252, 0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
                      <span style="color: #c7d2fe; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">✨ SIKHO AI</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 8px 0 6px 0; line-height: 1.3;">Welcome to Sikho AI 🚀</h1>
                    <p style="color: #818cf8; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">Your Career. Your Journey. Your Future.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Hi {{first_name}},</p>
              
              <p style="font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 24px;">
                We're excited to have you on board! <strong>Sikho AI</strong> is your personal AI-powered career copilot, designed to help you discover your potential, develop real-world skills, and take meaningful steps toward your dream career.
              </p>

              <!-- Section Title -->
              <div style="margin-top: 28px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
                <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  🚀 What You Can Do with Sikho AI
                </h3>
              </div>

              <!-- Feature Grid Cards -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                
                <!-- Feature 1: Career Intelligence -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td>
                          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #1e1b4b;">
                            🎯 Career Intelligence
                          </h4>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                            Discover career paths, identify skill gaps, and receive a personalized career roadmap tailored to your goals.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 2: Learn Anything -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #06b6d4; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td>
                          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #0e7490;">
                            📚 Learn Anything
                          </h4>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                            Access AI-powered lessons, personalized learning paths, interactive learning experiences, and instant explanations.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 3: Resume Intelligence -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td>
                          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #065f46;">
                            📄 Resume Intelligence
                          </h4>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                            Analyze your resume, understand your strengths, identify key improvements, and enhance your job readiness.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 4: GitHub Intelligence -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #8b5cf6; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td>
                          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #5b21b6;">
                            💻 GitHub Intelligence
                          </h4>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                            Analyze GitHub repositories, review code, identify improvement opportunities, and develop practical coding skills.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 5: Interview Mission -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td>
                          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #92400e;">
                            🎯 Interview Mission
                          </h4>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                            Prepare for company-specific interviews, practice interactive mock interviews, and boost your confidence.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 6: Hackathons & Opportunities -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ec4899; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td>
                          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #9d174d;">
                            🏆 Hackathons & Opportunities
                          </h4>
                          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                            Discover relevant hackathons, internships, and career opportunities aligned with your skills and interests.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- CTA Callout Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="{{app_url}}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                      Start Your Journey &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 16px; margin-bottom: 0;">
                Ready to take the next step? Log in now and explore your personalized dashboard.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Team Sikho AI</p>
              <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">Your Personal AI Career Copilot</p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Need help? Reach out at <a href="mailto:sikhoaiedu@gmail.com" style="color: #4f46e5; text-decoration: underline;">sikhoaiedu@gmail.com</a>
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 12px; margin-bottom: 0;">
                &copy; {{year}} Sikho AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

export const DEFAULT_WELCOME_TEXT = `Hi {{first_name}},

Welcome to Sikho AI! 🚀

We're excited to have you on board. Sikho AI is your personal AI-powered career copilot, designed to help you discover your potential, develop real-world skills, and take meaningful steps toward your dream career.

🚀 WHAT YOU CAN DO WITH SIKHO AI:

🎯 Career Intelligence — Discover career paths, identify skill gaps, and receive a personalized career roadmap.
📚 Learn Anything — Access AI-powered lessons, personalized learning paths, interactive learning experiences, and explanations.
📄 Resume Intelligence — Analyze your resume, understand your strengths, identify improvements, and enhance your job readiness.
💻 GitHub Intelligence — Analyze GitHub repositories, review code, identify improvement opportunities, and develop practical coding skills.
🎯 Interview Mission — Prepare for company-specific interviews, practice mock interviews, and improve interview readiness.
🏆 Hackathons & Opportunities — Discover relevant hackathons, internships, and career opportunities aligned with your interests.

Start your journey today: {{app_url}}

Happy Learning! 🌱

Team Sikho AI
Support: sikhoaiedu@gmail.com`;

/**
 * Resolves a hostname directly to its IPv4 address to guarantee that cloud platforms
 * like Render (which do not have IPv6 outbound routing) never fail with ENETUNREACH.
 */
const resolveIPv4Address = async (host: string): Promise<string> => {
  // If it's already an IP address, return it
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return host;
  }
  return new Promise((resolve) => {
    dns.resolve4(host, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        resolve(addresses[0]);
      } else {
        dns.lookup(host, { family: 4 }, (err2, address) => {
          if (!err2 && address) {
            resolve(address);
          } else {
            resolve(host);
          }
        });
      }
    });
  });
};

// Create Nodemailer Transporter using Gmail SMTP credentials from backend env
const createTransporter = async () => {
  const rawHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";

  const secureEnv = process.env.SMTP_SECURE;
  const isSecure = secureEnv !== undefined ? secureEnv === "true" : port === 465;

  // Explicitly resolve to IPv4 address to eliminate Render IPv6 ENETUNREACH
  const ipv4Host = await resolveIPv4Address(rawHost);

  const transportOptions = {
    host: ipv4Host,
    port,
    secure: isSecure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      servername: rawHost, // SNI ensures TLS matches Google certificate
      rejectUnauthorized: false,
    },
  };

  return nodemailer.createTransport(transportOptions as any);
};

/**
 * Generic email sending function.
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
    
    if (!user || !pass) {
      console.warn("⚠️ [Email] SMTP credentials missing (SMTP_USER / SMTP_PASS). Email NOT sent to:", options.to);
      console.warn("⚠️ [Email] Set SMTP_USER and SMTP_PASS in your environment variables (Render dashboard for production).");
      return false;
    }

    console.log(`📧 [Email] Attempting to send to: ${options.to} | Subject: ${options.subject}`);
    const transporter = await createTransporter();
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

    console.log(`✅ [Email] Successfully sent to ${options.to}. MessageID: ${info.messageId} | Response: ${info.response}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [Email] Failed to send to ${options.to}:`, error?.message || error);
    console.error(`❌ [Email] SMTP Error code: ${error?.code} | Response: ${error?.response}`);
    return false;
  }
};

/**
 * Fetch or Seed Welcome Email Template from Database
 */
export const getWelcomeEmailTemplate = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      let template = await EmailTemplate.findOne({ templateKey: "welcome_email" });
      if (!template) {
        template = await EmailTemplate.create({
          templateKey: "welcome_email",
          subject: DEFAULT_WELCOME_SUBJECT,
          bodyHtml: DEFAULT_WELCOME_HTML,
          bodyText: DEFAULT_WELCOME_TEXT,
          variables: ["{{first_name}}", "{{name}}", "{{email}}", "{{app_url}}"],
          updatedBy: "system",
        });
        console.log("🌱 Professional Welcome Email Template seeded into database.");
      }
      return template;
    }
  } catch (error: any) {
    console.error("⚠️ Error reading welcome email template from DB, fallback to default:", error?.message || error);
  }
  return {
    templateKey: "welcome_email",
    subject: DEFAULT_WELCOME_SUBJECT,
    bodyHtml: DEFAULT_WELCOME_HTML,
    bodyText: DEFAULT_WELCOME_TEXT,
    variables: ["{{first_name}}", "{{name}}", "{{email}}", "{{app_url}}"],
    updatedBy: "system",
  };
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
      variables: ["{{first_name}}", "{{name}}", "{{email}}", "{{app_url}}"],
      updatedBy,
    },
    { new: true, upsert: true }
  );
  return template;
};

/**
 * Process template placeholders: {{first_name}}, {{name}}, {{email}}, {{app_url}}, {{year}}
 */
export const processTemplatePlaceholders = (
  templateStr: string,
  userEmail: string,
  userName: string
): string => {
  const cleanName = (userName || "").trim();
  const firstName = cleanName ? cleanName.split(" ")[0] : "Learner";
  const fullName = cleanName || "Learner";
  const appUrl = process.env.PUBLIC_SITE_URL || "https://sikho-ai-37ni.vercel.app";
  const year = new Date().getFullYear().toString();

  return templateStr
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*user_name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*email\s*\}\}/gi, userEmail)
    .replace(/\{\{\s*user_email\s*\}\}/gi, userEmail)
    .replace(/\{\{\s*app_url\s*\}\}/gi, appUrl)
    .replace(/\{\{\s*year\s*\}\}/gi, year);
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
