import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),

    fullName: varchar("full_name", { length: 80 }).notNull(),

    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"),
    salt: text("salt"),

    emailVerified: boolean("email_verified").default(false),
    profileImageUrl: text("profile_image_url"),

    verificationToken: text("verification_token"),
    verificationTokenExpires: timestamp("verification_token_expires"),
    refreshToken: text("refresh_token"),
    resetPasswordToken: text("reset_password_token"),
    resetPasswordTokenExpires: timestamp("reset_password_token_expires"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
