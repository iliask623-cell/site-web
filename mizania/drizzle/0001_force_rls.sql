-- Applique la RLS même au propriétaire des tables (le rôle applicatif).
-- Sans FORCE, le propriétaire contournerait les politiques d'isolation.
-- Toute nouvelle table métier doit être ajoutée ici (test d'intégration à l'appui).
ALTER TABLE "contacts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" FORCE ROW LEVEL SECURITY;
