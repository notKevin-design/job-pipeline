// Scene 3 — Rate & tier jobs
// Duration: ~8s. Agent pastes URLs, cards score live with 5-dim breakdown.

function Scene3Rate({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;
  return (
    <Scene start={sceneStart} end={sceneEnd} background="#fafaf9">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.35} outDur={0.5}>
          <SceneLabel number="01" label="Rate & Tier" localTime={localTime}/>

          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid',
            gridTemplateColumns: '540px 1fr',
            gap: 40,
            padding: '120px 80px 80px',
          }}>
            {/* Left: command panel */}
            <CommandPanel localTime={localTime}/>

            {/* Right: job cards stack */}
            <JobCardsStack localTime={localTime}/>
          </div>
        </FadeFrame>
      )}
    </Scene>
  );
}

function SceneLabel({ number, label, localTime }) {
  const t = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));
  return (
    <div style={{
      position: 'absolute',
      top: 56, left: 80,
      display: 'flex', alignItems: 'center', gap: 14,
      opacity: t,
      transform: `translateX(${(1 - t) * -12}px)`,
    }}>
      <div className="mono" style={{
        fontSize: 13, fontWeight: 600,
        color: BRAND.primary400,
        letterSpacing: 2,
      }}>
        {number} /
      </div>
      <div className="mono" style={{
        fontSize: 13, fontWeight: 500,
        color: STONE[500],
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

function CommandPanel({ localTime }) {
  const lines = [
    { t: 0.4, text: '$ /0-run-pipeline', color: STONE[500] },
    { t: 1.0, text: '> Paste job URLs:', color: STONE[600] },
  ];

  const urls = [
    'https://jobs.ashbyhq.com/anthropic/pd',
    'https://ramp.com/careers/design-lead',
    'https://linear.app/jobs/de-growth',
    'https://figma.com/careers/staff-pd',
    'https://perplexity.ai/jobs/ai-pd',
    'https://cohere.com/jobs/agent-ux',
  ];

  return (
    <div style={{
      background: STONE[900],
      borderRadius: 20,
      padding: '28px 32px',
      boxShadow: '0 20px 50px -12px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
      height: 'fit-content',
      alignSelf: 'start',
    }}>
      {/* Terminal chrome */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 20 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}/>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}/>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }}/>
        <span className="mono" style={{ marginLeft: 12, fontSize: 11, color: STONE[500] }}>claude-code</span>
      </div>

      {lines.map((l, i) => {
        const v = clamp((localTime - l.t) / 0.3, 0, 1);
        return (
          <div key={i} className="mono" style={{
            fontSize: 16,
            color: l.color === STONE[500] ? '#a8a29e' : '#d6d3d1',
            marginBottom: 10,
            opacity: v,
            transform: `translateX(${(1 - v) * -6}px)`,
          }}>
            {l.text}
          </div>
        );
      })}

      {/* URL list — types on */}
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {urls.map((u, i) => {
          const start = 1.5 + i * 0.18;
          const v = clamp((localTime - start) / 0.35, 0, 1);
          return (
            <div key={i} className="mono" style={{
              fontSize: 14,
              color: v > 0 ? BRAND.primary100 : 'transparent',
              opacity: v,
              transform: `translateX(${(1 - v) * -4}px)`,
              borderLeft: `2px solid ${BRAND.primary400}`,
              paddingLeft: 10,
            }}>
              {u}
            </div>
          );
        })}
      </div>

      {/* Agent thinking */}
      {localTime > 2.8 && (
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AgentSpinner t={localTime}/>
          <span className="mono" style={{ fontSize: 13, color: '#a8a29e' }}>
            <AgentStatus localTime={localTime}/>
          </span>
        </div>
      )}
    </div>
  );
}

function AgentSpinner({ t }) {
  const rot = (t * 360) % 360;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ transform: `rotate(${rot}deg)` }}>
      <circle cx="8" cy="8" r="6" stroke="rgba(213, 232, 214, 0.2)" strokeWidth="2" fill="none"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="#d5e8d6" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function AgentStatus({ localTime }) {
  const steps = [
    { t: 2.8, text: 'Scraping 6 postings…' },
    { t: 4.0, text: 'Scoring on 5 dimensions…' },
    { t: 5.4, text: 'Assigning tiers…' },
    { t: 6.8, text: '6 jobs logged to tracker ✓' },
  ];
  let cur = steps[0].text;
  for (const s of steps) if (localTime >= s.t) cur = s.text;
  return cur;
}

