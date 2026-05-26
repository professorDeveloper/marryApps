import { Global, css } from '@emotion/react';
import { useTheme } from '@mui/material/styles';
import { varAlpha } from 'minimal-shared/utils';

// Maps the app's theme tokens → reference CSS variables, scoped to .mary-analytics.
// IMPORTANT: the app runs in CSS-variables / colorSchemes mode, so we read
// `theme.vars.palette.*` (which returns CSS-var strings bound to the active
// scheme) rather than `theme.palette.*` (which returns the default scheme's
// literal value and would freeze the dashboard in light mode).

export function AnalyticsGlobalStyles() {
  const theme = useTheme();
  const v = theme.vars.palette;

  // Channels (e.g. `var(--mui-palette-primary-mainChannel)`) are the "R G B"
  // triplets MUI emits for varAlpha. Use them whenever we need an alpha.
  const tokens = {
    accent: v.primary.main,
    accentSoft: varAlpha(v.primary.mainChannel, 0.14),
    accentFg: v.primary.contrastText,
    danger: v.error.main,
    dangerSoft: varAlpha(v.error.mainChannel, 0.14),
    success: v.success.main,
    successSoft: varAlpha(v.success.mainChannel, 0.16),
    bg: v.background.default,
    bgElev: v.background.paper,
    surface: v.background.paper,
    surface2: (v.background as { neutral?: string }).neutral ?? varAlpha(v.text.primaryChannel, 0.04),
    text: v.text.primary,
    text2: v.text.secondary,
    text3: varAlpha(v.text.primaryChannel, 0.5),
    text4: v.text.disabled,
    border: v.divider,
    borderStrong: varAlpha(v.text.primaryChannel, 0.18),
    hover: v.action.hover,
    // Neutral surface — keeps the dashboard's sidebar/footer regions on the
    // same surface ladder as the rest of the app's chrome.
    sidebarBg: (v.background as { neutral?: string }).neutral ?? v.action.hover,
    totalsBg: (v.background as { neutral?: string }).neutral ?? v.action.hover,
    overlayScrim: varAlpha(v.common.blackChannel, 0.5),
    cardShadowAmbient: varAlpha(v.common.blackChannel, 0.18),
    cardShadowKey: varAlpha(v.common.blackChannel, 0.08),
    cardShadowRim: varAlpha(v.text.primaryChannel, 0.05),
    drawerShadow: varAlpha(v.common.blackChannel, 0.24),
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    font: theme.typography.fontFamily || '"Manrope", -apple-system, sans-serif',
  };

  return (
    <Global
      styles={css`
        .mary-analytics {
          --accent: ${tokens.accent};
          --accent-soft: ${tokens.accentSoft};
          --accent-fg: ${tokens.accentFg};
          --danger: ${tokens.danger};
          --danger-soft: ${tokens.dangerSoft};
          --bg: ${tokens.bg};
          --bg-elev: ${tokens.bgElev};
          --surface: ${tokens.surface};
          --surface-2: ${tokens.surface2};
          --text: ${tokens.text};
          --text-2: ${tokens.text2};
          --text-3: ${tokens.text3};
          --text-4: ${tokens.text4};
          --border: ${tokens.border};
          --border-strong: ${tokens.borderStrong};
          --hover: ${tokens.hover};
          --sidebar-bg: ${tokens.sidebarBg};
          --totals-bg: ${tokens.totalsBg};
          --radius: 8px;
          --radius-sm: 6px;
          --row-h: 52px;
          --font: ${tokens.font};
          --mono: ${tokens.mono};
        }
        .mary-analytics[data-density='compact'] { --row-h: 42px; }
        .mary-analytics[data-radius='sharp'] { --radius: 2px; --radius-sm: 2px; }
        .mary-analytics[data-radius='soft']  { --radius: 8px; --radius-sm: 6px; }
        .mary-analytics[data-radius='pill']  { --radius: 16px; --radius-sm: 12px; }

        .mary-analytics * { box-sizing: border-box; }
        .mary-analytics {
          font-family: var(--font);
          color: var(--text);
          font-size: 14px;
          line-height: 1.5;
          letter-spacing: -0.005em;
          background: var(--bg);
        }
        .mary-analytics button { font: inherit; cursor: pointer; border: 0; background: none; color: inherit; padding: 0; }
        .mary-analytics input, .mary-analytics select { font: inherit; color: inherit; }
        .mary-analytics table { border-collapse: collapse; width: 100%; }

        /* ===== PAGE FRAME ===== */
        .mary-analytics .page-analytics {
          padding: 24px 32px 80px;
          max-width: 1600px;
          width: 100%;
          margin: 0 auto;
        }
        .mary-analytics .analytics-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .mary-analytics .analytics-controls-right { display: flex; align-items: center; gap: 12px; }
        .mary-analytics .period-summary {
          font-size: 12px;
          font-family: var(--mono);
          font-feature-settings: 'tnum';
          letter-spacing: -0.005em;
        }
        .mary-analytics .muted { color: var(--text-3); }
        .mary-analytics .mono {
          font-family: var(--mono);
          font-feature-settings: 'tnum', 'zero';
          letter-spacing: -0.01em;
        }

        /* ===== RANGE CHIPS ===== */
        .mary-analytics .range-chips { display: inline-flex; align-items: center; gap: 12px; }
        .mary-analytics .range-chips-group {
          display: inline-flex; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px;
        }
        .mary-analytics .range-chip {
          height: 30px; padding: 0 14px; border-radius: 4px;
          color: var(--text-3); font-size: 12.5px; font-weight: 500;
          letter-spacing: -0.003em; transition: background .12s, color .12s; font-family: var(--font);
        }
        .mary-analytics .range-chip:hover { color: var(--text); }
        .mary-analytics .range-chip.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
        .mary-analytics .range-compare { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
        .mary-analytics .range-compare-lbl {
          font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-3); font-weight: 600;
        }
        .mary-analytics .range-compare-val { font-family: var(--mono); color: var(--text-2); font-size: 12px; }

        /* ===== PANEL CARD ===== */
        .mary-analytics .panel-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); margin-bottom: 18px; overflow: hidden;
        }
        .mary-analytics .panel-card:last-child { margin-bottom: 0; }
        .mary-analytics .panel-card-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 12px; padding: 16px 18px 12px; border-bottom: 1px solid var(--border);
        }
        .mary-analytics .panel-card-titles { display: flex; flex-direction: column; gap: 4px; }
        .mary-analytics .panel-card-eyebrow {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
          color: var(--text-3); font-family: var(--mono); text-transform: uppercase;
        }
        .mary-analytics .panel-card-title {
          margin: 0; font-size: 15px; font-weight: 600;
          letter-spacing: -0.018em; color: var(--text);
        }
        .mary-analytics .panel-card-action { font-size: 12px; color: var(--text-3); }
        .mary-analytics .panel-foot-meta { font-size: 11.5px; }
        .mary-analytics .panel-card-body { padding: 18px; }
        .mary-analytics .panel-card-body--flush { padding: 0; }

        /* ===== KPI STRIP ===== */
        .mary-analytics .kpi-strip {
          display: grid; grid-template-columns: repeat(6, 1fr);
          gap: 12px; margin-bottom: 18px;
        }
        .mary-analytics .kpi-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 16px 18px 14px;
          display: flex; flex-direction: column; gap: 8px;
          min-width: 0; transition: border-color .12s;
        }
        .mary-analytics .kpi-card:hover { border-color: var(--border-strong); }
        .mary-analytics .kpi-card--zero { opacity: 0.6; }
        .mary-analytics .kpi-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3); font-family: var(--font);
        }
        .mary-analytics .kpi-value-row {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 8px; min-width: 0;
        }
        .mary-analytics .kpi-value {
          font-size: 22px; font-weight: 600; color: var(--text);
          font-family: var(--mono); font-feature-settings: 'tnum';
          letter-spacing: -0.025em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mary-analytics .kpi-prev {
          display: flex; align-items: baseline; gap: 6px;
          font-size: 11.5px; color: var(--text-3); margin-top: -2px;
        }
        .mary-analytics .kpi-prev-lbl {
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .mary-analytics .kpi-prev-val { font-family: var(--mono); font-feature-settings: 'tnum'; }

        /* ===== DELTA PILL ===== */
        .mary-analytics .kpi-delta {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 3px 7px; font-size: 11.5px; font-family: var(--mono);
          font-feature-settings: 'tnum'; font-weight: 500; border-radius: 999px;
          letter-spacing: -0.01em; white-space: nowrap; line-height: 1;
        }
        .mary-analytics .kpi-delta-num { font-weight: 500; }
        .mary-analytics .kpi-delta-arrow { font-size: 11px; line-height: 1; }
        .mary-analytics .kpi-delta.good { color: ${tokens.success}; background: ${tokens.successSoft}; }
        .mary-analytics .kpi-delta.bad  { color: var(--danger); background: var(--danger-soft); }
        .mary-analytics .kpi-delta.neutral { color: var(--text-2); background: var(--surface-2); }
        .mary-analytics .kpi-delta.flat { color: var(--text-4); background: transparent; padding: 0; font-size: 13px; }

        /* ===== SALES CHART ===== */
        .mary-analytics .sales-chart-stats {
          display: flex; align-items: center; gap: 32px; margin-bottom: 12px; flex-wrap: wrap;
        }
        .mary-analytics .sales-stat { display: flex; flex-direction: column; gap: 4px; }
        .mary-analytics .sales-stat-lbl {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .mary-analytics .sales-stat-val {
          font-size: 15px; color: var(--text); font-family: var(--mono);
          font-feature-settings: 'tnum'; font-weight: 600; letter-spacing: -0.02em;
        }
        .mary-analytics .sales-legend {
          margin-left: auto; display: inline-flex; align-items: center; gap: 10px;
          font-size: 11.5px; color: var(--text-2);
        }
        .mary-analytics .legend-swatch {
          display: inline-block; width: 18px; height: 3px; border-radius: 2px;
          margin-right: 6px; vertical-align: middle;
        }
        .mary-analytics .swatch-cur { background: var(--accent); }
        .mary-analytics .swatch-prev {
          background: repeating-linear-gradient(to right, var(--text-3) 0 4px, transparent 4px 7px);
          height: 2px;
        }
        .mary-analytics .chart-svg { width: 100%; height: auto; display: block; overflow: visible; }
        .mary-analytics .chart-axis-y, .mary-analytics .chart-axis-x {
          fill: var(--text-3); font-family: var(--mono); font-size: 10.5px;
        }
        .mary-analytics .chart-bar { transition: opacity .12s; }
        .mary-analytics .chart-bar:hover { opacity: 0.85; }

        /* ===== PAYMENT SPLIT ===== */
        .mary-analytics .payment-bar-track {
          display: flex; height: 10px; border-radius: 5px; overflow: hidden;
          background: var(--surface-2); margin-bottom: 14px;
        }
        .mary-analytics .payment-bar-seg.seg-cash { background: var(--accent); }
        .mary-analytics .payment-bar-seg.seg-card { background: var(--text-3); }
        .mary-analytics .payment-rows {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .mary-analytics .payment-rows li {
          display: grid; grid-template-columns: 14px 1fr auto auto;
          align-items: center; gap: 10px; font-size: 13px; padding: 6px 0;
          border-bottom: 1px solid var(--border);
        }
        .mary-analytics .payment-rows li:last-child { border-bottom: 0; }
        .mary-analytics .payment-dot { width: 8px; height: 8px; border-radius: 2px; }
        .mary-analytics .payment-dot.dot-cash { background: var(--accent); }
        .mary-analytics .payment-dot.dot-card { background: var(--text-3); }
        .mary-analytics .payment-name { text-transform: capitalize; color: var(--text); font-weight: 500; }
        .mary-analytics .payment-amt { color: var(--text); font-family: var(--mono); font-feature-settings: 'tnum'; text-align: right; }
        .mary-analytics .payment-pct { color: var(--text-3); font-family: var(--mono); font-feature-settings: 'tnum'; width: 60px; text-align: right; }
        .mary-analytics .payment-donut { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .mary-analytics .payment-donut > svg { flex-shrink: 0; }
        @media (max-width: 1180px) {
          .mary-analytics .layout-classic-row-2 .payment-donut,
          .mary-analytics .bento-payment .payment-donut {
            flex-direction: column; align-items: stretch; gap: 16px;
          }
          .mary-analytics .layout-classic-row-2 .payment-donut > svg,
          .mary-analytics .bento-payment .payment-donut > svg { align-self: center; }
        }
        .mary-analytics .donut-num {
          fill: var(--text); font-family: var(--mono); font-feature-settings: 'tnum';
          font-size: 18px; font-weight: 700; letter-spacing: -0.04em;
        }
        .mary-analytics .donut-sub {
          fill: var(--text-3); font-family: var(--font); font-size: 9px;
          font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
        }
        .mary-analytics .payment-legend {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0;
        }
        .mary-analytics .payment-legend li {
          display: grid; grid-template-columns: 12px 1fr auto auto;
          align-items: center; gap: 10px; font-size: 12.5px;
        }
        .mary-analytics .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
        .mary-analytics .legend-name { text-transform: capitalize; color: var(--text); font-weight: 500; }
        .mary-analytics .legend-val, .mary-analytics .legend-pct {
          font-family: var(--mono); font-feature-settings: 'tnum'; text-align: right;
        }
        .mary-analytics .legend-val { color: var(--text); }
        .mary-analytics .legend-pct { color: var(--text-3); min-width: 56px; }

        /* ===== CATEGORY LIST ===== */
        .mary-analytics .cat-table { width: 100%; border-collapse: collapse; }
        .mary-analytics .cat-table tbody tr { border-bottom: 1px solid var(--border); }
        .mary-analytics .cat-table tbody tr:last-child { border-bottom: 0; }
        .mary-analytics .cat-table td { padding: 10px 8px; vertical-align: middle; font-size: 13px; }
        .mary-analytics .cat-rank {
          color: var(--text-4); font-family: var(--mono); font-feature-settings: 'tnum';
          font-size: 11px; width: 38px;
        }
        .mary-analytics .cat-name {
          color: var(--text); font-weight: 500; width: 22%; max-width: 180px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .mary-analytics .cat-bar-cell { padding: 10px 12px !important; }
        .mary-analytics .cat-bar-track {
          position: relative; height: 6px; background: var(--surface-2);
          border-radius: 3px; overflow: hidden;
        }
        .mary-analytics .cat-bar-fill {
          height: 100%; background: var(--accent); border-radius: 3px;
          transition: width .3s ease-out;
        }
        .mary-analytics .cat-amt {
          font-family: var(--mono); font-feature-settings: 'tnum';
          color: var(--text); text-align: right; width: 110px;
        }
        .mary-analytics .cat-pct {
          font-family: var(--mono); font-feature-settings: 'tnum';
          color: var(--text-3); text-align: right; width: 60px;
        }
        .mary-analytics .cat-more { padding: 10px 8px 0; font-size: 12px; color: var(--text-3); text-align: center; }

        /* ===== TOP DISHES — TABLE ===== */
        .mary-analytics .dish-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .mary-analytics .dish-table thead th {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3); text-align: left;
          padding: 8px 12px; border-bottom: 1px solid var(--border);
        }
        .mary-analytics .dish-th-rank { width: 40px; padding-left: 4px !important; }
        .mary-analytics .dish-th-num { text-align: right !important; width: 90px; }
        .mary-analytics .dish-th-bar { text-align: left !important; width: 24%; min-width: 140px; }
        .mary-analytics .dish-table tbody tr { border-bottom: 1px solid var(--border); }
        .mary-analytics .dish-table tbody tr:last-child { border-bottom: 0; }
        .mary-analytics .dish-table tbody tr:hover { background: var(--hover); }
        .mary-analytics .dish-table td { padding: 12px; vertical-align: middle; }
        .mary-analytics .dish-rank {
          font-family: var(--mono); font-feature-settings: 'tnum';
          color: var(--text-4); font-size: 11.5px; padding-left: 4px !important;
        }
        .mary-analytics .dish-name { color: var(--text); font-weight: 500; }
        .mary-analytics .dish-qty, .mary-analytics .dish-rev {
          font-family: var(--mono); font-feature-settings: 'tnum';
          text-align: right; color: var(--text);
        }
        .mary-analytics .dish-qty { color: var(--text-2); }
        .mary-analytics .dish-bar-cell { padding: 12px !important; }
        .mary-analytics .dish-bar-track {
          position: relative; height: 6px; background: var(--surface-2);
          border-radius: 3px; overflow: hidden;
        }
        .mary-analytics .dish-bar-fill {
          height: 100%; background: var(--accent); border-radius: 3px;
          transition: width .3s ease-out;
        }

        /* ===== TOP DISHES — CARDS ===== */
        .mary-analytics .dish-cards {
          list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;
        }
        .mary-analytics .dish-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 12px 14px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .mary-analytics .dish-card-row {
          display: grid; grid-template-columns: 28px 1fr auto;
          align-items: baseline; gap: 8px;
        }
        .mary-analytics .dish-card-rank {
          color: var(--text-4); font-family: var(--mono);
          font-feature-settings: 'tnum'; font-size: 11px;
        }
        .mary-analytics .dish-card-name {
          color: var(--text); font-weight: 500; font-size: 13.5px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .mary-analytics .dish-card-rev {
          font-family: var(--mono); font-feature-settings: 'tnum';
          color: var(--text); font-size: 13px;
        }
        .mary-analytics .dish-card-bar { height: 4px; background: var(--surface-2); border-radius: 2px; overflow: hidden; }
        .mary-analytics .dish-card-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; }
        .mary-analytics .dish-card-meta {
          display: flex; align-items: baseline; gap: 6px;
          font-size: 11.5px; color: var(--text-2);
        }
        .mary-analytics .dish-card-meta .muted { color: var(--text-3); }

        /* ===== TOP DISHES — PODIUM ===== */
        .mary-analytics .dish-split { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .mary-analytics .dish-podium {
          list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        }
        .mary-analytics .dish-podium-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 14px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .mary-analytics .dish-podium-card.rank-1 {
          border-color: ${varAlpha(v.primary.mainChannel, 0.4)};
          background: ${varAlpha(v.primary.mainChannel, 0.06)};
        }
        .mary-analytics .dish-podium-rank {
          font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-3); font-family: var(--mono); font-weight: 600;
        }
        .mary-analytics .dish-podium-card.rank-1 .dish-podium-rank { color: var(--accent); }
        .mary-analytics .dish-podium-name {
          font-size: 15px; font-weight: 600; color: var(--text);
          letter-spacing: -0.015em; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .mary-analytics .dish-podium-rev {
          font-family: var(--mono); font-feature-settings: 'tnum';
          font-size: 18px; font-weight: 600; color: var(--text);
          letter-spacing: -0.025em; margin-top: 4px;
        }
        .mary-analytics .dish-podium-qty { font-size: 11px; }
        .mary-analytics .dish-podium-bar {
          margin-top: 8px; height: 4px; background: var(--surface-2);
          border-radius: 2px; overflow: hidden;
        }
        .mary-analytics .dish-podium-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; }
        .mary-analytics .dish-rest { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border); }
        .mary-analytics .dish-rest li {
          display: grid; grid-template-columns: 32px 1fr 60px 110px;
          align-items: baseline; gap: 12px; padding: 10px 4px;
          border-bottom: 1px solid var(--border); font-size: 13px;
        }
        .mary-analytics .dish-rest li:last-child { border-bottom: 0; }
        .mary-analytics .dish-rest-rank {
          color: var(--text-4); font-family: var(--mono);
          font-feature-settings: 'tnum'; font-size: 11px;
        }
        .mary-analytics .dish-rest-name { color: var(--text); font-weight: 500; }
        .mary-analytics .dish-rest-qty {
          font-family: var(--mono); font-feature-settings: 'tnum';
          font-size: 12px; text-align: right;
        }
        .mary-analytics .dish-rest-rev {
          font-family: var(--mono); font-feature-settings: 'tnum';
          color: var(--text); text-align: right;
        }

        /* ===== INSIGHTS ===== */
        .mary-analytics .insights { list-style: none; margin: 0; padding: 0; }
        .mary-analytics .insights--grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;
        }
        .mary-analytics .insights--row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        }
        .mary-analytics .insights--stack { display: flex; flex-direction: column; gap: 8px; }
        .mary-analytics .insight {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 12px 14px;
          display: flex; flex-direction: column; gap: 6px;
          position: relative; min-width: 0;
        }
        .mary-analytics .insight::before {
          content: ''; position: absolute; top: 12px; bottom: 12px; left: 0;
          width: 2px; border-radius: 0 2px 2px 0; background: var(--accent);
        }
        .mary-analytics .insights--stack .insight { padding-left: 14px; }
        .mary-analytics .insight-title {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .mary-analytics .insight-value {
          font-size: 16px; font-weight: 600; color: var(--text);
          letter-spacing: -0.02em; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; font-family: var(--font);
        }
        .mary-analytics .insight--peak .insight-value,
        .mary-analytics .insight--ops .insight-value,
        .mary-analytics .insight--mix .insight-value {
          font-family: var(--mono); font-feature-settings: 'tnum';
        }
        .mary-analytics .insight-detail { font-size: 12px; color: var(--text-2); line-height: 1.4; }

        /* ===== HOURLY HEATMAP ===== */
        .mary-analytics .heatmap { display: flex; flex-direction: column; gap: 12px; }
        .mary-analytics .heatmap-grid {
          display: grid; grid-template-columns: 40px repeat(14, 1fr); gap: 3px;
        }
        .mary-analytics .heatmap-h, .mary-analytics .heatmap-d {
          font-size: 10.5px; color: var(--text-3);
          font-family: var(--mono); font-feature-settings: 'tnum';
          display: flex; align-items: center; justify-content: center; height: 22px;
        }
        .mary-analytics .heatmap-d { justify-content: flex-end; padding-right: 8px; }
        .mary-analytics .heatmap-cell { height: 22px; border-radius: 3px; transition: outline .12s; }
        .mary-analytics .heatmap-cell:hover { outline: 1.5px solid var(--accent); outline-offset: 1px; }
        .mary-analytics .heatmap-foot {
          display: flex; align-items: center; gap: 12px;
          font-size: 11.5px; color: var(--text-3); flex-wrap: wrap;
        }
        .mary-analytics .heatmap-tag {
          padding: 2px 8px; background: var(--accent-soft); color: var(--accent);
          border-radius: 999px; font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase; font-family: var(--mono);
        }
        .mary-analytics .heatmap-scale {
          display: inline-flex; align-items: center; gap: 4px; margin-left: auto;
        }
        .mary-analytics .heatmap-scale-cell { width: 14px; height: 12px; border-radius: 2px; }

        /* ===== LAYOUT 1 · CLASSIC ===== */
        .mary-analytics .layout-classic { display: flex; flex-direction: column; gap: 0; }
        .mary-analytics .layout-classic-row-2 {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 18px; margin-bottom: 18px;
        }
        .mary-analytics .layout-classic-row-2 > .panel-card { margin-bottom: 0; }

        /* ===== LAYOUT 2 · SIDEBAR ===== */
        .mary-analytics .layout-sidebar {
          display: grid; grid-template-columns: 260px 1fr; gap: 20px;
        }
        .mary-analytics .layout-sidebar-rail {
          display: flex; flex-direction: column; gap: 8px;
          position: sticky; top: 80px; align-self: start;
        }
        .mary-analytics .rail-eyebrow {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-3);
          font-family: var(--mono); margin-bottom: 4px;
        }
        .mary-analytics .rail-kpis { display: flex; flex-direction: column; gap: 8px; }
        .mary-analytics .kpi-card--rail { padding: 14px 16px; gap: 4px; }
        .mary-analytics .kpi-card--rail .kpi-label { font-size: 10.5px; }
        .mary-analytics .kpi-card--rail .kpi-value { font-size: 18px; }
        .mary-analytics .kpi-card--rail .kpi-prev { margin-top: 0; }
        .mary-analytics .layout-sidebar-main { display: flex; flex-direction: column; gap: 18px; }
        .mary-analytics .layout-sidebar-main > .panel-card { margin-bottom: 0; }
        .mary-analytics .layout-sidebar-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
          gap: 18px;
        }
        .mary-analytics .layout-sidebar-grid > .panel-card { margin-bottom: 0; }

        /* ===== LAYOUT 3 · EDITORIAL ===== */
        .mary-analytics .layout-editorial { display: flex; flex-direction: column; gap: 18px; }
        .mary-analytics .editorial-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
          gap: 32px; align-items: flex-end;
          padding: 36px 28px 28px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius);
          border-bottom: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0;
        }
        .mary-analytics .editorial-eyebrow {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--text-3);
          font-family: var(--mono); margin-bottom: 14px;
        }
        .mary-analytics .editorial-hero-value {
          font-size: 96px; font-weight: 700; letter-spacing: -0.05em;
          color: var(--text); font-family: var(--mono);
          font-feature-settings: 'tnum'; line-height: 0.95; margin: 0;
        }
        .mary-analytics .editorial-hero-delta {
          display: flex; align-items: center; gap: 12px;
          margin-top: 14px; font-size: 13px;
        }
        .mary-analytics .editorial-hero-side {
          display: flex; flex-direction: column; gap: 12px; padding-bottom: 14px;
        }
        .mary-analytics .editorial-side-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 14px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .mary-analytics .editorial-side-lbl {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-3); font-family: var(--mono);
        }
        .mary-analytics .editorial-side-val {
          font-size: 26px; font-weight: 600; color: var(--text);
          font-family: var(--mono); font-feature-settings: 'tnum';
          letter-spacing: -0.03em;
        }
        .mary-analytics .editorial-side-card .kpi-delta { align-self: flex-start; margin-top: 4px; }
        .mary-analytics .editorial-tail {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: var(--border); border: 1px solid var(--border);
          border-top: 0; border-radius: 0 0 var(--radius) var(--radius);
        }
        .mary-analytics .editorial-tail-cell {
          background: var(--surface); padding: 16px 20px;
          display: grid; grid-template-columns: 1fr auto auto;
          align-items: center; gap: 12px;
        }
        .mary-analytics .editorial-tail-cell.is-zero { opacity: 0.55; }
        .mary-analytics .editorial-tail-lbl {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .mary-analytics .editorial-tail-val {
          font-family: var(--mono); font-feature-settings: 'tnum';
          font-size: 16px; color: var(--text); font-weight: 600;
        }
        .mary-analytics .editorial-cols {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 18px;
        }
        .mary-analytics .editorial-col-wide > .panel-card,
        .mary-analytics .editorial-col-narrow > .panel-card { margin-bottom: 18px; }
        .mary-analytics .editorial-col-narrow > .panel-card:last-child { margin-bottom: 0; }

        /* ===== LAYOUT 4 · BENTO ===== */
        .mary-analytics .layout-bento {
          display: grid; grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(140px, auto); gap: 14px;
        }
        .mary-analytics .bento-cell {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 18px 20px;
          display: flex; flex-direction: column; gap: 8px;
          min-width: 0; min-height: 0;
        }
        .mary-analytics .bento-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--text-3); font-family: var(--mono);
        }
        .mary-analytics .bento-card-head {
          display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;
        }
        .mary-analytics .bento-card-title {
          margin: 0; font-size: 14px; font-weight: 600;
          color: var(--text); letter-spacing: -0.015em;
        }
        .mary-analytics .bento-hero {
          grid-column: span 6; grid-row: span 2;
          background: linear-gradient(135deg, ${varAlpha(v.primary.mainChannel, 0.14)}, ${v.background.paper} 60%);
          border-color: ${varAlpha(v.primary.mainChannel, 0.3)};
          padding: 28px; justify-content: space-between;
        }
        .mary-analytics .bento-hero-value {
          font-size: 64px; font-weight: 700; letter-spacing: -0.04em;
          color: var(--text); font-family: var(--mono);
          font-feature-settings: 'tnum'; line-height: 1;
        }
        .mary-analytics .bento-hero-delta { display: flex; align-items: center; gap: 10px; font-size: 13px; }
        .mary-analytics .bento-kpi { grid-column: span 3; }
        .mary-analytics .bento-kpi-value {
          font-size: 28px; font-weight: 600; color: var(--text);
          font-family: var(--mono); font-feature-settings: 'tnum';
          letter-spacing: -0.03em; margin-top: auto;
        }
        .mary-analytics .bento-kpi-mini {
          grid-column: span 6; display: flex; flex-direction: column;
          padding: 14px 18px;
        }
        .mary-analytics .bento-mini-row {
          display: grid; grid-template-columns: 1fr auto auto;
          align-items: baseline; gap: 12px; padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }
        .mary-analytics .bento-mini-row:last-child { border-bottom: 0; }
        .mary-analytics .bento-mini-row.is-zero { opacity: 0.55; }
        .mary-analytics .bento-mini-lbl {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .mary-analytics .bento-mini-val {
          font-family: var(--mono); font-feature-settings: 'tnum';
          color: var(--text); font-size: 14px; font-weight: 500;
        }
        .mary-analytics .bento-chart    { grid-column: span 8; grid-row: span 3; }
        .mary-analytics .bento-payment  { grid-column: span 4; grid-row: span 3; }
        .mary-analytics .bento-cats     { grid-column: span 6; grid-row: span 3; }
        .mary-analytics .bento-dishes   { grid-column: span 6; grid-row: span 3; }
        .mary-analytics .bento-insights { grid-column: span 12; grid-row: span 2; }
        .mary-analytics .bento-heatmap  { grid-column: span 12; grid-row: span 3; }
        .mary-analytics .bento-dishes .dish-podium { grid-template-columns: repeat(3, 1fr); }

        /* ===== DENSITY ===== */
        .mary-analytics[data-density='compact'] .kpi-card { padding: 12px 14px 10px; gap: 4px; }
        .mary-analytics[data-density='compact'] .kpi-value { font-size: 19px; }
        .mary-analytics[data-density='compact'] .panel-card-head { padding: 12px 14px 10px; }
        .mary-analytics[data-density='compact'] .panel-card-body { padding: 14px; }
        .mary-analytics[data-density='compact'] .dish-table td { padding: 8px 12px; }
        .mary-analytics[data-density='compact'] .cat-table td { padding: 7px 8px; }

        /* ===== CARDS ===== */
        .mary-analytics[data-cards='flat'] .panel-card,
        .mary-analytics[data-cards='flat'] .kpi-card,
        .mary-analytics[data-cards='flat'] .editorial-side-card,
        .mary-analytics[data-cards='flat'] .dish-card,
        .mary-analytics[data-cards='flat'] .insight,
        .mary-analytics[data-cards='flat'] .dish-podium-card,
        .mary-analytics[data-cards='flat'] .bento-cell {
          border-color: transparent; background: var(--surface-2);
        }
        .mary-analytics[data-cards='elevated'] .panel-card,
        .mary-analytics[data-cards='elevated'] .kpi-card,
        .mary-analytics[data-cards='elevated'] .editorial-side-card,
        .mary-analytics[data-cards='elevated'] .dish-card,
        .mary-analytics[data-cards='elevated'] .dish-podium-card,
        .mary-analytics[data-cards='elevated'] .bento-cell {
          border-color: transparent;
          box-shadow:
            0 1px 0 0 ${tokens.cardShadowRim},
            0 6px 18px -8px ${tokens.cardShadowAmbient},
            0 2px 6px -2px ${tokens.cardShadowKey};
        }

        /* ===== SETTINGS DRAWER ===== */
        .mary-analytics .settings-overlay {
          position: fixed; inset: 0;
          background: ${tokens.overlayScrim};
          backdrop-filter: blur(4px);
          z-index: 1200; opacity: 0; pointer-events: none;
          transition: opacity .18s ease-out;
        }
        .mary-analytics .settings-overlay.open { opacity: 1; pointer-events: auto; }
        .mary-analytics .settings-drawer {
          position: fixed; top: 0; right: 0; height: 100vh;
          width: min(520px, 100vw);
          background: var(--bg); border-left: 1px solid var(--border);
          z-index: 1201;
          display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform .22s cubic-bezier(.3,.7,.4,1);
          box-shadow: -32px 0 64px -20px ${tokens.drawerShadow};
        }
        .mary-analytics .settings-drawer.open { transform: translateX(0); }
        .mary-analytics .settings-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .mary-analytics .settings-drawer-titles { display: flex; flex-direction: column; gap: 4px; }
        .mary-analytics .settings-drawer-eyebrow {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--text-3); font-family: var(--mono);
        }
        .mary-analytics .settings-drawer-title {
          margin: 0; font-size: 18px; font-weight: 600;
          letter-spacing: -0.022em; color: var(--text); font-family: var(--font);
        }
        .mary-analytics .settings-close {
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-3); border-radius: var(--radius-sm);
          transition: background .12s, color .12s;
        }
        .mary-analytics .settings-close:hover { background: var(--hover); color: var(--text); }
        .mary-analytics .settings-drawer-body {
          flex: 1; display: grid; grid-template-columns: 148px 1fr;
          min-height: 0; overflow: hidden;
        }
        .mary-analytics .settings-tabs {
          border-right: 1px solid var(--border);
          padding: 14px 10px;
          display: flex; flex-direction: column; gap: 2px;
          background: var(--sidebar-bg); overflow-y: auto;
        }
        .mary-analytics .settings-tab {
          position: relative; display: flex; align-items: center;
          padding: 9px 12px; color: var(--text-2);
          font-size: 13px; font-weight: 500; letter-spacing: -0.003em;
          border-radius: var(--radius-sm);
          transition: background .12s, color .12s; text-align: left;
        }
        .mary-analytics .settings-tab:hover { background: var(--hover); color: var(--text); }
        .mary-analytics .settings-tab.active {
          background: var(--accent-soft); color: var(--accent); font-weight: 600;
        }
        .mary-analytics .settings-tab-label { flex: 1; }
        .mary-analytics .settings-panel {
          overflow-y: auto; padding: 22px 28px 32px;
          display: flex; flex-direction: column; gap: 28px;
        }
        .mary-analytics .settings-section { display: flex; flex-direction: column; gap: 12px; }
        .mary-analytics .settings-section-label {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-3); font-family: var(--mono);
        }
        .mary-analytics .settings-section-body { display: flex; flex-direction: column; }
        .mary-analytics .settings-row {
          display: grid; grid-template-columns: 1fr auto; gap: 24px;
          align-items: center; padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .mary-analytics .settings-row:last-child { border-bottom: 0; }
        .mary-analytics .settings-row-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .mary-analytics .settings-row-label { font-size: 13.5px; font-weight: 500; color: var(--text); }
        .mary-analytics .settings-row-hint { font-size: 12px; color: var(--text-3); line-height: 1.4; }
        .mary-analytics .settings-row-control {
          display: flex; align-items: center; justify-content: flex-end;
          min-width: 200px;
        }
        .mary-analytics .seg {
          display: inline-flex; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 3px; gap: 2px;
        }
        .mary-analytics .seg-btn {
          height: 30px; padding: 0 14px; border-radius: 4px;
          font-size: 12.5px; font-weight: 500; color: var(--text-3);
          letter-spacing: -0.003em; transition: background .12s, color .12s;
          white-space: nowrap;
        }
        .mary-analytics .seg-btn:hover { color: var(--text); }
        .mary-analytics .seg-btn.active {
          background: var(--surface-2); color: var(--text);
          box-shadow: 0 1px 0 0 var(--border-strong);
        }
        .mary-analytics .sw {
          position: relative; width: 40px; height: 24px;
          border: 0; background: transparent; cursor: pointer; padding: 0;
        }
        .mary-analytics .sw-track {
          position: absolute; inset: 0; border-radius: 999px;
          background: var(--surface-2); border: 1px solid var(--border);
          transition: background .15s, border-color .15s;
        }
        .mary-analytics .sw-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--text-3);
          transition: transform .18s cubic-bezier(.3,.7,.4,1), background .15s;
        }
        .mary-analytics .sw.on .sw-track { background: var(--accent); border-color: var(--accent); }
        .mary-analytics .sw.on .sw-thumb {
          transform: translateX(16px); background: var(--accent-fg);
        }
        .mary-analytics .settings-select {
          position: relative; display: inline-flex; align-items: center; min-width: 220px;
        }
        .mary-analytics .settings-select select {
          appearance: none; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 0 32px 0 12px; height: 36px;
          font-size: 13px; color: var(--text);
          width: 100%; cursor: pointer; font-family: var(--font);
          transition: border-color .12s;
        }
        .mary-analytics .settings-select select:hover { border-color: var(--border-strong); }
        .mary-analytics .settings-select select:focus {
          outline: none; border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .mary-analytics .settings-select svg {
          position: absolute; right: 12px; pointer-events: none; color: var(--text-3);
        }
        .mary-analytics .settings-tab-intro {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 0 12px; border-bottom: 1px solid var(--border);
          font-size: 13px; color: var(--text-2);
        }
        .mary-analytics .settings-tab-count {
          font-family: var(--mono); font-feature-settings: 'tnum';
          font-size: 12px; font-weight: 600; color: var(--text-2);
          padding: 3px 10px; background: var(--surface-2); border-radius: 999px;
        }
        .mary-analytics .settings-drawer-foot {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--sidebar-bg); flex-shrink: 0;
        }
        .mary-analytics .settings-reset {
          height: 36px; padding: 0 14px;
          background: transparent; color: var(--text-2);
          font-size: 13px; font-weight: 500;
          border-radius: var(--radius-sm);
          transition: background .12s, color .12s;
        }
        .mary-analytics .settings-reset:hover { background: var(--hover); color: var(--text); }
        .mary-analytics .settings-done {
          height: 36px; padding: 0 18px;
          background: var(--accent); color: white;
          font-size: 13px; font-weight: 600;
          border-radius: var(--radius-sm);
          transition: filter .12s, transform .06s;
        }
        .mary-analytics .settings-done:hover { filter: brightness(1.08); }
        .mary-analytics .settings-done:active { transform: translateY(0.5px); }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1280px) {
          .mary-analytics .kpi-strip { grid-template-columns: repeat(3, 1fr); }
          .mary-analytics .layout-sidebar { grid-template-columns: 1fr; }
          .mary-analytics .layout-sidebar-rail { position: static; }
          .mary-analytics .rail-kpis { display: grid; grid-template-columns: repeat(3, 1fr); }
          .mary-analytics .layout-sidebar-grid { grid-template-columns: 1fr 1fr; }
          .mary-analytics .editorial-hero { grid-template-columns: 1fr; gap: 18px; }
          .mary-analytics .editorial-hero-value { font-size: 64px; }
          .mary-analytics .editorial-cols { grid-template-columns: 1fr; }
          .mary-analytics .editorial-tail { grid-template-columns: repeat(3, 1fr); }
          .mary-analytics .bento-hero    { grid-column: span 12; grid-row: span 2; }
          .mary-analytics .bento-kpi     { grid-column: span 6; }
          .mary-analytics .bento-kpi-mini{ grid-column: span 12; }
          .mary-analytics .bento-chart   { grid-column: span 12; }
          .mary-analytics .bento-payment { grid-column: span 12; }
          .mary-analytics .bento-cats    { grid-column: span 12; }
          .mary-analytics .bento-dishes  { grid-column: span 12; }
        }
        @media (max-width: 840px) {
          .mary-analytics .kpi-strip { grid-template-columns: repeat(2, 1fr); }
          .mary-analytics .layout-classic-row-2 { grid-template-columns: 1fr; }
          .mary-analytics .layout-sidebar-grid { grid-template-columns: 1fr; }
          .mary-analytics .editorial-tail { grid-template-columns: 1fr; }
          .mary-analytics .editorial-hero-value { font-size: 48px; }
          .mary-analytics .dish-th-bar { display: none; }
          .mary-analytics .dish-bar-cell { display: none; }
          .mary-analytics .settings-drawer { width: 100vw; }
          .mary-analytics .settings-drawer-body { grid-template-columns: 1fr; }
          .mary-analytics .settings-tabs {
            flex-direction: row; border-right: 0;
            border-bottom: 1px solid var(--border);
            overflow-x: auto; padding: 8px;
          }
          .mary-analytics .settings-tab { flex-shrink: 0; }
          .mary-analytics .settings-row { grid-template-columns: 1fr; gap: 10px; }
          .mary-analytics .settings-row-control { justify-content: flex-start; }
        }
      `}
    />
  );
}
