export type Alignment = 'tangent' | 'inside' | 'outside';
export type Role = 'N/NACC' | 'ACC' | 'ACA' | 'OLI' | 'OLC' | 'OLA/BWA';
export type ImplantationMode = 'standard' | 'custom';
export type FoundationTypeKey = 'bType' | 'bgType' | 'ngType' | 'hbType' | 'nbcType' | 'wbcType';

export interface OheConfig {
  wind: number | null; // 73, 105, 136, 155, 178, 216 kgf/m² (IS:875 / RDSO Sheets 1-18)
  implantationMode: ImplantationMode;
  implantation: number | null; // 3.00 for standard, 3.00 - 5.00 for custom
  stepLevel: number; // 0.00 to 2.00 m (Cess Step Level Difference C from Rail Level to Foundation Top)
  alignment: Alignment | null;
  radius: number; // 200 to 2500 m
  span: number; // 22.5 to 72 m
  role: Role | null;
}

export const windZones = [
  { value: 73, label: '73 kgf/m²', zone: 'Light', speed: '33 m/s', desc: 'Sheets 1–3: Blue region, basic wind speed 33 m/s' },
  { value: 105, label: '105 kgf/m²', zone: 'Medium', speed: '39 m/s', desc: 'Sheets 4–6: Yellow region, basic wind speed 39 m/s' },
  { value: 136, label: '136 kgf/m²', zone: 'Heavy', speed: '44 m/s', desc: 'Sheets 7–9: Sky blue region, basic wind speed 44 m/s' },
  { value: 155, label: '155 kgf/m²', zone: 'Heavy II', speed: '47 m/s', desc: 'Sheets 10–12: Green region, basic wind speed 47 m/s' },
  { value: 178, label: '178 kgf/m²', zone: 'Severe', speed: '50 m/s', desc: 'Sheets 13–15: Red region, basic wind speed 50 m/s' },
  { value: 216, label: '216 kgf/m²', zone: 'Severe II', speed: '55 m/s', desc: 'Sheets 16–18: Pink region, basic wind speed 55 m/s' },
];

export const spans = [22.5, 27.0, 31.5, 36.0, 40.5, 45.0, 49.5, 54.0, 58.5, 63.0, 67.5, 72.0];

export const roles: { value: Role; label: string; title: string; detail: string }[] = [
  { value: 'N/NACC', label: 'N / NACC', title: 'Normal Mast', detail: 'Single cantilever support on tangent or mild curve' },
  { value: 'ACC', label: 'ACC', title: 'Anti-Creep Centre', detail: 'Anchors catenary and contact wire at centre of tension length' },
  { value: 'ACA', label: 'ACA', title: 'Anti-Creep Anchor', detail: 'Terminates anti-creep wire to anchor foundation' },
  { value: 'OLI', label: 'OLI', title: 'Overlap Intermediate', detail: 'Supports 2 cantilevers at insulated / uninsulated overlap' },
  { value: 'OLC', label: 'OLC', title: 'Overlap Central', detail: 'Central mast in 3-span or 4-span overlap zone' },
  { value: 'OLA/BWA', label: 'OLA / BWA', title: 'Overlap / Weight Anchor', detail: 'Anchor mast with regulating equipment, pulleys & counterweights' },
];

// ==============================================================================
// KEC INTERNATIONAL / RVNL / SECR APPROVED DRAWING CHARTS
// Image 1 (KEC Sheet No. 01) & Image 2 (KEC Sheet No. 02): Common loadings
// Image 3 (Page No. 01): B-Type (DRG NO. TI/CIV/FND/RDSO/00001/12/0 SHEET-1)
// Image 4 (Page No. 03): BG-Type Side Gravity (DRG NO. TI/CIV/FND/RDSO/00001/12/0 SHEET-1)
// Image 5 (Page No. 05): NG-Type Pure Gravity (DRG NO. TI/CIV/FND/RDSO/00001/12/0 SHEET-2)
// ==============================================================================

export interface KecScheduleRow {
  load: number; // kg
  moment: number; // kg.m
  b: string; // B-Type (11,000 kgf/m²)
  hb: string; // HB-Type (21,500 kgf/m²)
  bg8k: string; // BG-Type (8,000 kgf/m²)
  bg11k: string; // BG-Type (11,000 kgf/m²)
  mg5k: string; // Pure Gravity MG (5,500 kgf/m²)
  mg8k: string; // Pure Gravity MG (8,000 kgf/m²)
  mg11k: string; // Pure Gravity MG (11,000 kgf/m²)
  nbc16k: string; // Dry BC (16,500 kgf/m²)
  nbc11k: string; // Dry BC (11,000 kgf/m²)
  nbc8k: string; // Dry BC (8,000 kgf/m²)
  ng5k: string; // NG (5,500 kgf/m²)
  ng8k: string; // NG (8,000 kgf/m²)
  ng11k: string; // NG (11,000 kgf/m²)
  wbc8k: string; // Wet BC (8,000 kgf/m²)
}

