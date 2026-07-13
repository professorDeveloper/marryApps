import type { ReactNode } from 'react';
import type { Tweaks } from './use-tweaks';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  onReset: () => void;
}

const TAB_IDS = ['layout', 'style', 'numbers', 'modules', 'sections'] as const;
type TabId = (typeof TAB_IDS)[number];

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
  const { t } = useTranslation('menu');
  const [tab, setTab] = useState<TabId>('layout');
  const s = (key: string) => t(`analyticsDashboard.settings.${key}`);
  const tabLabels: Record<TabId, string> = {
    layout: s('tabs.layout'),
    style: s('tabs.style'),
    numbers: s('tabs.numbers'),
    modules: s('tabs.modules'),
    sections: s('tabs.sections'),
  };

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
      <aside className={`settings-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label={s('ariaLabel')}>
        <header className="settings-drawer-head">
          <div className="settings-drawer-titles">
            <div className="settings-drawer-eyebrow">{s('eyebrow')}</div>
            <h2 className="settings-drawer-title">{s('title')}</h2>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label={t('analyticsDashboard.closeSettingsAria')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="settings-drawer-body">
          <nav className="settings-tabs">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`settings-tab ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
              >
                <span className="settings-tab-label">{tabLabels[id]}</span>
              </button>
            ))}
          </nav>

          <div className="settings-panel">
            {tab === 'layout' && (
              <SettingsSection label={s('layoutSection.label')}>
                <SettingsRow label={s('layoutSection.layout.label')} hint={s('layoutSection.layout.hint')}>
                  <SettingsSelect
                    value={tweaks.layout}
                    options={[
                      { value: 'classic', label: s('layoutSection.layout.classic') },
                      { value: 'sidebar', label: s('layoutSection.layout.sidebar') },
                      { value: 'editorial', label: s('layoutSection.layout.editorial') },
                      { value: 'bento', label: s('layoutSection.layout.bento') },
                    ]}
                    onChange={(v) => setTweak('layout', v)}
                  />
                </SettingsRow>
                <SettingsRow label={s('layoutSection.density.label')} hint={s('layoutSection.density.hint')}>
                  <Segmented
                    value={tweaks.density}
                    options={[
                      { value: 'comfortable', label: s('layoutSection.density.comfortable') },
                      { value: 'compact', label: s('layoutSection.density.compact') },
                    ]}
                    onChange={(v) => setTweak('density', v)}
                  />
                </SettingsRow>
              </SettingsSection>
            )}

            {tab === 'style' && (
              <>
                <SettingsSection label={s('styleSection.shapeLabel')}>
                  <SettingsRow label={s('styleSection.radius.label')} hint={s('styleSection.radius.hint')}>
                    <Segmented
                      value={tweaks.radius}
                      options={[
                        { value: 'sharp', label: s('styleSection.radius.sharp') },
                        { value: 'soft', label: s('styleSection.radius.soft') },
                        { value: 'pill', label: s('styleSection.radius.pill') },
                      ]}
                      onChange={(v) => setTweak('radius', v)}
                    />
                  </SettingsRow>
                  <SettingsRow label={s('styleSection.cards.label')} hint={s('styleSection.cards.hint')}>
                    <Segmented
                      value={tweaks.cardStyle}
                      options={[
                        { value: 'flat', label: s('styleSection.cards.flat') },
                        { value: 'outlined', label: s('styleSection.cards.outlined') },
                        { value: 'elevated', label: s('styleSection.cards.elevated') },
                      ]}
                      onChange={(v) => setTweak('cardStyle', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
                <SettingsSection label={s('styleSection.backgroundLabel')}>
                  <SettingsRow label={s('styleSection.tint.label')} hint={s('styleSection.tint.hint')}>
                    <Segmented
                      value={tweaks.bgTint}
                      options={[
                        { value: 'cool', label: s('styleSection.tint.cool') },
                        { value: 'warm', label: s('styleSection.tint.warm') },
                        { value: 'neutral', label: s('styleSection.tint.neutral') },
                      ]}
                      onChange={(v) => setTweak('bgTint', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {tab === 'numbers' && (
              <>
                <SettingsSection label={s('numbersSection.formattingLabel')}>
                  <SettingsRow label={s('numbersSection.format.label')} hint={s('numbersSection.format.hint')}>
                    <Segmented
                      value={tweaks.numFormat}
                      options={[
                        { value: 'compact', label: s('numbersSection.format.compact') },
                        { value: 'full', label: s('numbersSection.format.full') },
                      ]}
                      onChange={(v) => setTweak('numFormat', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
                <SettingsSection label={s('numbersSection.comparisonLabel')}>
                  <SettingsRow label={s('numbersSection.compare.label')} hint={s('numbersSection.compare.hint')}>
                    <Switch value={tweaks.compare} onChange={(v) => setTweak('compare', v)} ariaLabel={s('numbersSection.compare.ariaLabel')} />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {tab === 'modules' && (
              <>
                <SettingsSection label={s('modulesSection.salesDynamicsLabel')}>
                  <SettingsRow label={s('modulesSection.chartStyle.label')} hint={s('modulesSection.chartStyle.hint')}>
                    <SettingsSelect
                      value={tweaks.chartStyle}
                      options={[
                        { value: 'line_overlay', label: s('modulesSection.chartStyle.lineOverlay') },
                        { value: 'bars', label: s('modulesSection.chartStyle.bars') },
                        { value: 'area', label: s('modulesSection.chartStyle.area') },
                        { value: 'paired', label: s('modulesSection.chartStyle.paired') },
                      ]}
                      onChange={(v) => setTweak('chartStyle', v)}
                    />
                  </SettingsRow>
                </SettingsSection>
                <SettingsSection label={s('modulesSection.topDishesLabel')}>
                  <SettingsRow label={s('modulesSection.dishesDisplay.label')} hint={s('modulesSection.dishesDisplay.hint')}>
                    <SettingsSelect
                      value={tweaks.dishesStyle}
                      options={[
                        { value: 'table', label: s('modulesSection.dishesDisplay.table') },
                        { value: 'cards', label: s('modulesSection.dishesDisplay.cards') },
                        { value: 'podium', label: s('modulesSection.dishesDisplay.podium') },
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
                  <span className="muted">{s('sectionsTab.hideHint')}</span>
                  <span className="mono settings-tab-count">{visibleSections} / 7</span>
                </div>
                <SettingsSection label={s('sectionsTab.modulesOnPage')}>
                  <SettingsRow label={s('sectionsTab.kpiStrip.label')} hint={s('sectionsTab.kpiStrip.hint')}>
                    <Switch value={tweaks.sec_kpis} onChange={(v) => setTweak('sec_kpis', v)} ariaLabel={s('sectionsTab.kpiStrip.ariaLabel')} />
                  </SettingsRow>
                  <SettingsRow label={s('sectionsTab.salesDynamics.label')} hint={s('sectionsTab.salesDynamics.hint')}>
                    <Switch value={tweaks.sec_sales} onChange={(v) => setTweak('sec_sales', v)} ariaLabel={s('sectionsTab.salesDynamics.ariaLabel')} />
                  </SettingsRow>
                  <SettingsRow label={s('sectionsTab.categories.label')} hint={s('sectionsTab.categories.hint')}>
                    <Switch value={tweaks.sec_categories} onChange={(v) => setTweak('sec_categories', v)} ariaLabel={s('sectionsTab.categories.ariaLabel')} />
                  </SettingsRow>
                  <SettingsRow label={s('sectionsTab.payments.label')} hint={s('sectionsTab.payments.hint')}>
                    <Switch value={tweaks.sec_payments} onChange={(v) => setTweak('sec_payments', v)} ariaLabel={s('sectionsTab.payments.ariaLabel')} />
                  </SettingsRow>
                  <SettingsRow label={s('sectionsTab.dishes.label')} hint={s('sectionsTab.dishes.hint')}>
                    <Switch value={tweaks.sec_dishes} onChange={(v) => setTweak('sec_dishes', v)} ariaLabel={s('sectionsTab.dishes.ariaLabel')} />
                  </SettingsRow>
                  <SettingsRow label={s('sectionsTab.insights.label')} hint={s('sectionsTab.insights.hint')}>
                    <Switch value={tweaks.sec_insights} onChange={(v) => setTweak('sec_insights', v)} ariaLabel={s('sectionsTab.insights.ariaLabel')} />
                  </SettingsRow>
                  <SettingsRow label={s('sectionsTab.heatmap.label')} hint={s('sectionsTab.heatmap.hint')}>
                    <Switch value={false} onChange={() => {}} ariaLabel={s('sectionsTab.heatmap.ariaLabel')} disabled />
                  </SettingsRow>
                </SettingsSection>
              </>
            )}
          </div>
        </div>

        <footer className="settings-drawer-foot">
          <button type="button" className="settings-reset" onClick={onReset}>
            {s('reset')}
          </button>
          <button type="button" className="settings-done" onClick={onClose}>
            {s('done')}
          </button>
        </footer>
      </aside>
    </>
  );
}
