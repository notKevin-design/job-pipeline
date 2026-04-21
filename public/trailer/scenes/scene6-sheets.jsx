// Scene 6 — Google Sheets row lighting up
// Duration: ~6s. A sheet table populates end-to-end across 6 columns for 3 jobs.

function Scene6Sheets({ sceneStart, sceneEnd }) {
  const duration = sceneEnd - sceneStart;
  return (
    <Scene start={sceneStart} end={sceneEnd} background="#fafaf9">
      {({ localTime }) => (
        <FadeFrame localTime={localTime} duration={duration} inDur={0.35} outDur={0.5}>
          <SceneLabel number="04" label="Tracked end-to-end" localTime={localTime}/>

          <div style={{
            position: 'absolute', inset: 0,
            padding: '120px 70px 80px',
            display: 'flex', flexDirection: 'column', gap: 24,
          }}>
            <SheetTitle localTime={localTime}/>
            <SheetTable localTime={localTime}/>
            <SheetStats localTime={localTime}/>
          </div>
        </FadeFrame>
      )}
    </Scene>
  );
}

function SheetTitle({ localTime }) {
  const t = clamp((localTime - 0.2) / 0.4, 0, 1);
  return (
    <div style={{ opacity: t, transform: `translateY(${(1 - t) * 8}px)`, display: 'flex', alignItems: 'center', gap: 14 }}>
      <img src="assets/icons/google-sheets-logo.svg" alt="" style={{ width: 26, height: 26 }}/>
      <div className="serif" style={{ fontSize: 42, color: STONE[900], lineHeight: 1 }}>
        Job Tracker
      </div>
      <span className="mono" style={{ fontSize: 12, color: STONE[400], marginLeft: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
        Q2 2026 — Shared with you
      </span>
    </div>
  );
}

function SheetTable({ localTime }) {
  const cols = [
    { k: 'company',  label: 'Company',    w: '11%' },
    { k: 'role',     label: 'Role',       w: '17%' },
    { k: 'comp',     label: 'Comp',       w: '11%' },
    { k: 'tier',     label: 'Tier',       w: '9%' },
    { k: 'resume',   label: 'Resume',     w: '14%' },
    { k: 'inmail',   label: 'InMail',     w: '19%' },
    { k: 'note',     label: 'Connect Note', w: '19%' },
  ];

  const rows = [
    {
      rowStart: 1.0,
      data: {
        company: 'Anthropic',
        role: 'PD, Agents',
        comp: '$260k–$340k',
        tier: 1,
        resume: { name: 'Resume — Anthropic.docx', icon: 'doc' },
        inmail: "Hi Maya — been shipping LLM-facing flows and your PD, Agents opening lines up with how I work…",
        note:   "Just saw the PD role — would love to connect. Big fan of Claude Code's design bar.",
      },
    },
    {
      rowStart: 1.8,
      data: {
        company: 'Ramp',
        role: 'Lead Product Designer',
        comp: '$240k–$310k',
        tier: 1,
        resume: { name: 'Resume — Ramp.docx', icon: 'doc' },
        inmail: "Hey Eric — noticed Ramp is hiring a Lead PD. I've led 0→1 fintech tooling at a similar stage…",
        note:   "Ramp's finance tooling is the best-in-class I've seen. Would love to connect.",
      },
    },
    {
      rowStart: 2.6,
      data: {
        company: 'Figma',
        role: 'Staff PD',
        comp: '$300k–$400k',
        tier: 2,
        resume: { name: 'Resume — Figma.docx', icon: 'doc' },
        inmail: "Hi Noah — Figma's next chapter is where design tools become agentic, and I've spent two years…",
        note:   "Figma's AI track has been the most thoughtful take I've seen. Let's connect.",
      },
    },
  ];

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${STONE[200]}`,
      boxShadow: 'var(--shadow-subtle)',
      fontSize: 13,
      opacity: clamp((localTime - 0.5) / 0.4, 0, 1),
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: cols.map(c => c.w).join(' '),
        background: STONE[50],
        borderBottom: `1px solid ${STONE[200]}`,
      }}>
        {cols.map((c, i) => (
          <div key={i} className="mono" style={{
            padding: '10px 14px',
            fontSize: 10,
            fontWeight: 600,
            color: STONE[500],
            textTransform: 'uppercase',
            letterSpacing: 1,
            borderRight: i < cols.length - 1 ? `1px solid ${STONE[100]}` : 'none',
          }}>
            {c.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, ri) => (
        <SheetRow key={ri} row={row} cols={cols} localTime={localTime}/>
      ))}
    </div>
  );
}

function SheetRow({ row, cols, localTime }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: cols.map(c => c.w).join(' '),
      borderBottom: `1px solid ${STONE[100]}`,
      minHeight: 56,
      alignItems: 'center',
    }}>
      {cols.map((c, ci) => {
        // Stagger each cell within the row
        const cellStart = row.rowStart + ci * 0.12;
        const t = clamp((localTime - cellStart) / 0.35, 0, 1);
        const eased = Easing.easeOutCubic(t);

        // Flash highlight as it fills
        const flashT = clamp((localTime - cellStart) / 0.7, 0, 1);
        const flash = 1 - Easing.easeOutCubic(flashT);

        return (
          <div key={ci} style={{
            padding: '12px 14px',
            borderRight: ci < cols.length - 1 ? `1px solid ${STONE[100]}` : 'none',
            position: 'relative',
            background: `rgba(213, 232, 214, ${flash * 0.45})`,
            transition: 'background 300ms',
            overflow: 'hidden',
            height: '100%',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              opacity: eased,
              transform: `translateY(${(1 - eased) * 4}px)`,
              width: '100%',
              minWidth: 0,
            }}>
              <CellContent col={c.k} value={row.data[c.k]}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CellContent({ col, value }) {
  if (col === 'tier') {
    return <TierBadge tier={value}/>;
  }
  if (col === 'company') {
    return <span style={{ fontWeight: 600, color: STONE[900], fontSize: 13 }}>{value}</span>;
  }
  if (col === 'role') {
    return <span style={{ color: STONE[700], fontSize: 13 }}>{value}</span>;
  }
  if (col === 'comp') {
    return <span className="mono" style={{ fontSize: 12, color: STONE[600] }}>{value}</span>;
  }
  if (col === 'resume') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: BRAND.primary, fontSize: 12, fontWeight: 500 }}>
        <img src="assets/icons/google-docs-logo.svg" alt="" style={{ width: 14, height: 14 }}/>
        <span style={{
          textDecoration: 'underline',
          textDecorationColor: 'rgba(43, 76, 44, 0.3)',
          textUnderlineOffset: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          minWidth: 0,
        }}>{value.name}</span>
      </span>
    );
  }
  if (col === 'inmail' || col === 'note') {
    return (
      <span style={{
        fontSize: 12, color: STONE[600], lineHeight: 1.45,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {value}
      </span>
    );
  }
  return <span>{value}</span>;
}

function SheetStats({ localTime }) {
  const stats = [
    { label: 'Jobs scored',    v: '6',   start: 3.6 },
    { label: 'Tier 1s found',  v: '2',   start: 3.8 },
    { label: 'Resumes tailored', v: '6', start: 4.0 },
    { label: 'Outreach drafted', v: '12', start: 4.2 },
    { label: 'Pipeline time',  v: '4:38', start: 4.4, mono: true },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 16,
      marginTop: 8,
    }}>
      {stats.map((s, i) => {
        const t = clamp((localTime - s.start) / 0.4, 0, 1);
        const eased = Easing.easeOutBack(t);
        return (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 12,
            border: `1px solid ${STONE[200]}`,
            padding: '14px 16px',
            opacity: clamp(t, 0, 1),
            transform: `translateY(${(1 - eased) * 10}px)`,
          }}>
            <div className="mono" style={{ fontSize: 10, color: STONE[400], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
              {s.label}
            </div>
            <div className={s.mono ? 'mono' : 'serif'} style={{
              fontSize: s.mono ? 26 : 32,
              color: STONE[900],
              lineHeight: 1,
            }}>
              {s.v}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Scene6Sheets });
