export interface RawAd {
  id: string;
  page_name?: string;
  ad_delivery_start_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_snapshot_url?: string;
  publisher_platforms?: string[];
}

export interface AnalyzedAd {
  id: string;
  pageName: string;
  daysRunning: number;
  startDate: string;
  snippet: string;
  snapshotUrl: string;
  platforms: string[];
}

/** Nombre de jours pleins ecoules depuis le debut de diffusion. */
export function computeDaysRunning(deliveryStartTime: string, now: Date = new Date()): number {
  const start = new Date(deliveryStartTime);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Date de diffusion invalide: ${deliveryStartTime}`);
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((now.getTime() - start.getTime()) / msPerDay);
  return Math.max(days, 0);
}

function firstNonEmpty(values: string[] | undefined): string {
  return values?.find((v) => v && v.trim().length > 0)?.trim() ?? "";
}

/** Transforme une pub brute de l'API en pub analysee, prete a trier/afficher. */
export function analyzeAd(raw: RawAd, now: Date = new Date()): AnalyzedAd | null {
  if (!raw.ad_delivery_start_time) return null;
  return {
    id: raw.id,
    pageName: raw.page_name?.trim() || "(page inconnue)",
    daysRunning: computeDaysRunning(raw.ad_delivery_start_time, now),
    startDate: raw.ad_delivery_start_time,
    snippet: firstNonEmpty(raw.ad_creative_bodies) || firstNonEmpty(raw.ad_creative_link_captions),
    snapshotUrl: raw.ad_snapshot_url ?? "",
    platforms: raw.publisher_platforms ?? [],
  };
}

/** Trie par nombre de jours de diffusion decroissant (les plus rentables en premier). */
export function sortByDaysRunning(ads: AnalyzedAd[]): AnalyzedAd[] {
  return [...ads].sort((a, b) => b.daysRunning - a.daysRunning);
}

/** Ne garde que les pubs actives depuis au moins `minDays` jours. */
export function filterByMinDays(ads: AnalyzedAd[], minDays: number): AnalyzedAd[] {
  return ads.filter((ad) => ad.daysRunning >= minDays);
}

/** Enleve les doublons (meme page + meme texte de pub). */
export function dedupeAds(ads: AnalyzedAd[]): AnalyzedAd[] {
  const seen = new Set<string>();
  const result: AnalyzedAd[] = [];
  for (const ad of ads) {
    const key = `${ad.pageName}::${ad.snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ad);
  }
  return result;
}
