import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

const SLIDE_MS = 7000;
const mono = '"JetBrains Mono", "Courier New", monospace';

// ----------------------------------------------------------------------

function ShiftClosingVisual() {
  return (
    <Box sx={{
      border: '1px solid', borderColor: 'divider',
      borderRadius: '12px',
      bgcolor: 'rgba(255,255,255,0.025)',
      p: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: '22px',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ fontFamily: mono, fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Shift #247 · Today 22:00
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: mono, fontSize: '10.5px', color: 'success.main' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
          Closed
        </Box>
      </Box>

      <Box>
        <Box sx={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.disabled', mb: '6px' }}>
          Total revenue
        </Box>
        <Box sx={{ fontFamily: mono, fontSize: '34px', fontWeight: 500, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1 }}>
          4,284,000{' '}
          <Box component="span" sx={{ fontSize: '16px', color: 'text.disabled', fontWeight: 400 }}>UZS</Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { label: 'Cash', value: '1,842,000', pct: 43 },
          { label: 'Card', value: '1,760,000', pct: 41 },
          { label: 'Platform', value: '682,000', pct: 16 },
        ].map((row) => (
          <Box key={row.label} sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Box sx={{ fontFamily: mono, fontSize: '11px', color: 'text.disabled', width: '60px', flexShrink: 0 }}>{row.label}</Box>
            <Box sx={{ flex: 1, height: '4px', bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${row.pct}%`, bgcolor: 'var(--accent)', borderRadius: '2px', opacity: 0.65 }} />
            </Box>
            <Box sx={{ fontFamily: mono, fontSize: '11px', color: 'text.secondary', textAlign: 'right', minWidth: '90px', flexShrink: 0 }}>{row.value}</Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', pt: '2px', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ fontSize: '14px', color: 'success.main', lineHeight: 1 }}>✓</Box>
        <Box sx={{ fontFamily: mono, fontSize: '11.5px', color: 'text.secondary' }}>
          Closed in{' '}
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>11:42</Box> min
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function FoodCostVisual() {
  const items = [
    { name: 'Shashlik 200g', cost: 24.1 },
    { name: 'Lagman', cost: 31.8 },
    { name: 'Plov', cost: 28.4 },
    { name: 'Caesar Salad', cost: 19.2 },
    { name: 'Burger', cost: 26.7 },
  ];
  const target = 30;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '22px', py: '14px', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ fontFamily: mono, fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Menu · Live costs
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%', bgcolor: 'var(--accent)',
            animation: 'costPulse 1.8s ease-in-out infinite',
            '@keyframes costPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
          }} />
          <Box sx={{ fontFamily: mono, fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Live</Box>
        </Box>
      </Box>

      {items.map((item) => {
        const over = item.cost > target;
        return (
          <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: '16px', px: '22px', py: '13px', borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
            <Box sx={{ fontSize: '13px', fontWeight: 500, color: 'text.primary', flex: 1 }}>{item.name}</Box>
            <Box sx={{ width: '120px', height: '3px', bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
              <Box sx={{ height: '100%', width: `${(item.cost / 50) * 100}%`, bgcolor: over ? 'warning.main' : 'var(--accent)', borderRadius: '2px' }} />
            </Box>
            <Box sx={{ fontFamily: mono, fontSize: '12px', fontWeight: 700, color: over ? 'warning.main' : 'text.secondary', minWidth: '46px', textAlign: 'right', flexShrink: 0 }}>
              {item.cost}%
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ----------------------------------------------------------------------

function OneDatabaseVisual() {
  const rows = [
    { module: 'POS terminal', icon: '⊞', value: '4,284,000 UZS' },
    { module: 'Kitchen display', icon: '⊡', value: '47 orders live' },
    { module: 'Accounting', icon: '⊟', value: '4,284,000 UZS' },
    { module: 'Reports', icon: '≡', value: '4,284,000 UZS' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {rows.map((row, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '10px',
            p: '11px 16px',
            border: '1px solid', borderColor: 'divider',
            borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.025)',
            flex: 1,
          }}>
            <Box sx={{ fontFamily: mono, fontSize: '15px', color: 'text.disabled', lineHeight: 1 }}>{row.icon}</Box>
            <Box sx={{ fontSize: '13px', fontWeight: 500, color: 'text.secondary' }}>{row.module}</Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <Box sx={{ width: '28px', height: '1px', bgcolor: 'divider' }} />
            <Box sx={{ width: 5, height: 5, transform: 'rotate(45deg)', bgcolor: 'var(--accent)', opacity: 0.5, flexShrink: 0 }} />
          </Box>

          <Box sx={{
            p: '11px 16px',
            border: '1px solid', borderColor: 'rgba(var(--accent), 0.35)',
            borderRadius: '8px',
            bgcolor: 'rgba(var(--accent), 0.07)',
            fontFamily: mono, fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
            minWidth: '150px', flexShrink: 0,
          }}>
            {row.value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ----------------------------------------------------------------------

function BilingualVisual() {
  const [active, setActive] = useState<'EN' | 'RU' | 'UZ'>('UZ');

  const content = {
    EN: [
      { name: 'Beef Soup', desc: 'Slow-cooked broth with tender beef and seasonal vegetables.' },
      { name: 'Grilled Chicken', desc: 'Marinated overnight and served with fresh garden herbs.' },
      { name: 'Green Salad', desc: 'Seasonal greens tossed with house-made vinaigrette.' },
    ],
    RU: [
      { name: 'Говяжий суп', desc: 'Наваристый бульон с нежной говядиной и сезонными овощами.' },
      { name: 'Курица гриль', desc: 'Маринуется ночь, подаётся со свежей садовой зеленью.' },
      { name: 'Зелёный салат', desc: 'Сезонная зелень с фирменным соусом-винегрет.' },
    ],
    UZ: [
      { name: "Go'sht sho'rva", desc: "Mol go'shti va mavsumiy sabzavotli qaynatilgan sho'rva." },
      { name: 'Tovuq grill', desc: "Kechasi marinlangan, yangi bog' ko'katlari bilan beriladi." },
      { name: 'Yashil salat', desc: "Mavsumiy ko'katlar uy vinegreti bilan aralashtirilgan." },
    ],
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
        {(['EN', 'RU', 'UZ'] as const).map((lang) => (
          <Box
            key={lang}
            onClick={() => setActive(lang)}
            sx={{
              px: '22px', py: '13px',
              fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
              cursor: 'pointer',
              color: active === lang ? 'var(--accent)' : 'text.disabled',
              borderBottom: '2px solid',
              borderColor: active === lang ? 'var(--accent)' : 'transparent',
              transition: 'color 0.15s, border-color 0.15s',
              userSelect: 'none',
            }}
          >
            {lang}
          </Box>
        ))}
      </Box>

      <Box sx={{ p: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {content[active].map((item, i) => (
          <Box key={i}>
            <Box sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary', mb: '3px' }}>{item.name}</Box>
            <Box sx={{ fontSize: '12.5px', color: 'text.secondary', lineHeight: 1.5 }}>{item.desc}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

const slides = [
  {
    title: <>Close the books in <span style={{ color: 'var(--accent)' }}>12 minutes</span> flat.</>,
    copy: 'Bills, cash, card and platform receipts reconcile automatically. End your shift, not your evening.',
    Visual: ShiftClosingVisual,
  },
  {
    title: <>Live cost on <span style={{ color: 'var(--accent)' }}>every dish.</span></>,
    copy: "Watch your food cost the moment ingredients move. Catch a 2% slip before it becomes a 20% problem.",
    Visual: FoodCostVisual,
  },
  {
    title: <>POS, kitchen, office. <span style={{ color: 'var(--accent)' }}>One database.</span></>,
    copy: 'No exports. No "let me check with accounting." The same number on every screen, all the time.',
    Visual: OneDatabaseVisual,
  },
  {
    title: <>Bilingual on <span style={{ color: 'var(--accent)' }}>day one.</span></>,
    copy: "Switch between EN, RU and UZ on the fly. Your staff never sees a word they don't read.",
    Visual: BilingualVisual,
  },
];

// ----------------------------------------------------------------------

export function AuthSlideCarousel() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIdx((prev) => (prev + 1) % slides.length);
    }, SLIDE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        p: '64px 72px 56px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"),
          radial-gradient(ellipse at 50% 85%, rgba(var(--accent), 0.1), transparent 55%)
        `,
        backgroundSize: '200px 200px, auto',
      }}
    >
      <Box sx={{ position: 'relative', flex: 1 }}>
        {slides.map((slide, k) => {
          const { Visual } = slide;
          return (
            <Box
              key={k}
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '40px',
                opacity: k === idx ? 1 : 0,
                transform: k === idx ? 'translateY(0)' : 'translateY(14px)',
                transition: 'opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)',
                pointerEvents: k === idx ? 'auto' : 'none',
              }}
            >
              {/* Text */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Box component="h2" sx={{
                  fontSize: 'clamp(30px, 3.2vw, 42px)',
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.05,
                  m: 0,
                  color: 'text.primary',
                }}>
                  {slide.title}
                </Box>
                <Box component="p" sx={{
                  fontSize: '15px', lineHeight: 1.6,
                  color: 'text.secondary', m: 0,
                  maxWidth: '500px',
                }}>
                  {slide.copy}
                </Box>
              </Box>

              {/* Visual */}
              <Visual />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
