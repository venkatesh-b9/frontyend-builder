export type Alignment = 'tangent' | 'inside' | 'outside';
export type Role = 'N/NACC' | 'ACC' | 'ACA' | 'OLI' | 'OLC' | 'OLA/BWA';
export type ImplantationMode = 'standard' | 'custom';

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

export interface FoundationEntry {
  type: string;
  name: string;
  soilName: string;
  bearingCapacity: string;
  reference: string;
  functionCode: string; // N/NACC, ACC, ACA, OLI, OLC, OLA/BWA
  mastTypeLabel: string; // e.g. 8"×6" RSJ / 6"×6" BFB or B-150 / K-150, B-175 / K-175, B-225 / K-225
  fbmCode: number;
  fbmBreakdown: string; // e.g. "Vertical Load: 700 kg | Bending Moment: 4,000 kg·m"
  dimText: string;
  a: number; // width across track (m)
  b: number; // length along track (m)
  c?: number; // step level (m)
  h: number; // depth (m)
  baseVolume: number; // m³
  muffVolume: number; // m³
  superBlockVolume: number; // m³ (calculated when C > 0.50m)
  totalVolume: number; // m³ (Base + Muff + Super Block)
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
  mastSection: string;
  mastSeries: string; // e.g. "Rolled Section (RSJ / BFB)" or "B-Series / K-Series Fabricated Lattice Mast"
  mastType: 'rolled' | 'k-truss' | 'special';
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
 * Calculates RDSO employment schedule parameters (PDF 2), structural mechanics (PDF 1),
 * Cess Step Level Difference (C), Super Block volumes, and complete 6-soil Multi-Soil Foundation Matrix (PDF 3).
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
  // PDF 2 Employment Schedules (18 Sheets for 2x25 kV & 25 kV):
  // - Rolled sections: 8"x6" RSJ / 6"x6" BFB
  // - Fabricated lattice series: B-150 / K-150, B-175 / K-175, B-200 / K-200, B-225 / K-225, B-250 / K-250
  let mastSection = '8"×6" RSJ / 6"×6" BFB Rolled Beam (37.1 kg/m)';
  let mastSeries = 'Rolled Beam Section (8"×6" RSJ / 6"×6" BFB)';
  let mastType: 'rolled' | 'k-truss' | 'special' = 'rolled';
  let reverseDeflection = 30;
  let deflectionDirection = '+30 mm (Away from track)';
  let fbmCode = 140;

  const isBwa = role === 'OLA/BWA';
  const isCurve = alignment !== 'tangent';

  if (isBwa) {
    // OLA / BWA Anchor Mast: Back-pulled by guy wire, deflection is negative (towards track)
    reverseDeflection = -30;
    deflectionDirection = '-30 mm (Towards track)';
    mastType = 'k-truss';
    if (wind >= 178 || implantation > 4.0 || isCurve) {
      mastSection = 'B-250 / K-250 Heavy Fabricated Mast (250 mm)';
      mastSeries = 'B-250 / K-250 Heavy Fabricated Lattice Series';
      fbmCode = 389;
    } else {
      mastSection = 'B-225 / K-225 Heavy Fabricated Mast (225 mm)';
      mastSeries = 'B-225 / K-225 Heavy Fabricated Lattice Series';
      fbmCode = 374;
    }
  } else if (isCurve || role === 'OLC' || role === 'OLI' || role === 'ACA' || role === 'ACC') {
    // Curvature, Overlaps, or Anti-Creep
    mastType = 'k-truss';
    reverseDeflection = 30;
    deflectionDirection = '+30 mm (Away from track)';
    if (wind >= 178 || implantation > 4.2) {
      mastSection = 'B-200 / K-200 Fabricated Lattice Mast (200 mm)';
      mastSeries = 'B-200 / K-200 Fabricated Lattice Series';
      fbmCode = wind >= 216 ? 363 : 275;
    } else if (wind >= 136 || role === 'OLC' || (isCurve && radius < 1000)) {
      mastSection = 'B-175 / K-175 Fabricated Lattice Mast (175 mm)';
      mastSeries = 'B-175 / K-175 Fabricated Lattice Series';
      fbmCode = 260;
    } else {
      mastSection = 'B-150 / K-150 Fabricated Lattice Mast (150 mm)';
      mastSeries = 'B-150 / K-150 Fabricated Lattice Series';
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
      mastType = 'k-truss';
      mastSection = 'B-150 / K-150 Fabricated Lattice Mast (150 mm)';
      mastSeries = 'B-150 / K-150 Fabricated Lattice Series';
      fbmCode = 161;
    } else {
      mastType = 'k-truss';
      mastSection = 'B-175 / K-175 Fabricated Lattice Mast (175 mm)';
      mastSeries = 'B-175 / K-175 Fabricated Lattice Series';
      fbmCode = wind >= 178 ? 260 : 178;
    }
  }

