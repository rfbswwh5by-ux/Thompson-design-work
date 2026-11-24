import { createContext, useContext } from "react";
import { BRAND, FAQS, HERO, SERVICES } from "@/lib/site-defaults";

const SiteContentContext = createContext(null);

/**
 * Published site content (settings, copy, services, portfolio, FAQs,
 * testimonials), loaded by the site layout. Falls back to the studio's own
 * default copy so the site is never blank while content is being set up.
 */
export function SiteContentProvider({ data, children }) {
  const value = {
    settings: data?.settings ?? { business_name: BRAND.name, email: BRAND.email, phone: BRAND.phone },
    content: data?.content ?? HERO,
    services: data?.services?.length ? data.services : SERVICES,
    faqs: data?.faqs?.length ? data.faqs : FAQS,
    projects: data?.projects ?? [],
    testimonials: data?.testimonials ?? [],
  };
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext) ?? {};
}

export function heroFrom(content) {
  if (!content) return HERO;
  return {
    eyebrow: content.hero_eyebrow || HERO.eyebrow,
    headlineTop: content.hero_headline_top || HERO.headlineTop,
    headlineAccent: content.hero_headline_accent || HERO.headlineAccent,
    headlineBottom: content.hero_headline_bottom || HERO.headlineBottom,
    headline: content.hero_headline || HERO.headline,
    description: content.hero_description || HERO.description,
    primaryCta: content.hero_primary_cta || HERO.primaryCta,
    secondaryCta: content.hero_secondary_cta || HERO.secondaryCta,
  };
}