// Shared primitives for scenes: timing helpers, brand constants, small UI pieces.

const BRAND = {
  primary: '#2b4c2c',
  primary600: '#224022',
  primary400: '#3d6b3e',
  primary100: '#d5e8d6',
  primary50:  '#edf4ed',
};

const STONE = {
  50:  '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
};

// Maps scene-local progress (0..1) given a sprite start/end within the Stage.
function useLocalProgress(start, end) {
  const time = useTime();
  return clamp((time - start) / (end - start), 0, 1);
}

// Scene wrapper: renders children inside a <Sprite>. Children may be a fn.
// Respects window.__tweaks.bgMode to let Tweaks panel override scene bg
// for higher contrast ("cream", "ink", "brand", or "default").
function Scene({ start, end, background = '#fafaf9', children }) {
  // Force re-render on tweak change by reading from a ticker
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const h = () => force(x => x + 1);
    window.addEventListener('__tweaks_changed', h);
    return () => window.removeEventListener('__tweaks_changed', h);
  }, []);
  const mode = (window.__tweaks && window.__tweaks.bgMode) || 'default';
  const bgOverride = {
    default: background,
    cream:   '#f5efe4',   // warm cream — very high contrast w/ dark text
    ink:     '#0d0f0d',   // near-black
    brand:   '#1a3018',   // deep brand green
  }[mode];
  return (
    <Sprite start={start} end={end}>
      {({ localTime, progress, duration }) => (
        <div style={{
          position: 'absolute', inset: 0,
          background: bgOverride,
          overflow: 'hidden',
        }}>
          {typeof children === 'function'
            ? children({ localTime, progress, duration })
            : children}
        </div>
      )}
    </Sprite>
  );
}

// Cross-fade wrapper: fades between scenes. Place inside <Scene>.
function FadeFrame({ localTime, duration, inDur = 0.35, outDur = 0.45, children, style = {} }) {
  let opacity = 1;
  if (localTime < inDur) {
    opacity = Easing.easeOutCubic(localTime / inDur);
  } else if (localTime > duration - outDur) {
    opacity = 1 - Easing.easeInCubic((localTime - (duration - outDur)) / outDur);
  }
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity,
      ...style,
    }}>
      {children}
    </div>
  );
}

// Reveal: show a child at [showAt..hideAt] with optional slide+fade
function Reveal({ showAt = 0, hideAt = Infinity, from = { y: 12, opacity: 0 }, dur = 0.45, children, style = {} }) {
  const { localTime } = useSprite();
  const t = clamp((localTime - showAt) / dur, 0, 1);
  const eased = Easing.easeOutCubic(t);
  const outT = hideAt !== Infinity ? clamp((localTime - hideAt) / 0.3, 0, 1) : 0;
  const opacity = (from.opacity + (1 - from.opacity) * eased) * (1 - outT);
  const y = from.y * (1 - eased) - outT * 6;
  return (
    <div style={{
      transform: `translateY(${y}px)`,
      opacity,
      willChange: 'transform, opacity',
      ...style,
    }}>{children}</div>
  );
}

// Typing text effect — reveals `text` char-by-char over [start..end]
function TypeOn({ text, start = 0, end = 1, caret = true, style = {} }) {
  const { localTime } = useSprite();
  const t = clamp((localTime - start) / (end - start), 0, 1);
  const n = Math.floor(t * text.length);
  const shown = text.slice(0, n);
  const blink = Math.floor(localTime * 2) % 2 === 0;
  return (
    <span style={style}>
      {shown}
      {caret && t < 1 && <span style={{ opacity: blink ? 1 : 0.2, marginLeft: 1 }}>▌</span>}
    </span>
  );
}

// Small pill badge
function Pill({ children, bg, border, color, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'Geist, system-ui, sans-serif',
      ...style,
    }}>{children}</span>
  );
}

function TierBadge({ tier, size = 'sm' }) {
  const cfg = {
    1: { dot: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', label: 'Tier 1' },
    2: { dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'Tier 2' },
    3: { dot: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: 'Tier 3' },
  }[tier];
  const p = size === 'lg'
    ? { fs: 13, pad: '5px 11px', dot: 8 }
    : { fs: 11, pad: '3px 9px', dot: 7 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: p.pad,
      borderRadius: 8,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      color: cfg.text,
      fontSize: p.fs,
      fontWeight: 600,
    }}>
      <span style={{
        width: p.dot, height: p.dot, borderRadius: '50%',
        background: cfg.dot, display: 'inline-block',
      }}/>
      {cfg.label}
    </span>
  );
}

// Logo mark — modern "flow" glyph: a stroked arc tracing a pipeline path,
// punctuated by a solid dot (the "output" node). Sits on a soft gradient
// tile for presence without feeling like a 2015 app-icon.
function BrandMark({ size = 48 }) {
  const id = React.useId ? React.useId() : 'bm-' + Math.random().toString(36).slice(2, 8);
  const gradId = `${id}-g`;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.26,
      background: `linear-gradient(145deg, ${BRAND.primary400} 0%, ${BRAND.primary} 55%, ${BRAND.primary600} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `
        0 1px 0 rgba(255,255,255,0.12) inset,
        0 -1px 0 rgba(0,0,0,0.25) inset,
        0 8px 20px -6px rgba(26, 48, 24, 0.45),
        0 2px 6px -2px rgba(0,0,0,0.25)
      `,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle sheen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(237,244,237,0.18), transparent 55%)',
        pointerEvents: 'none',
      }}/>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none"
           style={{ position: 'relative' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%"  stopColor="#edf4ed"/>
            <stop offset="100%" stopColor="#d5e8d6"/>
          </linearGradient>
        </defs>
        {/* Pipeline path: in → branch → out, single unbroken stroke */}
        <path
          d="M4 10 L11 10 A5 5 0 0 1 16 15 L16 21 A5 5 0 0 0 21 26 L28 26"
          stroke={`url(#${gradId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Input node (hollow) */}
        <circle cx="4"  cy="10" r="2.2" fill={BRAND.primary} stroke={`url(#${gradId})`} strokeWidth="2"/>
        {/* Output node (solid) */}
        <circle cx="28" cy="26" r="2.8" fill={`url(#${gradId})`}/>
      </svg>
    </div>
  );
}

function ScoreBar({ value = 3, max = 3, width = 100, color = '#22c55e' }) {
  const pct = (value / max) * 100;
  return (
    <div style={{
      width,
      height: 6,
      borderRadius: 999,
      background: STONE[100],
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: color,
        borderRadius: 999,
        transition: 'width 200ms ease',
      }}/>
    </div>
  );
}

Object.assign(window, {
  BRAND, STONE,
  useLocalProgress, Scene, FadeFrame, Reveal, TypeOn,
  Pill, TierBadge, BrandMark, ScoreBar,
});