  // 6. Three-Digit FBM Code Architecture (PDF 3)
  // 100th digit: 1 = 700 kg load, 2 = 1600 kg load, 3 = 3000 kg load
  // 10th & 1st digit: Total overturning bending moment in hundreds of kg·m
  const fbmHundred = Math.floor(fbmCode / 100);
  const fbmVerticalLoad = fbmHundred === 1 ? 700 : fbmHundred === 2 ? 1600 : 3000;
  const fbmMoment = (fbmCode % 100) * 100;
  const fbmBreakdown = `Vertical Axial Load: ${fbmVerticalLoad.toLocaleString()} kg | Overturning Bending Moment: ${fbmMoment.toLocaleString()} kg·m`;

  // 7. Muff Specification (PDF 3)
  const muffVolume = isBwa ? 0.08 : 0.02;
  const muffSpec = {
    type: isBwa ? 'BWA Anchor Pyramidal Muff (0.08 m³)' : 'Standard Chamfered Muff (0.02 m³)',
    volume: muffVolume,
    description: isBwa
      ? '0.08 m³ reinforced anchor collar with 45° guy rod anchoring pocket'
      : '0.02 m³ protective 45° chamfered concrete collar above rail/cess level',
  };

  // 8. Multi-Soil Dynamic Foundation Matrix Mapping (PDF 3: TI/CIV/FND/00001/12/0 & KEC Standards)
  // Scale foundation dimensions across FBM spectrum (140 through 389)
  const fbmScale = (fbmCode - 140) / (389 - 140); // 0.0 to 1.0
  const scaleIdx = Math.round(fbmScale * 10);

  // Common label strings for foundation cards
  const roleLabel = roles.find((r) => r.value === role)?.label ?? 'N / NACC';
  const roleTitle = roles.find((r) => r.value === role)?.title ?? 'Normal Mast';
  const functionCodeStr = `${roleLabel} (${roleTitle})`;
  const mastTypeShort: string = mastType === 'rolled' ? '8"×6" RSJ / 6"×6" BFB' : (mastSection.split(' (')[0] ?? mastSection);

  // 1. B-Type (Side Bearing Foundation for Normal Soil 11,000 kgf/m²)
  const b_refNum = Math.min(13, Math.max(1, Math.round(fbmCode / 30)));
  const b_A = Number((1.05 + scaleIdx * 0.04).toFixed(2));
  const b_B = Number((1.25 + scaleIdx * 0.05).toFixed(2));
  const b_H = Number((2.00 + Math.floor(scaleIdx / 3) * 0.20).toFixed(2));
  const b_baseVol = Number((b_A * b_B * b_H).toFixed(2));
  const b_sbVol = Number((b_A * b_B * superBlockHeight).toFixed(2));
  const bType: FoundationEntry = {
    type: 'B-Type',
    name: 'Side Bearing Foundation',
    soilName: 'Normal Soil (Dry Bearing)',
    bearingCapacity: '11,000 kgf/m²',
    reference: `B-${b_refNum}`,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${b_A.toFixed(2)} × ${b_B.toFixed(2)} × ${b_H.toFixed(2)} m`,
    a: b_A,
    b: b_B,
    h: b_H,
    baseVolume: b_baseVol,
    muffVolume,
    superBlockVolume: b_sbVol,
    totalVolume: Number((b_baseVol + muffVolume + b_sbVol).toFixed(2)),
    features: `Rectangular side-bearing block for level ground & firm embankments, matched to ${mastTypeShort}`,
  };

  // 2. HB-Type (Side Bearing Foundation for Hard Soil / Moorum 21,500 kgf/m²)
  const hb_refNum = Math.min(11, Math.max(1, Math.round(fbmCode / 35)));
  const hb_A = Number((0.90 + scaleIdx * 0.03).toFixed(2));
  const hb_B = Number((1.10 + scaleIdx * 0.04).toFixed(2));
  const hb_H = Number((1.80 + Math.floor(scaleIdx / 3) * 0.15).toFixed(2));
  const hb_baseVol = Number((hb_A * hb_B * hb_H).toFixed(2));
  const hb_sbVol = Number((hb_A * hb_B * superBlockHeight).toFixed(2));
  const hbType: FoundationEntry = {
    type: 'HB-Type',
    name: 'Side Bearing Hard Soil',
    soilName: 'Hard Ground / Moorum',
    bearingCapacity: '21,500 kgf/m²',
    reference: `HB-${hb_refNum}`,
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
    features: `Economical compact side-bearing foundation for hard soil and rocky strata, matched to ${mastTypeShort}`,
  };

  // 3. BG-Type (Side Gravity for Slopes & Cuttings 11,000 kgf/m²)
  const bg_refNum = Math.min(14, Math.max(1, Math.round(fbmCode / 28)));
  const bg_A = Number((1.35 + scaleIdx * 0.05).toFixed(2));
  const bg_B = Number((1.30 + scaleIdx * 0.04).toFixed(2));
  const bg_C = Number(stepC.toFixed(2));
  const bg_H = Number((2.20 + Math.floor(scaleIdx / 3) * 0.15).toFixed(2));
  const bg_baseVol = Number(((bg_A * bg_B * (bg_H - bg_C * 0.45)) * 1.05).toFixed(2));
  const bg_sbVol = Number((bg_A * bg_B * superBlockHeight).toFixed(2));
  const bgType: FoundationEntry = {
    type: 'BG-Type',
    name: 'Side Gravity (Slopes & Cuttings)',
    soilName: 'Bank / Insufficient Cess Shoulder (e < 0.3m)',
    bearingCapacity: '11,000 kgf/m²',
    reference: `BG-${String(bg_refNum).padStart(2, '0')}`,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${bg_A.toFixed(2)} × ${bg_B.toFixed(2)} × ${bg_C.toFixed(2)} (step) × ${bg_H.toFixed(2)} m`,
    a: bg_A,
    b: bg_B,
    c: bg_C,
    h: bg_H,
    baseVolume: bg_baseVol,
    muffVolume,
    superBlockVolume: bg_sbVol,
    totalVolume: Number((bg_baseVol + muffVolume + bg_sbVol).toFixed(2)),
    features: `Trapezoidal side gravity foundation for slope embankments with C = ${bg_C.toFixed(2)} m drop, matched to ${mastTypeShort}`,
  };

