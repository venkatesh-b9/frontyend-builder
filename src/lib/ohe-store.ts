import { create } from 'zustand';
import {
  type Alignment,
  type FoundationTypeKey,
  type ImplantationMode,
  type OheConfig,
  type Role,
  getCurveScheduleForWind,
  getMaxTangentSpanForWind,
  getStandardImplantation,
} from './ohe-rules';

export interface OheState extends OheConfig {
  activeStep: number;
  selectedFoundationType: FoundationTypeKey; // 'bType' (Image 3), 'bgType' (Image 4), 'ngType' (Image 5), etc.
  setSelectedFoundationType: (type: FoundationTypeKey) => void;
  setMastPreference: (pref: 'auto' | 'B-150' | 'B-175' | 'B-200' | 'B-225' | 'B-250') => void;
  setWind: (wind: number) => void;
  setImplantationMode: (mode: ImplantationMode) => void;
  setImplantation: (val: number) => void;
  setStepLevel: (val: number) => void;
  setShoulderWidth: (val: number) => void;
  setAlignment: (alignment: Alignment) => void;
  setRadius: (radius: number) => void;
  setSpan: (span: number) => void;
  setRole: (role: Role) => void;
  setActiveStep: (step: number) => void;
  reset: () => void;
  loadPreset: (presetName: 'sample' | 'heavy' | 'bwa' | 'excess-step' | 'rdso-178') => void;
}

const initialDefaults: OheConfig = {
  wind: 178, // Wind Pressure 178 kgf/m² per user requirement & Image 1
  implantationMode: 'custom',
  implantation: 3.50, // 3.50 m within 2.80 m to 3.80 m (Tier 2) per user requirement
  stepLevel: 0.90, // Cess Step Level 0.90 m (triggers BG-Type BG-9)
  shoulderWidth: 0.40, // Cess Shoulder Width 0.40 m (slope bank)
  alignment: 'tangent',
  radius: 0,
  span: 58.5, // 178 kgf/m² tangent max span per Image 1
  role: 'N/NACC',
  mastPreference: 'auto',
};

