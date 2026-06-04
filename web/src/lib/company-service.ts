import { getCompanyMdaText, getCompanyProfile } from "./company-data";
import { summarizeMda } from "./mda-summarizer";
import type { CompanyProfile, MdaSummaryResult } from "./types";

export function resolveCompanyProfile(symbol: string): CompanyProfile | null {
  return getCompanyProfile(symbol);
}

export function buildMdaSummary(symbol: string): MdaSummaryResult | null {
  const profile = resolveCompanyProfile(symbol);
  if (!profile) return null;

  const rawText = getCompanyMdaText(profile.symbol, profile.name, profile.market);
  const { summary, highlights } = summarizeMda(rawText, profile.symbol, profile.latestQuarter);

  return {
    symbol: profile.symbol,
    quarter: profile.latestQuarter,
    downloadedAt: new Date().toISOString(),
    summary,
    highlights,
    rawText,
  };
}
