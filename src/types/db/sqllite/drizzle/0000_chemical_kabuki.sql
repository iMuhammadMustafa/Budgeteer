CREATE TABLE `accountcategories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text DEFAULT 'info-100',
	`icon` text DEFAULT '',
	`displayorder` integer DEFAULT 0,
	`tenantid` text NOT NULL,
	`isdeleted` integer DEFAULT false,
	`createdat` text NOT NULL,
	`createdby` text,
	`updatedat` text,
	`updatedby` text
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`categoryid` text NOT NULL,
	`balance` real DEFAULT 0,
	`currency` text DEFAULT 'USD',
	`color` text DEFAULT 'info-100',
	`icon` text DEFAULT '',
	`description` text,
	`notes` text,
	`owner` text,
	`displayorder` integer DEFAULT 0,
	`tenantid` text NOT NULL,
	`isdeleted` integer DEFAULT false,
	`createdat` text NOT NULL,
	`createdby` text,
	`updatedat` text,
	`updatedby` text,
	FOREIGN KEY (`categoryid`) REFERENCES `accountcategories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`type` text NOT NULL,
	`table` text NOT NULL,
	`tenantid` text,
	`isdeleted` integer DEFAULT false,
	`createdat` text NOT NULL,
	`createdby` text,
	`updatedat` text,
	`updatedby` text
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`full_name` text,
	`avatar_url` text,
	`timezone` text,
	`tenantid` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `recurrings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sourceaccountid` text NOT NULL,
	`categoryid` text,
	`amount` real,
	`type` text NOT NULL,
	`description` text,
	`payeename` text,
	`notes` text,
	`currencycode` text DEFAULT 'USD',
	`recurrencerule` text NOT NULL,
	`nextoccurrencedate` text NOT NULL,
	`enddate` text,
	`lastexecutedat` text,
	`isactive` integer DEFAULT true,
	`tenantid` text NOT NULL,
	`isdeleted` integer DEFAULT false,
	`createdat` text,
	`createdby` text,
	`updatedat` text,
	`updatedby` text,
	FOREIGN KEY (`sourceaccountid`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryid`) REFERENCES `transactioncategories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactioncategories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`groupid` text NOT NULL,
	`type` text NOT NULL,
	`color` text DEFAULT 'info-100',
	`icon` text DEFAULT '',
	`description` text,
	`displayorder` integer DEFAULT 0,
	`budgetamount` real DEFAULT 0,
	`budgetfrequency` text DEFAULT 'Monthly',
	`tenantid` text NOT NULL,
	`isdeleted` integer DEFAULT false,
	`createdat` text NOT NULL,
	`createdby` text,
	`updatedat` text,
	`updatedby` text,
	FOREIGN KEY (`groupid`) REFERENCES `transactiongroups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactiongroups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text DEFAULT 'info-100',
	`icon` text DEFAULT '',
	`description` text,
	`displayorder` integer DEFAULT 0,
	`budgetamount` real DEFAULT 0,
	`budgetfrequency` text DEFAULT 'Monthly',
	`tenantid` text NOT NULL,
	`isdeleted` integer DEFAULT false,
	`createdat` text NOT NULL,
	`createdby` text,
	`updatedat` text,
	`updatedby` text
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`accountid` text NOT NULL,
	`categoryid` text NOT NULL,
	`amount` real DEFAULT 0,
	`date` text NOT NULL,
	`description` text,
	`payee` text,
	`notes` text,
	`tags` text,
	`type` text NOT NULL,
	`transferaccountid` text,
	`transferid` text,
	`isvoid` integer DEFAULT false,
	`tenantid` text NOT NULL,
	`isdeleted` integer DEFAULT false,
	`createdat` text NOT NULL,
	`createdby` text,
	`updatedat` text,
	`updatedby` text,
	FOREIGN KEY (`accountid`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryid`) REFERENCES `transactioncategories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transferaccountid`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transferid`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