function JobCardsStack({ localTime }) {
  const jobs = [
    { co: 'Anthropic',   role: 'Product Designer, Agents', tier: 1, score: 14,
      dims: [['Role Match',3],['Industry Fit',3],['Company Stage',3],['Team Signal',3],['Recency',2]],
      appearAt: 3.2 },
    { co: 'Ramp',        role: 'Lead Product Designer',    tier: 1, score: 12,
      dims: [['Role Match',3],['Industry Fit',2],['Company Stage',3],['Team Signal',2],['Recency',2]],
      appearAt: 3.5 },
    { co: 'Figma',       role: 'Staff Product Designer',   tier: 2, score: 10,
      dims: [['Role Match',2],['Industry Fit',2],['Company Stage',2],['Team Signal',2],['Recency',2]],
      appearAt: 3.8 },
    { co: 'Linear',      role: 'Design Engineer, Growth',  tier: 2, score: 9,
      dims: [['Role Match',2],['Industry Fit',2],['Company Stage',2],['Team Signal',2],['Recency',1]],
      appearAt: 4.1 },
    { co: 'Perplexity',  role: 'Product Designer, AI',     tier: 2, score: 8,
      dims: [['Role Match',2],['Industry Fit',3],['Company Stage',1],['Team Signal',1],['Recency',1]],
      appearAt: 4.4 },
    { co: 'Cohere',      role: 'Agentic UX Designer',      tier: 3, score: 6,
      dims: [['Role Match',1],['Industry Fit',2],['Company Stage',1],['Team Signal',1],['Recency',1]],
      appearAt: 4.7 },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      maxHeight: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        paddingBottom: 6,
        opacity: clamp((localTime - 3.0) / 0.4, 0, 1),
      }}>
        <div className="serif" style={{ fontSize: 36, color: STONE[900] }}>
          Results
        </div>
        <div className="mono" style={{ fontSize: 12, color: STONE[400], letterSpacing: 1, textTransform: 'uppercase' }}>
          Ranked by fit · 5-dimension score
        </div>
      </div>

      {jobs.map((j, i) => (
        <JobCard key={i} job={j} localTime={localTime}/>
      ))}
    </div>
  );
}

function JobCard({ job, localTime }) {
  const t = clamp((localTime - job.appearAt) / 0.55, 0, 1);
  const eased = Easing.easeOutCubic(t);
  const scoreT = clamp((localTime - (job.appearAt + 0.3)) / 0.6, 0, 1);

  const tierColor = {
    1: { dot: '#22c55e', barBg: '#dcfce7' },
    2: { dot: '#f59e0b', barBg: '#fef3c7' },
    3: { dot: '#ef4444', barBg: '#fee2e2' },
  }[job.tier];

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      padding: '16px 20px',
      border: `1px solid ${STONE[200]}`,
      boxShadow: t > 0 ? 'var(--shadow-subtle)' : 'none',
      opacity: eased,
      transform: `translateY(${(1 - eased) * 14}px) scale(${0.98 + eased * 0.02})`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 18,
      alignItems: 'center',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: BRAND.primary400, textTransform: 'uppercase', letterSpacing: 0.6 }}>{job.co}</span>
          <span style={{ color: STONE[300] }}>·</span>
          <TierBadge tier={job.tier}/>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: STONE[900], marginBottom: 10 }}>
          {job.role}
        </div>

        {/* 5-dim score bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
        }}>
          {job.dims.map(([label, v], di) => {
            const color = v >= 3 ? '#22c55e' : v >= 2 ? '#f59e0b' : '#ef4444';
            return (
              <div key={di}>
                <div style={{
                  height: 5, borderRadius: 99,
                  background: STONE[100],
                  overflow: 'hidden',
                  marginBottom: 5,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(v / 3) * 100 * scoreT}%`,
                    background: color,
                    borderRadius: 99,
                  }}/>
                </div>
                <div className="mono" style={{ fontSize: 9, color: STONE[400], letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: big score */}
      <div style={{ textAlign: 'right' }}>
        <div className="serif" style={{
          fontSize: 40,
          color: STONE[900],
          lineHeight: 1,
        }}>
          {Math.round(job.score * scoreT)}
        </div>
        <div className="mono" style={{ fontSize: 10, color: STONE[400], marginTop: 2, letterSpacing: 0.5 }}>
          / 15
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Scene3Rate, SceneLabel });
