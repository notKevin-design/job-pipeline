// Scene 5 — Draft LinkedIn outreach
// Duration: ~6s. InMail and Connection Note type themselves in side-by-side cards.

function Scene5Outreach({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;
  return (
    <Scene start={sceneStart} end={sceneEnd} background="#fafaf9">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.35} outDur={0.5}>
          <SceneLabel number="03" label="Draft Outreach" localTime={localTime}/>

          <div style={{
            position: 'absolute', inset: 0,
            padding: '120px 80px 80px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
          }}>
            <InMailCard localTime={localTime}/>
            <ConnectCard localTime={localTime}/>
          </div>
        </FadeFrame>
      )}
    </Scene>
  );
}

function InMailCard({ localTime }) {
  const subject = "Designer→Anthropic: your agent-first PD role";
  const body = "Hi Maya — I\u2019ve been shipping LLM-facing flows for 2 years (evals-driven research, streaming chain-of-thought UIs) and your PD, Agents opening lines up with how I already work. I\u2019d love 15 min to compare notes on what \u201Cship what you design\u201D means for your team. My portfolio: not-kevin.design";

  return (
    <OutreachFrame
      kind="inmail"
      label="LINKEDIN INMAIL · Tier 1"
      title="Anthropic — PD, Agents"
      recipient="Maya Chen · Design Manager"
      localTime={localTime}
      startAt={0.5}
    >
      <div style={{ marginBottom: 12 }}>
        <div className="mono" style={{ fontSize: 10, color: '#0a66c2', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
          InMail subject
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: STONE[900], lineHeight: 1.3 }}>
          <TypeOnText text={subject} start={0.7} end={2.0} localTime={localTime}/>
        </div>
      </div>
      <div style={{ height: 1, background: STONE[100], margin: '16px 0' }}/>
      <div style={{ fontSize: 15, lineHeight: 1.6, color: STONE[700] }}>
        <TypeOnText text={body} start={2.0} end={4.8} localTime={localTime}/>
      </div>
    </OutreachFrame>
  );
}

function ConnectCard({ localTime }) {
  const body = "Hi Maya! Just saw the PD, Agents role at Anthropic \u2014 I\u2019ve been building agent-facing UX and would love to connect. Big fan of Claude Code\u2019s design bar.";

  return (
    <OutreachFrame
      kind="connect"
      label="CONNECT · 280 chars"
      title="LinkedIn — Connection Note"
      recipient="Maya Chen · Design Manager"
      localTime={localTime}
      startAt={0.9}
    >
      <div style={{ fontSize: 15, lineHeight: 1.65, color: STONE[700] }}>
        <TypeOnText text={body} start={1.2} end={4.2} localTime={localTime}/>
      </div>
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CharCounter localTime={localTime} start={1.2} end={4.2} body={body}/>
        <Pill bg={BRAND.primary50} border={BRAND.primary100} color={BRAND.primary600}
              style={{ opacity: clamp((localTime - 4.4) / 0.4, 0, 1) }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
          Written to Sheet · col S
        </Pill>
      </div>
    </OutreachFrame>
  );
}

function OutreachFrame({ kind, label, title, recipient, children, localTime, startAt }) {
  const t = clamp((localTime - startAt) / 0.5, 0, 1);
  const eased = Easing.easeOutCubic(t);
  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      padding: '22px 26px 24px',
      border: `1px solid ${STONE[200]}`,
      boxShadow: 'var(--shadow-subtle)',
      opacity: eased,
      transform: `translateY(${(1 - eased) * 12}px)`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, paddingBottom: 14,
        borderBottom: `1px dashed ${STONE[200]}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: kind === 'inmail' ? '#eef4ff' : BRAND.primary50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {kind === 'inmail' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a66c2">
                <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5V9h3v10zM6.5 7.7A1.7 1.7 0 1 1 8.2 6a1.7 1.7 0 0 1-1.7 1.7zM19 19h-3v-5.3c0-1.3-.5-2-1.6-2-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.3c.4-.6 1.1-1.5 2.8-1.5 2 0 3.5 1.3 3.5 4.1V19z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 11V7a5 5 0 0 0-10 0v4M5 11h14v10H5z" stroke={BRAND.primary} strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: STONE[900] }}>{title}</div>
            <div className="mono" style={{ fontSize: 11, color: STONE[500], marginTop: 1 }}>{recipient}</div>
          </div>
        </div>
        <div className="mono" style={{
          fontSize: 10, fontWeight: 600,
          color: STONE[500], letterSpacing: 1.2,
        }}>
          {label}
        </div>
      </div>

      {children}
    </div>
  );
}

function TypeOnText({ text, start, end, localTime }) {
  const t = clamp((localTime - start) / (end - start), 0, 1);
  const n = Math.floor(t * text.length);
  const shown = text.slice(0, n);
  const blink = Math.floor(localTime * 2.5) % 2 === 0;
  return (
    <span>
      {shown}
      {t > 0 && t < 1 && (
        <span style={{ opacity: blink ? 1 : 0.2, color: BRAND.primary400, fontWeight: 600 }}>▌</span>
      )}
    </span>
  );
}

function CharCounter({ localTime, start, end, body }) {
  const t = clamp((localTime - start) / (end - start), 0, 1);
  const n = Math.floor(t * body.length);
  return (
    <div className="mono" style={{
      fontSize: 11, color: STONE[400], letterSpacing: 0.5,
    }}>
      {n} / 300 chars
    </div>
  );
}

Object.assign(window, { Scene5Outreach });
