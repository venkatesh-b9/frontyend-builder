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
      }),
    [wind, implantationMode, implantation, stepLevel, alignment, radius, span, role]
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

3. MULTI-SOIL FOUNDATION MATRIX (RDSO Volume Chart):
- B-Type (Normal Soil 11,000 kgf/m²):
  Ref: ${result.foundations.bType.reference} | Dim: ${result.foundations.bType.dimText}
  Base: ${result.foundations.bType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.bType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.bType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.bType.totalVolume.toFixed(2)} m³
- BG-Type (Slopes/Cuttings Step C=${result.superBlock.stepC.toFixed(2)}m):
  Ref: ${result.foundations.bgType.reference} | Dim: ${result.foundations.bgType.dimText}
  Base: ${result.foundations.bgType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.bgType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.bgType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.bgType.totalVolume.toFixed(2)} m³
- NG-Type (Loose Soil 5,500 kgf/m²):
  Ref: ${result.foundations.ngType.reference} | Dim: ${result.foundations.ngType.dimText}
  Base: ${result.foundations.ngType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.ngType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.ngType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.ngType.totalVolume.toFixed(2)} m³
- NBC-Type (Dry Black Cotton 16,500 kgf/m²):
  Ref: ${result.foundations.nbcType.reference} | Dim: ${result.foundations.nbcType.dimText}
  Base: ${result.foundations.nbcType.baseVolume.toFixed(2)} m³ | Muff: ${result.foundations.nbcType.muffVolume.toFixed(2)} m³ | Super Block: ${result.foundations.nbcType.superBlockVolume.toFixed(2)} m³ | Total: ${result.foundations.nbcType.totalVolume.toFixed(2)} m³
