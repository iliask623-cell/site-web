-- Deux versions VÉRIFIÉES d'une même règle ne peuvent pas être en vigueur en
-- même temps : sinon le calcul dépendrait de l'ordre des lignes.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_verified_no_overlap"
  EXCLUDE USING gist ("code" WITH =, daterange("valid_from", "valid_to", '[)') WITH &&)
  WHERE ("status" = 'verified');--> statement-breakpoint
ALTER TABLE "invoice_mention_rules" ADD CONSTRAINT "invoice_mention_rules_verified_no_overlap"
  EXCLUDE USING gist ("code" WITH =, daterange("valid_from", "valid_to", '[)') WITH &&)
  WHERE ("status" = 'verified');
