import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownToLine,
  Box,
  Check,
  CheckCircle2,
  CircleDot,
  Compass,
  Copy,
  Crosshair,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  Layers3,
  LayoutGrid,
  Menu,
  RotateCcw,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table as TableIcon,
  TrainFront,
  Wind,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  calculateOhe,
  roles,
  spans,
  windZones,
  RDSO_CURVE_RADII,
  getCurveScheduleForWind,
  getMaxTangentSpanForWind,
  getStandardImplantation,
  type Alignment,
  type Role,
} from '@/lib/ohe-rules';
import { useOheStore } from '@/lib/ohe-store';
import type { SceneView } from '@/components/ohe-scene';

const OheScene = lazy(() => import('@/components/ohe-scene'));

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'RDSO OHE Mast & Foundation Configurator | Engineering Workspace' },
      {
        name: 'description',
        content:
          'Precision Indian Railways RDSO OHE mast selection, dynamic implantation, Cess Step Level (C), Super Block volumes, and multi-soil foundation matrix.',
      },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
    ],
  }),
  component: ConfiguratorPage,
});

type MobileTab = 'wizard' | 'viewport' | 'matrix';

function StepHeader({
  number,
  title,
  subtitle,
  completed,
  active,
}: {
  number: string;
  title: string;
  subtitle?: string;
  completed: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/80 bg-panel px-4 py-2.5 sm:px-5 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-colors ${
            completed
              ? 'bg-success text-success-foreground'
              : active
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-panel-deep text-muted-foreground'
          }`}
        >
          {completed ? <Check className="size-3.5 stroke-[3]" /> : number}
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</h3>
          {subtitle && <p className="line-clamp-1 font-mono text-[9px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {completed ? (
        <Badge variant="outline" className="border-success/30 bg-success/10 font-mono text-[9px] text-success">
          SET
        </Badge>
      ) : active ? (
        <Badge variant="outline" className="border-primary/40 bg-primary/10 font-mono text-[9px] text-primary">
          ACTIVE
        </Badge>
      ) : (
        <Badge variant="outline" className="border-border bg-muted/30 font-mono text-[9px] text-muted-foreground">
          LOCKED
        </Badge>
      )}
    </div>
  );
}

function ConfiguratorPage() {
  const state = useOheStore();
  const {
    wind,
    implantationMode,
    implantation,
    stepLevel,
    alignment,
    radius,
    span,
    role,
    mastPreference,
    setMastPreference,
    selectedFoundationType,
    setSelectedFoundationType,
    setWind,
    setImplantationMode,
    setImplantation,
    setStepLevel,
    setAlignment,
    setRadius,
    setSpan,
    setRole,
    reset,
    loadPreset,
  } = state;

  const [sceneView, setSceneView] = useState<SceneView>('iso');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('wizard');
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState<'matrix' | 'specifications' | 'rdso-notes'>('matrix');
  const [mobileActionsOpen, setMobileActionsOpen] = useState<boolean>(false);

  // Sequential validation checks
  const step1Done = wind !== null;
  const step2Done = step1Done && implantation !== null;
  const step3Done = step2Done && alignment !== null;
  const step4Done = step3Done && role !== null;
  const allStepsComplete = step1Done && step2Done && step3Done && step4Done;

  const result = useMemo(
    () =>
      calculateOhe({
        wind,
        implantationMode,
        implantation,
        stepLevel,
        alignment,
        radius,
        span,
        role,
        mastPreference,
      }),
    [wind, implantationMode, implantation, stepLevel, alignment, radius, span, role, mastPreference]
  );

  const copyTechnicalSummary = async () => {
    const text = `RDSO OHE MAST & FOUNDATION SPECIFICATION
=========================================
1. LOAD & GEOMETRY PARAMETERS:
- Wind Pressure: ${wind ?? 'N/A'} kgf/m²
- Implantation (Setting Distance): ${(implantation ?? 3.0).toFixed(2)} m (${result.tierDescription})
- Cess Step Level Difference (C): ${result.superBlock.stepC.toFixed(2)} m (${result.superBlock.status})
${result.superBlock.required ? `- Super Block Height (H_sb): ${result.superBlock.height.toFixed(2)} m (ACTM Vol-II requirement)` : '- Super Block: Not Required (C ≤ 0.50 m standard step)'}
- Track Alignment: ${alignment ?? 'N/A'} ${alignment !== 'tangent' ? `(Radius: ${radius} m, Span: ${span} m, Versine: ${result.versine} mm)` : ''}
- Mast Function: ${role ?? 'N/A'}

2. MAST SIZING & DEFLECTION:
- Section: ${result.mastSection}
- Total Length: ${result.mastLengthTotal.toFixed(2)} m (${result.mastLengthAbove.toFixed(2)} m above foundation, ${result.mastLengthEmbedded.toFixed(2)} m embedded in foundation)
${result.superBlock.required ? `- Extra Embedment in Super Block: ${result.superBlock.height.toFixed(2)} m (Total below RL = ${result.superBlock.mastBelowRL.toFixed(2)} m)` : `- Mast Length Below RL: ${result.superBlock.mastBelowRL.toFixed(2)} m`}
- Reverse Deflection: ${result.deflectionDirection}
- Foundation Bending Moment (FBM) Code: ${result.fbmCode}

3. MULTI-SOIL FOUNDATION MATRIX (RDSO Volume Chart & KEC Standards):
- B-Type (Normal Soil 11,000 kgf/m²):
  Ref: ${result.foundations.bType.reference} | Dim: ${result.foundations.bType.dimText}
  Function: ${result.foundations.bType.functionCode} | Mast: ${result.foundations.bType.mastTypeLabel}
  Base: ${result.foundations.bType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.bType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.bType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.bType.totalVolume.toFixed(2)} m³
- HB-Type (Hard Soil / Moorum 21,500 kgf/m²):
  Ref: ${result.foundations.hbType.reference} | Dim: ${result.foundations.hbType.dimText}
  Function: ${result.foundations.hbType.functionCode} | Mast: ${result.foundations.hbType.mastTypeLabel}
  Base: ${result.foundations.hbType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.hbType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.hbType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.hbType.totalVolume.toFixed(2)} m³
- BG-Type (Slopes/Cuttings Step C=${result.superBlock.stepC.toFixed(2)}m):
  Ref: ${result.foundations.bgType.reference} | Dim: ${result.foundations.bgType.dimText}
  Function: ${result.foundations.bgType.functionCode} | Mast: ${result.foundations.bgType.mastTypeLabel}
  Base: ${result.foundations.bgType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.bgType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.bgType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.bgType.totalVolume.toFixed(2)} m³
- NG-Type (Loose Soil 5,500 kgf/m²):
  Ref: ${result.foundations.ngType.reference} | Dim: ${result.foundations.ngType.dimText}
  Function: ${result.foundations.ngType.functionCode} | Mast: ${result.foundations.ngType.mastTypeLabel}
  Base: ${result.foundations.ngType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.ngType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.ngType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.ngType.totalVolume.toFixed(2)} m³
- NBC-Type (Dry Black Cotton 16,500 kgf/m²):
  Ref: ${result.foundations.nbcType.reference} | Dim: ${result.foundations.nbcType.dimText}
  Function: ${result.foundations.nbcType.functionCode} | Mast: ${result.foundations.nbcType.mastTypeLabel}
  Base: ${result.foundations.nbcType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.nbcType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.nbcType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.nbcType.totalVolume.toFixed(2)} m³
- WBC-Type (Wet Black Cotton 8,000 kgf/m²):
  Ref: ${result.foundations.wbcType.reference} | Dim: ${result.foundations.wbcType.dimText}
  Function: ${result.foundations.wbcType.functionCode} | Mast: ${result.foundations.wbcType.mastTypeLabel}
  Base: ${result.foundations.wbcType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.wbcType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.wbcType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.wbcType.totalVolume.toFixed(2)} m³

* Reference: Indian Railways RDSO Employment Schedules, ACTM Vol-II, and Volume Charts.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground antialiased selection:bg-signal/20 selection:text-signal">
        {/* Top Navigation Bar */}
        <header className="no-print relative z-30 flex h-14 items-center justify-between border-b border-border bg-panel-deep px-3 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm sm:size-9">
              <TrainFront className="size-4 sm:size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-display text-sm font-bold uppercase tracking-tight sm:text-lg">
                  RDSO <span className="text-signal">OHE</span> Configurator
                </h1>
                <Badge variant="outline" className="hidden border-border font-mono text-[9px] text-muted-foreground sm:inline-flex">
                  V2.2 MOBILE
                </Badge>
              </div>
              <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                Coupled Mast Sizing, Cess Step Level (C), Super Block Engine & Multi-Soil Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="mr-1 hidden items-center gap-1.5 rounded-sm border border-border/80 bg-panel px-2.5 py-1 font-mono text-[10px] text-muted-foreground lg:flex">
              <span
                className={`size-2 rounded-full ${
                  allStepsComplete ? 'animate-pulse bg-success' : 'bg-signal'
                }`}
              />
              {allStepsComplete ? 'COUPLING ACTIVE' : 'AWAITING CONFIGURATION'}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPreset('rdso-178')}
              className="hidden border-border bg-panel text-xs hover:border-signal/50 md:inline-flex font-mono"
              title="Load 178 kgf/m², Implantation 3.5m, Cess C=0.90m, Mast B-200, FBM 168, BG-9"
            >
              <Sparkles className="size-3.5 text-signal mr-1" /> RDSO 178 (Img 1 & 2)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPreset('excess-step')}
              className="hidden border-border bg-panel text-xs hover:border-signal/50 lg:inline-flex"
              title="Test Cess Step C = 1.20m with Super Block"
            >
              <Box className="size-3.5 text-signal" /> Excess Step Demo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="hidden border-border bg-panel text-xs hover:border-destructive/40 sm:inline-flex"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="hidden bg-primary text-primary-foreground sm:inline-flex"
            >
              <ArrowDownToLine className="size-3.5" /> Print Sheet
            </Button>

            {/* Mobile Actions Drawer Button */}
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-border bg-panel lg:hidden"
              onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
              aria-label="Mobile Actions Menu"
            >
              {mobileActionsOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </header>

        {/* Mobile Dropdown Action Bar (Collapsible on mobile) */}
        {mobileActionsOpen && (
          <div className="no-print border-b border-border bg-panel p-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadPreset('sample');
                  setMobileActionsOpen(false);
                }}
                className="justify-start border-border bg-panel-deep text-xs"
              >
                <Sparkles className="size-3.5 text-signal mr-1.5" /> Standard Preset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadPreset('excess-step');
                  setMobileActionsOpen(false);
                }}
                className="justify-start border-border bg-panel-deep text-xs"
              >
                <Box className="size-3.5 text-signal mr-1.5" /> Excess Step (C=1.2m)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyTechnicalSummary();
                  setMobileActionsOpen(false);
                }}
                className="justify-start border-border bg-panel-deep text-xs"
              >
                <Copy className="size-3.5 mr-1.5" /> Copy Specification
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  reset();
                  setMobileActionsOpen(false);
                }}
                className="justify-start border-border bg-panel-deep text-xs text-destructive hover:text-destructive"
              >
                <RotateCcw className="size-3.5 mr-1.5" /> Reset Wizard
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Dedicated Segmented Tab Bar (Visible on mobile/tablet screens < lg) */}
        <div className="no-print sticky top-0 z-20 flex border-b border-border bg-panel-deep lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab('wizard')}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === 'wizard'
                ? 'border-signal bg-panel text-signal'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Wizard</span>
            <span className="rounded-full bg-panel-deep px-1.5 py-0.2 font-mono text-[9px]">
              {[step1Done, step2Done, step3Done, step4Done].filter(Boolean).length}/4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('viewport')}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === 'viewport'
                ? 'border-signal bg-panel text-signal'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Box className="size-3.5" />
            <span>3D Twin</span>
            {allStepsComplete && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 font-mono text-[9px] text-primary">
                3D
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('matrix')}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === 'matrix'
                ? 'border-signal bg-panel text-signal'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Matrix</span>
            <span className="rounded-full bg-signal-soft px-1.5 py-0.2 font-mono text-[9px] text-signal">
              FBM {result.fbmCode}
            </span>
          </button>
        </div>

        {/* Main Application Layout (Responsive Split: Side-by-Side on Desktop, Tabbed on Mobile) */}
        <div className="no-print flex flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
          {/* Left Column: Sequential Engineering Wizard */}
          <aside
            className={`w-full shrink-0 border-b border-border bg-panel lg:w-[470px] xl:w-[500px] lg:border-b-0 lg:border-r lg:overflow-y-auto ${
              mobileTab === 'wizard' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Wizard Desktop Header Status */}
            <div className="sticky top-0 z-10 hidden border-b border-border bg-panel/95 backdrop-blur-sm px-5 py-3 lg:block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sequential Wizard</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  PROGRESS:{' '}
                  <span className="font-bold text-signal">
                    {[step1Done, step2Done, step3Done, step4Done].filter(Boolean).length}/4
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-deep">
                <div
                  className="h-full bg-signal transition-all duration-300"
                  style={{
                    width: `${([step1Done, step2Done, step3Done, step4Done].filter(Boolean).length / 4) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="divide-y divide-border pb-24 lg:pb-8">
              {/* STEP 1: Wind Pressure (RDSO / IS:875) */}
              <section className="bg-panel-deep/30">
                <StepHeader
                  number="1"
                  title="Wind Pressure (RDSO / IS:875)"
                  subtitle="Filters subsequent schedules & structural sizing"
                  completed={step1Done}
                  active={!step1Done}
                />
                <div className="p-3.5 sm:p-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {windZones.map((zone) => {
                      const isSelected = wind === zone.value;
                      return (
                        <button
                          key={zone.value}
                          type="button"
                          onClick={() => setWind(zone.value)}
                          className={`flex min-h-[58px] flex-col items-start rounded border p-2.5 text-left transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'border-signal bg-signal/10 ring-1 ring-signal'
                              : 'border-border bg-panel hover:border-border hover:bg-panel-deep'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {zone.value} <span className="text-[10px] font-normal text-muted-foreground">kgf/m²</span>
                            </span>
                            {isSelected && <Check className="size-3 text-signal" />}
                          </div>
                          <span className="mt-1 text-[10px] font-medium text-signal">
                            {zone.zone} ({zone.speed})
                          </span>
                          <span className="mt-0.5 truncate text-[9px] text-muted-foreground" title={zone.desc}>
                            {zone.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {wind && (
                    <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-success" />
                      Wind Zone: <strong className="text-foreground">{wind} kgf/m²</strong> (
                      {windZones.find((z) => z.value === wind)?.zone})
                    </div>
                  )}
                </div>
              </section>

              {/* STEP 2: Implantation & Cess Step Level Difference (C) */}
              <section className={!step1Done ? 'opacity-40 pointer-events-none' : 'bg-panel-deep/30'}>
                <StepHeader
                  number="2"
                  title="Implantation & Cess Step (C)"
                  subtitle="Setting distance, Cess Step C, and Super Block Engine"
                  completed={step2Done}
                  active={step1Done && !step2Done}
                />
                <div className="p-3.5 sm:p-5 space-y-4">
                  {/* 1. Implantation Mode Cards */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      1. Implantation Selection
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {/* Card A: Fixed Standard */}
                      <div
                        onClick={() => setImplantationMode('standard')}
                        className={`cursor-pointer rounded border p-3 transition-all active:scale-[0.98] ${
                          implantationMode === 'standard'
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-panel hover:bg-panel-deep'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-foreground">Card A: Standard Setting</span>
                          {implantationMode === 'standard' && <Check className="size-3.5 text-primary" />}
                        </div>
                        <div className="mt-2 font-mono text-xl font-bold text-signal">
                          {result.minSetting.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">m</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Auto-enforced per PDF 2 Page 37 ({alignment === 'tangent' ? 'Tangent: 2.80m' : alignment === 'outside' ? `Outside Curve: ${result.minSetting.toFixed(2)}m` : `Inside Curve: ${result.minSetting.toFixed(2)}m`}).
                        </p>
                      </div>

                      {/* Card B: Dynamic Custom */}
                      <div
                        onClick={() => setImplantationMode('custom')}
                        className={`cursor-pointer rounded border p-3 transition-all active:scale-[0.98] ${
                          implantationMode === 'custom'
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-panel hover:bg-panel-deep'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-foreground">Card B: Dynamic Custom</span>
                          {implantationMode === 'custom' && <Check className="size-3.5 text-primary" />}
                        </div>
                        <div className="mt-2 font-mono text-xl font-bold text-signal">
                          {(implantation ?? result.minSetting).toFixed(2)}{' '}
                          <span className="text-xs font-normal text-muted-foreground">m</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Custom setting (2.50m – 5.00m) resolving exact PDF 1 Implantation Tier.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider and Input for Implantation */}
                  <div className="rounded border border-border/80 bg-panel p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Implantation Setting Distance (m)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={2.5}
                          max={5.0}
                          step={0.05}
                          value={implantation ?? result.minSetting}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setImplantationMode('custom');
                              setImplantation(val);
                            }
                          }}
                          className="h-8 w-20 border-border bg-panel-deep text-right font-mono text-xs"
                        />
                        <span className="font-mono text-xs text-muted-foreground">m</span>
                      </div>
                    </div>

                    <Slider
                      min={2.5}
                      max={5.0}
                      step={0.05}
                      value={[implantation ?? result.minSetting]}
                      onValueChange={(vals) => {
                        setImplantationMode('custom');
                        setImplantation(vals[0] ?? 2.8);
                      }}
                      className="py-1"
                    />

                    {/* Quick Touch Preset Buttons on Mobile */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[2.8, 2.95, 3.2, 3.35, 3.55, 3.8, 4.2, 4.85].map((presetVal) => (
                        <button
                          key={presetVal}
                          type="button"
                          onClick={() => {
                            setImplantationMode('custom');
                            setImplantation(presetVal);
                          }}
                          className={`rounded border px-2 py-0.5 font-mono text-[9px] transition-colors ${
                            (implantation ?? result.minSetting) === presetVal
                              ? 'border-signal bg-signal/20 font-bold text-signal'
                              : 'border-border bg-panel-deep text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {presetVal.toFixed(2)}m
                        </button>
                      ))}
                    </div>

                    {/* Tier Flag Banner (PDF 1 Employment Schedule Sheet Mapping) */}
                    <div
                      className={`rounded border px-3 py-2 text-[11px] ${
                        result.requiresChair
                          ? 'border-signal/40 bg-signal-soft text-signal'
                          : 'border-border bg-panel-deep text-muted-foreground'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 font-bold">
                        <span className="font-mono">{result.sheetInfo.implantationTier}:</span>
                        <span className="text-[10px] text-foreground font-normal">{result.sheetInfo.implantationDesc}</span>
                        <Badge variant="outline" className="border-border text-[9px]">
                          PDF 1 Sheet-{result.sheetInfo.sheetNumber}
                        </Badge>
                      </div>
                      {result.requiresChair && (
                        <p className="mt-1 text-[10px] leading-tight text-signal">
                          ⚠️ Warning: Requires Cantilever Adaptor Chair per RDSO Drawing <strong>ETI/OHE/P/3131</strong>.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Cess Step Level Difference (C) & Super Block Engineering */}
                  <div className="rounded border border-border/80 bg-panel p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold uppercase text-foreground">
                          2. Cess Step Level Difference (C)
                        </label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Vertical distance from Rail Level (RL) to top of foundation casting. Standard C ≤ 0.50 m. If
                            C &gt; 0.50 m, a monolithic Super Block is mandated by ACTM Vol-II.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0.0}
                          max={2.0}
                          step={0.05}
                          value={stepLevel}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) setStepLevel(val);
                          }}
                          className="h-8 w-20 border-border bg-panel-deep text-right font-mono text-xs"
                        />
                        <span className="font-mono text-xs text-muted-foreground">m</span>
                      </div>
                    </div>

                    <Slider
                      min={0.0}
                      max={2.0}
                      step={0.05}
                      value={[stepLevel]}
                      onValueChange={(vals) => setStepLevel(vals[0] ?? 0.5)}
                      className="py-1"
                    />

                    {/* Cess Level Guidance Banner & Recommended Foundation by Cess */}
                    <div className="rounded border border-primary/30 bg-primary/10 p-2.5 text-[11px] space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-primary">
                          <CheckCircle2 className="size-3.5 text-primary" />
                          Recommended Foundation: {result.recommendedFoundation.typeName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`font-mono text-[9px] ${
                            result.recommendedFoundation.typeKey === 'bgType'
                              ? 'border-signal bg-signal/20 text-signal font-bold'
                              : 'border-primary/40 text-primary'
                          }`}
                        >
                          {result.recommendedFoundation.soilPressure}
                        </Badge>
                      </div>
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {result.recommendedFoundation.reason}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[9px]">
                        <span
                          className={`rounded px-1.5 py-0.5 border transition-all ${
                            stepLevel <= 0.70
                              ? 'border-signal bg-signal/20 text-signal font-bold shadow-sm'
                              : 'border-border bg-panel-deep text-muted-foreground'
                          }`}
                        >
                          C ≤ 0.70m: B-Type (Normal Ground)
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 border transition-all ${
                            stepLevel > 0.70 && stepLevel <= 1.00
                              ? 'border-signal bg-signal/20 text-signal font-bold shadow-sm'
                              : 'border-border bg-panel-deep text-muted-foreground'
                          }`}
                        >
                          0.70m &lt; C ≤ 1.00m: BG-Type (High Cess / Slope)
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 border transition-all ${
                            stepLevel > 1.00
                              ? 'border-signal bg-signal/20 text-signal font-bold shadow-sm'
                              : 'border-border bg-panel-deep text-muted-foreground'
                          }`}
                        >
                          C &gt; 1.00m: NG-Type (Pure Gravity)
                        </span>
                      </div>
                    </div>

                    {/* Quick Step Presets for Easy Mobile Selection */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { val: 0.0, label: '0.00m (Flush)' },
                        { val: 0.5, label: '0.50m (B-Type Normal)' },
                        { val: 0.7, label: '0.70m (B-Type Max)' },
                        { val: 0.9, label: '0.90m (BG-Type High Cess)' },
                        { val: 1.2, label: '1.20m (NG-Type Deep Cess)' },
                        { val: 1.6, label: '1.60m (Extreme SB)' },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setStepLevel(preset.val)}
                          className={`rounded border px-2 py-0.5 font-mono text-[9px] transition-colors ${
                            stepLevel === preset.val
                              ? 'border-signal bg-signal/20 font-bold text-signal'
                              : 'border-border bg-panel-deep text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Engineering Threshold Status */}
                    <div
                      className={`flex items-center justify-between rounded border px-3 py-2 text-[11px] ${
                        result.superBlock.required
                          ? 'border-destructive/40 bg-destructive/10 text-destructive'
                          : 'border-success/30 bg-success/10 text-success'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {result.superBlock.required ? (
                          <AlertTriangle className="size-4 shrink-0 text-destructive" />
                        ) : (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        )}
                        <span>{result.superBlock.status}</span>
                      </div>
                      <span className="font-mono text-[10px]">C = {result.superBlock.stepC.toFixed(2)} m</span>
                    </div>

                    {/* Super Block Details Card (If C > 0.50 m) */}
                    {result.superBlock.required ? (
                      <div className="rounded border border-signal/40 bg-signal-soft p-3 text-[11px] space-y-2 text-foreground">
                        <div className="flex items-center justify-between font-bold text-signal">
                          <span className="flex items-center gap-1.5">
                            <Box className="size-4" /> Super Block Mandated (ACTM Vol-II)
                          </span>
                          <span className="font-mono text-xs">
                            H_sb = {result.superBlock.height.toFixed(2)} m
                          </span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          Super Block required of size ({result.foundations.bType.a.toFixed(2)}m ×{' '}
                          {result.foundations.bType.b.toFixed(2)}m top) × {result.superBlock.height.toFixed(2)} m height
                          to bring top of casting to within 500 mm of Rail Level.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                          <div className="rounded bg-panel-deep px-2 py-1 border border-border">
                            <span className="text-muted-foreground">Extra Concrete Vol:</span>{' '}
                            <strong className="text-signal">
                              {result.foundations.bType.superBlockVolume.toFixed(2)} m³
                            </strong>
                          </div>
                          <div className="rounded bg-panel-deep px-2 py-1 border border-border">
                            <span className="text-muted-foreground">Mast below RL:</span>{' '}
                            <strong className="text-foreground">
                              {result.superBlock.mastBelowRL.toFixed(2)} m
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded border border-border bg-panel-deep p-2.5 font-mono text-[10px] text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Mast embedment in foundation:</span>
                          <span className="text-foreground">1.35 m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mast below Rail Level (1.35m + C):</span>
                          <span className="text-foreground">{result.superBlock.mastBelowRL.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Super Block requirement:</span>
                          <span className="text-success font-semibold">None (Standard C ≤ 0.50m)</span>
                        </div>
                      </div>
                    )}

                    {/* Clause 3.5.14 Violation Alert */}
                    {result.superBlock.clause3514Violation && (
                      <div className="flex items-start gap-2 rounded border border-destructive bg-destructive/20 p-2.5 text-[11px] text-destructive">
                        <AlertOctagon className="mt-0.5 size-4 shrink-0" />
                        <span>
                          <strong>Clause 3.5.14 Violation:</strong> Mast below RL cannot exceed 1.850 m without casting
                          a monolithic Super Block.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* STEP 3: Alignment & Curve Parameters */}
              <section className={!step2Done ? 'opacity-40 pointer-events-none' : 'bg-panel-deep/30'}>
                <StepHeader
                  number="3"
                  title="Track Alignment & Curvature"
                  subtitle="Tangent or Curvature with dynamic Versine & Clearance"
                  completed={step3Done}
                  active={step2Done && !step3Done}
                />
                <div className="p-3.5 sm:p-5 space-y-4">
                  {/* Segmented Control */}
                  <div className="grid grid-cols-3 gap-1 rounded border border-border bg-panel-deep p-1">
                    {[
                      { key: 'tangent', label: 'Tangent' },
                      { key: 'inside', label: 'Inside Curve' },
                      { key: 'outside', label: 'Outside Curve' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setAlignment(item.key as Alignment)}
                        className={`rounded py-2 text-[11px] font-semibold transition-all active:scale-[0.98] ${
                          alignment === item.key
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Curve Parameters */}
                  {alignment && alignment !== 'tangent' && (
                    <div className="rounded border border-border/80 bg-panel p-3.5 space-y-3.5">
                      {/* Standard RDSO Curve Radii Quick Selector (PDF 1 Discrete Rows) */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase text-foreground">
                            1. Select Curve Radius (R)
                          </label>
                          <span className="font-mono text-xs font-bold text-signal">{radius} m</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                          {RDSO_CURVE_RADII.map((rVal) => {
                            const curveSpecs = getCurveScheduleForWind(wind ?? 105);
                            const matched = curveSpecs.find((c) => c.radius <= rVal) ?? curveSpecs[curveSpecs.length - 1]!;
                            const isSelected = radius === rVal;
                            return (
                              <button
                                key={rVal}
                                type="button"
                                onClick={() => setRadius(rVal)}
                                className={`flex flex-col items-center justify-center rounded border p-1.5 transition-all text-center ${
                                  isSelected
                                    ? 'border-signal bg-signal/15 ring-1 ring-signal text-foreground font-bold'
                                    : 'border-border bg-panel-deep/60 hover:bg-panel-deep text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <span className="font-mono text-xs font-bold">{rVal}m</span>
                                <span className="font-mono text-[9px] text-signal font-semibold">
                                  {matched.maxSpan}m span
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slider and Input for Custom Radius */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">Fine Radius Adjustment</span>
                          <span className="font-mono text-[10px] text-muted-foreground">200 m – 2500 m</span>
                        </div>
                        <Slider
                          min={200}
                          max={2500}
                          step={50}
                          value={[radius]}
                          onValueChange={(vals) => setRadius(vals[0] ?? 1000)}
                          className="mt-1.5 py-1"
                        />
                      </div>

                      {/* Schedule Coupling Banner (PDF 1 Automatic Rule) */}
                      <div className="rounded border border-primary/40 bg-primary/10 p-2.5 text-[11px] space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-primary">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5" /> PDF 1 Schedule Auto-Coupled
                          </span>
                          <span className="font-mono text-[10px] text-primary">
                            {result.sheetInfo.sheetDrawing}
                          </span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          Radius <strong>{radius} m</strong> on {alignment === 'inside' ? 'Inside Curve' : 'Outside Curve'} auto-selects OHE Span to{' '}
                          <strong className="text-signal">{result.maxPermissibleSpan} m</strong> with Max Versine{' '}
                          <strong className="text-signal">{result.maxScheduleVersine} mm</strong> per RDSO Employment Schedule.
                        </p>
                      </div>

                      {/* Span Selector */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                            2. OHE Span Length (m)
                          </label>
                          {span > result.maxPermissibleSpan && (
                            <button
                              type="button"
                              onClick={() => setSpan(result.maxPermissibleSpan)}
                              className="font-mono text-[10px] text-destructive underline hover:text-destructive/80 font-bold"
                            >
                              Reset to Schedule Max ({result.maxPermissibleSpan}m)
                            </button>
                          )}
                        </div>
                        <Select value={String(span)} onValueChange={(val) => setSpan(parseFloat(val))}>
                          <SelectTrigger className="mt-1.5 h-8 border-border bg-panel-deep font-mono text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {spans.map((s) => (
                              <SelectItem
                                key={s}
                                value={String(s)}
                                className={`font-mono text-xs ${s > result.maxPermissibleSpan ? 'text-destructive' : ''}`}
                              >
                                {s.toFixed(1)} m span {s === result.maxPermissibleSpan ? '★ (Schedule Max)' : s > result.maxPermissibleSpan ? '⚠️ (Exceeds Max!)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {span > result.maxPermissibleSpan && (
                          <div className="mt-1.5 flex items-start gap-1 rounded bg-destructive/10 border border-destructive/30 p-1.5 text-[10px] text-destructive">
                            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                            <span>Warning: Selected span ({span}m) exceeds RDSO maximum permissible span of {result.maxPermissibleSpan}m for R={radius}m.</span>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Versine Readout */}
                      <div className="flex items-center justify-between rounded bg-panel-deep px-3 py-2 border border-border">
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          Versine: S² / (8 × R) × 1000
                        </span>
                        <span className="font-mono text-xs font-bold text-signal">
                          {result.versine.toFixed(1)} mm
                        </span>
                      </div>

                      {/* Inside Curve Clearance Auto-enforce Notice */}
                      {alignment === 'inside' && !result.settingValid && (
                        <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-2.5 text-[11px] text-destructive">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          <span>
                            Setting distance ({(implantation ?? result.minSetting).toFixed(2)} m) is below the RDSO minimum (
                            {result.minSetting.toFixed(2)} m) required for an inside curve of radius {radius} m per PDF 2 Page 37.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {alignment === 'tangent' && (
                    <div className="rounded border border-border bg-panel p-3 text-[11px] space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-muted-foreground">Track Alignment:</span>
                        <span className="text-foreground font-bold">Straight Tangent (Radius: ∞)</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-muted-foreground">Permissible OHE Span:</span>
                        <span className="text-signal font-bold">{result.maxPermissibleSpan} m</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-muted-foreground">Versine / Stagger:</span>
                        <span className="text-foreground font-semibold">0.0 mm</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-muted-foreground">Schedule Drawing:</span>
                        <span className="text-primary font-bold">{result.sheetInfo.sheetDrawing} (Row 1)</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* STEP 4: Mast Function Selection (Reactive Core) */}
              <section className={!step3Done ? 'opacity-40 pointer-events-none' : 'bg-panel-deep/30'}>
                <StepHeader
                  number="4"
                  title="Mast Function Selection (Reactive Core)"
                  subtitle="Dynamically scales Mast Type, Reverse Deflection & FBM Code"
                  completed={step4Done}
                  active={step3Done && !step4Done}
                />
                <div className="p-3.5 sm:p-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {roles.map((r) => {
                      const isSelected = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex min-h-[72px] flex-col items-start rounded border p-2.5 text-left transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'border-signal bg-signal/10 ring-1 ring-signal shadow-sm'
                              : 'border-border bg-panel hover:border-border hover:bg-panel-deep'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-mono text-xs font-bold text-foreground">{r.label}</span>
                            {isSelected && <Check className="size-3 text-signal" />}
                          </div>
                          <span className="mt-0.5 text-[10px] font-medium text-signal">{r.title}</span>
                          <span className="mt-1 line-clamp-2 text-[9px] leading-tight text-muted-foreground">
                            {r.detail}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* B-Series Mast Size Selector & RDSO Schedule Auto Resolution */}
                  <div className="mt-3 rounded border border-border/80 bg-panel p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        B-Series Mast Section (PDF 1 Employment Schedule Columns)
                      </span>
                      <span className="font-mono text-[10px] text-signal font-bold">
                        {result.mastSection.split(' (')[0]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'auto' as const, label: 'Auto (RDSO Schedule Rec.)' },
                        { id: 'B-175' as const, label: 'B-175 (175 mm)' },
                        { id: 'B-200' as const, label: 'B-200 (200 mm)' },
                        { id: 'B-225' as const, label: 'B-225 (225 mm)' },
                        { id: 'B-250' as const, label: 'B-250 (250 mm)' },
                      ].map((item) => {
                        const isSelected = (mastPreference ?? 'auto') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setMastPreference(item.id)}
                            className={`rounded border px-2.5 py-1 font-mono text-[10px] transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                                : 'border-border bg-panel-deep text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                      <span>
                        FBM Code: <strong className="text-primary font-bold">{result.fbmCode}</strong>
                      </span>
                      <span>
                        Reverse Deflection: <strong className="text-signal font-bold">{result.deflectionDirection}</strong>
                      </span>
                      <span>
                        Embedment: <strong className="text-foreground font-mono">{result.mastLengthEmbedded}m</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Mobile Sticky Floating Summary Pill (Shown when on Wizard tab on mobile) */}
            <div className="no-print fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t border-border bg-panel/95 p-2.5 backdrop-blur-md lg:hidden">
              <div className="min-w-0 pr-2 font-mono text-[10px] leading-tight">
                <div className="truncate font-bold text-foreground">{result.mastSection}</div>
                <div className="text-muted-foreground">
                  FBM <span className="text-signal font-semibold">{result.fbmCode}</span> · C:{' '}
                  <span className="text-foreground">{result.superBlock.stepC.toFixed(2)}m</span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setMobileTab('viewport')}
                  className="h-8 bg-primary px-2.5 text-xs text-primary-foreground"
                >
                  <Box className="size-3.5 mr-1" /> View 3D
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileTab('matrix')}
                  className="h-8 border-border bg-panel-deep px-2.5 text-xs"
                >
                  <FileSpreadsheet className="size-3.5 mr-1" /> Matrix
                </Button>
              </div>
            </div>
          </aside>

          {/* Right Column: 3D Viewport and Dynamic Foundation Matrix */}
          <main
            className={`flex min-w-0 flex-1 flex-col overflow-y-auto bg-background ${
              mobileTab === 'wizard' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* 3D Scene Viewport / Conditional Blueprint Card */}
            <section
              className={`relative flex shrink-0 flex-col overflow-hidden border-b border-border bg-[#0d1520] ${
                mobileTab === 'viewport' ? 'h-[calc(100vh-120px)] lg:h-[480px]' : 'h-[360px] lg:h-[460px]'
              }`}
            >
              {/* Header Bar over Viewport */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-panel-deep/85 px-3 py-2 backdrop-blur-md sm:px-4 sm:py-2.5">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Box className="size-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    3D Digital Twin Viewport
                  </span>
                  {allStepsComplete && (
                    <Badge variant="outline" className="hidden sm:inline-flex border-primary/30 bg-primary/10 font-mono text-[9px] text-primary">
                      {result.mastSection}
                    </Badge>
                  )}
                  {allStepsComplete && result.superBlock.required && (
                    <Badge variant="outline" className="border-signal/40 bg-signal-soft font-mono text-[9px] text-signal">
                      SB: {result.superBlock.height.toFixed(2)}m
                    </Badge>
                  )}
                </div>

                {allStepsComplete && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    {/* 3D Foundation Model Selector (PDF 2 Volume Chart Drawings) */}
                    <div className="flex items-center rounded border border-border bg-panel p-0.5" title="Switch 3D Foundation Type (PDF 2 Volume Chart)">
                      {(
                        [
                          ['bType', 'B (Img 3)'],
                          ['hbType', 'HB (P.02)'],
                          ['bgType', 'BG (Img 4)'],
                          ['ngType', 'NG (Img 5)'],
                          ['nbcType', 'NBC (P.06)'],
                          ['wbcType', 'WBC (P.04)'],
                        ] as const
                      ).map(([k, label]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelectedFoundationType(k)}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors sm:px-2 sm:py-1 sm:text-[10px] ${
                            selectedFoundationType === k
                              ? 'bg-signal text-signal-foreground font-black shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* View preset buttons */}
                    <div className="flex items-center rounded border border-border bg-panel p-0.5">
                      {(
                        [
                          ['iso', 'Iso'],
                          ['front', 'Front'],
                          ['side', 'Side'],
                          ['top', 'Top'],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSceneView(v)}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors sm:px-2 sm:py-1 sm:text-[10px] ${
                            sceneView === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Wireframe toggle */}
                    <Button
                      variant={wireframe ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setWireframe(!wireframe)}
                      className="h-6 sm:h-7 border-border px-1.5 sm:px-2 text-[9px] sm:text-[10px]"
                      title="Toggle Wireframe mode"
                    >
                      <Eye className="size-3 sm:mr-1" />
                      <span className="hidden sm:inline">Wireframe</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Viewport Content: Conditional Rendering */}
              <div className="relative flex-1">
                {allStepsComplete ? (
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                        Initializing 3D WebGL Canvas…
                      </div>
                    }
                  >
                    <OheScene
                      config={{
                        wind,
                        implantationMode,
                        implantation,
                        stepLevel,
                        alignment,
                        radius,
                        span,
                        role,
                      }}
                      result={result}
                      view={sceneView}
                      wireframe={wireframe}
                      selectedFoundationType={selectedFoundationType}
                    />

                    {/* Overlay HUD Readouts (Mobile Compact) */}
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 sm:bottom-4 sm:left-4 sm:right-auto sm:gap-2">
                      <div className="flex items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                        <Layers3 className="size-3 text-primary" />
                        3D FDN:{' '}
                        <span className="font-bold text-signal uppercase">
                          {selectedFoundationType === 'bType'
                            ? `B-Type (Img 3: ${result.foundations.bType.reference})`
                            : selectedFoundationType === 'bgType'
                            ? `BG-Type (Img 4: ${result.foundations.bgType.reference})`
                            : selectedFoundationType === 'ngType'
                            ? `NG-Type (Img 5: ${result.foundations.ngType.reference})`
                            : selectedFoundationType === 'hbType'
                            ? `HB-Type (P.02: ${result.foundations.hbType.reference})`
                            : selectedFoundationType === 'nbcType'
                            ? `NBC-Type (P.06: ${result.foundations.nbcType.reference})`
                            : `WBC-Type (P.04: ${result.foundations.wbcType.reference})`}
                        </span>
                      </div>
                      <div className="hidden items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm md:flex">
                        <FileText className="size-3 text-primary" />
                        <span className="text-primary font-bold">{result.sheetInfo.sheetDrawing}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                        <Crosshair className="size-3 text-signal" />
                        IMP: <span className="font-bold text-signal">{(implantation ?? result.minSetting).toFixed(2)}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                        STEP C: <span className="font-bold text-signal">{result.superBlock.stepC.toFixed(2)}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                        FBM: <span className="font-bold text-primary">{result.fbmCode}</span>
                      </div>
                      <div className="hidden items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2.5 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm sm:flex">
                        DEFLECTION: <span className="font-bold text-signal">{result.deflectionDirection}</span>
                      </div>
                    </div>

                    <div className="pointer-events-none absolute top-12 right-3 hidden rounded border border-border bg-panel-deep/80 px-2 py-1 font-mono text-[9px] text-muted-foreground backdrop-blur-sm lg:block">
                      ORBIT: Drag · PAN: Right Click · ZOOM: Scroll
                    </div>
                  </Suspense>
                ) : (
                  /* High-End Technical Blueprint Empty State */
                  <div className="relative flex h-full flex-col items-center justify-center p-4 text-center sm:p-8">
                    <div className="pointer-events-none absolute inset-0 opacity-15 technical-grid" />

                    <div className="relative z-10 max-w-md rounded-lg border border-border/80 bg-panel-deep/90 p-4 shadow-2xl backdrop-blur-md sm:p-6">
                      <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary sm:size-12">
                        <Layers className="size-5 animate-pulse sm:size-6" />
                      </div>

                      <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm">
                        Awaiting Configuration Parameters
                      </h3>
                      <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                        Configure Wind Pressure, Implantation, Cess Step Level (C), Alignment, and Mast Function to
                        generate 3D Digital Twin and Foundation Matrix.
                      </p>

                      {/* Step completion pills */}
                      <div className="mt-3 grid grid-cols-2 gap-1.5 text-left font-mono text-[9px] sm:gap-2 sm:text-[10px]">
                        <div
                          className={`flex items-center gap-1 rounded border px-2 py-1 ${
                            step1Done ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-panel text-muted-foreground'
                          }`}
                        >
                          <CircleDot className="size-2.5" />
                          <span className="truncate">1. Wind: {wind ? `${wind}kg` : 'Pending'}</span>
                        </div>

                        <div
                          className={`flex items-center gap-1 rounded border px-2 py-1 ${
                            step2Done ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-panel text-muted-foreground'
                          }`}
                        >
                          <CircleDot className="size-2.5" />
                          <span className="truncate">2. Imp: {implantation ? `${implantation.toFixed(2)}m` : 'Pending'}</span>
                        </div>

                        <div
                          className={`flex items-center gap-1 rounded border px-2 py-1 ${
                            step3Done ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-panel text-muted-foreground'
                          }`}
                        >
                          <CircleDot className="size-2.5" />
                          <span className="truncate">3. Align: {alignment ? alignment : 'Pending'}</span>
                        </div>

                        <div
                          className={`flex items-center gap-1 rounded border px-2 py-1 ${
                            step4Done ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-panel text-muted-foreground'
                          }`}
                        >
                          <CircleDot className="size-2.5" />
                          <span className="truncate">4. Mast: {role ? role : 'Pending'}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            loadPreset('sample');
                            setMobileTab('viewport');
                          }}
                          className="bg-primary text-primary-foreground text-xs"
                        >
                          <Sparkles className="size-3.5 mr-1" /> Load Standard Setup
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Dynamic Structural Cascade & Multi-Soil Dynamic Foundation Matrix */}
            <section
              className={`p-3.5 sm:p-6 space-y-4 sm:space-y-6 ${
                mobileTab === 'viewport' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Output Engine Summary Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                <div className="rounded border border-border bg-panel p-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase">Recommended Mast</span>
                    <Layers3 className="size-3.5 text-primary" />
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-foreground sm:text-base">
                    {result.mastSection}
                  </div>
                  <div className="mt-0.5 line-clamp-1 font-mono text-[9px] text-muted-foreground">
                    Total: {result.mastLengthTotal}m · Embed: {result.mastLengthEmbedded}m
                    {result.superBlock.required && ` + ${result.superBlock.height.toFixed(2)}m SB`}
                  </div>
                </div>

                <div className="rounded border border-border bg-panel p-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase">Reverse Deflection</span>
                    <Compass className="size-3.5 text-signal" />
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-signal sm:text-base">
                    {result.deflectionDirection}
                  </div>
                  <div className="mt-0.5 line-clamp-1 font-mono text-[9px] text-muted-foreground">
                    {role === 'OLA/BWA' ? 'Guy wire anchor counter-deflection' : 'Cantilever load pre-camber'}
                  </div>
                </div>

                <div className="rounded border border-border bg-panel p-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase">FBM Code (RDSO)</span>
                    <Gauge className="size-3.5 text-primary" />
                  </div>
                  <div className="mt-1 font-display text-lg font-bold text-primary sm:text-xl">
                    {result.fbmCode}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                    RDSO Schedule Code
                  </div>
                </div>

                <div className="rounded border border-border bg-panel p-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase">Cess Step & Super Block</span>
                    <Box className="size-3.5 text-signal" />
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-foreground sm:text-base">
                    {result.superBlock.required ? `H = ${result.superBlock.height.toFixed(2)} m` : 'Standard Step'}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                    C = {result.superBlock.stepC.toFixed(2)} m (RL to Fdn Top)
                  </div>
                </div>
              </div>

              {/* Navigation Tabs & Display Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border">
                <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'matrix', label: 'Foundation Matrix', icon: FileSpreadsheet },
                    { id: 'specifications', label: 'Schedule Specs', icon: Activity },
                    { id: 'rdso-notes', label: 'ACTM Notes', icon: ShieldCheck },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 border-b-2 py-2 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                          activeTab === tab.id
                            ? 'border-signal text-signal'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="size-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pb-1 sm:pb-0">
                  {/* Cards vs Table View toggle for mobile/tablet */}
                  {activeTab === 'matrix' && (
                    <div className="flex items-center rounded border border-border bg-panel p-0.5">
                      <button
                        type="button"
                        onClick={() => setMatrixDisplayMode('cards')}
                        className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                          matrixDisplayMode === 'cards'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Card view (optimized for mobile)"
                      >
                        <LayoutGrid className="size-3 mr-1 inline" /> Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatrixDisplayMode('table')}
                        className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                          matrixDisplayMode === 'table'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Tabular data view"
                      >
                        <TableIcon className="size-3 mr-1 inline" /> Table
                      </button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyTechnicalSummary}
                    className="h-7 sm:h-8 border-border bg-panel text-[11px] sm:text-xs"
                  >
                    {copied ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Tab 1: Multi-Soil Dynamic Foundation Matrix */}
              {activeTab === 'matrix' && (
                <div className="space-y-4">
                  {/* Active RDSO Employment Schedule & Foundation Matrix Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-primary/40 bg-panel-deep p-3.5 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/20 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 font-bold text-foreground">
                          <span>{result.sheetInfo.sheetDrawing}</span>
                          <Badge variant="outline" className="border-signal/50 text-signal font-mono text-[9px] bg-signal/10">
                            {wind} kgf/m² ({result.sheetInfo.windSpeed})
                          </Badge>
                          <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[9px] bg-primary/10">
                            {result.sheetInfo.implantationTier}
                          </Badge>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground mt-0.5">
                          Section: <strong className="text-foreground">{result.sheetInfo.tableSection}</strong> · {result.sheetInfo.implantationDesc}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[10.5px]">
                      <div>
                        <span className="text-muted-foreground">FBM Code: </span>
                        <strong className="text-primary font-bold">{result.fbmCode}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reverse Deflection: </span>
                        <strong className="text-signal font-bold">{result.deflectionDirection}</strong>
                      </div>
                    </div>
                  </div>

                  {/* KEC Volume Chart Sheet No. 01 Equivalent Foundation Sizing (Image 2) */}
                  <div className="rounded-lg border border-border bg-panel overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-panel-deep px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-signal/50 bg-signal/10 text-signal font-mono text-[9px] font-bold">
                          KEC Sheet No. 01 (Image 2)
                        </Badge>
                        <span className="font-bold text-xs text-foreground">
                          Equivalent Foundation Sizes for FDN Code {result.fbmCode} (Contract Agreement RVNL/ELECT/JHS/CWA-KAV/RE)
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-[9px]">
                        Soil Design: 11,000 kgf/m²
                      </Badge>
                    </div>

                    <div className="overflow-x-auto p-3">
                      <table className="w-full text-center font-mono text-[10.5px]">
                        <thead>
                          <tr className="border-b border-border text-[9.5px] uppercase text-muted-foreground">
                            <th className="pb-2 text-left">FDN Code</th>
                            <th className="pb-2">Direct Load</th>
                            <th className="pb-2">Bending Moment</th>
                            <th className={`pb-2 px-1.5 ${stepLevel <= 0.70 ? 'text-signal font-bold' : ''}`}>
                              Side Bearing 11k {stepLevel <= 0.70 && '★ (C ≤ 0.7m)'}
                            </th>
                            <th className="pb-2 px-1.5">Hard Soil 21.5k</th>
                            <th className="pb-2 px-1.5">Side Gravity 8k</th>
                            <th className={`pb-2 px-1.5 ${stepLevel > 0.70 && stepLevel <= 1.00 ? 'text-signal font-bold' : ''}`}>
                              Side Gravity 11k {stepLevel > 0.70 && stepLevel <= 1.00 && '★ (0.7m < C ≤ 1.0m)'}
                            </th>
                            <th className="pb-2 px-1.5">Pure Gravity 8k</th>
                            <th className={`pb-2 px-1.5 ${stepLevel > 1.00 ? 'text-signal font-bold' : ''}`}>
                              Pure Gravity 11k {stepLevel > 1.00 && '★ (C > 1.0m)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="divide-x divide-border/40 font-bold">
                            <td className="py-2.5 text-left text-primary">{result.fbmCode}</td>
                            <td className="py-2.5">{result.activeKecRow.load} kg</td>
                            <td className="py-2.5">{result.activeKecRow.moment} kg·m</td>
                            <td className={`py-2.5 px-2 ${stepLevel <= 0.70 ? 'bg-signal/20 text-signal ring-2 ring-signal font-black' : 'text-foreground'}`}>
                              {result.activeKecRow.b}
                            </td>
                            <td className="py-2.5 px-2 text-muted-foreground">{result.activeKecRow.hb}</td>
                            <td className="py-2.5 px-2 text-muted-foreground">{result.activeKecRow.bg8k}</td>
                            <td className={`py-2.5 px-2 ${stepLevel > 0.70 && stepLevel <= 1.00 ? 'bg-signal/20 text-signal ring-2 ring-signal font-black' : 'text-foreground'}`}>
                              {result.activeKecRow.bg11k}
                            </td>
                            <td className="py-2.5 px-2 text-muted-foreground">{result.activeKecRow.mg8k}</td>
                            <td className={`py-2.5 px-2 ${stepLevel > 1.00 ? 'bg-signal/20 text-signal ring-2 ring-signal font-black' : 'text-foreground'}`}>
                              {result.activeKecRow.mg11k}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-border bg-panel-deep/50 px-3.5 py-2 text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-1">
                      <span>
                        Active Cess Level: <strong className="text-foreground">C = {result.superBlock.stepC.toFixed(2)} m</strong> ➔ Recommended Foundation:{' '}
                        <strong className="text-signal">{result.recommendedFoundation.typeName}</strong> ({result.recommendedFoundation.reference})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFoundationType(result.recommendedFoundation.typeKey);
                          setMobileTab('viewport');
                        }}
                        className="rounded bg-signal px-2 py-0.5 text-signal-foreground font-bold text-[9.5px] hover:bg-signal/90 transition-colors shadow-sm"
                      >
                        Inspect {result.recommendedFoundation.reference} in 3D Twin
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Responsive Mobile Cards View (Best UX on small screens!) */}
                  {matrixDisplayMode === 'cards' ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { key: 'bType' as const, item: result.foundations.bType, imageTag: 'Image 3 / Page 01 (DRG TI/CIV/FND/RDSO/00001/12/0 SHEET-1 Normal Soil)' },
                        { key: 'hbType' as const, item: result.foundations.hbType, imageTag: 'PDF 2 Page 02 (DRG TI/CIV/FND/RDSO/00001/12/0 SHEET-1 Hard Soil)' },
                        { key: 'bgType' as const, item: result.foundations.bgType, imageTag: 'Image 4 / Page 03 (DRG TI/CIV/FND/RDSO/00001/12/0 SHEET-1 Side Gravity)' },
                        { key: 'ngType' as const, item: result.foundations.ngType, imageTag: 'Image 5 / Page 05 (DRG TI/CIV/FND/RDSO/00001/12/0 SHEET-2 Pure Gravity)' },
                        { key: 'nbcType' as const, item: result.foundations.nbcType, imageTag: 'PDF 2 Page 06 (DRG TI/CIV/FND/RDSO/00001/12/0 SHEET-3 Dry BC)' },
                        { key: 'wbcType' as const, item: result.foundations.wbcType, imageTag: 'PDF 2 Page 04 (DRG TI/CIV/FND/RDSO/00001/12/0 SHEET-1 Wet BC)' },
                      ].map(({ key, item, imageTag }) => {
                        const isSelected = selectedFoundationType === key;
                        return (
                          <div
                            key={item.type}
                            className={`rounded-lg border p-3.5 space-y-2.5 transition-all shadow-sm ${
                              isSelected
                                ? 'border-signal bg-signal/5 ring-1 ring-signal'
                                : 'border-border bg-panel hover:border-border/80'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-display text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                  <span>{item.type}</span>
                                  <span className="text-[10px] font-normal text-muted-foreground">
                                    ({item.name.replace(' Foundation', '')})
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">{item.soilName}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="border-primary/40 bg-primary/10 font-mono text-[10px] font-bold text-primary">
                                  {item.reference}
                                </Badge>
                                <span className="font-mono text-[9px] text-signal font-semibold">
                                  FBM {item.fbmCode}
                                </span>
                              </div>
                            </div>

                            {/* 3D Visualizer Trigger & Drawing Citation */}
                            <div className="flex items-center justify-between gap-1 rounded bg-panel-deep px-2 py-1 border border-border/80">
                              <span className="truncate font-mono text-[8.5px] text-muted-foreground" title={imageTag}>
                                {imageTag}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFoundationType(key);
                                  setMobileTab('viewport');
                                }}
                                className={`flex shrink-0 items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] font-bold transition-all ${
                                  isSelected
                                    ? 'bg-signal text-signal-foreground shadow-sm'
                                    : 'border border-border bg-panel text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <Box className="size-3" />
                                {isSelected ? 'In 3D Twin' : 'View in 3D'}
                              </button>
                            </div>

                            {/* Function Code & Mast Section Badge Block */}
                            <div className="rounded border border-primary/20 bg-primary/5 p-2 space-y-1 font-mono text-[10px]">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-[9px] uppercase font-semibold">Function Code:</span>
                                <Badge variant="secondary" className="font-mono text-[9px] px-1.5 py-0">
                                  {item.functionCode}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-[9px] uppercase font-semibold">Mast Section:</span>
                                <span className="font-bold text-foreground text-[10px] truncate max-w-[190px]" title={item.mastTypeLabel}>
                                  {item.mastTypeLabel}
                                </span>
                              </div>
                              <div className="pt-0.5 text-[8.5px] text-muted-foreground line-clamp-1 border-t border-primary/10 mt-1">
                                {item.fbmBreakdown}
                              </div>
                            </div>

                            <div className="rounded bg-panel-deep p-2 border border-border/80 space-y-1 font-mono text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Dimensions:</span>
                                <span className="font-semibold text-foreground text-right">{item.dimText}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Soil SBC:</span>
                                <span className="text-foreground">{item.bearingCapacity}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1 rounded bg-panel-deep p-2 border border-border text-center font-mono text-[9px]">
                              <div>
                                <span className="text-muted-foreground block">Base Vol</span>
                                <strong className="text-foreground">{item.baseVolume.toFixed(2)}m³</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Super Block</span>
                                <strong className={item.superBlockVolume > 0 ? 'text-signal' : 'text-muted-foreground'}>
                                  {item.superBlockVolume > 0 ? `${item.superBlockVolume.toFixed(2)}m³` : '0m³'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Total Vol</span>
                                <strong className="text-signal text-[11px] font-bold">
                                  {item.totalVolume.toFixed(2)}m³
                                </strong>
                              </div>
                            </div>

                            <p className="line-clamp-2 text-[9px] text-muted-foreground italic leading-tight">
                              {item.features}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Mode B: Full 9-Column Tabular View (with touch-friendly scroll) */
                    <div className="overflow-x-auto rounded border border-border bg-panel">
                      <table className="w-full min-w-[880px] text-left text-xs">
                        <thead className="border-b border-border bg-panel-deep font-mono text-[10px] uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-3">3D</th>
                            <th className="px-3.5 py-3">Soil & Foundation Type</th>
                            <th className="px-3 py-3">Function Code</th>
                            <th className="px-3 py-3">Mast Section (B-Type)</th>
                            <th className="px-3 py-3">Fdn Code</th>
                            <th className="px-3 py-3">Dimensions (A × B × H)</th>
                            <th className="px-2.5 py-3">Base (m³)</th>
                            <th className="px-2.5 py-3">Muff (m³)</th>
                            <th className="px-2.5 py-3">Super Block (m³)</th>
                            <th className="px-3.5 py-3 font-bold text-signal">Total (m³)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-[11px]">
                          {[
                            { key: 'bType' as const, item: result.foundations.bType },
                            { key: 'hbType' as const, item: result.foundations.hbType },
                            { key: 'bgType' as const, item: result.foundations.bgType },
                            { key: 'ngType' as const, item: result.foundations.ngType },
                            { key: 'nbcType' as const, item: result.foundations.nbcType },
                            { key: 'wbcType' as const, item: result.foundations.wbcType },
                          ].map(({ key, item }, idx) => {
                            const isSelected = selectedFoundationType === key;
                            return (
                              <tr
                                key={item.type}
                                onClick={() => setSelectedFoundationType(key)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-signal/15 font-semibold ring-1 ring-inset ring-signal'
                                    : idx % 2 === 1
                                    ? 'bg-panel-deep/20 hover:bg-panel-deep/50'
                                    : 'hover:bg-panel-deep/50'
                                }`}
                              >
                                <td className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFoundationType(key);
                                      setMobileTab('viewport');
                                    }}
                                    className={`rounded p-1 transition-all ${
                                      isSelected
                                        ? 'bg-signal text-signal-foreground'
                                        : 'border border-border bg-panel text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="View this foundation in 3D"
                                  >
                                    <Box className="size-3.5" />
                                  </button>
                                </td>
                                <td className="px-3.5 py-3">
                                  <strong className="text-foreground">{item.type} ({item.name.replace(' Foundation', '')})</strong>
                                  <span className="block font-sans text-[9px] text-muted-foreground">
                                    {item.soilName} ({item.bearingCapacity})
                                  </span>
                                </td>
                                <td className="px-3 py-3 font-sans">
                                  <Badge variant="secondary" className="font-mono text-[9px] px-1.5 py-0 whitespace-nowrap">
                                    {item.functionCode}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="font-bold text-foreground text-[10px] whitespace-nowrap" title={item.mastTypeLabel}>
                                    {item.mastTypeLabel}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="font-bold text-primary">{item.reference}</span>
                                  <span className="block text-[9px] text-signal font-semibold">FBM {item.fbmCode}</span>
                                </td>
                                <td className="px-3 py-3 text-foreground whitespace-nowrap">
                                  {item.dimText}
                                </td>
                                <td className="px-2.5 py-3 text-muted-foreground">
                                  {item.baseVolume.toFixed(2)}
                                </td>
                                <td className="px-2.5 py-3 text-muted-foreground">
                                  {item.muffVolume.toFixed(2)}
                                </td>
                                <td className="px-2.5 py-3 text-muted-foreground">
                                  {item.superBlockVolume > 0 ? (
                                    <span className="font-bold text-signal">
                                      {item.superBlockVolume.toFixed(2)}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-3.5 py-3 font-bold text-signal">
                                  {item.totalVolume.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[9px] sm:text-[10px] text-muted-foreground">
                    <span>* Concrete Grade: M-15 / M-20 nominal mix per RDSO ETI/OHE/P/3131.</span>
                    <span>
                      Active FBM Code: <strong className="text-primary">{result.fbmCode}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Parameter breakdown */}
              {activeTab === 'specifications' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded border border-border bg-panel p-3.5 sm:p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-foreground">Geometry & Clearance Summary</h4>
                    <div className="space-y-1.5 font-mono text-[11px] sm:text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Setting Distance (Implantation):</span>
                        <span className="text-foreground">{(implantation ?? 3.0).toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RDSO Tier Classification:</span>
                        <span className="text-signal">{result.implantationTier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adaptor Chair (ETI/OHE/P/3131):</span>
                        <span className="text-foreground">{result.requiresChair ? 'REQUIRED' : 'Not Required'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cess Step Level (C):</span>
                        <span className="text-foreground">{result.superBlock.stepC.toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Super Block Status:</span>
                        <span className={result.superBlock.required ? 'text-signal font-bold' : 'text-success'}>
                          {result.superBlock.status}
                        </span>
                      </div>
                      {result.superBlock.required && (
                        <div className="flex justify-between">
                          <span>Super Block Height:</span>
                          <span className="text-signal font-bold">{result.superBlock.height.toFixed(2)} m</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Alignment / Radius:</span>
                        <span className="text-foreground">{alignment ?? 'N/A'} {alignment !== 'tangent' ? `(${radius} m)` : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculated Versine:</span>
                        <span className="text-foreground">{result.versine.toFixed(1)} mm</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded border border-border bg-panel p-3.5 sm:p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-foreground">Structure & Loading Details</h4>
                    <div className="space-y-1.5 font-mono text-[11px] sm:text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Wind Pressure:</span>
                        <span className="text-foreground">{wind ?? 'N/A'} kgf/m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mast Role / Function:</span>
                        <span className="text-foreground">{role ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved Mast Section:</span>
                        <span className="text-primary font-bold">{result.mastSection}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Mast Length:</span>
                        <span className="text-foreground">{result.mastLengthTotal} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Embedded in Foundation:</span>
                        <span className="text-foreground">{result.mastLengthEmbedded} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Mast Below Rail Level:</span>
                        <span className="text-foreground">{result.superBlock.mastBelowRL.toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Height Above Top of Casting:</span>
                        <span className="text-foreground">{result.mastLengthAbove} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reverse Deflection:</span>
                        <span className="text-signal font-bold">{result.deflectionDirection}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Design Notes & Standard Drawing References */}
              {activeTab === 'rdso-notes' && (
                <div className="rounded border border-border bg-panel p-4 sm:p-5 space-y-3 sm:space-y-4 text-xs leading-relaxed text-muted-foreground">
                  <div className="border-l-2 border-primary pl-3">
                    <h5 className="font-bold text-foreground">Super Block Rules (ACTM Vol-II & Clause 3.5.14)</h5>
                    <p className="mt-1">
                      Whenever the Cess Step Level difference C exceeds 0.50 m (500 mm below Rail Level),
                      the mast would be exposed to uncontained earth fill and overturning moment without lateral confinement.
                      Clause 3.5.14 stipulates that the mast below Rail Level cannot exceed 1.850 m without casting a
                      monolithic concrete Super Block. The Super Block height H_sb = C - 0.50 m brings the casting
                      top back to within 500 mm of Rail Level.
                    </p>
                  </div>

                  <div className="border-l-2 border-signal pl-3">
                    <h5 className="font-bold text-foreground">Dynamic Mast Sizing & Reverse Deflection</h5>
                    <p className="mt-1">
                      Rolled beams (8"×6" RSJ or 6"×6" BFB) are deployed for straight tracks with light/medium wind loads (FBM 140)
                      with +30 mm pre-camber away from the track. Curve or overlap central masts (OLC) auto-escalate to B-150 / B-175 / B-200
                      fabricated battened masts (FBM 200/225). Anchor masts (OLA/BWA) auto-escalate to heavy B-225 / B-250 fabricated battened masts
                      (FBM 250/275) with -30 mm reverse deflection towards the track to counteract the tension of the 45° guy wire anchor.
                    </p>
                  </div>

                  <div className="border-l-2 border-border pl-3">
                    <h5 className="font-bold text-foreground">Standard Drawing References</h5>
                    <ul className="mt-1 list-disc list-inside space-y-1 font-mono text-[10px] sm:text-[11px]">
                      <li>ACTM Vol-II Part-I — Foundation casting, Super Block standards, and tolerances</li>
                      <li>RDSO Drg ETI/OHE/P/3131 — General arrangement of OHE foundations and adaptation brackets</li>
                      <li>RDSO Drg ETI/C/0058 — Volume charts for B, BG, and NG series foundations</li>
                      <li>RDSO Drg ETI/C/0060 — NBC and WBC foundation designs for expansive Black Cotton soils</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Verification & Legal Disclaimer */}
              <div className="flex items-start gap-2.5 rounded border border-border/80 bg-panel-deep p-3 sm:p-4 text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" />
                <p>
                  <strong className="text-foreground">Preliminary Engineering Tool:</strong> Values computed by this configurator are
                  indicative selections based on published RDSO Employment Schedules, ACTM Vol-II, and Volume Charts. Site-specific soil investigation reports,
                  certified structural load calculations, and approved Railway Division drawings must be verified prior to procurement or execution.
                </p>
              </div>
            </section>
          </main>
        </div>

        {/* Print Layout Sheet */}
        <div className="print-sheet hidden p-8 font-mono text-xs">
          <h1 className="text-lg font-bold">RDSO OHE MAST & FOUNDATION CONFIGURATION RECORD</h1>
          <p className="mt-1 text-muted-foreground">Generated via RDSO OHE Engineering Workspace</p>
          <hr className="my-4" />
          <div className="space-y-2">
            <p><strong>Wind Zone:</strong> {wind} kgf/m²</p>
            <p><strong>Implantation:</strong> {(implantation ?? 3.0).toFixed(2)} m ({result.tierDescription})</p>
            <p><strong>Cess Step Level (C):</strong> {result.superBlock.stepC.toFixed(2)} m ({result.superBlock.status})</p>
            {result.superBlock.required && (
              <p><strong>Super Block Height:</strong> {result.superBlock.height.toFixed(2)} m</p>
            )}
            <p><strong>Alignment:</strong> {alignment} (Radius: {radius} m, Span: {span} m, Versine: {result.versine} mm)</p>
            <p><strong>Mast Function Code:</strong> {result.foundations.bType.functionCode}</p>
            <p><strong>Resolved Mast Section:</strong> {result.mastSection}</p>
            <p><strong>Reverse Deflection:</strong> {result.deflectionDirection}</p>
            <p><strong>FBM Code:</strong> {result.fbmCode} ({result.foundations.bType.fbmBreakdown})</p>
            <p><strong>B-Type Foundation (Normal Soil):</strong> {result.foundations.bType.reference} ({result.foundations.bType.dimText}) — Total Vol: {result.foundations.bType.totalVolume} m³</p>
            <p><strong>HB-Type Foundation (Hard Soil):</strong> {result.foundations.hbType.reference} ({result.foundations.hbType.dimText}) — Total Vol: {result.foundations.hbType.totalVolume} m³</p>
            <p><strong>BG-Type Foundation (Cuttings/Slopes):</strong> {result.foundations.bgType.reference} ({result.foundations.bgType.dimText}) — Total Vol: {result.foundations.bgType.totalVolume} m³</p>
            <p><strong>NG-Type Foundation (Loose Soil):</strong> {result.foundations.ngType.reference} ({result.foundations.ngType.dimText}) — Total Vol: {result.foundations.ngType.totalVolume} m³</p>
            <p><strong>NBC-Type Foundation (Dry Black Cotton):</strong> {result.foundations.nbcType.reference} ({result.foundations.nbcType.dimText}) — Total Vol: {result.foundations.nbcType.totalVolume} m³</p>
            <p><strong>WBC-Type Foundation (Wet Black Cotton):</strong> {result.foundations.wbcType.reference} ({result.foundations.wbcType.dimText}) — Total Vol: {result.foundations.wbcType.totalVolume} m³</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
