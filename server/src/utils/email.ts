import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_TOKEN || "a76b1e0ba07eb84b08c23e9942fcb027";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "hello@stashflow.app";
const SENDER_NAME = process.env.SENDER_NAME || "Stashflow";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: SENDER_EMAIL,
  name: SENDER_NAME,
};

/**
 * Send an email using Mailtrap
 */
export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  textContent: string,
  htmlContent?: string
) => {
  const recipients = [{ email: recipientEmail }];

  try {
    const result = await client.send({
      from: sender,
      to: recipients,
      subject,
      text: textContent,
      html: htmlContent || textContent,
      category: "Stashflow",
    });

    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Send verification code email
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationCode: string
) => {
  const subject = "Verify your Stashflow account";
  const textContent = `
    Hello ${name},
    
    Thank you for signing up for Stashflow. To verify your account, please use the following code:
    
    ${verificationCode}
    
    This code will expire in 30 minutes.
    
    Best regards,
    The Stashflow Team
  `;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify your Stashflow account</h2>
      <p>Hello ${name},</p>
      <p>Thank you for signing up for Stashflow. To verify your account, please use the following code:</p>
      <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
        <strong>${verificationCode}</strong>
      </div>
      <p>This code will expire in 30 minutes.</p>
      <p>Best regards,<br>The Stashflow Team</p>
    </div>
  `;

  return sendEmail(email, subject, textContent, htmlContent);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetCode: string
) => {
  // Extract only the first 6 characters if the reset code is longer
  // In a real implementation, you might want to generate a dedicated 6-digit code
  const sixDigitCode = resetCode.substring(0, 6);

  const subject = "Reset your Stashflow password";
  const textContent = `
    Hello ${name},
    
    You've requested to reset your password. Please use the following 6-digit code to reset your password:
    
    ${sixDigitCode}
    
    This code will expire in 30 minutes. If you didn't request a password reset, please ignore this email.
    
    If you didn't receive this email, you can request a new code from the password reset page.
    
    Best regards,
    The Stashflow Team
  `;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset your Stashflow password</h2>
      <p>Hello ${name},</p>
      <p>You've requested to reset your password. Please use the following 6-digit code to reset your password:</p>
      <div style="margin: 20px 0; text-align: center;">
        <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; background-color: #f3f4f6; padding: 16px; border-radius: 8px;">${sixDigitCode}</div>
      </div>
      <p>This code will expire in 30 minutes. If you didn't request a password reset, please ignore this email.</p>
      <p>If you didn't receive this email initially, you can request a new code from the password reset page.</p>
      <p>Best regards,<br>The Stashflow Team</p>
    </div>
  `;

  return sendEmail(email, subject, textContent, htmlContent);
}; 