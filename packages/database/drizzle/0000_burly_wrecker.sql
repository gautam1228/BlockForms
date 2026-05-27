CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text,
	"salt" text,
	"email_verified" boolean DEFAULT false,
	"profile_image_url" text,
	"verification_token" text,
	"verification_token_expires" timestamp,
	"refresh_token" text,
	"reset_password_token" text,
	"reset_password_token_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
