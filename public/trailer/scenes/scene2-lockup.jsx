// Scene 2 — Product lockup
// Duration: ~3s. Brand mark + name + tagline emerge from the collapse.

function Scene2Lockup({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;
  return (
    <Scene start={sceneStart} end={sceneEnd} background="#edf4ed">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.4} outDur={0.5}>
          {/* Soft grid bg */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, #c3d9c4 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.45,
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
          }}/>

          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lockup localTime={localTime} duration={duration}/>
          </div>
        </FadeFrame>
      )}
    </Scene>
  );
}

function Lockup({ localTime, duration }) {
  const markT  = Easing.easeOutBack(clamp(localTime / 0.55, 0, 1));
  const wordIn = Easing.easeOutCubic(clamp((localTime - 0.35) / 0.55, 0, 1));
  const tagIn  = Easing.easeOutCubic(clamp((localTime - 0.95) / 0.55, 0, 1));

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Brand mark: zooms from 0 → 1 */}
      <div style={{
        display: 'inline-block',
        transform: `scale(${0.3 + 0.7 * markT})`,
        opacity: clamp(localTime / 0.35, 0, 1),
        marginBottom: 36,
      }}>
        <BrandMark size={104}/>
      </div>

      <div style={{
        transform: `translateY(${(1 - wordIn) * 16}px)`,
        opacity: wordIn,
        marginBottom: 20,
      }}>
        <div className="serif" style={{
          fontSize: 128,
          lineHeight: 1,
          color: '#1a3018',
          letterSpacing: '0.5px',
        }}>
          Job Pipeline
        </div>
      </div>

      <div style={{
        transform: `translateY(${(1 - tagIn) * 10}px)`,
        opacity: tagIn,
      }}>
        <div style={{
          fontSize: 28,
          color: '#3d6b3e',
          fontWeight: 400,
          lineHeight: 1.35,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          An agent that rates jobs, tailors your resume,<br/>
          and drafts the outreach — while you sleep.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Scene2Lockup });
