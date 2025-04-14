// src/events/user.events.ts

import { eventEmitter } from "../config/eventEmitter.config";
import { sendEmail } from "../config/nodemailer.config";

eventEmitter.on(
  "user.created",
  async (user: { email: string; username: string; otp: string }) => {
    console.debug("event emit called");
    try {
      const mailData = {
        from: process.env.TRANSPORTER_EMAIL,
        to: user.email,
        subject: "Verify Your Account",
        text: `Hello ${
          user.username || "User"
        },Thanks for signing up! Please verify your account using the One-Time Password (OTP) below:OTP: ${
          user.otp
        }This OTP is valid for only 15 minutes. If you did not request this, please ignore this email.Thanks, The Team`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <h2 style="color: #111827; text-align: center;">🔐 Verify Your Account</h2>
            <p style="font-size: 16px; color: #374151;">Hello ${
              user.username || "User"
            },</p>
            <p style="font-size: 16px; color: #374151;">Thank you for signing up. Please use the following OTP to verify your account:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; background-color: #f3f4f6; color: #111827; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 6px;">
                ${user.otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #6b7280;">This OTP will expire in 15 minutes. If you did not request this email, please ignore it.</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Regards,<br><strong>The Team</strong></p>
          </div>
        </div>
        `,
      };

      await sendEmail(mailData);
      console.info(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error(
        `Failed to send verification email to ${user.email}:`,
        error
      );
    }
  }
);

eventEmitter.on(
  "otp.refreshed",
  async (user: { email: string; otp: string }) => {
    console.debug("event emit called");
    try {
      const mailData = {
        from: process.env.TRANSPORTER_EMAIL,
        to: user.email,
        subject: "Verify Your Account",
        text: `Hello user,Thanks for signing up! Please verify your account using the One-Time Password (OTP) below:OTP: ${user.otp}This OTP is valid for only 15 minutes. If you did not request this, please ignore this email.Thanks, The Team`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <h2 style="color: #111827; text-align: center;">🔐 Verify Your Account</h2>
            <p style="font-size: 16px; color: #374151;">Hello ${"User"},</p>
            <p style="font-size: 16px; color: #374151;">Thank you for signing up. Please use the following OTP to verify your account:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; background-color: #f3f4f6; color: #111827; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 6px;">
                ${user.otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #6b7280;">This OTP will expire in 15 minutes. If you did not request this email, please ignore it.</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Regards,<br><strong>The Team</strong></p>
          </div>
        </div>
        `,
      };

      await sendEmail(mailData);
      console.info(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error(
        `Failed to send verification email to ${user.email}:`,
        error
      );
    }
  }
);

console.debug(`Listener count: ${eventEmitter.listenerCount("user.created")}`);