export const useOheStore = create<OheState>((set) => ({
  ...initialDefaults,
  activeStep: 5, // fully configured by default
  selectedFoundationType: 'bgType', // default to BG-Type Side Gravity (Image 4 / Image 2 highlighted) for C = 0.90m

  setSelectedFoundationType: (selectedFoundationType) => set({ selectedFoundationType }),

  setMastPreference: (mastPreference) => set({ mastPreference }),

  setWind: (wind) =>
    set((state) => {
      const isTangent = (state.alignment ?? 'tangent') === 'tangent';
      let nextSpan = state.span;
      if (isTangent) {
        nextSpan = getMaxTangentSpanForWind(wind);
      } else {
        const curveSpecs = getCurveScheduleForWind(wind);
        const curRadius = state.radius > 0 ? state.radius : 1400;
        const matched = curveSpecs.find((c) => c.radius <= curRadius) ?? curveSpecs[curveSpecs.length - 1]!;
        if (nextSpan > matched.maxSpan) {
          nextSpan = matched.maxSpan;
        }
      }
      return {
        wind,
        span: nextSpan,
        activeStep: Math.max(state.activeStep, 2),
      };
    }),

  setImplantationMode: (implantationMode) =>
    set((state) => {
      const curAlign = state.alignment ?? 'tangent';
      const curRadius = state.radius > 0 ? state.radius : 1400;
      const nextImp =
        implantationMode === 'standard'
          ? getStandardImplantation(curAlign, curRadius)
          : Math.max(2.80, Math.min(5.00, state.implantation ?? 3.50));
      return {
        implantationMode,
        implantation: nextImp,
        activeStep: Math.max(state.activeStep, 3),
      };
    }),

  setImplantation: (implantation) =>
    set((state) => ({
      implantation: Math.max(2.50, Math.min(5.00, implantation)),
      activeStep: Math.max(state.activeStep, 3),
    })),

  setStepLevel: (stepLevel) =>
    set((state) => {
      const clamped = Math.max(0.00, Math.min(2.00, Number(stepLevel.toFixed(2))));
      const e = state.shoulderWidth ?? 0.60;
      // Auto-select foundation type based on RDSO Cess Step Level (C) & Shoulder Width (e):
      // e < 0.20m OR C > 1.00m: NG-Type (Pure Gravity, Deep Cess Drop-off / Slope Edge)
      // e < 0.50m OR (0.70m < C <= 1.00m): BG-Type (Side Gravity, Embankment Slope)
      // C <= 0.70m AND e >= 0.50m: B-Type (Side Bearing, Normal Firm Ground)
      let autoFdn: FoundationTypeKey = state.selectedFoundationType;
      if (e < 0.20 || clamped > 1.00) {
        autoFdn = 'ngType';
      } else if (e < 0.50 || clamped > 0.70) {
        autoFdn = 'bgType';
      } else {
        autoFdn = 'bType';
      }
      return {
        stepLevel: clamped,
        selectedFoundationType: autoFdn,
      };
    }),

  setShoulderWidth: (shoulderWidth) =>
    set((state) => {
      const clamped = Math.max(0.05, Math.min(1.20, Number(shoulderWidth.toFixed(2))));
      const c = state.stepLevel ?? 0.50;
      let autoFdn: FoundationTypeKey = state.selectedFoundationType;
      if (clamped < 0.20 || c > 1.00) {
        autoFdn = 'ngType';
      } else if (clamped < 0.50 || c > 0.70) {
        autoFdn = 'bgType';
      } else {
        autoFdn = 'bType';
      }
      return {
        shoulderWidth: clamped,
        selectedFoundationType: autoFdn,
      };
    }),

  setAlignment: (alignment) =>
    set((state) => {
      const curWind = state.wind ?? 105;
      if (alignment === 'tangent') {
        const span = getMaxTangentSpanForWind(curWind);
        const imp = state.implantationMode === 'standard' ? 2.80 : state.implantation;
        return {
          alignment,
          radius: 0,
          span,
          implantation: imp,
          activeStep: Math.max(state.activeStep, 4),
        };
      }

      // Inside or Outside Curve
      const radius = state.radius > 0 ? state.radius : 1400;
      const curveSpecs = getCurveScheduleForWind(curWind);
      const matched = curveSpecs.find((c) => c.radius <= radius) ?? curveSpecs[curveSpecs.length - 1]!;
      const imp = state.implantationMode === 'standard' ? getStandardImplantation(alignment, radius) : state.implantation;
      return {
        alignment,
        radius,
        span: matched.maxSpan,
        implantation: imp,
        activeStep: Math.max(state.activeStep, 4),
      };
    }),

  setRadius: (radius) =>
    set((state) => {
      const clampedRadius = Math.max(200, Math.min(2500, radius));
      const curWind = state.wind ?? 105;
      const curveSpecs = getCurveScheduleForWind(curWind);
      const matched = curveSpecs.find((c) => c.radius <= clampedRadius) ?? curveSpecs[curveSpecs.length - 1]!;
      const curAlign = state.alignment ?? 'outside';
      const imp = state.implantationMode === 'standard' ? getStandardImplantation(curAlign, clampedRadius) : state.implantation;
      return {
        radius: clampedRadius,
        span: matched.maxSpan, // AUTOMATICALLY coupled to schedule span!
        implantation: imp,
      };
    }),

  setSpan: (span) =>
    set(() => ({
      span,
    })),

  setRole: (role) =>
    set(() => ({
      role,
      activeStep: 5, // all completed
    })),

  setActiveStep: (step) =>
    set(() => ({
      activeStep: step,
    })),

  reset: () =>
    set({
      wind: null,
      implantationMode: 'standard',
      implantation: null,
      stepLevel: 0.50,
      shoulderWidth: 0.60,
      alignment: null,
      radius: 1000,
      span: 49.5,
      role: null,
      activeStep: 1,
    }),

  loadPreset: (presetName) => {
    if (presetName === 'rdso-178' || presetName === 'sample') {
      set({
        wind: 178, // 178 kgf/m² per Image 1 & user prompt
        implantationMode: 'custom',
        implantation: 3.50, // 3.50 m within 2.80 - 3.80 m range (Tier 2, Sheet 14)
        stepLevel: 0.90, // 0.90 m Cess Level (triggers BG-Type BG-9 per Image 2)
        shoulderWidth: 0.40, // 0.40 m Cess Shoulder Width (slope bank -> BG-Type)
        alignment: 'tangent',
        radius: 0,
        span: 58.5, // 58.5 m permissible span per Image 1
        role: 'N/NACC', // B-200, FBM 168
        selectedFoundationType: 'bgType', // BG-9 (highlighted yellow in Image 2)
        mastPreference: 'auto',
        activeStep: 5,
      });
    } else if (presetName === 'heavy') {
      set({
        wind: 178,
        implantationMode: 'custom',
        implantation: 4.20,
        stepLevel: 0.85,
        shoulderWidth: 0.35,
        alignment: 'inside',
        radius: 800,
        span: 45.0,
        role: 'ACC',
        selectedFoundationType: 'bgType',
        mastPreference: 'auto',
        activeStep: 5,
      });
    } else if (presetName === 'bwa') {
      set({
        wind: 178,
        implantationMode: 'custom',
        implantation: 3.50,
        stepLevel: 0.50,
        shoulderWidth: 0.70,
        alignment: 'tangent',
        radius: 0,
        span: 58.5,
        role: 'OLA/BWA', // B-225, FBM 395
        selectedFoundationType: 'bType', // B-12 for C = 0.50m
        mastPreference: 'auto',
        activeStep: 5,
      });
    } else if (presetName === 'excess-step') {
      set({
        wind: 178,
        implantationMode: 'custom',
        implantation: 3.50,
        stepLevel: 1.20, // excess step > 1.00m requiring super block (H = 0.70m) & NG-Type
        shoulderWidth: 0.15, // narrow slope edge (<0.20m) requiring NG-Type
        alignment: 'tangent',
        radius: 0,
        span: 58.5,
        role: 'N/NACC',
        selectedFoundationType: 'ngType', // NG-31 for C = 1.20m
        mastPreference: 'auto',
        activeStep: 5,
      });
    }
  },
}));
