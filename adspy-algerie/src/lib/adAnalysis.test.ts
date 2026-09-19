import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeAd,
  computeDaysRunning,
  dedupeAds,
  filterByMinDays,
  sortByDaysRunning,
  type AnalyzedAd,
} from "./adAnalysis.js";

test("computeDaysRunning renvoie le nombre de jours ecoules", () => {
  const now = new Date("2026-09-19T12:00:00Z");
  assert.equal(computeDaysRunning("2026-08-25T00:00:00Z", now), 25);
  assert.equal(computeDaysRunning("2026-09-19T00:00:00Z", now), 0);
});

test("computeDaysRunning rejette une date invalide", () => {
  assert.throws(() => computeDaysRunning("pas-une-date"));
});

test("analyzeAd renvoie null si pas de date de debut", () => {
  const result = analyzeAd({ id: "1" });
  assert.equal(result, null);
});

test("analyzeAd calcule les jours et recupere un extrait de texte", () => {
  const now = new Date("2026-09-19T00:00:00Z");
  const ad = analyzeAd(
    {
      id: "42",
      page_name: "Boutique Exemple",
      ad_delivery_start_time: "2026-09-04T00:00:00Z",
      ad_creative_bodies: ["Livraison gratuite partout en Algerie"],
      ad_snapshot_url: "https://facebook.com/ads/library/?id=42",
      publisher_platforms: ["facebook", "instagram"],
    },
    now,
  );
  assert.notEqual(ad, null);
  assert.equal(ad!.daysRunning, 15);
  assert.equal(ad!.pageName, "Boutique Exemple");
  assert.equal(ad!.snippet, "Livraison gratuite partout en Algerie");
});

test("sortByDaysRunning trie du plus grand au plus petit", () => {
  const ads = [
    { id: "a", daysRunning: 5 },
    { id: "b", daysRunning: 30 },
    { id: "c", daysRunning: 15 },
  ] as AnalyzedAd[];
  const sorted = sortByDaysRunning(ads).map((a) => a.id);
  assert.deepEqual(sorted, ["b", "c", "a"]);
});

test("filterByMinDays garde uniquement les pubs assez anciennes", () => {
  const ads = [
    { id: "a", daysRunning: 5 },
    { id: "b", daysRunning: 30 },
    { id: "c", daysRunning: 15 },
  ] as AnalyzedAd[];
  const filtered = filterByMinDays(ads, 15).map((a) => a.id);
  assert.deepEqual(filtered, ["b", "c"]);
});

test("dedupeAds enleve les doublons page+texte identiques", () => {
  const ads = [
    { id: "a", pageName: "X", snippet: "Promo -50%" },
    { id: "b", pageName: "X", snippet: "Promo -50%" },
    { id: "c", pageName: "Y", snippet: "Promo -50%" },
  ] as AnalyzedAd[];
  const deduped = dedupeAds(ads).map((a) => a.id);
  assert.deepEqual(deduped, ["a", "c"]);
});
