CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"images" text[] DEFAULT '{""}' NOT NULL,
	"tags" text[] DEFAULT '{""}' NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"blog_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_like" UNIQUE("blog_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "save_unique" UNIQUE("blog_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(30) NOT NULL,
	"last_name" varchar(30) NOT NULL,
	"username" varchar(30) NOT NULL,
	"email" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"password" text,
	"refresh_token" text,
	"provider" text,
	"provider_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"image" text DEFAULT 'https://api.dicebear.com/9.x/personas/svg?seed=Brooklynn',
	"otp" text,
	"otp_expiry" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_id_idx" ON "blogs" USING btree ("id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tags_idx" ON "blogs" USING btree ("tags" array_ops);--> statement-breakpoint
CREATE INDEX "comments_blog_id_idx" ON "comments" USING btree ("blog_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "comments_user_id_idx" ON "comments" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "likes_blog_id_idx" ON "likes" USING btree ("blog_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "likes_blog_user_idx" ON "likes" USING btree ("blog_id" uuid_ops,"user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "likes_user_id_idx" ON "likes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "saves_blog_id_idx" ON "saves" USING btree ("blog_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "saves_user_id_idx" ON "saves" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "provider_id_idx" ON "users" USING btree ("provider_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_idx" ON "users" USING btree ("id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username" text_ops);