- WBC-Type (Wet Black Cotton 8,000 kgf/m²):
  Ref: ${result.foundations.wbcType.reference} | Dim: ${result.foundations.wbcType.dimText}
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
              onClick={() => loadPreset('sample')}
              className="hidden border-border bg-panel text-xs hover:border-primary/50 md:inline-flex"
            >
              <Sparkles className="size-3.5 text-signal" /> Sample
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
                          implantationMode === 'standard' && (implantation ?? 3.0) === 3.0
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-panel hover:bg-panel-deep'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-foreground">Card A: Standard</span>
                          {implantationMode === 'standard' && <Check className="size-3.5 text-primary" />}
                        </div>
                        <div className="mt-2 font-mono text-xl font-bold text-signal">
                          3.00 <span className="text-xs font-normal text-muted-foreground">m</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Fixed standard setting distance (baseline 2.80–3.00 m).
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
                          <span className="text-xs font-bold uppercase text-foreground">Card B: Dynamic</span>
                          {implantationMode === 'custom' && <Check className="size-3.5 text-primary" />}
                        </div>
                        <div className="mt-2 font-mono text-xl font-bold text-signal">
                          {(implantation ?? 3.5).toFixed(2)}{' '}
                          <span className="text-xs font-normal text-muted-foreground">m</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Dynamic setting bounded between 3.00 m and 5.00 m.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider and Input for Implantation */}
                  <div className="rounded border border-border/80 bg-panel p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Implantation Distance (m)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={3.0}
                          max={5.0}
                          step={0.05}
                          value={implantation ?? 3.0}
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
                      min={3.0}
                      max={5.0}
                      step={0.05}
                      value={[implantation ?? 3.0]}
                      onValueChange={(vals) => {
                        setImplantationMode('custom');
                        setImplantation(vals[0] ?? 3.0);
                      }}
                      className="py-1"
                    />

                    {/* Quick Touch Preset Buttons on Mobile */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[3.0, 3.3, 3.5, 3.8, 4.2, 4.75].map((presetVal) => (
                        <button
                          key={presetVal}
                          type="button"
                          onClick={() => {
                            setImplantationMode('custom');
                            setImplantation(presetVal);
                          }}
                          className={`rounded border px-2 py-0.5 font-mono text-[9px] transition-colors ${
                            (implantation ?? 3.0) === presetVal
                              ? 'border-signal bg-signal/20 font-bold text-signal'
                              : 'border-border bg-panel-deep text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {presetVal.toFixed(2)}m
                        </button>
                      ))}
                    </div>

                    {/* Tier Flag Banner */}
                    <div
                      className={`rounded border px-3 py-2 text-[11px] ${
                        result.requiresChair
                          ? 'border-signal/40 bg-signal-soft text-signal'
                          : 'border-border bg-panel-deep text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="font-mono">{result.implantationTier}:</span> {result.tierDescription}
                      </div>
                      {result.requiresChair && (
                        <p className="mt-1 text-[10px] leading-tight">
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

                    {/* Quick Step Presets for Easy Mobile Selection */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { val: 0.0, label: '0.00m (Flush)' },
                        { val: 0.5, label: '0.50m (Std)' },
                        { val: 0.8, label: '0.80m' },
                        { val: 1.2, label: '1.20m (Excess)' },
                        { val: 1.6, label: '1.60m' },
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
                      {/* Radius Selector */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                            Curve Radius (R)
                          </label>
                          <span className="font-mono text-xs font-bold text-signal">{radius} m</span>
                        </div>
                        <Slider
                          min={200}
                          max={2500}
                          step={50}
                          value={[radius]}
                          onValueChange={(vals) => setRadius(vals[0] ?? 1000)}
                          className="mt-2.5 py-1"
                        />
                        <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
                          <span>200 m (Sharp)</span>
                          <span>2500 m (Mild)</span>
                        </div>
                      </div>

                      {/* Span Selector */}
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                          OHE Span Length (m)
                        </label>
                        <Select value={String(span)} onValueChange={(val) => setSpan(parseFloat(val))}>
                          <SelectTrigger className="mt-1.5 h-8 border-border bg-panel-deep font-mono text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {spans.map((s) => (
                              <SelectItem key={s} value={String(s)} className="font-mono text-xs">
                                {s.toFixed(1)} m standard span
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            Setting distance ({implantation?.toFixed(2)} m) is below the RDSO minimum (
                            {result.minSetting.toFixed(2)} m) required for an inside curve of radius {radius} m.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {alignment === 'tangent' && (
                    <div className="flex items-center justify-between rounded border border-border bg-panel px-3 py-2 font-mono text-[10px] text-muted-foreground">
                      <span>Catenary Stagger: 0 mm</span>
                      <span className="text-foreground">Versine: 0.0 mm</span>
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
                <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-1 sm:gap-1.5">
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
                    />

                    {/* Overlay HUD Readouts (Mobile Compact) */}
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 sm:bottom-4 sm:left-4 sm:right-auto sm:gap-2">
                      <div className="flex items-center gap-1.5 rounded border border-border bg-panel-deep/90 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                        <Crosshair className="size-3 text-signal" />
                        IMP: <span className="font-bold text-signal">{(implantation ?? 3.0).toFixed(2)}m</span>
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
                  {/* Mode A: Responsive Mobile Cards View (Best UX on small screens!) */}
                  {matrixDisplayMode === 'cards' ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        result.foundations.bType,
                        result.foundations.bgType,
                        result.foundations.ngType,
                        result.foundations.nbcType,
                        result.foundations.wbcType,
                      ].map((item) => (
                        <div
                          key={item.type}
                          className="rounded-lg border border-border bg-panel p-3.5 space-y-2.5 transition-all hover:border-border/80 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-display text-xs font-bold uppercase text-foreground">
                                {item.type} ({item.name.replace(' Foundation', '')})
                              </div>
                              <div className="text-[10px] text-muted-foreground">{item.soilName}</div>
                            </div>
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 font-mono text-[10px] text-primary">
                              {item.reference}
                            </Badge>
                          </div>

                          <div className="rounded bg-panel-deep p-2 border border-border/80 space-y-1 font-mono text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Dimensions:</span>
                              <span className="font-semibold text-foreground">{item.dimText}</span>
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
                      ))}
                    </div>
                  ) : (
                    /* Mode B: Full 7-Column Tabular View (with touch-friendly scroll) */
                    <div className="overflow-x-auto rounded border border-border bg-panel">
                      <table className="w-full min-w-[760px] text-left text-xs">
                        <thead className="border-b border-border bg-panel-deep font-mono text-[10px] uppercase text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">RDSO Reference / Soil Type</th>
                            <th className="px-4 py-3">Foundation Code</th>
                            <th className="px-4 py-3">Dimensions (A × B × H in meters)</th>
                            <th className="px-4 py-3">Base Vol (m³)</th>
                            <th className="px-4 py-3">Muff Vol (m³)</th>
                            <th className="px-4 py-3">Super Block (m³)</th>
                            <th className="px-4 py-3 font-bold text-signal">Total Vol (m³)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-[11px]">
                          {/* Row 1: B-Type */}
                          <tr className="hover:bg-panel-deep/50 transition-colors">
                            <td className="px-4 py-3">
                              <strong className="text-foreground">B-Type (Side Bearing)</strong>
                              <span className="block font-sans text-[9px] text-muted-foreground">
                                {result.foundations.bType.soilName} ({result.foundations.bType.bearingCapacity})
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {result.foundations.bType.reference}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {result.foundations.bType.dimText}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.bType.baseVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.bType.muffVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.bType.superBlockVolume > 0 ? (
                                <span className="font-bold text-signal">
                                  {result.foundations.bType.superBlockVolume.toFixed(2)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-signal">
                              {result.foundations.bType.totalVolume.toFixed(2)}
                            </td>
                          </tr>

                          {/* Row 2: BG-Type */}
                          <tr className="hover:bg-panel-deep/50 transition-colors bg-panel-deep/20">
                            <td className="px-4 py-3">
                              <strong className="text-foreground">BG-Type (Side Gravity)</strong>
                              <span className="block font-sans text-[9px] text-muted-foreground">
                                {result.foundations.bgType.soilName} (Slope step C = {result.superBlock.stepC.toFixed(2)}m)
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {result.foundations.bgType.reference}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {result.foundations.bgType.dimText}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.bgType.baseVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.bgType.muffVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.bgType.superBlockVolume > 0 ? (
                                <span className="font-bold text-signal">
                                  {result.foundations.bgType.superBlockVolume.toFixed(2)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-signal">
                              {result.foundations.bgType.totalVolume.toFixed(2)}
                            </td>
                          </tr>

                          {/* Row 3: NG-Type */}
                          <tr className="hover:bg-panel-deep/50 transition-colors">
                            <td className="px-4 py-3">
                              <strong className="text-foreground">NG-Type (Pure Gravity)</strong>
                              <span className="block font-sans text-[9px] text-muted-foreground">
                                {result.foundations.ngType.soilName} ({result.foundations.ngType.bearingCapacity})
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {result.foundations.ngType.reference}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {result.foundations.ngType.dimText}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.ngType.baseVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.ngType.muffVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.ngType.superBlockVolume > 0 ? (
                                <span className="font-bold text-signal">
                                  {result.foundations.ngType.superBlockVolume.toFixed(2)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-signal">
                              {result.foundations.ngType.totalVolume.toFixed(2)}
                            </td>
                          </tr>

                          {/* Row 4: NBC-Type */}
                          <tr className="hover:bg-panel-deep/50 transition-colors">
                            <td className="px-4 py-3">
                              <strong className="text-foreground">NBC-Type (Dry Black Cotton)</strong>
                              <span className="block font-sans text-[9px] text-muted-foreground">
                                {result.foundations.nbcType.soilName} ({result.foundations.nbcType.bearingCapacity})
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {result.foundations.nbcType.reference}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {result.foundations.nbcType.dimText}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.nbcType.baseVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.nbcType.muffVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.nbcType.superBlockVolume > 0 ? (
                                <span className="font-bold text-signal">
                                  {result.foundations.nbcType.superBlockVolume.toFixed(2)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-signal">
                              {result.foundations.nbcType.totalVolume.toFixed(2)}
                            </td>
                          </tr>

                          {/* Row 5: WBC-Type */}
                          <tr className="hover:bg-panel-deep/50 transition-colors">
                            <td className="px-4 py-3">
                              <strong className="text-foreground">WBC-Type (Wet Black Cotton)</strong>
                              <span className="block font-sans text-[9px] text-muted-foreground">
                                {result.foundations.wbcType.soilName} ({result.foundations.wbcType.bearingCapacity})
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {result.foundations.wbcType.reference}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {result.foundations.wbcType.dimText}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.wbcType.baseVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.wbcType.muffVolume.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {result.foundations.wbcType.superBlockVolume > 0 ? (
                                <span className="font-bold text-signal">
                                  {result.foundations.wbcType.superBlockVolume.toFixed(2)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-signal">
                              {result.foundations.wbcType.totalVolume.toFixed(2)}
                            </td>
                          </tr>
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
                      with +30 mm pre-camber away from the track. Curve or overlap central masts (OLC) auto-escalate to K-175 / K-200
                      fabricated lattice trusses (FBM 260). Anchor masts (OLA/BWA) auto-escalate to heavy K-225 / K-250 fabricated trusses
                      (FBM 374/389) with -30 mm reverse deflection towards the track to counteract the tension of the 45° guy wire anchor.
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
            <p><strong>Mast Function:</strong> {role}</p>
            <p><strong>Resolved Mast:</strong> {result.mastSection}</p>
            <p><strong>Reverse Deflection:</strong> {result.deflectionDirection}</p>
            <p><strong>FBM Code:</strong> {result.fbmCode}</p>
            <p><strong>B-Type Foundation:</strong> {result.foundations.bType.reference} ({result.foundations.bType.dimText}) — {result.foundations.bType.totalVolume} m³</p>
            <p><strong>BG-Type Foundation:</strong> {result.foundations.bgType.reference} ({result.foundations.bgType.dimText}) — {result.foundations.bgType.totalVolume} m³</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
