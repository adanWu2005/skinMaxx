import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Resend } from 'resend';

import { query } from "../../db";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

const JWT_SECRET = process.env.JWT_SECRET || "skinmaxx-secret-key-change-in-production";
const resend = new Resend(process.env.RESEND_API_KEY);

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const existingUserResult = await query(
        'SELECT id FROM users WHERE email = $1',
        [input.email]
      );
      
      if (existingUserResult.rows.length > 0) {
        throw new Error("User already exists");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const userId = `user_${Date.now()}_${Math.random()}`;

      await query(
        'INSERT INTO users (id, email, password, name) VALUES ($1, $2, $3, $4)',
        [userId, input.email, hashedPassword, input.name]
      );

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        'UPDATE verification_codes SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE',
        [userId]
      );

      await query(
        'INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
        [userId, code, expiresAt]
      );

      try {
        await resend.emails.send({
          from: 'skinMaxx <onboarding@resend.dev>',
          to: input.email,
          subject: 'Your Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verification Code</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #6366f1; font-size: 48px; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
              <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error('[Auth] Failed to send verification email:', error);
        throw new Error('Failed to send verification code');
      }

      return {
        requiresVerification: true,
        userId: userId,
        email: input.email,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await query(
        'SELECT id, email, password, name FROM users WHERE email = $1',
        [input.email]
      );
      
      if (result.rows.length === 0) {
        throw new Error("Invalid credentials");
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const result = await query(
        'SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [input.userId, input.code]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired code');
      }

      await query(
        'UPDATE verification_codes SET is_used = TRUE WHERE id = $1',
        [result.rows[0].id]
      );

      const userResult = await query(
        'SELECT id, email, name FROM users WHERE id = $1',
        [input.userId]
      );

      const user = userResult.rows[0];
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),

  resendCode: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const recentCodeResult = await query(
        'SELECT created_at FROM verification_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [input.userId]
      );

      if (recentCodeResult.rows.length > 0) {
        const lastCodeTime = new Date(recentCodeResult.rows[0].created_at).getTime();
        const now = Date.now();
        const timeSinceLastCode = (now - lastCodeTime) / 1000;

        if (timeSinceLastCode < 30) {
          throw new Error(`Please wait ${Math.ceil(30 - timeSinceLastCode)} seconds before requesting a new code`);
        }
      }

      const userResult = await query(
        'SELECT email FROM users WHERE id = $1',
        [input.userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        'UPDATE verification_codes SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE',
        [input.userId]
      );

      await query(
        'INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
        [input.userId, code, expiresAt]
      );

      try {
        await resend.emails.send({
          from: 'skinMaxx <onboarding@resend.dev>',
          to: userResult.rows[0].email,
          subject: 'Your Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verification Code</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #6366f1; font-size: 48px; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
              <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error('[Auth] Failed to send verification email:', error);
        throw new Error('Failed to send verification code');
      }

      return { success: true };
    }),

  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      await query(
        'DELETE FROM scans WHERE user_id = $1',
        [ctx.userId]
      );

      await query(
        'DELETE FROM users WHERE id = $1',
        [ctx.userId]
      );

      return { success: true };
    }),

  sendResetCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const userResult = await query(
        'SELECT id FROM users WHERE email = $1',
        [input.email]
      );

      if (userResult.rows.length === 0) {
        throw new Error('No account found with this email');
      }

      const userId = userResult.rows[0].id;
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        'UPDATE verification_codes SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE',
        [userId]
      );

      await query(
        'INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
        [userId, code, expiresAt]
      );

      try {
        await resend.emails.send({
          from: 'skinMaxx <onboarding@resend.dev>',
          to: input.email,
          subject: 'Password Reset Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset</h2>
              <p>You requested to reset your password. Your verification code is:</p>
              <h1 style="color: #6366f1; font-size: 48px; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
              <p style="color: #666;">This code will expire in 10 minutes.</p>
              <p style="color: #666;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error('[Auth] Failed to send reset email:', error);
        throw new Error('Failed to send reset code');
      }

      return {
        success: true,
        userId: userId,
      };
    }),

  verifyResetCode: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const result = await query(
        'SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [input.userId, input.code]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired code');
      }

      return {
        success: true,
        codeId: result.rows[0].id,
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        codeId: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const codeResult = await query(
        'SELECT * FROM verification_codes WHERE id = $1 AND user_id = $2 AND is_used = FALSE AND expires_at > NOW()',
        [input.codeId, input.userId]
      );

      if (codeResult.rows.length === 0) {
        throw new Error('Invalid or expired verification session');
      }

      const userResult = await query(
        'SELECT password FROM users WHERE id = $1',
        [input.userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const isSamePassword = await bcrypt.compare(input.newPassword, userResult.rows[0].password);
      if (isSamePassword) {
        throw new Error('New password cannot be the same as your old password');
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      await query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, input.userId]
      );

      await query(
        'UPDATE verification_codes SET is_used = TRUE WHERE id = $1',
        [input.codeId]
      );

      return { success: true };
    }),
});
