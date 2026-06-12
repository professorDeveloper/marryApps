import type { NumFormat } from '../data/formatters';
import type { SalesDayPoint, AnalyticsPayload } from '../data/types';

import { fmtNum, fmtCompact } from '../data/formatters';

export type ChartStyle = 'bars' | 'area' | 'line_overlay' | 'paired';

const CHART_PAD = { l: 48, r: 16, t: 18, b: 28 };
const CHART_W = 760;
const CHART_H = 280;

function buildAxis(cur: SalesDayPoint[], prev: SalesDayPoint[]): string[] {
  const a = new Set<string>([...cur.map((d) => d.label), ...prev.map((d) => d.label)]);
  return [...a].sort((x, y) => {
    const nx = parseFloat(x);
    const ny = parseFloat(y);
    if (Number.isFinite(nx) && Number.isFinite(ny)) return nx - ny;
    return x.localeCompare(y);
  });
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / pow;
  let nice: number;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function seriesValue(series: SalesDayPoint[], label: string): number {
  const d = series.find((x) => x.label === label);
  return d ? d.revenue : 0;
}

interface Scale {
  max: number;
  w: number;
  h: number;
  xStep: number;
  x: (i: number) => number;
  y: (v: number) => number;
}

function buildScale(axis: string[], cur: SalesDayPoint[], prev: SalesDayPoint[], includePrev: boolean): Scale {
  const maxCur = cur.length ? Math.max(...cur.map((d) => d.revenue)) : 0;
  const maxPrev = includePrev && prev.length ? Math.max(...prev.map((d) => d.revenue)) : 0;
  const max = niceMax(Math.max(maxCur, maxPrev));
  const w = CHART_W - CHART_PAD.l - CHART_PAD.r;
  const h = CHART_H - CHART_PAD.t - CHART_PAD.b;
  const xStep = w / Math.max(axis.length, 1);
  return {
    max,
    w,
    h,
    xStep,
    x: (i: number) => CHART_PAD.l + xStep * (i + 0.5),
    y: (v: number) => CHART_PAD.t + h - (v / max) * h,
  };
}

function Grid({ scale }: { scale: Scale }) {
  const ticks = 4;
  const out = [];
  for (let i = 0; i <= ticks; i++) {
    const v = (scale.max / ticks) * i;
    const yy = scale.y(v);
    out.push(
      <g key={i}>
        <line x1={CHART_PAD.l} x2={CHART_W - CHART_PAD.r} y1={yy} y2={yy} stroke="var(--border)" strokeWidth="1" />
        <text x={CHART_PAD.l - 8} y={yy + 3} className="chart-axis-y" textAnchor="end">
          {fmtCompact(v)}
        </text>
      </g>
    );
  }
  return <g>{out}</g>;
}

function AxisX({ axis, scale }: { axis: string[]; scale: Scale }) {
  return (
    <g>
      {axis.map((label, i) => (
        <text key={label} x={scale.x(i)} y={CHART_H - 8} className="chart-axis-x" textAnchor="middle">
          {label}
        </text>
      ))}
    </g>
  );
}

interface ChartProps {
  cur: SalesDayPoint[];
  prev: SalesDayPoint[];
  showPrev: boolean;
}

function BarsChart({ cur, prev, showPrev }: ChartProps) {
  const axis = buildAxis(cur, prev);
  const scale = buildScale(axis, cur, prev, showPrev);
  const barW = Math.min(scale.xStep * 0.55, 20);
  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg">
      <Grid scale={scale} />
      <AxisX axis={axis} scale={scale} />
      {showPrev &&
        axis.map((label, i) => {
          const v = seriesValue(prev, label);
          if (!v) return null;
          const yy = scale.y(v);
          return (
            <rect
              key={`p${label}`}
              x={scale.x(i) - barW / 2}
              y={yy}
              width={barW}
              height={CHART_H - CHART_PAD.b - yy}
              fill="var(--text-4)"
              opacity="0.55"
              rx="1.5"
            />
          );
        })}
      {axis.map((label, i) => {
        const v = seriesValue(cur, label);
        if (!v) return null;
        const yy = scale.y(v);
        const w = showPrev ? barW * 0.6 : barW;
        return (
          <g key={label} className="chart-bar">
            <rect
              x={scale.x(i) - w / 2}
              y={yy}
              width={w}
              height={CHART_H - CHART_PAD.b - yy}
              fill="var(--accent)"
              rx="1.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

function AreaChart({ cur, prev, showPrev }: ChartProps) {
  const axis = buildAxis(cur, prev);
  const scale = buildScale(axis, cur, prev, showPrev);
  const buildPath = (series: SalesDayPoint[]) =>
    axis.map((label, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(i)} ${scale.y(seriesValue(series, label))}`).join(' ');
  const buildArea = (series: SalesDayPoint[]) => {
    const top = buildPath(series);
    return `${top} L ${scale.x(axis.length - 1)} ${CHART_PAD.t + scale.h} L ${scale.x(0)} ${CHART_PAD.t + scale.h} Z`;
  };
  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg">
      <Grid scale={scale} />
      <AxisX axis={axis} scale={scale} />
      {showPrev && (
        <>
          <path d={buildArea(prev)} fill="var(--text-4)" opacity="0.18" />
          <path d={buildPath(prev)} stroke="var(--text-3)" strokeWidth="1.4" fill="none" strokeDasharray="3 3" />
        </>
      )}
      <path d={buildArea(cur)} fill="var(--accent)" opacity="0.18" />
      <path d={buildPath(cur)} stroke="var(--accent)" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      {axis.map((label, i) => {
        const v = seriesValue(cur, label);
        return v ? <circle key={label} cx={scale.x(i)} cy={scale.y(v)} r="2.5" fill="var(--accent)" /> : null;
      })}
    </svg>
  );
}

function LineOverlayChart({ cur, prev, showPrev }: ChartProps) {
  const axis = buildAxis(cur, prev);
  const scale = buildScale(axis, cur, prev, showPrev);
  const buildPath = (series: SalesDayPoint[]) =>
    axis.map((label, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(i)} ${scale.y(seriesValue(series, label))}`).join(' ');
  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg">
      <Grid scale={scale} />
      <AxisX axis={axis} scale={scale} />
      {showPrev && (
        <path d={buildPath(prev)} stroke="var(--text-3)" strokeWidth="1.4" fill="none" strokeDasharray="4 3" />
      )}
      <path
        d={buildPath(cur)}
        stroke="var(--accent)"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {axis.map((label, i) => {
        const v = seriesValue(cur, label);
        return v ? (
          <circle key={label} cx={scale.x(i)} cy={scale.y(v)} r="3" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.6" />
        ) : null;
      })}
    </svg>
  );
}

function PairedBarsChart({ cur, prev }: ChartProps) {
  const axis = buildAxis(cur, prev);
  const scale = buildScale(axis, cur, prev, true);
  const barW = Math.min(scale.xStep * 0.32, 10);
  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg">
      <Grid scale={scale} />
      <AxisX axis={axis} scale={scale} />
      {axis.map((label, i) => {
        const vC = seriesValue(cur, label);
        const vP = seriesValue(prev, label);
        return (
          <g key={label}>
            {vP > 0 && (
              <rect
                x={scale.x(i) - barW - 1}
                y={scale.y(vP)}
                width={barW}
                height={CHART_H - CHART_PAD.b - scale.y(vP)}
                fill="var(--text-4)"
                opacity="0.65"
                rx="1.5"
              />
            )}
            {vC > 0 && (
              <rect
                x={scale.x(i) + 1}
                y={scale.y(vC)}
                width={barW}
                height={CHART_H - CHART_PAD.b - scale.y(vC)}
                fill="var(--accent)"
                rx="1.5"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function SalesChart({ style, cur, prev, showPrev }: ChartProps & { style: ChartStyle }) {
  switch (style) {
    case 'bars':
      return <BarsChart cur={cur} prev={prev} showPrev={showPrev} />;
    case 'area':
      return <AreaChart cur={cur} prev={prev} showPrev={showPrev} />;
    case 'paired':
      return <PairedBarsChart cur={cur} prev={prev} showPrev={showPrev} />;
    case 'line_overlay':
    default:
      return <LineOverlayChart cur={cur} prev={prev} showPrev={showPrev} />;
  }
}

interface SalesDynamicsProps {
  payload: AnalyticsPayload;
  chartStyle: ChartStyle;
  showCompare: boolean;
  numFormat: NumFormat;
}

export function SalesDynamics({ payload, chartStyle, showCompare, numFormat }: SalesDynamicsProps) {
  const cur = payload.current.sales_dynamics;
  const prev = payload.previous.sales_dynamics;
  const total = cur.reduce((s, d) => s + d.revenue, 0);
  const peak = cur.length ? cur.reduce((a, b) => (b.revenue > a.revenue ? b : a), cur[0]) : null;
  const avg = cur.length ? total / cur.length : 0;
  return (
    <div className="sales-chart">
      <div className="sales-chart-stats">
        <div className="sales-stat">
          <div className="sales-stat-lbl">Total</div>
          <div className="sales-stat-val mono">{fmtNum(total, numFormat)}</div>
        </div>
        <div className="sales-stat">
          <div className="sales-stat-lbl">Daily avg</div>
          <div className="sales-stat-val mono">{fmtNum(avg, numFormat)}</div>
        </div>
        <div className="sales-stat">
          <div className="sales-stat-lbl">Peak day</div>
          <div className="sales-stat-val mono">{peak?.label ?? '—'}</div>
        </div>
        <div className="sales-stat">
          <div className="sales-stat-lbl">Active days</div>
          <div className="sales-stat-val mono">{cur.length}</div>
        </div>
        {showCompare && (
          <div className="sales-legend">
            <span className="legend-swatch swatch-cur" />
            Current
            <span className="legend-swatch swatch-prev" />
            Previous
          </div>
        )}
      </div>
      <SalesChart style={chartStyle} cur={cur} prev={prev} showPrev={showCompare} />
    </div>
  );
}
