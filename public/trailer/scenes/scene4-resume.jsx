// Scene 4 — Customize resume (diff view)
// Duration: ~7s. Left: original bullet. Right: tailored bullet streams in.

function Scene4Resume({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;
  return (
    <Scene start={sceneStart} end={sceneEnd} background="#fafaf9">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.35} outDur={0.5}>
          <SceneLabel number="02" label="Analyze & Customize" localTime={localTime}/>

          <div style={{
            position: 'absolute', inset: 0,
            padding: '120px 80px 80px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
          }}>
            <ResumeDoc side="before" localTime={localTime}/>
            <ResumeDoc side="after" localTime={localTime}/>
          </div>

          {/* Arrow between */}
          <Arrow localTime={localTime}/>
        </FadeFrame>
      )}
    </Scene>
  );
}

function Arrow({ localTime }) {
  const t = clamp((localTime - 1.0) / 0.4, 0, 1);
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * t})`,
      opacity: t,
      zIndex: 5,
    }}>
      <div style={{
        width: 52, height: 52,
        borderRadius: '50%',
        background: BRAND.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px -4px rgba(43, 76, 44, 0.4)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="#edf4ed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

function ResumeDoc({ side, localTime }) {
  const isAfter = side === 'after';

  const bulletsBefore = [
    { text: 'Led design for consumer analytics dashboard, owning discovery through launch.', emph: [] },
    { text: 'Partnered with engineering on component library and design system updates.', emph: [] },
    { text: 'Shipped redesign of core flows that improved retention week-over-week.', emph: [] },
    { text: 'Ran generative research and synthesis workshops with cross-functional leads.', emph: [] },
    { text: 'Mentored 3 junior designers and owned design reviews for the squad.', emph: [] },
  ];

  const bulletsAfter = [
    { text: 'Led ', add: 'agent-first', rest: ' design for an analytics copilot — spec\'d tool-calling UX and streaming chain-of-thought.' },
    { text: 'Shipped a ', add: 'prompt-to-UI component library', rest: ' with engineering — 40+ primitives, adopted across 4 teams.' },
    { text: 'Redesigned core flows around ', add: 'LLM fallibility', rest: ' — clearer error states lifted retention +18% in 6 weeks.' },
    { text: 'Ran ', add: 'evals-driven research', rest: ' with ML leads; synthesis shaped roadmap for the next two quarters.' },
    { text: 'Mentored 3 designers on ', add: 'shipping with AI primitives', rest: ' — led internal workshops and design reviews.' },
  ];

  const bullets = isAfter ? bulletsAfter : bulletsBefore;
  const startBase = isAfter ? 1.2 : 0.2;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1px solid ${isAfter ? BRAND.primary100 : STONE[200]}`,
      boxShadow: isAfter
        ? '0 20px 40px -10px rgba(43, 76, 44, 0.18), 0 4px 12px rgba(0,0,0,0.04)'
        : 'var(--shadow-subtle)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 26px',
        borderBottom: `1px solid ${STONE[100]}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isAfter ? BRAND.primary50 : STONE[50],
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="assets/icons/google-docs-logo.svg" alt="" style={{ width: 18, height: 18 }}/>
          <div>
            <div className="mono" style={{ fontSize: 10, color: STONE[400], textTransform: 'uppercase', letterSpacing: 1 }}>
              {isAfter ? 'Tailored for Anthropic' : 'Your resume'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: STONE[800], marginTop: 1 }}>
              {isAfter ? 'Resume — Anthropic · PD, Agents' : 'Resume — master.docx'}
            </div>
          </div>
        </div>
        {isAfter && (
          <Pill bg="#f0fdf4" border="#bbf7d0" color="#166534">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
            Saved to Drive
          </Pill>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '26px 30px', flex: 1 }}>
        <div style={{
          fontSize: 11, color: STONE[500], fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16,
        }}>
          Senior Product Designer — 2022–Present
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bullets.map((b, i) => {
            const appearAt = startBase + i * 0.35;
            const t = clamp((localTime - appearAt) / 0.5, 0, 1);
            const eased = Easing.easeOutCubic(t);
            return (
              <div key={i} style={{
                opacity: eased,
                transform: `translateY(${(1 - eased) * 8}px)`,
                fontSize: 15,
                lineHeight: 1.55,
                color: STONE[700],
                display: 'flex',
                gap: 10,
              }}>
                <span style={{ color: STONE[300], marginTop: 1, flexShrink: 0 }}>—</span>
                <span>
                  {isAfter ? (
                    <>
                      {b.text}
                      <AfterHighlight localTime={localTime} start={appearAt + 0.2} text={b.add}/>
                      {b.rest}
                    </>
                  ) : (
                    b.text
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AfterHighlight({ localTime, start, text }) {
  // Types in, then gets a green highlight swipe
  const typeT = clamp((localTime - start) / 0.55, 0, 1);
  const n = Math.floor(typeT * text.length);
  const shown = text.slice(0, n);

  const hlT = clamp((localTime - (start + 0.4)) / 0.4, 0, 1);

  return (
    <span style={{
      position: 'relative',
      color: BRAND.primary600,
      fontWeight: 600,
      background: `linear-gradient(90deg, ${BRAND.primary100} 0%, ${BRAND.primary100} ${hlT * 100}%, transparent ${hlT * 100}%)`,
      padding: '1px 3px',
      borderRadius: 3,
    }}>
      {shown}
      {typeT < 1 && <span style={{ opacity: (Math.floor(localTime * 3) % 2) ? 1 : 0.2 }}>▌</span>}
    </span>
  );
}

Object.assign(window, { Scene4Resume });
