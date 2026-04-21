// Main trailer — composes all scenes into a 1920×1080 Stage.
// Total ~38s, silent kinetic demo.

const SCENES = [
  { start:  0.0, end:  4.0, Component: Scene1ColdOpen  },
  { start:  4.0, end:  7.5, Component: Scene2Lockup    },
  { start:  7.5, end: 15.5, Component: Scene3Rate      },
  { start: 15.5, end: 22.5, Component: Scene4Resume    },
  { start: 22.5, end: 28.5, Component: Scene5Outreach  },
  { start: 28.5, end: 34.5, Component: Scene6Sheets    },
  { start: 34.5, end: 38.5, Component: Scene7EndCard   },
];

const TOTAL = 38.5;

function Trailer() {
  return (
    <Stage
      width={1920}
      height={1080}
      duration={TOTAL}
      background="#fafaf9"
      loop={true}
      autoplay={true}
      persistKey="jp-trailer"
    >
      <Clock/>
      {SCENES.map((s, i) => (
        <s.Component key={i} sceneStart={s.start} sceneEnd={s.end}/>
      ))}
      <ProgressChapters/>
    </Stage>
  );
}

// Small chapter markers at bottom-left, showing current scene
function ProgressChapters() {
  const time = useTime();
  const current = SCENES.findIndex(s => time >= s.start && time < s.end);
  const labels = ['', '', 'Rate', 'Customize', 'Outreach', 'Track', ''];
  return (
    <div style={{
      position: 'absolute',
      left: 40, bottom: 32,
      display: 'flex', gap: 8,
      fontFamily: 'Geist Mono, monospace',
      fontSize: 11,
      color: 'rgba(28,25,23,0.35)',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      pointerEvents: 'none',
      zIndex: 100,
      mixBlendMode: 'difference',
    }}>
      {current >= 2 && current <= 5 && (
        <span style={{ color: 'rgba(237, 244, 237, 0.55)' }}>
          0{current - 1} · {labels[current]}
        </span>
      )}
    </div>
  );
}

function Clock() {
  return null;
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Trailer/>);
