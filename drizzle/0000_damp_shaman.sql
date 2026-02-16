CREATE TABLE `api_cache` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`cache_type` text NOT NULL,
	`response_data` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_cache_type` ON `api_cache` (`cache_type`);--> statement-breakpoint
CREATE INDEX `idx_expires_at` ON `api_cache` (`expires_at`);