import { z } from "zod";

export const RegisterSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(30),
  phoneNumber: z.string().min(8, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional()
    .or(z.literal("")),
  verificationCode: z.string().optional(),
  idToken: z.string().optional(),
  captchaToken: z.string().optional(),
});

export const LoginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const ResetPasswordSchema = z.object({
  phoneNumber: z.string().min(7, "Valid phone number required"),
  verificationCode: z.string().min(4, "Verification code is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  idToken: z.string().optional(),
});

export const PhoneAuthSchema = z.object({
  phoneNumber: z
    .string()
    .min(8, "Valid phone number required")
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone format (e.g. +1234567890)"),
  verificationCode: z.string().min(4).optional(),
  idToken: z.string().optional(),
  firebaseUid: z.string().optional(),
  displayName: z.string().min(2).max(30).optional(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  mode: z.enum(["login", "signup", "check"]).optional(),
});

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2).max(30).optional(),
  bio: z.string().max(200).optional(),
  avatar: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  allowFriendRequests: z.boolean().optional(),
});

export const MessageSendSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, "Message cannot be empty").max(2000),
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(["IMAGE", "FILE"]).optional(),
  replyToId: z.string().optional(),
});

export const UserReportSchema = z.object({
  reportedUserId: z.string().min(1),
  messageId: z.string().optional(),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(500),
});

export const RewardDefSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  icon: z.string().min(1),
  type: z.enum(["BADGE", "AVATAR_FRAME", "VIP_TITLE", "XP_BOOST", "EMOTE_PACK"]),
  probability: z.number().min(0).max(1),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  segmentIndex: z.number().int().min(0).max(7),
  xpValue: z.number().int().min(0),
});