  // 4. NG-Type (New Pure Gravity for Loose Soil / Ash Fill 5,500 kgf/m²)
  const ng_refNum = Math.min(38, Math.max(21, 21 + Math.round(fbmScale * 17)));
  const ng_A = Number((1.55 + scaleIdx * 0.06).toFixed(2));
  const ng_B = Number((1.45 + scaleIdx * 0.05).toFixed(2));
  const ng_H = Number((2.30 + Math.floor(scaleIdx / 3) * 0.15).toFixed(2));
  const ng_baseVol = Number((ng_A * ng_B * ng_H * 0.94).toFixed(2));
  const ng_sbVol = Number((ng_A * ng_B * superBlockHeight).toFixed(2));
  const ngType: FoundationEntry = {
    type: 'NG-Type',
    name: 'New Pure Gravity Foundation',
    soilName: 'Loose Alluvial Soil / Ash Fill',
    bearingCapacity: '5,500 kgf/m²',
    reference: `NG-${ng_refNum}`,
    functionCode: functionCodeStr,
    mastTypeLabel: mastTypeShort,
    fbmCode,
    fbmBreakdown,
    dimText: `${ng_A.toFixed(2)} × ${ng_B.toFixed(2)} × ${ng_H.toFixed(2)} m`,
    a: ng_A,
    b: ng_B,
    h: ng_H,
    baseVolume: ng_baseVol,
    muffVolume,
    superBlockVolume: ng_sbVol,
    totalVolume: Number((ng_baseVol + muffVolume + ng_sbVol).toFixed(2)),
    features: `Stepped pure gravity block resisting overtuning without lateral soil reliance, matched to ${mastTypeShort}`,
  };

  // 5. NBC-Type (Dry Black Cotton Soil 16,500 kgf/m², 3.00 m standard depth)
  const nbc_refNum = 101 + Math.round(fbmScale * 33);
  const nbc_A = Number((1.65 + scaleIdx * 0.07).toFixed(2));
  const nbc_B = Number((1.55 + scaleIdx * 0.06).toFixed(2));
  const nbc_H = 3.00; // standard 3.0m RDSO depth for NBC
  const nbc_baseVol = Number((nbc_A * nbc_B * nbc_H * 0.82).toFixed(2));
  const nbc_sbVol = Number((nbc_A * nbc_B * superBlockHeight).toFixed(2));
  const nbcType: FoundationEntry = {
    type: 'NBC-Type',
    name: 'Dry Black Cotton Foundation',
    soilName: 'Dry Expansive Black Cotton Soil',
    bearingCapacity: '16,500 kgf/m²',
    reference: `NBC-${nbc_refNum}`,
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
    features: `Deep pyramidal gravity block anchored 3.0 m deep below seasonal moisture active zone, matched to ${mastTypeShort}`,
  };

  // 6. WBC-Type (Wet Black Cotton Soil 8,000 kgf/m², 2.50 m depth)
  const wbc_refNum = 20 + Math.round(fbmScale * 13);
  const wbc_A = Number((1.85 + scaleIdx * 0.08).toFixed(2));
  const wbc_B = Number((1.75 + scaleIdx * 0.07).toFixed(2));
  const wbc_H = 2.50; // standard 2.5m depth for WBC
  const wbc_baseVol = Number((wbc_A * wbc_B * wbc_H * 0.85).toFixed(2));
  const wbc_sbVol = Number((wbc_A * wbc_B * superBlockHeight).toFixed(2));
  const wbcType: FoundationEntry = {
    type: 'WBC-Type',
    name: 'Wet Black Cotton Foundation',
    soilName: 'Waterlogged / Wet Black Cotton Soil',
    bearingCapacity: '8,000 kgf/m²',
    reference: `WBC-${wbc_refNum}`,
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
    features: `Stepped raft gravity block countering high swelling pressure and waterlogging, matched to ${mastTypeShort}`,
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
    mastLengthTotal: 9.50,
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
