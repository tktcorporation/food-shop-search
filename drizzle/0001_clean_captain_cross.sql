CREATE TABLE `place_cache` (
	`place_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`vicinity` text NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`user_ratings_total` integer DEFAULT 0 NOT NULL,
	`price_level` integer DEFAULT -1 NOT NULL,
	`types` text NOT NULL,
	`photo_references` text NOT NULL,
	`is_open_now` integer,
	`lat` real,
	`lng` real,
	`business_status` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_place_expires` ON `place_cache` (`expires_at`);