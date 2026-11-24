CREATE TABLE `pizzerias` (
	`team_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text,
	`phone` text,
	`website` text,
	`maps_url` text,
	`dinner_date` text,
	`dinner_time` text,
	`booking_status` text NOT NULL,
	`booked_under` text,
	`confirmation_code` text,
	`notes` text,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "pizzerias_booking_status" CHECK("pizzerias"."booking_status" IN ('da_prenotare', 'da_confermare', 'prenotato'))
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_members_team_id_idx` ON `team_members` (`team_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_id` text NOT NULL,
	`slot` integer NOT NULL,
	`name` text NOT NULL,
	`invite_code` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "teams_slot_range" CHECK("teams"."slot" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_invite_code_unique` ON `teams` (`invite_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_edition_slot_unique` ON `teams` (`edition_id`,`slot`);