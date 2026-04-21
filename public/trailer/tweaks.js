// Tweaks panel for Launch Trailer — lets user flip scene backgrounds
// and boost text contrast without touching the scenes themselves.

(function () {
  'use strict';

  // Persisted defaults — host rewrites this block when user changes values.
  const DEFAULTS = /*EDITMODE-BEGIN*/{
    "bgMode": "default",
    "textBoost": 0
  }/*EDITMODE-END*/;

  // Current state (starts from saved defaults)
  const state = Object.assign({}, DEFAULTS);
  window.__tweaks = state;

  // ── CSS contrast overlay ──────────────────────────────────────────────
  // For each bgMode we inject overrides that retarget scene-level text
  // colors via attribute selectors + !important. Scene cards/panels keep
  // their own styling (they have their own bg), so only the *scene-level*
  // text on the scene bg needs retargeting.
  const overlay = document.createElement('style');
  overlay.id = '__tweaks_overlay';
  document.head.appendChild(overlay);

  function renderOverlay() {
    const { bgMode, textBoost } = state;
    let css = '';

    // textBoost: 0..3 — darken stone text globally (dark bg modes invert)
    // We can't easily retarget every inline-styled color, so instead we
    // apply a filter to the stage that boosts contrast on dark text.
    if (textBoost > 0 && (bgMode === 'default' || bgMode === 'cream')) {
      const amt = 1 + textBoost * 0.08;
      css += `#root [data-stage] { filter: contrast(${amt}); }\n`;
    }

    // For ink / brand modes we need an extra visual cue since scene cards
    // are still light — add a soft vignette so text on the scene bg reads
    // even when scenes use white cards.
    if (bgMode === 'ink' || bgMode === 'brand') {
      css += `
        #root [data-stage]::after {
          content: ''; position: absolute; inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center,
            transparent 55%, rgba(0,0,0,0.35) 100%);
          z-index: 50;
        }
      `;
    }

    overlay.textContent = css;
  }

  function apply() {
    renderOverlay();
    // Nudge React scenes to re-read __tweaks.bgMode
    window.dispatchEvent(new Event('__tweaks_changed'));
  }

  // ── Panel UI ──────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = '__tweaks_panel';
  panel.style.cssText = `
    position: fixed; right: 20px; bottom: 20px;
    width: 280px;
    background: #fafaf9;
    border: 1px solid #d6d3d1;
    border-radius: 14px;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.12);
    padding: 16px 18px 18px;
    font-family: 'Geist', system-ui, sans-serif;
    font-size: 13px;
    color: #1c1917;
    z-index: 1000;
    display: none;
  `;
  panel.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px;">
      <div style="font-weight: 600; font-size: 13px; letter-spacing: 0.2px;">Tweaks</div>
      <div style="font-family: 'Geist Mono', monospace; font-size: 10px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1.2px;">contrast</div>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; color: #57534e; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Background</div>
      <div id="__tw_bg" style="display:grid; grid-template-columns: 1fr 1fr; gap: 6px;"></div>
    </div>

    <div>
      <div style="font-size: 11px; color: #57534e; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; display:flex; justify-content:space-between;">
        <span>Text contrast boost</span>
        <span id="__tw_boost_val" style="font-family: 'Geist Mono', monospace; color: #78716c;">0</span>
      </div>
      <input id="__tw_boost" type="range" min="0" max="3" step="1" value="${state.textBoost}"
        style="width: 100%; accent-color: #2b4c2c;"/>
      <div style="font-size: 10px; color: #a8a29e; margin-top: 4px; display:flex; justify-content:space-between;">
        <span>subtle</span><span>strong</span>
      </div>
    </div>

    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e7e5e4; font-size: 11px; color: #78716c; line-height: 1.4;">
      Tip: "Ink" & "Brand" add a soft vignette so light cards stay legible on dark backgrounds.
    </div>
  `;
  document.body.appendChild(panel);

  // Background swatches
  const BG_OPTIONS = [
    { key: 'default', label: 'Original',   swatch: 'linear-gradient(135deg,#fafaf9 50%,#edf4ed 50%)' },
    { key: 'cream',   label: 'Cream',      swatch: '#f5efe4' },
    { key: 'ink',     label: 'Ink',        swatch: '#0d0f0d' },
    { key: 'brand',   label: 'Brand',      swatch: '#1a3018' },
  ];
  const bgWrap = panel.querySelector('#__tw_bg');
  const bgBtns = {};
  BG_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.key = opt.key;
    btn.style.cssText = `
      display:flex; align-items:center; gap: 8px;
      padding: 7px 9px;
      border-radius: 9px;
      border: 1.5px solid #e7e5e4;
      background: #fff;
      cursor: pointer;
      font-family: inherit; font-size: 12px; color: #1c1917;
      text-align: left;
      transition: border-color 140ms, background 140ms;
    `;
    btn.innerHTML = `
      <span style="width:16px; height:16px; border-radius: 5px; background: ${opt.swatch}; border: 1px solid rgba(0,0,0,0.12); flex-shrink: 0;"></span>
      <span>${opt.label}</span>
    `;
    btn.addEventListener('click', () => {
      state.bgMode = opt.key;
      persist({ bgMode: opt.key });
      syncUI();
      apply();
    });
    bgWrap.appendChild(btn);
    bgBtns[opt.key] = btn;
  });

  // Boost slider
  const boost = panel.querySelector('#__tw_boost');
  const boostVal = panel.querySelector('#__tw_boost_val');
  boost.addEventListener('input', () => {
    state.textBoost = parseInt(boost.value, 10);
    boostVal.textContent = state.textBoost;
    persist({ textBoost: state.textBoost });
    apply();
  });

  function syncUI() {
    Object.keys(bgBtns).forEach(k => {
      const active = k === state.bgMode;
      bgBtns[k].style.borderColor = active ? '#2b4c2c' : '#e7e5e4';
      bgBtns[k].style.background  = active ? '#edf4ed' : '#fff';
      bgBtns[k].style.fontWeight  = active ? 600 : 400;
    });
    boost.value = state.textBoost;
    boostVal.textContent = state.textBoost;
  }

  function persist(edits) {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    } catch (_) {}
  }

  // ── Host handshake ────────────────────────────────────────────────────
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === '__activate_edit_mode')   panel.style.display = 'block';
    if (e.data.type === '__deactivate_edit_mode') panel.style.display = 'none';
  });

  // Announce availability AFTER listener is wired
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (_) {}

  // Initial paint
  syncUI();
  apply();
})();
