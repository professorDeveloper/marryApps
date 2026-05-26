import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Tweaks } from './use-tweaks';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  onReset: () => void;
}

const TABS = [
  { id: 'layout', label: 'Layout' },
  { id: 'style', label: 'Style' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'modules', label: 'Modules' },
  { id: 'sections', label: 'Sections' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="settings-row">
      <div className="settings-row-meta">
        <div className="settings-row-label">{label}</div>
        {hint && <div className="settings-row-hint">{hint}</div>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <div className="settings-section-label">{label}</div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

interface SegOption<V extends string> {
  value: V;
  label: string;
}
function Segmented<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: SegOption<V>[];
  onChange: (v: V) => void;
}) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`seg-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ value, onChange, ariaLabel, disabled }: { value: boolean; onChange: (v: boolean) => void; ariaLabel: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={`sw ${value ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!value)}
      style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
    >
      <span className="sw-track" />
      <span className="sw-thumb" />
    </button>
  );
}

function SettingsSelect<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: SegOption<V>[];
  onChange: (v: V) => void;
}) {
  return (
    <div className="settings-select">
      <select value={value} onChange={(e) => onChange(e.target.value as V)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

export function SettingsDrawer({ open, onClose, tweaks, setTweak, onReset }: SettingsDrawerProps) {
  const [tab, setTab] = useState<TabId>('layout');

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const visibleSections = [
    tweaks.sec_kpis,
    tweaks.sec_sales,
    tweaks.sec_categories,
    tweaks.sec_payments,
    tweaks.sec_dishes,
    tweaks.sec_insights,
    tweaks.sec_heatmap,
  ].filter(Boolean).length;

  return (
    <>
      <div className={`settings-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`settings-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Page settings">
        <header className="settings-drawer-head">
          <div className="settings-drawer-titles">
            <div className="settings-drawer-eyebrow">PAGE SETTINGS</div>
            <h2 className="settings-drawer-title">Configure dashboard</h2>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="settings-drawer-body">
          <nav className="settings-tabs">
            {TABS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`settings-tab ${tab === s.id ? 'active' : ''}`}
                onClick={() => setTab(s.id)}
              >
                <span className="settings-tab-label">{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-panel">
            {tab === 'layout' && (
              <SettingsSection label="Composition">
                <SettingsRow label="Layout" hint="Overall page structure.">
                  <SettingsSelect
                    value={tweaks.layout}
                    options={[
                      { value: 'classic', label: '1 · Classic' },
                      { value: 'sidebar', label: '2 · KPI rail' },
                      { value: 'editorial', label: '3 · Editorial' },
                      { value: 'bento', label: '4 · Bento' },
                    ]}
                    onChange={(v) => setTweak('layout', v)}
                  />
                </SettingsRow>
                <SettingsRow label="Density" hint="Tighter rows + smaller paddings.">
                  <Segmented
                    value={tweaks.density}
                    options={[
                      { value: 'comfortable', label: 'Comfortable' },
                      { value: 'compact', label: 'Compact' },
                    ]}
                    onChange={(v) => setTweak('density', v)}
                  />
                </SettingsRow>
              </SettingsSection>
            )}

            {tab === 'style' && (
              <>
                <SettingsSection label="Shape">
                  <SettingsRow label="Corner radius" hint="How rounded everything looks.">
                    <Segmented
                      value={tweaks.radius}
                      options={[
                        { value: 'sharp', label: 'Sharp' },
                        { value: 'soft', label: 'Soft' },
                        { value: 'pill', label: 'Round' },
                      ]}
                      onChange={(v) => setTweak('radius', v)}
                    />
                  </SettingsRow>
                  <SettingsRow label="Cards" hint="Border, shadow, or flat fill.">
                    <Segmented
                      value={tweaks.cardStyle}
                      options={[
                        { value: 'flat', label: 'Flat' },
                        { value: 'outlined', label: 'Outline' },
                        { value: 'elevated', label: 'Lift' },
                      ]}
                      onChange={(v) => setTweak('cardStyle', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
                <SettingsSection label="Background">
                  <SettingsRow label="Tint" hint="Subtle hue shift on the page bg.">
                    <Segmented
                      value={tweaks.bgTint}
                      options={[
                        { value: 'cool', label: 'Cool' },
                        { value: 'warm', label: 'Warm' },
                        { value: 'neutral', label: 'Flat' },
                      ]}
                      onChange={(v) => setTweak('bgTint', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {tab === 'numbers' && (
              <>
                <SettingsSection label="Formatting">
                  <SettingsRow label="Format" hint="Compact (46.9M) or full grouped digits.">
                    <Segmented
                      value={tweaks.numFormat}
                      options={[
                        { value: 'compact', label: '46.9M' },
                        { value: 'full', label: '46 884 174' },
                      ]}
                      onChange={(v) => setTweak('numFormat', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
                <SettingsSection label="Comparison">
                  <SettingsRow label="Show vs previous period" hint="Delta % + arrow on every KPI.">
                    <Switch value={tweaks.compare} onChange={(v) => setTweak('compare', v)} ariaLabel="Compare to previous" />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {tab === 'modules' && (
              <>
                <SettingsSection label="Sales dynamics">
                  <SettingsRow label="Chart style" hint="How daily revenue is drawn.">
                    <SettingsSelect
                      value={tweaks.chartStyle}
                      options={[
                        { value: 'line_overlay', label: 'Line + dashed overlay' },
                        { value: 'bars', label: 'Bars' },
                        { value: 'area', label: 'Area' },
                        { value: 'paired', label: 'Paired bars' },
                      ]}
                      onChange={(v) => setTweak('chartStyle', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
                <SettingsSection label="Top dishes">
                  <SettingsRow label="Display" hint="Table, cards, or podium + list.">
                    <SettingsSelect
                      value={tweaks.dishesStyle}
                      options={[
                        { value: 'table', label: 'Ranked table' },
                        { value: 'cards', label: 'Card list' },
                        { value: 'podium', label: 'Podium + list' },
                      ]}
                      onChange={(v) => setTweak('dishesStyle', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {tab === 'sections' && (
              <>
                <div className="settings-tab-intro">
                  <span className="muted">Hide modules you don&apos;t need.</span>
                  <span className="mono settings-tab-count">{visibleSections} / 7</span>
                </div>
                <SettingsSection label="Modules on this page">
                  <SettingsRow label="KPI strip" hint="Revenue, checks, average check, returns, discounts, VAT.">
                    <Switch value={tweaks.sec_kpis} onChange={(v) => setTweak('sec_kpis', v)} ariaLabel="KPI strip" />
                  </SettingsRow>
                  <SettingsRow label="Sales dynamics" hint="Daily revenue chart for the period.">
                    <Switch value={tweaks.sec_sales} onChange={(v) => setTweak('sec_sales', v)} ariaLabel="Sales dynamics" />
                  </SettingsRow>
                  <SettingsRow label="Revenue by category" hint="Bar list of categories ranked by revenue.">
                    <Switch value={tweaks.sec_categories} onChange={(v) => setTweak('sec_categories', v)} ariaLabel="Categories" />
                  </SettingsRow>
                  <SettingsRow label="Payment types" hint="Cash vs card split.">
                    <Switch value={tweaks.sec_payments} onChange={(v) => setTweak('sec_payments', v)} ariaLabel="Payment types" />
                  </SettingsRow>
                  <SettingsRow label="Top dishes" hint="Top dishes by revenue.">
                    <Switch value={tweaks.sec_dishes} onChange={(v) => setTweak('sec_dishes', v)} ariaLabel="Top dishes" />
                  </SettingsRow>
                  <SettingsRow label="Insights" hint="Auto-generated callouts.">
                    <Switch value={tweaks.sec_insights} onChange={(v) => setTweak('sec_insights', v)} ariaLabel="Insights" />
                  </SettingsRow>
                  <SettingsRow label="Hourly heatmap" hint="Disabled — data not wired yet.">
                    <Switch value={false} onChange={() => {}} ariaLabel="Hourly heatmap" disabled />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}
          </div>
        </div>

        <footer className="settings-drawer-foot">
          <button type="button" className="settings-reset" onClick={onReset}>
            Reset to defaults
          </button>
          <button type="button" className="settings-done" onClick={onClose}>
            Done
          </button>
        </footer>
      </aside>
    </>
  );
}
