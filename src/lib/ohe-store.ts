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
  setWind: (wind: number) => void;
  setImplantationMode: (mode: ImplantationMode) => void;
  setImplantation: (val: number) => void;
  setStepLevel: (val: number) => void;
  setAlignment: (alignment: Alignment) => void;
  setRadius: (radius: number) => void;
  setSpan: (span: number) => void;
  setRole: (role: Role) => void;
  setActiveStep: (step: number) => void;
  reset: () => void;
  loadPreset: (presetName: 'sample' | 'heavy' | 'bwa' | 'excess-step') => void;
}

const initialDefaults: OheConfig = {
  wind: 105,
  implantationMode: 'standard',
  implantation: 2.80, // RDSO standard tangent setting
  stepLevel: 0.50, // default standard step C = 0.50 m
  alignment: 'tangent',
  radius: 0,
  span: 67.5, // 105 kgf/m² tangent max span
  role: 'N/NACC',
};

export const useOheStore = create<OheState>((set) => ({
  ...initialDefaults,
  activeStep: 5, // fully configured by default
  selectedFoundationType: 'bType', // default to B-Type Side Bearing (Image 3)

  setSelectedFoundationType: (selectedFoundationType) => set({ selectedFoundationType }),

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
    set(() => ({
      stepLevel: Math.max(0.00, Math.min(2.00, Number(stepLevel.toFixed(2)))),
    })),

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
      alignment: null,
      radius: 1000,
      span: 49.5,
      role: null,
      activeStep: 1,
    }),

  loadPreset: (presetName) => {
    if (presetName === 'heavy') {
      set({
        wind: 178,
        implantationMode: 'custom',
        implantation: 4.20,
        stepLevel: 0.85,
        alignment: 'inside',
        radius: 800,
        span: 49.5,
        role: 'ACC',
        activeStep: 5,
      });
    } else if (presetName === 'bwa') {
      set({
        wind: 136,
        implantationMode: 'standard',
        implantation: 3.00,
        stepLevel: 0.50,
        alignment: 'tangent',
        radius: 1000,
        span: 54.0,
        role: 'OLA/BWA',
        activeStep: 5,
      });
    } else if (presetName === 'excess-step') {
      set({
        wind: 105,
        implantationMode: 'custom',
        implantation: 3.50,
        stepLevel: 1.20, // excess step requiring super block (H = 0.70m)
        alignment: 'tangent',
        radius: 1000,
        span: 49.5,
        role: 'N/NACC',
        activeStep: 5,
      });
    } else {
      set({
        wind: 105,
        implantationMode: 'standard',
        implantation: 3.00,
        stepLevel: 0.50,
        alignment: 'tangent',
        radius: 1000,
        span: 49.5,
        role: 'N/NACC',
        activeStep: 5,
      });
    }
  },
}));
