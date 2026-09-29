export type Category = 'single' | 'ttc' | 'portal';
export type Alignment = 'tangent' | 'inside' | 'outside';
export type Soil = 'normal' | 'hard' | 'loose' | 'dry-cotton' | 'wet-cotton';
export type Role = 'N/NACC' | 'ACC' | 'ACA' | 'OLI' | 'OLC' | 'OLA/BWA';
export type Config = { category: Category; wind: number; implantation: number; alignment: Alignment; radius: number; span: number; role: Role; soil: Soil; tracks: number; portalSpan: number; portalType: string };

export const windZones = [73, 105, 136, 155, 178, 216];
export const spans = [22.5, 31.5, 36, 40.5, 45, 49.5, 54, 58.5, 63, 67.5, 72];
export const roles: { value: Role; label: string; detail: string }[] = [
  { value: 'N/NACC', label: 'N / NACC', detail: 'Normal mast' },
  { value: 'ACC', label: 'ACC', detail: 'Anti-creep centre' },
  { value: 'ACA', label: 'ACA', detail: 'Anti-creep anchor' },
  { value: 'OLI', label: 'OLI', detail: 'Overlap intermediate' },
  { value: 'OLC', label: 'OLC', detail: 'Overlap central' },
  { value: 'OLA/BWA', label: 'OLA / BWA', detail: 'Overlap / weight anchor' },
];
export const soils: { value: Soil; label: string; capacity: number }[] = [
  { value: 'normal', label: 'Normal soil', capacity: 11000 },
  { value: 'hard', label: 'Hard soil', capacity: 21500 },
  { value: 'loose', label: 'Loose soil', capacity: 5500 },
  { value: 'dry-cotton', label: 'Dry black cotton', capacity: 16500 },
  { value: 'wet-cotton', label: 'Wet black cotton', capacity: 8000 },
];
export const portalTypes = [
  { value: 'N', label: 'N-Type', maxTracks: 4, minSpan: 10, maxSpan: 20.4 },
  { value: 'O', label: 'O-Type', maxTracks: 6, minSpan: 20, maxSpan: 30.5 },
  { value: 'R', label: 'R-Type', maxTracks: 8, minSpan: 30, maxSpan: 36 },
  { value: 'P', label: 'P-Type', maxTracks: 4, minSpan: 10, maxSpan: 20.4 },
  { value: 'G', label: 'G-Type', maxTracks: 4, minSpan: 10, maxSpan: 20.4 },
  { value: 'BFB', label: 'BFB-Type', maxTracks: 4, minSpan: 10, maxSpan: 24.6 },
];
const fbmCodes = [135, 140, 147, 154, 161, 168, 173, 178, 185, 193, 199, 254, 260, 265, 270, 363, 374, 389, 395, 399];

export function calculate(config: Config) {
  const { category, wind, implantation, alignment, radius, span, role, soil, portalSpan, portalType, tracks } = config;
  const versine = alignment === 'tangent' ? 0 : (span * span / (8 * radius)) * 1000;
  const minSetting = alignment === 'inside' ? (radius >= 3500 ? 3.2 : radius >= 2350 ? 3.35 : radius >= 1150 ? 3.55 : 3.6) : alignment === 'outside' ? (radius >= 875 ? 2.8 : 2.95) : 2.8;
  const implantationBand = implantation <= 3 ? 'Standard' : implantation <= 3.8 ? 'Higher implantation' : 'Extra large';
  const windBand = wind <= 75 ? 'Light' : wind <= 112.5 ? 'Medium' : wind <= 155 ? 'Heavy' : 'Severe';
  const mast = category === 'portal' ? `${portalType}-Type portal` : category === 'ttc' ? 'Two-track cantilever' : wind >= 178 || implantation > 3.8 ? 'K-225 fabricated mast' : wind >= 136 || role === 'OLA/BWA' ? 'K-175 fabricated mast' : 'K-125 fabricated mast';
  const codeIndex = Math.min(fbmCodes.length - 1, Math.floor((wind - 73) / 30) + Math.floor((implantation - 2.8) / 0.45) + (alignment !== 'tangent' ? 1 : 0) + (role === 'OLA/BWA' ? 2 : 0) + (category === 'portal' ? 5 : category === 'ttc' ? 2 : 0));
  const fbm = fbmCodes[Math.max(0, codeIndex)] ?? 135;
  const number = Math.min(13, Math.max(1, Math.ceil((fbm - 100) / 25)));
  const foundation = category === 'portal' ? `P-${Math.min(18, number + 2)}` : soil === 'hard' ? `HB-${String(Math.min(11, number)).padStart(2, '0')}` : soil === 'loose' ? `BG-${String(Math.min(14, number)).padStart(2, '0')}` : soil === 'dry-cotton' ? `NBC-${100 + Math.min(52, number * 4)}` : soil === 'wet-cotton' ? `WBC-${Math.min(33, 19 + number)}` : `B-${String(number).padStart(2, '0')}`;
  const a = category === 'portal' ? 1.9 : soil === 'loose' ? 1.5 : 1.2;
  const b = category === 'portal' ? 1.9 : soil === 'loose' ? 1.4 : 1.2;
  const h = category === 'portal' ? 2.5 : soil === 'loose' ? 2.3 : 2.1;
  const baseVolume = a * b * h;
  const muffVolume = role === 'OLA/BWA' ? 0.08 : 0.02;
  const portal = portalTypes.find(p => p.value === portalType) ?? { value: 'N', label: 'N-Type', maxTracks: 4, minSpan: 10, maxSpan: 20.4 };
  const portalValid = category !== 'portal' || (tracks <= portal.maxTracks && portalSpan >= portal.minSpan && portalSpan <= portal.maxSpan);
  const settingValid = implantation >= minSetting;
  return { versine, minSetting, implantationBand, windBand, mast, fbm, foundation, a, b, h, baseVolume, muffVolume, totalVolume: baseVolume + muffVolume, reverseDeflection: role === 'OLA/BWA' ? -30 : 30, portalValid, settingValid, soilCapacity: soils.find(s => s.value === soil)?.capacity ?? 11000 };
}
