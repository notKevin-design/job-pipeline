// Scene 7 — End card
// Duration: ~4s. Brand lockup + CTA.

function Scene7EndCard({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;
  return (
    <Scene start={sceneStart} end={sceneEnd} background="#1a3018">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.5} outDur={0.5}>
          {/* Radial gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 40%, rgba(61, 107, 62, 0.35), transparent 65%)',
          }}/>
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(213, 232, 214, 0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>

          <EndContent localTime={localTime}/>

          {/* Corner tags */}
          <CornerTag localTime={localTime}/>
        </FadeFrame>
      )}
    </Scene>
  );
}

function EndContent({ localTime }) {
  const markT  = Easing.easeOutBack(clamp(localTime / 0.6, 0, 1));
  const titleT = Easing.easeOutCubic(clamp((localTime - 0.3) / 0.55, 0, 1));
  const tagT   = Easing.easeOutCubic(clamp((localTime - 0.75) / 0.55, 0, 1));
  const ctaT   = Easing.easeOutCubic(clamp((localTime - 1.2) / 0.55, 0, 1));
  const urlT   = Easing.easeOutCubic(clamp((localTime - 1.7) / 0.55, 0, 1));

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
    }}>
      <div style={{
        transform: `scale(${0.4 + 0.6 * markT})`,
        opacity: clamp(localTime / 0.4, 0, 1),
        marginBottom: 32,
      }}>
        <BrandMark size={88}/>
      </div>

      <div style={{
        transform: `translateY(${(1 - titleT) * 14}px)`,
        opacity: titleT,
        marginBottom: 18,
      }}>
        <div className="serif" style={{
          fontSize: 140,
          lineHeight: 1,
          color: '#edf4ed',
          letterSpacing: 1,
        }}>
          Job Pipeline
        </div>
      </div>

      <div style={{
        transform: `translateY(${(1 - tagT) * 10}px)`,
        opacity: tagT,
        marginBottom: 60,
      }}>
        <div style={{
          fontSize: 26,
          color: 'rgba(213, 232, 214, 0.75)',
          fontWeight: 400,
          lineHeight: 1.35,
          maxWidth: 900,
        }}>
          Your AI job-hunt copilot — rate, tailor, and reach out in one run.
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        opacity: ctaT,
        transform: `translateY(${(1 - ctaT) * 10}px)`,
      }}>
        <div style={{
          background: '#edf4ed',
          color: BRAND.primary,
          padding: '18px 32px',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: 0.3,
          fontFamily: 'Geist Mono, monospace',
          textTransform: 'uppercase',
          boxShadow: '0 8px 24px rgba(237, 244, 237, 0.15)',
        }}>
          Clone & run locally →
        </div>
        <span className="mono" style={{
          fontSize: 14,
          color: 'rgba(213, 232, 214, 0.55)',
          letterSpacing: 1,
        }}>
          npm install · /0-run-pipeline
        </span>
      </div>

      <div className="mono" style={{
        marginTop: 36,
        fontSize: 15,
        color: 'rgba(213, 232, 214, 0.55)',
        letterSpacing: 1,
        opacity: urlT,
        transform: `translateY(${(1 - urlT) * 6}px)`,
      }}>
        github.com/notKevin-design/job-pipeline
      </div>
    </div>
  );
}

function CornerTag({ localTime }) {
  const t = clamp((localTime - 0.6) / 0.5, 0, 1);
  return (
    <>
      <div style={{
        position: 'absolute',
        top: 48, left: 56,
        opacity: t,
        fontFamily: 'Geist Mono, monospace',
        fontSize: 12,
        color: 'rgba(213, 232, 214, 0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        v0.5 · out now
      </div>
      <div style={{
        position: 'absolute',
        top: 48, right: 56,
        opacity: t,
        fontFamily: 'Geist Mono, monospace',
        fontSize: 12,
        color: 'rgba(213, 232, 214, 0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        MIT · made for designers
      </div>
      <div style={{
        position: 'absolute',
        bottom: 48, left: 56,
        opacity: t,
        fontFamily: 'Geist Mono, monospace',
        fontSize: 12,
        color: 'rgba(213, 232, 214, 0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        runs on claude code
      </div>
      <div style={{
        position: 'absolute',
        bottom: 48, right: 56,
        opacity: t,
        fontFamily: 'Geist Mono, monospace',
        fontSize: 12,
        color: 'rgba(213, 232, 214, 0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        sheets · drive · linkedin
      </div>
    </>
  );
}

Object.assign(window, { Scene7EndCard });
