// Scene 1 — Cold open: "Death by a thousand tabs"
// Duration: ~3.5s. Messy overlapping browser tabs + stress signals, then collapse.

function Scene1ColdOpen({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;

  return (
    <Scene start={sceneStart} end={sceneEnd} background="#1c1917">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.3} outDur={0.6}>
          {/* Drifting grid of job tabs */}
          <MessyTabs localTime={localTime} />

          {/* Scrim that deepens as title appears (≥0.4s) */}
          <TitleScrim localTime={localTime}/>

          {/* Center text overlay, appears later */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}>
            <TitleType localTime={localTime} />
          </div>
        </FadeFrame>
      )}
    </Scene>
  );
}

function MessyTabs({ localTime }) {
  // Pre-seeded positions of mock browser tabs floating around
  const tabs = [
    { x: -80,  y: 60,   w: 460, h: 260, rot: -6, delay: 0.0, role: 'Senior Product Designer',   co: 'Anthropic', src: 'jobs.ashbyhq.com' },
    { x: 480,  y: 30,   w: 440, h: 240, rot: 3,  delay: 0.1, role: 'Founding Designer',         co: 'Ramp',       src: 'ramp.com/careers' },
    { x: 1040, y: 90,   w: 460, h: 260, rot: -4, delay: 0.2, role: 'Design Engineer',           co: 'Linear',     src: 'linear.app/jobs' },
    { x: 1500, y: 40,   w: 420, h: 250, rot: 5,  delay: 0.3, role: 'Lead Product Designer',     co: 'Figma',      src: 'figma.com/careers' },

    { x: -40,  y: 420,  w: 440, h: 260, rot: 4,  delay: 0.15, role: 'Sr. UX Researcher',        co: 'Stripe',     src: 'linkedin.com/jobs' },
    { x: 430,  y: 460,  w: 470, h: 240, rot: -3, delay: 0.25, role: 'Agentic UX Designer',      co: 'Cohere',     src: 'jobs.lever.co' },
    { x: 960,  y: 440,  w: 440, h: 260, rot: 2,  delay: 0.35, role: 'Product Designer, AI',     co: 'Perplexity', src: 'perplexity.ai/jobs' },
    { x: 1460, y: 480,  w: 420, h: 240, rot: -5, delay: 0.45, role: 'Design Lead',              co: 'Vercel',     src: 'vercel.com/careers' },

    { x: -20,  y: 790,  w: 430, h: 240, rot: -2, delay: 0.4,  role: 'Principal Designer',       co: 'Notion',     src: 'notion.so/careers' },
    { x: 460,  y: 830,  w: 460, h: 250, rot: 3,  delay: 0.5,  role: 'Sr. Design Engineer',      co: 'Raycast',    src: 'raycast.com/jobs' },
    { x: 990,  y: 800,  w: 440, h: 260, rot: -6, delay: 0.55, role: 'Design, Growth',           co: 'Arc',        src: 'arc.net/careers' },
    { x: 1480, y: 840,  w: 440, h: 240, rot: 4,  delay: 0.6,  role: 'UX Designer',              co: 'OpenAI',     src: 'openai.com/careers' },
  ];

  // Global collapse toward center at end of scene
  const collapse = Easing.easeInCubic(clamp((localTime - 2.3) / 1.0, 0, 1));

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {tabs.map((t, i) => {
        const entryT = clamp((localTime - t.delay) / 0.5, 0, 1);
        const eased = Easing.easeOutCubic(entryT);
        const drift = Math.sin((localTime + i) * 0.6) * 4;

        // Collapse toward center
        const cx = 960, cy = 540;
        const dx = (cx - (t.x + t.w / 2)) * collapse * 0.85;
        const dy = (cy - (t.y + t.h / 2)) * collapse * 0.85;
        const collapseScale = 1 - collapse * 0.5;
        const collapseOpacity = 1 - collapse * 0.9;

        return (
          <div key={i} style={{
            position: 'absolute',
            left: t.x, top: t.y,
            width: t.w, height: t.h,
            transform: `translate(${dx}px, ${dy + drift}px) rotate(${t.rot * (1 - collapse)}deg) scale(${(0.95 + eased * 0.05) * collapseScale})`,
            opacity: eased * collapseOpacity,
            borderRadius: 14,
            background: '#fafaf9',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
          }}>
            <TabWindow {...t} />
          </div>
        );
      })}
    </div>
  );
}

function TabWindow({ role, co, src }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Browser chrome */}
      <div style={{
        padding: '10px 12px',
        background: '#f5f5f4',
        borderBottom: '1px solid #e7e5e4',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fca5a5' }}/>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd34d' }}/>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#86efac' }}/>
        </div>
        <div style={{
          flex: 1, padding: '4px 10px',
          background: '#fff', borderRadius: 6,
          fontFamily: 'Geist Mono, monospace',
          fontSize: 10, color: '#78716c',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {src}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '20px 22px', flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#3d6b3e', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{co}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#1c1917', lineHeight: 1.15, marginBottom: 16 }}>{role}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 6, borderRadius: 3, background: '#e7e5e4', width: '88%' }}/>
          <div style={{ height: 6, borderRadius: 3, background: '#e7e5e4', width: '72%' }}/>
          <div style={{ height: 6, borderRadius: 3, background: '#e7e5e4', width: '92%' }}/>
          <div style={{ height: 6, borderRadius: 3, background: '#e7e5e4', width: '64%' }}/>
          <div style={{ height: 6, borderRadius: 3, background: '#e7e5e4', width: '78%' }}/>
        </div>
      </div>
    </div>
  );
}

function TitleScrim({ localTime }) {
  // Deep radial scrim that ramps up as title enters, fades with collapse
  const rampIn  = clamp((localTime - 0.3) / 0.5, 0, 1);
  const rampOut = clamp((localTime - 2.3) / 0.7, 0, 1);
  const strength = Easing.easeOutCubic(rampIn) * (1 - Easing.easeInCubic(rampOut));
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse 55% 45% at center, rgba(10,10,10,${0.55 + strength * 0.35}) 0%, rgba(10,10,10,${0.25 + strength * 0.4}) 45%, rgba(10,10,10,0.85) 95%)`,
      pointerEvents: 'none',
      zIndex: 5,
    }}/>
  );
}

function TitleType({ localTime }) {
  // Appears at ~0.6s, exits with collapse at ~2.3s
  const inT  = clamp((localTime - 0.5) / 0.5, 0, 1);
  const outT = clamp((localTime - 2.3) / 0.6, 0, 1);
  const opacity = Easing.easeOutCubic(inT) * (1 - Easing.easeInCubic(outT));
  const y = (1 - Easing.easeOutCubic(inT)) * 20 - outT * 10;
  return (
    <div style={{
      textAlign: 'center',
      transform: `translateY(${y}px)`,
      opacity,
    }}>
      <div className="mono" style={{
        fontSize: 15,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: 'rgba(237, 244, 237, 0.55)',
        marginBottom: 28,
      }}>
        — Job searching in 2026 —
      </div>
      <div className="serif" style={{
        fontSize: 100,
        lineHeight: 1.05,
        color: '#fafaf9',
        fontWeight: 700,
        letterSpacing: '-1px',
        maxWidth: 1300,
        textWrap: 'pretty',
      }}>
        Death by a thousand tabs.
      </div>
    </div>
  );
}

Object.assign(window, { Scene1ColdOpen });
