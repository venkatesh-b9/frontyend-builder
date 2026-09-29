import { create } from 'zustand';
import type { Config } from './ohe-rules';

type OheStore = Config & { set: <K extends keyof Config>(key: K, value: Config[K]) => void; reset: () => void };
const defaults: Config = { category: 'single', wind: 105, implantation: 2.8, alignment: 'tangent', radius: 3500, span: 49.5, role: 'N/NACC', soil: 'normal', tracks: 2, portalSpan: 20, portalType: 'N' };
export const useOheStore = create<OheStore>((set) => ({ ...defaults, set: (key, value) => set({ [key]: value }), reset: () => set(defaults) }));
