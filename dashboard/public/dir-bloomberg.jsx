// DIRECTION 2: BLOOMBERG TERMINAL
// Pure black, dense data, full mono, blueprint grid, sharp edges, amber accent + bone.

const { useState: useState2 } = React;

function BloombergTerminal() {
  const bg = '#000000';
  const surface = '#0a0a0a';
  const border = '#1f1f1f';
  const borderHi = '#2a2a2a';
  const bone = '#F5E6C8';
  const amber = '#ffb13a';
  const text = '#d8d4cc';
  const dim = '#7a7468';
  const sub = '#4a463e';
  const ok = '#9bc88a';
  const err = '#e07a6e';

  const css = `
    .bb * { box-sizing: border-box; }
    .bb { font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; color: ${text};
      background: ${bg}; width: 1280px; height: 800px; display: flex; font-size: 12px;
      background-image:
        linear-gradient(${border} 1px, transparent 1px),
        linear-gradient(90deg, ${border} 1px, transparent 1px);
      background-size: 24px 24px; background-position: -1px -1px; }
    .bb-tile { background: ${bg}; }
    .bb-side { width: 48px; background: ${surface}; border-right: 1px solid ${borderHi};
      display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 4px; }
    .bb-mark { width: 28px; height: 28px; border: 1px solid ${bone}; color: ${bone};
      display: flex; align-items: center; justify-content: center; font-weight: 900;
      font-style: italic; font-size: 13px; margin-bottom: 12px; }
    .bb-nav { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      color: ${dim}; cursor: pointer; font-size: 11px; letter-spacing: 0.05em; }
    .bb-nav.active { color: ${amber}; background: rgba(255,177,58,0.08);
      border-left: 2px solid ${amber}; }
    .bb-nav:hover { color: ${text}; }

    .bb-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .bb-topbar { height: 32px; background: ${surface}; border-bottom: 1px solid ${borderHi};
      display: flex; align-items: center; padding: 0 12px; gap: 0; font-size: 10px;
      letter-spacing: 0.1em; text-transform: uppercase; }
    .bb-topbar > div { padding: 0 14px; height: 100%; display: flex; align-items: center;
      border-right: 1px solid ${border}; color: ${dim}; }
    .bb-topbar > div:first-child { color: ${amber}; font-weight: 700; padding-left: 16px; }
    .bb-topbar > .bb-spacer { flex: 1; border: 0; }
    .bb-topbar .bb-status-on { color: ${ok}; }
    .bb-topbar .bb-status-on::before { content: '●'; margin-right: 6px; }

    .bb-grid { flex: 1; display: grid; grid-template-columns: 1.6fr 1fr; grid-template-rows: auto auto 1fr;
      gap: 1px; background: ${borderHi}; padding: 1px; min-height: 0; }
    .bb-cell { background: ${bg}; padding: 12px 14px; min-height: 0; overflow: hidden;
      display: flex; flex-direction: column; }
    .bb-cell-head { display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed ${border}; }
    .bb-cell-title { font-size: 9px; color: ${amber}; letter-spacing: 0.25em;
      text-transform: uppercase; font-weight: 700; }
    .bb-cell-sub { font-size: 9px; color: ${sub}; letter-spacing: 0.15em; text-transform: uppercase; }

    .bb-vital { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1px; background: ${borderHi};
      grid-column: 1 / -1; }
    .bb-vital-cell { background: ${bg}; padding: 14px 16px; }
    .bb-vital-lab { font-size: 9px; color: ${dim}; letter-spacing: 0.25em; text-transform: uppercase; }
    .bb-vital-val { font-size: 28px; color: ${bone}; font-weight: 600; line-height: 1;
      margin-top: 8px; font-feature-settings: 'tnum'; letter-spacing: -0.02em; }
    .bb-vital-val.warn { color: ${amber}; }
    .bb-vital-meta { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; font-size: 10px; color: ${dim}; }
    .bb-vital-delta.up { color: ${ok}; } .bb-vital-delta.dn { color: ${err}; }

    .bb-row { display: flex; align-items: center; padding: 6px 0; gap: 12px; font-size: 11px;
      border-bottom: 1px dashed ${border}; }
    .bb-row:last-child { border-bottom: 0; }
    .bb-row-id { color: ${sub}; width: 56px; flex-shrink: 0; }
    .bb-row-tag { color: ${amber}; padding: 1px 6px; border: 1px solid ${amber}; font-size: 9px;
      letter-spacing: 0.15em; }
    .bb-row-title { flex: 1; color: ${text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bb-row-num { color: ${bone}; font-feature-settings: 'tnum'; }
    .bb-row-time { color: ${dim}; font-size: 10px; min-width: 48px; text-align: right; }

    .bb-svc { display: grid; grid-template-columns: 1fr auto auto; gap: 16px;
      padding: 5px 0; border-bottom: 1px dotted ${border}; align-items: center; font-size: 11px; }
    .bb-svc:last-child { border-bottom: 0; }
    .bb-svc-name { color: ${text}; }
    .bb-svc-up { color: ${ok}; font-size: 9px; letter-spacing: 0.15em; }
    .bb-svc-time { color: ${dim}; font-size: 10px; min-width: 40px; text-align: right; }

    .bb-stat-line { display: flex; align-items: baseline; justify-content: space-between;
      padding: 6px 0; border-bottom: 1px dotted ${border}; font-size: 11px; }
    .bb-stat-line:last-child { border-bottom: 0; }

    .bb-bar { height: 2px; background: ${border}; position: relative; margin-top: 6px; }
    .bb-bar > i { position: absolute; left: 0; top: -1px; bottom: -1px; background: ${bone}; }
    .bb-bar.warn > i { background: ${amber}; }

    .bb-bottom { height: 22px; background: ${surface}; border-top: 1px solid ${borderHi};
      display: flex; align-items: center; padding: 0 16px; gap: 24px; font-size: 10px;
      color: ${dim}; letter-spacing: 0.1em; text-transform: uppercase; }
    .bb-bottom .bb-blink { color: ${amber}; }
    .bb-bottom .bb-blink::before { content: '▮ '; }

    .bb-spark { display: flex; align-items: flex-end; gap: 2px; height: 28px; margin-top: 8px; }
    .bb-spark > i { background: ${bone}; opacity: 0.7; flex: 1; }
  `;

  const sparkHeights = [40, 65, 50, 70, 55, 80, 62, 75, 88, 72, 60, 78, 66, 90, 55, 72, 80, 68, 62, 70];

  return (
    <div>
      <style>{css}</style>
      <div className="bb">
        <aside className="bb-side">
          <div className="bb-mark">A</div>
          <div className="bb-nav active">01</div>
          <div className="bb-nav">02</div>
          <div className="bb-nav">03</div>
          <div className="bb-nav">04</div>
          <div className="bb-nav">05</div>
          <div className="bb-nav">06</div>
          <div className="bb-nav">07</div>
          <div className="bb-nav">08</div>
        </aside>

        <main className="bb-main">
          <div className="bb-topbar">
            <div>ATARAXIA · ALFRED</div>
            <div>F1 KOKPİT</div>
            <div>F2 GÖREVLER</div>
            <div>F3 AJANLAR</div>
            <div>F4 DEFI</div>
            <div className="bb-spacer"></div>
            <div className="bb-status-on">OPENCLAW UP · 6S</div>
            <div>09:42:08 GMT+3</div>
          </div>

          <div className="bb-grid">
            <div className="bb-vital" style={{ gridColumn: '1 / -1' }}>
              <div className="bb-vital-cell">
                <div className="bb-vital-lab">RAM%</div>
                <div className="bb-vital-val">62.3</div>
                <div className="bb-vital-meta"><span>4.98 / 8.00 GB</span><span className="bb-vital-delta up">+0.4</span></div>
              </div>
              <div className="bb-vital-cell">
                <div className="bb-vital-lab">CPU%</div>
                <div className="bb-vital-val">34.1</div>
                <div className="bb-vital-meta"><span>load 0.42 0.38 0.31</span></div>
              </div>
              <div className="bb-vital-cell">
                <div className="bb-vital-lab">DISK%</div>
                <div className="bb-vital-val warn">88.2</div>
                <div className="bb-vital-meta"><span>56.4 / 64.0 GB</span><span className="bb-vital-delta dn" style={{color: amber}}>WARN</span></div>
              </div>
              <div className="bb-vital-cell">
                <div className="bb-vital-lab">UPTIME</div>
                <div className="bb-vital-val">14d</div>
                <div className="bb-vital-meta"><span>since 13.04 14:08</span></div>
              </div>
            </div>

            <div className="bb-cell" style={{ gridRow: 'span 1' }}>
              <div className="bb-cell-head">
                <span className="bb-cell-title">› Aktivite Akışı</span>
                <span className="bb-cell-sub">Son 24s · 47 olay</span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="bb-row">
                  <span className="bb-row-id">T-024</span>
                  <span className="bb-row-tag">DONE</span>
                  <span className="bb-row-title">Sprint planı tamamlandı, sonraki haftaya devredildi</span>
                  <span className="bb-row-time">23dk</span>
                </div>
                <div className="bb-row">
                  <span className="bb-row-id">T-019</span>
                  <span className="bb-row-tag" style={{color: amber, borderColor: amber}}>WARN</span>
                  <span className="bb-row-title">Telegram bridge yeniden başlatıldı (3. kez)</span>
                  <span className="bb-row-time">1s</span>
                </div>
                <div className="bb-row">
                  <span className="bb-row-id">T-018</span>
                  <span className="bb-row-tag">SCAN</span>
                  <span className="bb-row-title">DeFi APM tarama, 3 yeni havuz, 2 alarm</span>
                  <span className="bb-row-time">2s</span>
                </div>
                <div className="bb-row">
                  <span className="bb-row-id">T-017</span>
                  <span className="bb-row-tag">DONE</span>
                  <span className="bb-row-title">Pi 400 düzenli yedek alındı, 12.4 GB</span>
                  <span className="bb-row-time">4s</span>
                </div>
                <div className="bb-row">
                  <span className="bb-row-id">T-016</span>
                  <span className="bb-row-tag">DONE</span>
                  <span className="bb-row-title">Home Assistant otomasyonu güncellendi</span>
                  <span className="bb-row-time">6s</span>
                </div>
              </div>
            </div>

            <div className="bb-cell">
              <div className="bb-cell-head">
                <span className="bb-cell-title">› DeFi APM</span>
                <span className="bb-cell-sub">147 havuz · 3 alarm</span>
              </div>
              <div className="bb-stat-line"><span>İzlenen havuz</span><span className="bb-row-num">147</span></div>
              <div className="bb-stat-line"><span>En yüksek APY</span><span style={{color: ok}}>%12.4</span></div>
              <div className="bb-stat-line"><span>Portföy değer</span><span className="bb-row-num">$8,247.12</span></div>
              <div className="bb-stat-line"><span>24s değişim</span><span style={{color: ok}}>+2.31%</span></div>
              <div className="bb-stat-line"><span>Kritik alarm</span><span style={{color: amber}}>03</span></div>
              <div className="bb-spark">
                {sparkHeights.map((h, i) => <i key={i} style={{ height: `${h}%` }}></i>)}
              </div>
            </div>

            <div className="bb-cell">
              <div className="bb-cell-head">
                <span className="bb-cell-title">› Docker Servisler</span>
                <span className="bb-cell-sub">11/12 aktif</span>
              </div>
              <div className="bb-svc"><span className="bb-svc-name">postgres</span><span className="bb-svc-up">UP</span><span className="bb-svc-time">14d</span></div>
              <div className="bb-svc"><span className="bb-svc-name">openclaw-gateway</span><span className="bb-svc-up">UP</span><span className="bb-svc-time">6s</span></div>
              <div className="bb-svc"><span className="bb-svc-name">home-assistant</span><span className="bb-svc-up">UP</span><span className="bb-svc-time">14d</span></div>
              <div className="bb-svc"><span className="bb-svc-name">redis</span><span className="bb-svc-up">UP</span><span className="bb-svc-time">14d</span></div>
              <div className="bb-svc"><span className="bb-svc-name">telegram-bridge</span><span className="bb-svc-up" style={{color: amber}}>RESTART</span><span className="bb-svc-time">23dk</span></div>
              <div className="bb-svc"><span className="bb-svc-name">defi-scanner</span><span className="bb-svc-up">UP</span><span className="bb-svc-time">2s</span></div>
              <div className="bb-svc"><span className="bb-svc-name">claude-bridge</span><span className="bb-svc-up">UP</span><span className="bb-svc-time">3d</span></div>
            </div>

            <div className="bb-cell">
              <div className="bb-cell-head">
                <span className="bb-cell-title">› Sprint W17</span>
                <span className="bb-cell-sub">7 / 18 kalan</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 32, color: bone, fontWeight: 600, fontFeatureSettings: "'tnum'" }}>62%</span>
                  <span style={{ fontSize: 10, color: dim, letterSpacing: '0.15em' }}>11 / 18 DONE</span>
                </div>
                <div className="bb-bar" style={{ height: 4, marginTop: 10 }}><i style={{ width: '62%' }}></i></div>
              </div>
              <div className="bb-stat-line"><span>Yüksek öncelik</span><span style={{color: amber}}>04</span></div>
              <div className="bb-stat-line"><span>Bugün biten</span><span style={{color: ok}}>03</span></div>
              <div className="bb-stat-line"><span>Tahmini bitiş</span><span className="bb-row-num">02.05</span></div>
            </div>
          </div>

          <div className="bb-bottom">
            <span className="bb-blink">CANLI</span>
            <span>BUFFER 0.4MB</span>
            <span>API 12ms</span>
            <span style={{ marginLeft: 'auto' }}>v2.4.1 · BUILD 2c8a1f</span>
          </div>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { BloombergTerminal });
