import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email({ message: "Please provide a valid email address." });

const isProduction = process.env.NODE_ENV === "production";
const usernameSchema = z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" });
const identifierSchema = isProduction
    ? z.string()
        .min(1, { message: "Email or Username is required." })
        .refine((value) => {
            // Check if it's a valid email
            const emailResult = emailSchema.safeParse(value);
            if (emailResult.success) return true;
            
            // If not email, check if it's a valid username (3+ chars, alphanumeric + underscores)
            const usernameResult = usernameSchema.safeParse(value);
            if (usernameResult.success) return true;
            
            return false;
        }, {
            message: "Please enter a valid email address or username (3+ characters, letters, numbers, and underscores only)."
        })
    : z.string().min(1, { message: "Email or Username is required." });
const passwordSchema = isProduction
    ? z.string()
        .min(8, { message: "Password must be at least 8 characters long." })
    : z.string().min(1, { message: "Password is required." });
                
export const userIdSchema = z.object({
  userId: uuidSchema,
});

export const loginSchema = z.object({
  authString: identifierSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const tagsSchema = z.object({
    tagIds: z.array(z.string().uuid())
});

export const nicknameSchema = z.object({
    billId: uuidSchema,
    nickname: z.string().min(1, { message: "Nickname cannot be empty." }).max(100, { message: "Nickname cannot exceed 100 characters." })
});

export const proposalSchema = z.object({
    billId: uuidSchema,
    currentStatus: z.string().min(1, { message: "Current status cannot be empty." }).max(100, { message: "Current status cannot exceed 100 characters." }),
    suggestedStatus: z.string().min(1, { message: "Suggested status cannot be empty." }).max(100, { message: "Suggested status cannot exceed 100 characters." }),
    note: z.string().max(1000, { message: "Note cannot exceed 1000 characters." }).optional()
});

export const newTagSchema = z.object({
    name: z.string().min(1, { message: "Tag name cannot be empty." }).max(50, { message: "Tag name cannot exceed 50 characters." }),
    color: z.string().min(1, { message: "Tag color cannot be empty." }).max(20, { message: "Tag color cannot exceed 20 characters." }) // e.g. #FFFFFF
});

export const usersSchema = z.object({
    userIds: z.array(z.string().uuid()).min(1, { message: "At least one user ID is required." })
});