CREATE TYPE "public"."vat_liability" AS ENUM('unknown', 'subject', 'not_subject');--> statement-breakpoint
CREATE TYPE "public"."invoice_mention_scope" AS ENUM('seller', 'buyer', 'document', 'line');--> statement-breakpoint
CREATE TYPE "public"."source_issuer" AS ENUM('jora', 'finance_ministry', 'dgi', 'commerce_ministry', 'justice_ministry', 'anpdp', 'other');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('law', 'ordinance', 'executive_decree', 'order', 'instruction', 'methodological_note', 'official_page', 'other');--> statement-breakpoint
CREATE TYPE "public"."tax_rule_kind" AS ENUM('rate', 'threshold', 'exemption', 'regime_condition');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('draft', 'to_verify', 'verified', 'retired');--> statement-breakpoint
CREATE TABLE "invoice_mention_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"scope" "invoice_mention_scope" NOT NULL,
	"label" text NOT NULL,
	"field_key" text,
	"condition" text,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"source_id" uuid,
	"legal_article" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "verification_status" DEFAULT 'draft' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_mention_rules_period" CHECK ("invoice_mention_rules"."valid_to" is null or "invoice_mention_rules"."valid_to" > "invoice_mention_rules"."valid_from"),
	CONSTRAINT "invoice_mention_rules_verified_is_sourced" CHECK ("invoice_mention_rules"."status" <> 'verified' or ("invoice_mention_rules"."source_id" is not null and "invoice_mention_rules"."verified_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "official_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"issuer" "source_issuer" NOT NULL,
	"kind" "source_kind" NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"published_on" date,
	"journal_reference" text,
	"url" text,
	"provenance_note" text,
	"status" "verification_status" DEFAULT 'to_verify' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "official_sources_verified_has_date" CHECK ("official_sources"."status" <> 'verified' or "official_sources"."verified_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "tax_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"tax_code" text NOT NULL,
	"kind" "tax_rule_kind" NOT NULL,
	"label" text NOT NULL,
	"rate_basis_points" integer,
	"amount_cents" bigint,
	"conditions" text,
	"exemptions" text,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"fiscal_year" integer,
	"source_id" uuid,
	"legal_article" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "verification_status" DEFAULT 'draft' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rules_code_format" CHECK ("tax_rules"."code" ~ '^[A-Z][A-Z0-9_]{1,63}$'),
	CONSTRAINT "tax_rules_period" CHECK ("tax_rules"."valid_to" is null or "tax_rules"."valid_to" > "tax_rules"."valid_from"),
	CONSTRAINT "tax_rules_rate_value" CHECK ("tax_rules"."kind" <> 'rate' or ("tax_rules"."rate_basis_points" is not null and "tax_rules"."rate_basis_points" between 0 and 10000)),
	CONSTRAINT "tax_rules_threshold_value" CHECK ("tax_rules"."kind" <> 'threshold' or ("tax_rules"."amount_cents" is not null and "tax_rules"."amount_cents" >= 0)),
	CONSTRAINT "tax_rules_verified_is_sourced" CHECK ("tax_rules"."status" <> 'verified' or ("tax_rules"."source_id" is not null and "tax_rules"."verified_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxes_code_format" CHECK ("taxes"."code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "vat_liability" "vat_liability" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tax_regime_code" text;--> statement-breakpoint
ALTER TABLE "invoice_mention_rules" ADD CONSTRAINT "invoice_mention_rules_source_id_official_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."official_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_mention_rules" ADD CONSTRAINT "invoice_mention_rules_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_sources" ADD CONSTRAINT "official_sources_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_tax_code_taxes_code_fk" FOREIGN KEY ("tax_code") REFERENCES "public"."taxes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_source_id_official_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."official_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_mention_rules_code_version_key" ON "invoice_mention_rules" USING btree ("code","version");--> statement-breakpoint
CREATE UNIQUE INDEX "official_sources_slug_key" ON "official_sources" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_rules_code_version_key" ON "tax_rules" USING btree ("code","version");--> statement-breakpoint
CREATE INDEX "tax_rules_lookup_idx" ON "tax_rules" USING btree ("code","valid_from");