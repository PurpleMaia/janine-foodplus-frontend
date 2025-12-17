import { db } from '@/db/kysely/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const passwordSchema = z.string()
            .min(8, { message: "Password must be at least 8 characters long." })
            .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
            .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
            .regex(/[0-9]/, { message: "Password must contain at least one number." })
            .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });

async function hashedPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function changePassword(userId: string, newPassword: string): Promise<void> {
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
        throw new Error('Invalid password: ' + validation.error.message);
    }
    const hashedPwd = await hashedPassword(newPassword);

    await db.updateTable('auth_key')
        .set({ hashed_password: hashedPwd })
        .where('user_id', '=', userId)
        .execute();
}

function main() {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error('Usage: npx tsx change-password.ts <userId> <newPassword>');
        process.exit(1);
    }

    const [userId, newPassword] = args;
    changePassword(userId, newPassword)
        .then(() => {
            console.log('Password changed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error changing password:', error);
            process.exit(1);
        });
}

main();