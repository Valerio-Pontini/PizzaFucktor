CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`pizzeria_team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`pizza_score` integer NOT NULL,
	`menu_score` integer NOT NULL,
	`service_score` integer NOT NULL,
	`ambience_score` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pizzeria_team_id`) REFERENCES `pizzerias`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "votes_score_range" CHECK("votes"."pizza_score" BETWEEN 1 AND 5 AND "votes"."menu_score" BETWEEN 1 AND 5 AND "votes"."service_score" BETWEEN 1 AND 5 AND "votes"."ambience_score" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_pizzeria_user_unique` ON `votes` (`pizzeria_team_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `votes_pizzeria_team_idx` ON `votes` (`pizzeria_team_id`);--> statement-breakpoint
CREATE INDEX `votes_user_updated_idx` ON `votes` (`user_id`,`updated_at`);