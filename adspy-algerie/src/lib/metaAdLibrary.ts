import type { RawAd } from "./adAnalysis.js";

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/ads_archive`;

const FIELDS = [
  "id",
  "page_name",
  "ad_delivery_start_time",
  "ad_creative_bodies",
  "ad_creative_link_captions",
  "ad_snapshot_url",
  "publisher_platforms",
].join(",");

export interface SearchAdsParams {
  accessToken: string;
  searchTerms: string;
  country: string;
  limit?: number;
  activeStatus?: "ACTIVE" | "ALL" | "INACTIVE";
}

interface AdsArchiveResponse {
  data: RawAd[];
  paging?: { next?: string };
  error?: { message: string; type: string; code: number };
}

/**
 * Interroge l'API officielle Meta Ad Library (ads_archive).
 * Necessite un access token valide avec le champ ads_read.
 * Documentation: https://www.facebook.com/ads/library/api
 */
export async function searchAds({
  accessToken,
  searchTerms,
  country,
  limit = 100,
  activeStatus = "ACTIVE",
}: SearchAdsParams): Promise<RawAd[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("search_terms", searchTerms);
  url.searchParams.set("ad_reached_countries", JSON.stringify([country]));
  url.searchParams.set("ad_active_status", activeStatus);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(Math.min(limit, 250)));

  const res = await fetch(url.toString());
  const body = (await res.json()) as AdsArchiveResponse;

  if (!res.ok || body.error) {
    const message = body.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Echec de l'appel a l'API Meta Ad Library: ${message}`);
  }

  return body.data ?? [];
}

/** Lance une recherche pour chaque mot-cle et fusionne les resultats. */
export async function searchAdsForTerms(
  terms: string[],
  opts: Omit<SearchAdsParams, "searchTerms">,
): Promise<RawAd[]> {
  const all: RawAd[] = [];
  for (const term of terms) {
    const results = await searchAds({ ...opts, searchTerms: term });
    all.push(...results);
    // Petite pause pour rester raisonnable vis-a-vis du taux limite de l'API.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return all;
}