export const KEC_FDN_SCHEDULE: Record<number, KecScheduleRow> = {
  115: { load: 700, moment: 1500, b: 'B-01', hb: 'HB-1', bg8k: 'BG-0', bg11k: 'BG-01', mg5k: 'MG-2', mg8k: 'MG-1', mg11k: 'MG-0', nbc16k: 'NBC-101', nbc11k: 'NBC-103', nbc8k: 'NBC-140', ng5k: 'NG-24', ng8k: 'NG-21', ng11k: 'NG-21', wbc8k: 'WBC-20' },
  120: { load: 700, moment: 2000, b: 'B-0',  hb: 'HB-1', bg8k: 'BG-1', bg11k: 'BG-0',  mg5k: 'MG-2', mg8k: 'MG-1', mg11k: 'MG-0', nbc16k: 'NBC-102', nbc11k: 'NBC-120', nbc8k: 'NBC-141', ng5k: 'NG-26', ng8k: 'NG-22', ng11k: 'NG-22', wbc8k: 'WBC-21' },
  125: { load: 700, moment: 2500, b: 'B-1',  hb: 'HB-1', bg8k: 'BG-2', bg11k: 'BG-1',  mg5k: 'MG-3', mg8k: 'MG-2', mg11k: 'MG-1', nbc16k: 'NBC-102', nbc11k: 'NBC-121', nbc8k: 'NBC-142', ng5k: 'NG-28', ng8k: 'NG-23', ng11k: 'NG-23', wbc8k: 'WBC-22' },
  130: { load: 700, moment: 3000, b: 'B-2',  hb: 'HB-1', bg8k: 'BG-3', bg11k: 'BG-2',  mg5k: 'MG-5', mg8k: 'MG-3', mg11k: 'MG-2', nbc16k: 'NBC-104', nbc11k: 'NBC-122', nbc8k: 'NBC-144', ng5k: 'NG-29', ng8k: 'NG-24', ng11k: 'NG-24', wbc8k: 'WBC-24' },
  135: { load: 700, moment: 3500, b: 'B-3',  hb: 'HB-2', bg8k: 'BG-5', bg11k: 'BG-3',  mg5k: 'MG-6', mg8k: 'MG-3', mg11k: 'MG-3', nbc16k: 'NBC-104', nbc11k: 'NBC-123', nbc8k: 'NBC-146', ng5k: 'NG-31', ng8k: 'NG-25', ng11k: 'NG-25', wbc8k: 'WBC-25' },
  140: { load: 700, moment: 4000, b: 'B-4',  hb: 'HB-3', bg8k: 'BG-6', bg11k: 'BG-4',  mg5k: 'MG-7', mg8k: 'MG-5', mg11k: 'MG-4', nbc16k: 'NBC-105', nbc11k: 'NBC-124', nbc8k: 'NBC-147', ng5k: 'NG-33', ng8k: 'NG-26', ng11k: 'NG-26', wbc8k: 'WBC-25' },
  147: { load: 700, moment: 4700, b: 'B-5',  hb: 'HB-4', bg8k: 'BG-7', bg11k: 'BG-6',  mg5k: 'MG-8', mg8k: 'MG-6', mg11k: 'MG-5', nbc16k: 'NBC-106', nbc11k: 'NBC-126', nbc8k: 'NBC-149', ng5k: 'NG-35', ng8k: 'NG-28', ng11k: 'NG-28', wbc8k: 'WBC-27' },
  154: { load: 700, moment: 5400, b: 'B-6',  hb: 'HB-5', bg8k: 'BG-9', bg11k: 'BG-6',  mg5k: 'MG-9', mg8k: 'MG-7', mg11k: 'MG-6', nbc16k: 'NBC-107', nbc11k: 'NBC-127', nbc8k: 'NBC-150', ng5k: 'NG-37', ng8k: 'NG-30', ng11k: 'NG-30', wbc8k: 'WBC-28' },
  161: { load: 700, moment: 6100, b: 'B-7',  hb: 'HB-6', bg8k: 'BG-9', bg11k: 'BG-7',  mg5k: 'MG-13', mg8k: 'MG-8', mg11k: 'MG-7', nbc16k: 'NBC-108', nbc11k: 'NBC-128', nbc8k: 'NBC-152', ng5k: 'NG-38', ng8k: 'NG-31', ng11k: 'NG-31', wbc8k: 'WBC-29' },
  168: { load: 700, moment: 6800, b: 'B-8',  hb: 'HB-6', bg8k: 'BG-10', bg11k: 'BG-9', mg5k: 'MG-13', mg8k: 'MG-9', mg11k: 'MG-8', nbc16k: 'NBC-109', nbc11k: 'NBC-129', nbc8k: 'NBC-152', ng5k: 'SPL', ng8k: 'NG-31', ng11k: 'NG-31', wbc8k: 'WBC-29' },
  173: { load: 700, moment: 7300, b: 'B-9',  hb: 'HB-7', bg8k: 'BG-11', bg11k: 'BG-9', mg5k: 'MG-14', mg8k: 'MG-10', mg11k: 'MG-9', nbc16k: 'NBC-109', nbc11k: 'NBC-130', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-32', ng11k: 'NG-32', wbc8k: 'WBC-30' },
  178: { load: 700, moment: 7800, b: 'B-10', hb: 'HB-7', bg8k: 'BG-12', bg11k: 'BG-10', mg5k: 'MG-15', mg8k: 'MG-12', mg11k: 'MG-10', nbc16k: 'NBC-110', nbc11k: 'NBC-131', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-33', ng11k: 'NG-33', wbc8k: 'WBC-31' },
  185: { load: 700, moment: 8500, b: 'B-10', hb: 'HB-7', bg8k: 'BG-13', bg11k: 'BG-11', mg5k: 'MG-15', mg8k: 'MG-12', mg11k: 'MG-10', nbc16k: 'NBC-110', nbc11k: 'NBC-132', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-34', ng11k: 'NG-34', wbc8k: 'WBC-32' },
  193: { load: 700, moment: 9300, b: 'B-11', hb: 'HB-8', bg8k: 'BG-14', bg11k: 'BG-12', mg5k: 'MG-16', mg8k: 'MG-13', mg11k: 'MG-11', nbc16k: 'SPL', nbc11k: 'NBC-132', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-36', ng11k: 'NG-36', wbc8k: 'WBC-33' },
  199: { load: 700, moment: 10100, b: 'B-11', hb: 'HB-9', bg8k: 'SPL', bg11k: 'BG-13', mg5k: 'MG-17', mg8k: 'MG-13', mg11k: 'MG-11', nbc16k: 'SPL', nbc11k: 'NBC-133', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-37', ng11k: 'NG-37', wbc8k: 'WBC-33' },

  220: { load: 1600, moment: 2000, b: 'B-2',  hb: 'HB-1', bg8k: 'BG-1', bg11k: 'BG-0',  mg5k: 'MG-3', mg8k: 'MG-1', mg11k: 'MG-0', nbc16k: 'NBC-102', nbc11k: 'NBC-120', nbc8k: 'NBC-141', ng5k: 'NG-28', ng8k: 'NG-22', ng11k: 'NG-22', wbc8k: 'WBC-21' },
  225: { load: 1600, moment: 2500, b: 'B-3',  hb: 'HB-2', bg8k: 'BG-3', bg11k: 'BG-1',  mg5k: 'MG-4', mg8k: 'MG-2', mg11k: 'MG-1', nbc16k: 'NBC-102', nbc11k: 'NBC-121', nbc8k: 'NBC-143', ng5k: 'NG-28', ng8k: 'NG-23', ng11k: 'NG-22', wbc8k: 'WBC-22' },
  234: { load: 1600, moment: 3400, b: 'B-4',  hb: 'HB-3', bg8k: 'BG-6', bg11k: 'BG-3',  mg5k: 'MG-6', mg8k: 'MG-4', mg11k: 'MG-2', nbc16k: 'NBC-104', nbc11k: 'NBC-123', nbc8k: 'NBC-145', ng5k: 'NG-32', ng8k: 'NG-25', ng11k: 'NG-24', wbc8k: 'WBC-25' },
  240: { load: 1600, moment: 4000, b: 'B-5',  hb: 'HB-4', bg8k: 'BG-7', bg11k: 'BG-4',  mg5k: 'MG-7', mg8k: 'MG-5', mg11k: 'MG-3', nbc16k: 'NBC-105', nbc11k: 'NBC-124', nbc8k: 'NBC-148', ng5k: 'NG-34', ng8k: 'NG-26', ng11k: 'NG-26', wbc8k: 'WBC-26' },
  245: { load: 1600, moment: 4500, b: 'B-6',  hb: 'HB-5', bg8k: 'BG-8', bg11k: 'BG-5',  mg5k: 'MG-8', mg8k: 'MG-6', mg11k: 'MG-4', nbc16k: 'NBC-105', nbc11k: 'NBC-125', nbc8k: 'NBC-149', ng5k: 'NG-36', ng8k: 'NG-28', ng11k: 'NG-28', wbc8k: 'WBC-27' },
  250: { load: 1600, moment: 5000, b: 'B-7',  hb: 'HB-6', bg8k: 'BG-9', bg11k: 'BG-6',  mg5k: 'MG-9', mg8k: 'MG-6', mg11k: 'MG-5', nbc16k: 'NBC-106', nbc11k: 'NBC-127', nbc8k: 'NBC-150', ng5k: 'NG-37', ng8k: 'NG-29', ng11k: 'NG-29', wbc8k: 'WBC-28' },
  254: { load: 1600, moment: 5400, b: 'B-7',  hb: 'HB-6', bg8k: 'BG-9', bg11k: 'BG-6',  mg5k: 'MG-10', mg8k: 'MG-7', mg11k: 'MG-6', nbc16k: 'NBC-107', nbc11k: 'NBC-127', nbc8k: 'NBC-151', ng5k: 'NG-37', ng8k: 'NG-30', ng11k: 'NG-30', wbc8k: 'WBC-28' },
  260: { load: 1600, moment: 6000, b: 'B-8',  hb: 'HB-6', bg8k: 'BG-10', bg11k: 'BG-7', mg5k: 'MG-13', mg8k: 'MG-8', mg11k: 'MG-7', nbc16k: 'NBC-108', nbc11k: 'NBC-128', nbc8k: 'NBC-152', ng5k: 'NG-38', ng8k: 'NG-31', ng11k: 'NG-31', wbc8k: 'WBC-29' },
  265: { load: 1600, moment: 6500, b: 'B-9',  hb: 'HB-8', bg8k: 'BG-11', bg11k: 'BG-9', mg5k: 'MG-13', mg8k: 'MG-8', mg11k: 'MG-7', nbc16k: 'NBC-108', nbc11k: 'NBC-129', nbc8k: 'NBC-152', ng5k: 'SPL', ng8k: 'NG-31', ng11k: 'NG-31', wbc8k: 'WBC-29' },
  270: { load: 1600, moment: 7000, b: 'B-10', hb: 'HB-9', bg8k: 'BG-11', bg11k: 'BG-9', mg5k: 'MG-14', mg8k: 'MG-10', mg11k: 'MG-8', nbc16k: 'NBC-109', nbc11k: 'NBC-130', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-32', ng11k: 'NG-32', wbc8k: 'WBC-30' },
  275: { load: 1600, moment: 7500, b: 'B-10', hb: 'HB-9', bg8k: 'BG-12', bg11k: 'BG-10', mg5k: 'MG-15', mg8k: 'MG-12', mg11k: 'MG-9', nbc16k: 'NBC-109', nbc11k: 'NBC-131', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-32', ng11k: 'NG-32', wbc8k: 'WBC-31' },

  325: { load: 3000, moment: 2500, b: 'B-4',  hb: 'HB-3', bg8k: 'BG-2', bg11k: 'BG-1',  mg5k: 'MG-5', mg8k: 'MG-3', mg11k: 'MG-1', nbc16k: 'NBC-103', nbc11k: 'NBC-123', nbc8k: 'NBC-144', ng5k: 'NG-32', ng8k: 'NG-24', ng11k: 'NG-22', wbc8k: 'WBC-23' },
  330: { load: 3000, moment: 3000, b: 'B-5',  hb: 'HB-4', bg8k: 'BG-6', bg11k: 'BG-3',  mg5k: 'MG-6', mg8k: 'MG-3', mg11k: 'MG-2', nbc16k: 'NBC-103', nbc11k: 'NBC-123', nbc8k: 'NBC-146', ng5k: 'NG-33', ng8k: 'NG-25', ng11k: 'NG-23', wbc8k: 'WBC-25' },
  340: { load: 3000, moment: 4000, b: 'B-6',  hb: 'HB-6', bg8k: 'BG-8', bg11k: 'BG-4',  mg5k: 'MG-8', mg8k: 'MG-5', mg11k: 'MG-3', nbc16k: 'NBC-107', nbc11k: 'NBC-125', nbc8k: 'NBC-149', ng5k: 'NG-36', ng8k: 'NG-27', ng11k: 'NG-26', wbc8k: 'WBC-27' },
  347: { load: 3000, moment: 4700, b: 'B-7',  hb: 'HB-6', bg8k: 'BG-9', bg11k: 'BG-6',  mg5k: 'MG-9', mg8k: 'MG-6', mg11k: 'MG-3', nbc16k: 'NBC-105', nbc11k: 'NBC-127', nbc8k: 'NBC-150', ng5k: 'NG-37', ng8k: 'NG-28', ng11k: 'NG-28', wbc8k: 'WBC-28' },
  355: { load: 3000, moment: 5500, b: 'B-8',  hb: 'HB-7', bg8k: 'BG-10', bg11k: 'BG-7', mg5k: 'MG-13', mg8k: 'MG-7', mg11k: 'MG-5', nbc16k: 'NBC-107', nbc11k: 'NBC-128', nbc8k: 'NBC-152', ng5k: 'SPL', ng8k: 'NG-29', ng11k: 'NG-30', wbc8k: 'WBC-29' },
  363: { load: 3000, moment: 6300, b: 'B-9',  hb: 'HB-8', bg8k: 'BG-11', bg11k: 'BG-8', mg5k: 'MG-14', mg8k: 'MG-8', mg11k: 'MG-6', nbc16k: 'NBC-108', nbc11k: 'NBC-130', nbc8k: 'NBC-152', ng5k: 'SPL', ng8k: 'NG-31', ng11k: 'NG-31', wbc8k: 'WBC-30' },
  374: { load: 3000, moment: 7400, b: 'B-10', hb: 'HB-9', bg8k: 'BG-12', bg11k: 'BG-9', mg5k: 'MG-16', mg8k: 'MG-10', mg11k: 'MG-8', nbc16k: 'NBC-109', nbc11k: 'NBC-131', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-32', ng11k: 'NG-32', wbc8k: 'WBC-31' },
  389: { load: 3000, moment: 8900, b: 'B-12', hb: 'HB-9', bg8k: 'BG-14', bg11k: 'BG-11', mg5k: 'MG-17', mg8k: 'MG-13', mg11k: 'MG-11', nbc16k: 'NBC-110', nbc11k: 'NBC-133', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-35', ng11k: 'NG-33', wbc8k: 'WBC-33' },
  395: { load: 3000, moment: 9500, b: 'B-12', hb: 'HB-10', bg8k: 'SPL', bg11k: 'BG-12', mg5k: 'MG-17', mg8k: 'MG-13', mg11k: 'MG-11', nbc16k: 'NBC-111', nbc11k: 'NBC-134', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-36', ng11k: 'NG-34', wbc8k: 'WBC-33' },
  399: { load: 3000, moment: 10500, b: 'B-13', hb: 'HB-11', bg8k: 'SPL', bg11k: 'BG-13', mg5k: 'MG-17', mg8k: 'MG-13', mg11k: 'MG-11', nbc16k: 'SPL', nbc11k: 'NBC-134', nbc8k: 'SPL', ng5k: 'SPL', ng8k: 'NG-37', ng11k: 'NG-36', wbc8k: 'SPL' },
};

// IMAGE 3: B-Type Specifications (DRG. NO. TI/CIV/FND/RDSO/00001/12/0 SHEET-1)
export const B_TYPE_SPECS: Record<string, { a: number; b: number; h: number; vol: number; muffNorm: number; muffBwa: number }> = {
  'B-01': { a: 0.70, b: 0.70, h: 1.80, vol: 0.882, muffNorm: 0.02, muffBwa: 0.08 },
  'B-0':  { a: 0.70, b: 0.90, h: 1.80, vol: 1.134, muffNorm: 0.02, muffBwa: 0.08 },
  'B-1':  { a: 0.80, b: 0.90, h: 1.80, vol: 1.296, muffNorm: 0.02, muffBwa: 0.08 },
  'B-2':  { a: 0.80, b: 0.90, h: 1.90, vol: 1.368, muffNorm: 0.02, muffBwa: 0.08 },
  'B-3':  { a: 0.80, b: 1.05, h: 1.90, vol: 1.596, muffNorm: 0.02, muffBwa: 0.08 },
  'B-4':  { a: 0.80, b: 1.20, h: 1.90, vol: 1.824, muffNorm: 0.02, muffBwa: 0.08 },
  'B-5':  { a: 0.80, b: 1.40, h: 1.90, vol: 2.128, muffNorm: 0.02, muffBwa: 0.08 },
  'B-6':  { a: 0.80, b: 1.60, h: 1.90, vol: 2.432, muffNorm: 0.02, muffBwa: 0.08 },
  'B-7':  { a: 0.80, b: 1.80, h: 1.90, vol: 2.736, muffNorm: 0.02, muffBwa: 0.08 },
  'B-8':  { a: 0.80, b: 2.00, h: 1.90, vol: 3.040, muffNorm: 0.02, muffBwa: 0.08 },
  'B-9':  { a: 0.80, b: 2.00, h: 2.00, vol: 3.200, muffNorm: 0.02, muffBwa: 0.08 },
  'B-10': { a: 0.80, b: 2.10, h: 2.10, vol: 3.528, muffNorm: 0.02, muffBwa: 0.08 },
  'B-11': { a: 0.80, b: 2.30, h: 2.10, vol: 3.864, muffNorm: 0.02, muffBwa: 0.08 },
  'B-12': { a: 0.80, b: 2.50, h: 2.10, vol: 4.200, muffNorm: 0.02, muffBwa: 0.08 },
  'B-13': { a: 0.80, b: 2.70, h: 2.10, vol: 4.536, muffNorm: 0.02, muffBwa: 0.08 },
};

// IMAGE 4: BG-Type Specifications (DRG. NO. TI/CIV/FND/RDSO/00001/12/0 SHEET-1)
export const BG_TYPE_SPECS: Record<string, { a: number; b: number; c: number; h: number; vol: number; muffNorm: number; muffBwa: number }> = {
  'BG-01': { a: 1.40, b: 0.80, c: 0.80, h: 1.60, vol: 1.408, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-0':  { a: 1.50, b: 0.80, c: 0.80, h: 1.60, vol: 1.472, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-1':  { a: 1.70, b: 0.80, c: 0.80, h: 1.60, vol: 1.600, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-2':  { a: 1.80, b: 0.80, c: 0.80, h: 1.60, vol: 1.664, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-3':  { a: 1.80, b: 1.00, c: 0.80, h: 1.60, vol: 2.080, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-4':  { a: 1.90, b: 1.00, c: 0.80, h: 1.60, vol: 2.160, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-5':  { a: 2.00, b: 1.00, c: 0.80, h: 1.60, vol: 2.240, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-6':  { a: 2.00, b: 1.20, c: 0.80, h: 1.60, vol: 2.688, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-7':  { a: 2.00, b: 1.40, c: 0.80, h: 1.60, vol: 3.136, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-8':  { a: 2.00, b: 1.50, c: 0.80, h: 1.60, vol: 3.360, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-9':  { a: 2.00, b: 1.70, c: 0.80, h: 1.60, vol: 3.808, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-10': { a: 2.00, b: 1.90, c: 0.80, h: 1.60, vol: 4.256, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-11': { a: 2.00, b: 2.10, c: 0.80, h: 1.60, vol: 4.704, muffNorm: 0.02, muffBwa: 0.08 },
  'BG-12': { a: 2.00, b: 2.30, c: 0.80, h: 1.60, vol: 5.152, muffNorm: 0.02, muffBwa: 0.08 },
  'HB-13': { a: 2.00, b: 2.50, c: 0.80, h: 1.60, vol: 5.600, muffNorm: 0.02, muffBwa: 0.08 },
  'HB-14': { a: 2.00, b: 2.70, c: 0.80, h: 1.60, vol: 6.048, muffNorm: 0.02, muffBwa: 0.08 },
};

// IMAGE 5: NG-Type Specifications (DRG. NO. TI/CIV/FND/RDSO/00001/12/0 SHEET-2)
export const NG_TYPE_SPECS: Record<string, { a1: number; a2: number; b1: number; b2: number; b3: number; b4: number; vol: number; muffNorm: number; muffBwa: number }> = {
  'NG-21': { a1: 1.00, a2: 0.70, b1: 1.60, b2: 1.30, b3: 0.70, b4: 0.70, vol: 1.156, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-22': { a1: 1.00, a2: 0.70, b1: 2.00, b2: 1.70, b3: 0.80, b4: 0.80, vol: 1.401, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-23': { a1: 1.00, a2: 0.70, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 1.592, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-24': { a1: 1.20, a2: 0.70, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 1.800, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-25': { a1: 1.30, a2: 0.70, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 1.905, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-26': { a1: 1.50, a2: 0.80, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 2.192, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-27': { a1: 1.70, a2: 0.80, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 2.400, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-28': { a1: 1.80, a2: 0.90, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 2.583, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-29': { a1: 2.10, a2: 1.00, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 2.975, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-30': { a1: 2.30, a2: 1.10, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 3.261, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-31': { a1: 2.50, a2: 1.30, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 3.627, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-32': { a1: 2.70, a2: 1.50, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 3.992, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-33': { a1: 2.90, a2: 1.70, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 4.358, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-34': { a1: 3.10, a2: 1.90, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 4.724, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-35': { a1: 3.30, a2: 2.10, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 5.089, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-36': { a1: 3.60, a2: 2.40, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 5.637, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-37': { a1: 4.00, a2: 2.80, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 6.368, muffNorm: 0.02, muffBwa: 0.08 },
  'NG-38': { a1: 4.40, a2: 3.20, b1: 2.20, b2: 1.90, b3: 0.95, b4: 0.80, vol: 7.099, muffNorm: 0.02, muffBwa: 0.08 },
};

export interface FoundationEntry {
  type: string;
  name: string;
  soilName: string;
  bearingCapacity: string;
  reference: string;
  functionCode: string; // e.g. N / NACC (Normal Mast), ACC, OLA / BWA
  mastTypeLabel: string; // Strictly B-Type or Rolled: e.g. 8"×6" RSJ / 6"×6" BFB or B-150 / B-175 / B-200 / B-225 / B-250
  fbmCode: number;
  fbmBreakdown: string;
  dimText: string;
  a: number; // width across track (m) (or A for B/BG, or B1 for NG across track)
  b: number; // length along track (m) (or B for B/BG, or A1 for NG along track)
  c?: number; // top width across track (0.80m for BG)
  h: number; // depth (m)
  // NG specific stepped geometry (Image 5):
  ngDims?: {
    a1: number;
    a2: number;
    b1: number;
    b2: number;
    b3: number;
    b4: number;
  };
  baseVolume: number; // m³
  muffVolume: number; // m³
  superBlockVolume: number; // m³
  totalVolume: number; // m³
  features: string;
}

export interface SuperBlockInfo {
  required: boolean;
  stepC: number;
  height: number; // H_superblock = C - 0.50 m
  status: 'STANDARD STEP DISTANCE' | 'EXCESS STEP LEVEL DETECTED';
  description: string;
  mastBelowRL: number; // 1.35 + C
  clause3514Violation: boolean;
}

export interface CalculationResult {
  isComplete: boolean;
  versine: number;
  minSetting: number;
  settingValid: boolean;
  implantationTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  tierDescription: string;
  requiresChair: boolean;
  mastSection: string; // ONLY B-Type or Rolled Beam
  mastSeries: string; // ONLY B-Series or Rolled Beam
  mastType: 'rolled' | 'b-type'; // STRICTLY B-TYPE ONLY (no K-type)
  mastLengthTotal: number;
  mastLengthEmbedded: number;
  mastLengthAbove: number;
  reverseDeflection: number; // mm
  deflectionDirection: string;
  fbmCode: number;
  fbmVerticalLoad: number; // kg
  fbmMoment: number; // kg·m
  fbmBreakdown: string;
  superBlock: SuperBlockInfo;
  foundations: {
    bType: FoundationEntry;
    hbType: FoundationEntry;
    bgType: FoundationEntry;
    ngType: FoundationEntry;
    nbcType: FoundationEntry;
    wbcType: FoundationEntry;
  };
  muffSpec: {
    type: string;
    volume: number;
    description: string;
  };
}

/**
 * Calculates RDSO & KEC employment schedule parameters, structural mechanics,
 * Cess Step Level Difference (C), Super Block volumes, and complete 6-soil Multi-Soil Foundation Matrix.
 * Enforces: ONLY B-TYPE MASTS (NO K-TYPE).
 */
export function calculateOhe(config: OheConfig): CalculationResult {
  const isComplete = Boolean(
    config.wind !== null &&
    config.implantation !== null &&
    config.alignment !== null &&
    config.role !== null
  );

  const wind = config.wind ?? 105;
  const implantation = config.implantation ?? 3.00;
  // Cess Step Level Difference C: range 0.00 to 2.00, default 0.50
  const stepC = Math.max(0.0, Math.min(2.0, config.stepLevel !== undefined ? config.stepLevel : 0.50));
  const alignment = config.alignment ?? 'tangent';
  const radius = config.radius || 1000;
  const span = config.span || 49.5;
  const role = config.role ?? 'N/NACC';

  // 1. Versine calculation: S² * 1000 / (8 * R) mm
  const versine = alignment === 'tangent' ? 0 : Number(((span * span * 1000) / (8 * radius)).toFixed(1));

  // 2. Minimum Setting Distance per RDSO rules (PDF 1: OHE Design Manual Vol-II)
  let minSetting = 2.80;
  if (alignment === 'inside') {
    if (radius >= 3500) minSetting = 3.20;
    else if (radius >= 2350) minSetting = 3.35;
    else if (radius >= 1150) minSetting = 3.55;
    else if (radius >= 300) minSetting = 3.60;
    else minSetting = 3.75;
  } else if (alignment === 'outside') {
    minSetting = radius >= 875 ? 2.80 : 2.95;
  }
  const settingValid = implantation >= minSetting;

  // 3. Implantation Tier Classification (PDF 2 Sheets 1-18)
  let implantationTier: 'Tier 1' | 'Tier 2' | 'Tier 3' = 'Tier 2';
  let tierDescription = 'Standard Implantation (≤ 3.80 m)';
  let requiresChair = false;

  if (implantation <= 2.80) {
    implantationTier = 'Tier 1';
    tierDescription = 'Baseline / Minimum Implantation (≤ 2.80 m)';
  } else if (implantation <= 3.80) {
    implantationTier = 'Tier 2';
    tierDescription = 'Schedule: Standard Implantation (2.80 m to 3.80 m)';
  } else {
    implantationTier = 'Tier 3';
    tierDescription = 'Schedule: Implantation > 3.80 m & up to 4.85 m';
    requiresChair = true;
  }

  // 4. Cess Step Level Difference (C) & Super Block Engineering (ACTM Vol-II & RDSO Spec)
  const isExcessStep = stepC > 0.50;
  const superBlockHeight = isExcessStep ? Number((stepC - 0.50).toFixed(2)) : 0;
  const mastBelowRL = Number((1.35 + stepC).toFixed(2));
  // Clause 3.5.14 check: Mast below RL cannot exceed 1.850 m without casting a monolithic Super Block
  const clause3514Violation = mastBelowRL > 1.850 && !isExcessStep;

  const superBlock: SuperBlockInfo = {
    required: isExcessStep,
    stepC,
    height: superBlockHeight,
    status: isExcessStep ? 'EXCESS STEP LEVEL DETECTED' : 'STANDARD STEP DISTANCE',
    description: isExcessStep
      ? `Super Block required of size (Top of Foundation Dimensions) × ${superBlockHeight.toFixed(2)} m height to bring top of casting to within 500 mm of Rail Level (per ACTM Vol-II & RDSO Spec).`
      : 'Standard step level distance (C ≤ 0.50 m). Foundation top is within 500 mm of Rail Level; no super block required.',
    mastBelowRL,
    clause3514Violation,
  };

  // 5. Reactive Structural Cascade: Mast Section, Reverse Deflection, and FBM Code
  // USER REQUIREMENT: STRICTLY B-TYPE ONLY (NO K-TYPE MASTS)
  let mastSection = '8"×6" RSJ / 6"×6" BFB Rolled Beam (37.1 kg/m)';
  let mastSeries = 'Rolled Beam Section (8"×6" RSJ / 6"×6" BFB)';
  let mastType: 'rolled' | 'b-type' = 'rolled';
  let reverseDeflection = 30;
  let deflectionDirection = '+30 mm (Away from track)';
  let fbmCode = 140;

  const isBwa = role === 'OLA/BWA';
  const isCurve = alignment !== 'tangent';

  if (isBwa) {
    // OLA / BWA Anchor Mast: Back-pulled by guy wire, deflection is negative (towards track)
    reverseDeflection = -30;
    deflectionDirection = '-30 mm (Towards track)';
    mastType = 'b-type';
    if (wind >= 178 || implantation > 4.0 || isCurve) {
      mastSection = 'B-250 Heavy Fabricated Battened Mast (250 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-250)';
      fbmCode = 389;
    } else {
      mastSection = 'B-225 Heavy Fabricated Battened Mast (225 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-225)';
      fbmCode = 374;
    }
  } else if (isCurve || role === 'OLC' || role === 'OLI' || role === 'ACA' || role === 'ACC') {
    // Curvature, Overlaps, or Anti-Creep
    mastType = 'b-type';
    reverseDeflection = 30;
    deflectionDirection = '+30 mm (Away from track)';
    if (wind >= 178 || implantation > 4.2) {
      mastSection = 'B-200 Fabricated Battened Mast (200 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-200)';
      fbmCode = wind >= 216 ? 363 : 275;
    } else if (wind >= 136 || role === 'OLC' || (isCurve && radius < 1000)) {
      mastSection = 'B-175 Fabricated Battened Mast (175 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-175)';
      fbmCode = 260;
    } else {
      mastSection = 'B-150 Fabricated Battened Mast (150 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-150)';
      fbmCode = 254;
    }
  } else {
    // Tangent Normal Mast
    reverseDeflection = 30;
    deflectionDirection = '+30 mm (Away from track)';
    if (wind <= 105 && implantation <= 3.80) {
      mastType = 'rolled';
      mastSection = implantation > 3.25
        ? '8"×6" RSJ (200×150 mm) Rolled Beam'
        : '6"×6" BFB (152×152 mm) Rolled Beam';
      mastSeries = 'Rolled Beam Section (8"×6" RSJ / 6"×6" BFB)';
      fbmCode = 140;
    } else if (wind <= 136 && implantation <= 4.00) {
      mastType = 'b-type';
      mastSection = 'B-150 Fabricated Battened Mast (150 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-150)';
      fbmCode = 161;
    } else {
      mastType = 'b-type';
      mastSection = 'B-175 Fabricated Battened Mast (175 mm)';
      mastSeries = 'B-Series Fabricated Battened Mast (B-175)';
      fbmCode = wind >= 178 ? 260 : 178;
    }
  }

  // 6. Three-Digit FBM Code Architecture (Sheet 01 & Sheet 02)
  const fbmHundred = Math.floor(fbmCode / 100);
  const fbmVerticalLoad = fbmHundred === 1 ? 700 : fbmHundred === 2 ? 1600 : 3000;
  const fbmMoment = (fbmCode % 100) * 100;
  const fbmBreakdown = `Direct Axial Load: ${fbmVerticalLoad.toLocaleString()} kg | Overturning Bending Moment: ${fbmMoment.toLocaleString()} kg·m`;

  // 7. Muff Specification (PDF 3 & Image 3/4/5)
  const muffVolume = isBwa ? 0.08 : 0.02;
  const muffSpec = {
    type: isBwa ? 'BWA Anchor Pyramidal Muff (0.08 m³)' : 'Standard Chamfered Muff (0.02 m³)',
    volume: muffVolume,
    description: isBwa
      ? '0.08 m³ reinforced anchor collar with 45° guy rod anchoring pocket'
      : '0.02 m³ protective 45° chamfered concrete collar above rail/cess level',
  };

  // 8. EXACT KEC SCHEDULE LOOKUP (Image 1 & Image 2)
  const scheduleRow: KecScheduleRow = KEC_FDN_SCHEDULE[fbmCode] ?? KEC_FDN_SCHEDULE[140]!;

  const roleLabel = roles.find((r) => r.value === role)?.label ?? 'N / NACC';
  const roleTitle = roles.find((r) => r.value === role)?.title ?? 'Normal Mast';
  const functionCodeStr = `${roleLabel} (${roleTitle})`;
  const mastTypeShort: string = mastType === 'rolled' ? '8"×6" RSJ / 6"×6" BFB' : (mastSection.split(' (')[0] ?? mastSection);

  // --------------------------------------------------------------------------
  // 1. B-Type: Side Bearing in Normal Soil 11,000 kgf/m² (IMAGE 3 Drawing TI/CIV/FND/RDSO/00001/12/0 SHEET-1)
  // --------------------------------------------------------------------------
  const bRef = scheduleRow.b;
  const bSpec = B_TYPE_SPECS[bRef] ?? B_TYPE_SPECS['B-4']!;
  const b_A = bSpec.a;
  const b_B = bSpec.b;
  const b_H = bSpec.h;
  const b_baseVol = bSpec.vol;
  const b_muffVol = isBwa ? bSpec.muffBwa : bSpec.muffNorm;
  const b_sbVol = Number((b_A * b_B * superBlockHeight).toFixed(2));
  const bType: FoundationEntry = {
    type: 'B-Type',
    name: 'Side Bearing Foundation',
    soilName: 'Normal Soil (Dry Bearing)',
    bearingCapacity: '11,000 kgf/m²',
    reference: bRef,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${b_A.toFixed(2)} × ${b_B.toFixed(2)} × ${b_H.toFixed(2)} m`,
    a: b_A,
    b: b_B,
    h: b_H,
    baseVolume: b_baseVol,
    muffVolume: b_muffVol,
    superBlockVolume: b_sbVol,
    totalVolume: Number((b_baseVol + b_muffVol + b_sbVol).toFixed(2)),
    features: `Rectangular side-bearing block per Image 3 (Sheet-1) for level ground, matched to ${mastTypeShort}`,
  };

  // --------------------------------------------------------------------------
  // 2. HB-Type: Side Bearing in Hard Soil / Moorum 21,500 kgf/m² (IMAGE 1 KEC Sheet No. 01)
  // --------------------------------------------------------------------------
  const hbRef = scheduleRow.hb;
  const hb_num = parseInt(hbRef.replace(/\D/g, '')) || 1;
  const hb_A = 0.80;
  const hb_B = Number((0.80 + hb_num * 0.12).toFixed(2));
  const hb_H = 1.80;
  const hb_baseVol = Number((hb_A * hb_B * hb_H).toFixed(2));
  const hb_sbVol = Number((hb_A * hb_B * superBlockHeight).toFixed(2));
  const hbType: FoundationEntry = {
    type: 'HB-Type',
    name: 'Side Bearing Hard Soil',
    soilName: 'Hard Ground / Moorum',
    bearingCapacity: '21,500 kgf/m²',
    reference: hbRef,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${hb_A.toFixed(2)} × ${hb_B.toFixed(2)} × ${hb_H.toFixed(2)} m`,
    a: hb_A,
    b: hb_B,
    h: hb_H,
    baseVolume: hb_baseVol,
    muffVolume,
    superBlockVolume: hb_sbVol,
    totalVolume: Number((hb_baseVol + muffVolume + hb_sbVol).toFixed(2)),
    features: `Compact side-bearing block per Image 1 for high bearing capacity hard soil (21,500 kgf/m²)`,
  };

  // --------------------------------------------------------------------------
  // 3. BG-Type: Side Gravity for Slopes & Cuttings 11,000 kgf/m² (IMAGE 4 Drawing TI/CIV/FND/RDSO/00001/12/0 SHEET-1)
  // --------------------------------------------------------------------------
  const bgRef = scheduleRow.bg11k === 'SPL' ? scheduleRow.bg8k : scheduleRow.bg11k;
  const bgSpec = BG_TYPE_SPECS[bgRef] ?? BG_TYPE_SPECS['BG-4']!;
  const bg_A = bgSpec.a;
  const bg_B = bgSpec.b;
  const bg_C = bgSpec.c;
  const bg_H = bgSpec.h;
  const bg_baseVol = bgSpec.vol;
  const bg_muffVol = isBwa ? bgSpec.muffBwa : bgSpec.muffNorm;
  // Super block rests on top casting width (C = 0.80 m) × B
  const bg_sbVol = Number((bg_C * bg_B * superBlockHeight).toFixed(2));
  const bgType: FoundationEntry = {
    type: 'BG-Type',
    name: 'Side Gravity (Slopes & Cuttings)',
    soilName: 'Bank / Insufficient Cess Shoulder (e < 0.3m)',
    bearingCapacity: '11,000 kgf/m²',
    reference: bgRef,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${bg_A.toFixed(2)}m (base) × ${bg_B.toFixed(2)}m × ${bg_C.toFixed(2)}m (top C) × ${bg_H.toFixed(2)}m`,
    a: bg_A,
    b: bg_B,
    c: bg_C,
    h: bg_H,
    baseVolume: bg_baseVol,
    muffVolume: bg_muffVol,
    superBlockVolume: bg_sbVol,
    totalVolume: Number((bg_baseVol + bg_muffVol + bg_sbVol).toFixed(2)),
    features: `Asymmetric side gravity trapezoidal block per Image 4 (Sheet-1) with vertical track face & 45° slope back`,
  };

  // --------------------------------------------------------------------------
  // 4. NG-Type: Pure Gravity for Loose Soil / Ash Fill (IMAGE 5 Drawing TI/CIV/FND/RDSO/00001/12/0 SHEET-2)
  // --------------------------------------------------------------------------
  const ngRef = scheduleRow.ng11k === 'SPL' ? scheduleRow.ng8k : scheduleRow.ng11k;
  const ngSpec = NG_TYPE_SPECS[ngRef] ?? NG_TYPE_SPECS['NG-26']!;
  const ng_baseVol = ngSpec.vol;
  const ng_muffVol = isBwa ? ngSpec.muffBwa : ngSpec.muffNorm;
  // Super block rests on top pedestal neck (B4 × A2)
  const ng_sbVol = Number((ngSpec.b4 * ngSpec.a2 * superBlockHeight).toFixed(2));
  const ngType: FoundationEntry = {
    type: 'NG-Type',
    name: 'New Pure Gravity Foundation',
    soilName: 'Loose Alluvial Soil / Ash Fill',
    bearingCapacity: '5,500 – 11,000 kgf/m²',
    reference: ngRef,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `Footing ${ngSpec.b1.toFixed(2)}×${ngSpec.a1.toFixed(2)}m | Neck ${ngSpec.b4.toFixed(2)}×${ngSpec.a2.toFixed(2)}m | H=1.50m`,
    a: ngSpec.b1, // across track footing
    b: ngSpec.a1, // along track footing
    h: 1.50, // total height per Image 5
    ngDims: {
      a1: ngSpec.a1,
      a2: ngSpec.a2,
      b1: ngSpec.b1,
      b2: ngSpec.b2,
      b3: ngSpec.b3,
      b4: ngSpec.b4,
    },
    baseVolume: ng_baseVol,
    muffVolume: ng_muffVol,
    superBlockVolume: ng_sbVol,
    totalVolume: Number((ng_baseVol + ng_muffVol + ng_sbVol).toFixed(2)),
    features: `3-Stage stepped pure gravity block per Image 5 (Sheet-2): 150mm footing + 500mm slope + 850mm pedestal`,
  };

  // --------------------------------------------------------------------------
  // 5. NBC-Type: Dry Black Cotton Soil (IMAGE 2 KEC Sheet No. 02)
  // --------------------------------------------------------------------------
  const nbcRef = scheduleRow.nbc16k === 'SPL' ? scheduleRow.nbc11k : scheduleRow.nbc16k;
  const nbc_num = parseInt(nbcRef.replace(/\D/g, '')) || 105;
  const nbc_A = Number((1.50 + ((nbc_num - 100) % 20) * 0.05).toFixed(2));
  const nbc_B = Number((1.40 + ((nbc_num - 100) % 20) * 0.04).toFixed(2));
  const nbc_H = 3.00; // standard 3.00 m deep under-reamed block
  const nbc_baseVol = Number((nbc_A * nbc_B * nbc_H * 0.80).toFixed(2));
  const nbc_sbVol = Number((nbc_A * nbc_B * superBlockHeight).toFixed(2));
  const nbcType: FoundationEntry = {
    type: 'NBC-Type',
    name: 'Dry Black Cotton Foundation',
    soilName: 'Dry Expansive Black Cotton Soil',
    bearingCapacity: '16,500 kgf/m²',
    reference: nbcRef,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${nbc_A.toFixed(2)} × ${nbc_B.toFixed(2)} × ${nbc_H.toFixed(2)} m (3.0m depth)`,
    a: nbc_A,
    b: nbc_B,
    h: nbc_H,
    baseVolume: nbc_baseVol,
    muffVolume,
    superBlockVolume: nbc_sbVol,
    totalVolume: Number((nbc_baseVol + muffVolume + nbc_sbVol).toFixed(2)),
    features: `Deep pyramidal gravity block per Image 2 anchored 3.0 m deep below seasonal moisture active zone`,
  };

  // --------------------------------------------------------------------------
  // 6. WBC-Type: Wet Black Cotton Soil (IMAGE 2 KEC Sheet No. 02)
  // --------------------------------------------------------------------------
  const wbcRef = scheduleRow.wbc8k === 'SPL' ? 'WBC-28' : scheduleRow.wbc8k;
  const wbc_num = parseInt(wbcRef.replace(/\D/g, '')) || 25;
  const wbc_A = Number((1.70 + (wbc_num - 20) * 0.06).toFixed(2));
  const wbc_B = Number((1.60 + (wbc_num - 20) * 0.05).toFixed(2));
  const wbc_H = 2.50; // standard 2.50 m depth for WBC
  const wbc_baseVol = Number((wbc_A * wbc_B * wbc_H * 0.82).toFixed(2));
  const wbc_sbVol = Number((wbc_A * wbc_B * superBlockHeight).toFixed(2));
  const wbcType: FoundationEntry = {
    type: 'WBC-Type',
    name: 'Wet Black Cotton Foundation',
    soilName: 'Waterlogged / Wet Black Cotton Soil',
    bearingCapacity: '8,000 kgf/m²',
    reference: wbcRef,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${wbc_A.toFixed(2)} × ${wbc_B.toFixed(2)} × ${wbc_H.toFixed(2)} m (2.5m depth)`,
    a: wbc_A,
    b: wbc_B,
    h: wbc_H,
    baseVolume: wbc_baseVol,
    muffVolume,
    superBlockVolume: wbc_sbVol,
    totalVolume: Number((wbc_baseVol + muffVolume + wbc_sbVol).toFixed(2)),
    features: `Stepped raft gravity block per Image 2 countering high swelling pressure and waterlogging`,
  };

  return {
    isComplete,
    versine,
    minSetting,
    settingValid,
    implantationTier,
    tierDescription,
    requiresChair,
    mastSection,
    mastSeries,
    mastType,
    mastLengthTotal: 9.50, // 8.15m above + 1.35m embedded standard
    mastLengthEmbedded: 1.35,
    mastLengthAbove: 8.15,
    reverseDeflection,
    deflectionDirection,
    fbmCode,
    fbmVerticalLoad,
    fbmMoment,
    fbmBreakdown,
    superBlock,
    foundations: {
      bType,
      hbType,
      bgType,
      ngType,
      nbcType,
      wbcType,
    },
    muffSpec,
  };
}
