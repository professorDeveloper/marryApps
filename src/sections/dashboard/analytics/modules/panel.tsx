import type { ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Panel({ title, eyebrow, action, children, className = '', padded = true }: PanelProps) {
  return (
    <section className={`panel-card ${className}`}>
      {(title || action) && (
        <header className="panel-card-head">
          <div className="panel-card-titles">
            {eyebrow && <div className="panel-card-eyebrow">{eyebrow}</div>}
            {title && <h3 className="panel-card-title">{title}</h3>}
          </div>
          {action && <div className="panel-card-action">{action}</div>}
        </header>
      )}
      <div className={`panel-card-body ${padded ? '' : 'panel-card-body--flush'}`}>{children}</div>
    </section>
  );
}
