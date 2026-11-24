import {
  CountryCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';

export type SupportedCurrency = 'EGP' | 'USD' | 'AED' | 'SAR' | 'GBP' | 'EUR';

export interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  defaultCurrency: SupportedCurrency;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', defaultCurrency: 'EGP' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', defaultCurrency: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', defaultCurrency: 'SAR' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', defaultCurrency: 'GBP' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', defaultCurrency: 'USD' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', defaultCurrency: 'USD' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', defaultCurrency: 'USD' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', defaultCurrency: 'USD' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', defaultCurrency: 'USD' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', defaultCurrency: 'USD' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', defaultCurrency: 'USD' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', defaultCurrency: 'EUR' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', defaultCurrency: 'EUR' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', defaultCurrency: 'EUR' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', defaultCurrency: 'EUR' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', defaultCurrency: 'USD' },
];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EGP: 'EGP',
  USD: '$',
  AED: 'AED',
  SAR: 'SAR',
  GBP: '£',
  EUR: '€',
};

export const ALL_CURRENCIES: SupportedCurrency[] = [
  'EGP',
  'USD',
  'AED',
  'SAR',
  'GBP',
  'EUR',
];

/**
 * Converts a 2-letter ISO country code (e.g. "EG") to its regional indicator flag emoji ("🇪🇬").
 */
export function countryCodeToFlag(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const upper = countryCode.toUpperCase();
  const codePoints = [...upper].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getCountryName(countryCode?: string | null): string {
  if (!countryCode) return '';
  const match = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode.toUpperCase());
  return match ? match.name : countryCode.toUpperCase();
}

export function getDefaultCurrencyForCountry(
  countryCode: CountryCode = 'EG'
): SupportedCurrency {
  const match = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
  return match ? match.defaultCurrency : 'EGP';
}

export interface ParsedPhoneResult {
  isValid: boolean;
  e164: string;              // e.g. "+201012345678"
  international: string;     // e.g. "+20 10 1234 5678"
  country?: CountryCode;     // e.g. "EG"
  flag: string;              // e.g. "🇪🇬"
  error?: string;
}

/**
 * Parses, validates, and normalizes any user-entered phone string into canonical E.164 format
 * using libphonenumber-js.
 * - Numbers starting with "00" are converted to "+" (international prefix).
 * - Numbers starting with "+" are parsed as international.
 * - Numbers without "+" or "00" are parsed using `defaultCountry` (default: 'EG').
 */
export function parseAndValidatePhone(
  rawInput: string,
  defaultCountry: CountryCode = 'EG'
): ParsedPhoneResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      e164: '',
      international: '',
      flag: countryCodeToFlag(defaultCountry),
      error: 'Phone number is required.',
    };
  }

  // Normalize Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) if pasted from mobile dialer
  const asciiNormalized = trimmed.replace(/[٠-٩]/g, (d) =>
    String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  );

  // Clean visual separators while keeping leading +
  let prepped = asciiNormalized.replace(/[\s\-().]/g, '');
  if (prepped.startsWith('00')) {
    prepped = '+' + prepped.slice(2);
  }

  try {
    const parsed = prepped.startsWith('+')
      ? parsePhoneNumberFromString(prepped)
      : parsePhoneNumberFromString(prepped, defaultCountry);

    if (!parsed || !parsed.isValid()) {
      const targetCountryName =
        getCountryName(parsed?.country || defaultCountry) || defaultCountry;
      return {
        isValid: false,
        e164: '',
        international: trimmed,
        country: parsed?.country || defaultCountry,
        flag: countryCodeToFlag(parsed?.country || defaultCountry),
        error: prepped.startsWith('+')
          ? `Invalid international phone number${parsed?.country ? ` for ${targetCountryName}` : ''}.`
          : `Invalid phone number for ${targetCountryName} (${defaultCountry}). Include +country code for other countries.`,
      };
    }

    const detectedCountry = parsed.country || defaultCountry;
    return {
      isValid: true,
      e164: parsed.number, // Canonical E.164 (+201012345678)
      international: parsed.formatInternational(),
      country: detectedCountry,
      flag: countryCodeToFlag(detectedCountry),
    };
  } catch {
    return {
      isValid: false,
      e164: '',
      international: trimmed,
      flag: countryCodeToFlag(defaultCountry),
      error: 'Could not parse phone number.',
    };
  }
}

/**
 * Formats a stored E.164 phone number into a readable international display string with a country flag.
 */
export function formatPhoneWithFlag(
  e164Phone?: string | null,
  fallbackCountry: CountryCode = 'EG'
): { flag: string; formatted: string; country?: CountryCode } {
  if (!e164Phone) {
    return { flag: '—', formatted: '—' };
  }
  const parsed = parsePhoneNumberFromString(e164Phone, fallbackCountry);
  if (!parsed) {
    return {
      flag: countryCodeToFlag(fallbackCountry),
      formatted: e164Phone,
    };
  }
  return {
    flag: countryCodeToFlag(parsed.country || fallbackCountry),
    formatted: parsed.formatInternational(),
    country: parsed.country,
  };
}

/**
 * Builds a `tel:` link using canonical E.164 format (+201012345678).
 */
export function buildTelLink(e164Phone: string): string {
  const parsed = parsePhoneNumberFromString(e164Phone);
  const canonical = parsed ? parsed.number : e164Phone.replace(/[^\d+]/g, '');
  return `tel:${canonical}`;
}

/**
 * Builds a `https://wa.me/` link using digits only (no `+` sign).
 */
export function buildWhatsAppLink(e164Phone: string, message: string): string {
  const parsed = parsePhoneNumberFromString(e164Phone);
  const digitsOnly = (parsed ? parsed.number : e164Phone).replace(/[^\d]/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${digitsOnly}?text=${encodedMsg}`;
}

export function formatBudgetWithCurrency(
  budget?: number | null,
  currency: SupportedCurrency = 'EGP'
): string {
  if (budget === null || budget === undefined || Number.isNaN(Number(budget))) {
    return '—';
  }
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(budget));

  if (symbol === '$' || symbol === '£' || symbol === '€') {
    return `${symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${symbol}`;
}
