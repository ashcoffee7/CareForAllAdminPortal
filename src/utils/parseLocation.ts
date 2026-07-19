// profiles.location is a single free-text field members typed themselves
// during signup -- no fixed format. Real examples seen: "Stone mountain,
// Georgia", "Boston,MA", "NA, tunisia". So this doesn't try to parse
// positionally (city vs state vs country) -- it splits on comma and
// matches each segment against known US state names/abbreviations and
// country names instead.
//
// US states are checked before countries, because a couple of state
// names collide with country names (Georgia being the obvious one) --
// given how few non-US entries exist in practice, defaulting an
// ambiguous single-word match to the US state is the safer guess.
export interface ParsedLocation {
  state: string | null;
  country: string | null;
}

const US_STATE_NAMES: string[] = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia',
];

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
  hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa', ks: 'Kansas',
  ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland', ma: 'Massachusetts',
  mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri', mt: 'Montana',
  ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey', nm: 'New Mexico',
  ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio', ok: 'Oklahoma',
  or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
  sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont',
  va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming',
  dc: 'District of Columbia',
};

const US_STATE_LOOKUP: Record<string, string> = { ...US_STATE_ABBREVIATIONS };
US_STATE_NAMES.forEach((name) => { US_STATE_LOOKUP[name.toLowerCase()] = name; });

const COUNTRY_NAMES: string[] = [
  'United States', 'Canada', 'Mexico', 'United Kingdom', 'Ireland', 'France', 'Germany',
  'Spain', 'Portugal', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Poland', 'Czech Republic',
  'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Turkey', 'Ukraine', 'Russia',
  'Belarus', 'Georgia', 'Armenia', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Estonia',
  'Latvia', 'Lithuania', 'Croatia', 'Serbia', 'Slovenia', 'Bosnia and Herzegovina',
  'Albania', 'North Macedonia', 'Montenegro', 'Moldova', 'Cyprus', 'Malta', 'Luxembourg',
  'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Sudan', 'South Sudan', 'Ethiopia',
  'Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi',
  'Democratic Republic of the Congo', 'Republic of the Congo', 'Gabon', 'Cameroon',
  'Nigeria', 'Ghana', 'Ivory Coast', 'Senegal', 'Mali', 'Niger', 'Chad',
  'Central African Republic', 'Benin', 'Togo', 'Burkina Faso', 'Guinea',
  'Sierra Leone', 'Liberia', 'Mauritania', 'Gambia', 'Guinea-Bissau', 'Cape Verde',
  'South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Zambia', 'Malawi', 'Mozambique',
  'Madagascar', 'Mauritius', 'Angola', 'Lesotho', 'Eswatini',
  'China', 'Japan', 'South Korea', 'North Korea', 'Mongolia', 'Taiwan', 'Hong Kong',
  'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Myanmar',
  'Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Malaysia', 'Singapore', 'Indonesia',
  'Philippines', 'Brunei', 'Timor-Leste',
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Yemen',
  'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Iran', 'Israel', 'Palestine', 'Afghanistan',
  'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea',
  'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Ecuador', 'Bolivia',
  'Paraguay', 'Uruguay', 'Guyana', 'Suriname',
  'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama',
  'Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Trinidad and Tobago', 'Bahamas',
  'Barbados', 'Antigua and Barbuda', 'Saint Lucia', 'Grenada', 'Dominica',
  'Saint Kitts and Nevis', 'Saint Vincent and the Grenadines', 'Montserrat',
];

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States', us: 'United States', america: 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom', britain: 'United Kingdom', 'great britain': 'United Kingdom',
  'south korea': 'South Korea', korea: 'South Korea',
  uae: 'United Arab Emirates',
  "cote d'ivoire": 'Ivory Coast', "côte d'ivoire": 'Ivory Coast', 'cote divoire': 'Ivory Coast',
  'dr congo': 'Democratic Republic of the Congo', drc: 'Democratic Republic of the Congo',
};

const COUNTRY_LOOKUP: Record<string, string> = { ...COUNTRY_ALIASES };
COUNTRY_NAMES.forEach((name) => { COUNTRY_LOOKUP[name.toLowerCase()] = name; });

// Trailing periods ("MA.") and stray apostrophe-like marks (the okina in
// "Hawai`i") show up in free-typed entries but aren't part of the actual
// name, so they're stripped before matching.
function normalizeSegment(segment: string): string {
  return segment.trim().toLowerCase().replace(/\.+$/, '').replace(/[’'`ʻ]/g, '');
}

function matchSegment(seg: string): ParsedLocation | null {
  const state = US_STATE_LOOKUP[seg];
  if (state) { return { state, country: 'United States' }; }
  const country = COUNTRY_LOOKUP[seg];
  if (country) { return { state: null, country }; }
  return null;
}

export function parseLocation(location: string | null | undefined): ParsedLocation {
  if (!location || !location.trim()) { return { state: null, country: null }; }

  // "na"/"n/a" segments are placeholders (e.g. an international member
  // leaving the state segment as "NA") -- drop just that segment rather
  // than the whole entry, so the remaining segment can still match a
  // country.
  const segments = location.split(/[,/]/)
    .map(normalizeSegment)
    .filter((seg) => seg && seg !== 'na' && seg !== 'n/a');

  for (const seg of segments) {
    const match = matchSegment(seg);
    if (match) { return match; }
  }

  // No comma/slash delimiter (e.g. "Chesterfield Virginia", or
  // "Zimbabwe Bulawayo" written country-first) -- fall back to checking
  // whether the head or tail of the single segment is a known state or
  // country name, trying the longest word-window first since names can be
  // multiple words ("West Virginia", "United Arab Emirates").
  if (segments.length === 1) {
    const words = segments[0].split(/\s+/).filter(Boolean);
    for (let windowSize = words.length - 1; windowSize >= 1; windowSize--) {
      const suffix = words.slice(words.length - windowSize).join(' ');
      const suffixMatch = matchSegment(suffix);
      if (suffixMatch) { return suffixMatch; }

      const prefix = words.slice(0, windowSize).join(' ');
      const prefixMatch = matchSegment(prefix);
      if (prefixMatch) { return prefixMatch; }
    }
  }

  return { state: null, country: null };
}
