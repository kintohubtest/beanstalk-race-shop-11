import type { Address, TaxClass } from '../types.ts';

export interface TaxComponents {
  federal: number;
  regional: number;
}

/** Sales tax by country, then by region (province or state), split into federal and regional parts. */
const RATES: Record<string, Record<string, TaxComponents>> = {
  CA: {
    AB: { federal: 0.05, regional: 0 },
    BC: { federal: 0.05, regional: 0.07 },
    MB: { federal: 0.05, regional: 0.07 },
    NB: { federal: 0.05, regional: 0.1 },
    NL: { federal: 0.05, regional: 0.1 },
    NS: { federal: 0.05, regional: 0.1 },
    NT: { federal: 0.05, regional: 0 },
    NU: { federal: 0.05, regional: 0 },
    ON: { federal: 0.05, regional: 0.08 },
    PE: { federal: 0.05, regional: 0.1 },
    QC: { federal: 0.05, regional: 0.09 },
    SK: { federal: 0.05, regional: 0.06 },
    YT: { federal: 0.05, regional: 0 },
  },
  US: {
    CA: { federal: 0, regional: 0.0725 },
    FL: { federal: 0, regional: 0.06 },
    NY: { federal: 0, regional: 0.04 },
    OR: { federal: 0, regional: 0 },
    TX: { federal: 0, regional: 0.0625 },
    WA: { federal: 0, regional: 0.065 },
  },
};

const NO_TAX: TaxComponents = { federal: 0, regional: 0 };

/** Share of the full rate charged on `reduced` goods such as food. */
const REDUCED_SHARE = 0.5;

/**
 * The federal and regional tax rates (fractions, 0.05 = 5%) that apply to goods of
 * `taxClass` shipped to `address`. Unknown regions fall back to `fallback`, all regional.
 */
export function taxComponentsFor(address: Address, taxClass: TaxClass, fallback: number): TaxComponents {
  if (taxClass === 'exempt') return NO_TAX;
  const country = address.country.toUpperCase();
  const region = address.region.toUpperCase();
  const full = RATES[country]?.[region] ?? { federal: 0, regional: fallback };
  const share = taxClass === 'reduced' ? REDUCED_SHARE : 1;
  return { federal: full.federal * share, regional: full.regional * share };
}

/** The combined rate (a fraction, 0.13 = 13%). */
export function taxRateFor(address: Address, taxClass: TaxClass, fallback: number): number {
  const { federal, regional } = taxComponentsFor(address, taxClass, fallback);
  // Round away floating point noise such as 0.05 + 0.07.
  return Math.round((federal + regional) * 1e6) / 1e6;
}
