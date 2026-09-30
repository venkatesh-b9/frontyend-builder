import { create } from 'zustand';
import type { Alignment, FoundationTypeKey, ImplantationMode, OheConfig, Role } from './ohe-rules';

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
  implantation: 3.00,
  stepLevel: 0.50, // default standard step C = 0.50 m
  alignment: 'tangent',
  radius: 1000,
  span: 49.5,
  role: 'N/NACC',
};

export const useOheStore = create<OheState>((set) => ({
  ...initialDefaults,
  activeStep: 5, // fully configured by default
  selectedFoundationType: 'bType', // default to B-Type Side Bearing (Image 3)

  setSelectedFoundationType: (selectedFoundationType) => set({ selectedFoundationType }),

  setWind: (wind) =>
    set((state) => ({
      wind,
      activeStep: Math.max(state.activeStep, 2),
    })),

  setImplantationMode: (implantationMode) =>
    set((state) => ({
      implantationMode,
      implantation: implantationMode === 'standard' ? 3.00 : Math.max(3.00, Math.min(5.00, state.implantation ?? 3.50)),
      activeStep: Math.max(state.activeStep, 3),
    })),

  setImplantation: (implantation) =>
    set((state) => ({
      implantation: Math.max(3.00, Math.min(5.00, implantation)),
      activeStep: Math.max(state.activeStep, 3),
    })),

  setStepLevel: (stepLevel) =>
    set(() => ({
      stepLevel: Math.max(0.00, Math.min(2.00, Number(stepLevel.toFixed(2)))),
    })),

  setAlignment: (alignment) =>
    set((state) => ({
      alignment,
      activeStep: Math.max(state.activeStep, 4),
    })),

  setRadius: (radius) =>
    set(() => ({
      radius: Math.max(200, Math.min(2500, radius)),
    })),

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
