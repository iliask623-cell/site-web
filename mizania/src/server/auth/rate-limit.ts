import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export type RateLimitRule = { limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  loginPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  loginPerIp: { limit: 50, windowSeconds: 15 * 60 },
  registerPerIp: { limit: 10, windowSeconds: 60 * 60 },
  resetPerEmail: { limit: 5, windowSeconds: 60 * 60 },
  resetPerIp: { limit: 20, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Compteur à fenêtre fixe, atomique (une seule requête). Renvoie `true` si
 * l'action est autorisée. Stocké en base : fonctionne aussi en serverless.
 */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<boolean> {
  const rows = await getDb().execute<{ count: number }>(sql`
    insert into rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start <= now() - make_interval(secs => ${rule.windowSeconds})
                   then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start <= now() - make_interval(secs => ${rule.windowSeconds})
                   then now() else rate_limits.window_start end
    returning count
  `);
  return rows[0].count <= rule.limit;
}

export async function resetRateLimit(key: string): Promise<void> {
  await getDb().execute(sql`delete from rate_limits where key = ${key}`);
}
