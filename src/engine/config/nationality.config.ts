export interface NationalityConfig {
  name: string;
  locale: string;
}

export const NATIONALITIES: Record<string, NationalityConfig> = {
  POL: { name: 'Poland', locale: 'pl' },
  GER: { name: 'Germany', locale: 'de' },
  NED: { name: 'Netherlands', locale: 'nl' },
  BEL: { name: 'Belgium', locale: 'nl_BE' },
  FRA: { name: 'France', locale: 'fr' },
  CZE: { name: 'Czech Republic', locale: 'cs_CZ' },
  SPA: { name: 'Spain', locale: 'es' },
  ITA: { name: 'Italy', locale: 'it' },
  SUI: { name: 'Switzerland', locale: 'de_CH' },
  GBR: { name: 'Great Britain', locale: 'en' },
};
