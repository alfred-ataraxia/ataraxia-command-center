// Three design directions for ATARAXIA Alfred Command Center.
// All show the same Cockpit screen so the user can compare apples-to-apples.

const { useState } = React;

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION 1: EDITORIAL BONE
// Warm black, bone accent, hairline borders, zero radius, magazine type.
// ─────────────────────────────────────────────────────────────────────────────
function EditorialBone() {
  const bg = '#0c0b09';
  const surface = '#141210';
  const panel = '#1a1714';
  const border = '#2a241e';
  const bone = '#F5E6C8';
  const text = '#e8dfcf';
  const dim = '#8a7f70';
  const sub = '#5a5247';
  const ok = '#a8c690';
  const warn = '#d4a574';
  const err = '#c97060';

  const css = `
    .ed * { box-sizing: border-box; }
    .ed { font-family: 'IBM Plex Sans', system-ui, sans-serif; color: ${text};
      background: ${bg}; width: 1280px; height: 800px; display: flex;
      letter-spacing: -0.005em; }
    .ed-side { width: 220px; background: ${surface}; border-right: 1px solid ${border};
      display: flex; flex-direction: column; padding: 0; }
    .ed-brand { padding: 28px 24px 32px; border-bottom: 1px solid ${border}; }
    .ed-brand-mark { font-family: 'IBM Plex Serif', Georgia, serif; font-style: italic;
      font-weight: 700; font-size: 22px; color: ${bone}; letter-spacing: -0.02em; line-height: 1; }
    .ed-brand-sub { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: ${dim};
      letter-spacing: 0.3em; text-transform: uppercase; margin-top: 8px; }
    .ed-nav { flex: 1; padding: 16px 0; }
    .ed-nav-item { display: flex; align-items: baseline; gap: 14px; padding: 9px 24px;
      font-size: 13px; color: ${dim}; cursor: pointer; border-left: 2px solid transparent; }
    .ed-nav-item:hover { color: ${text}; }
    .ed-nav-item.active { color: ${bone}; border-left-color: ${bone};
      background: linear-gradient(90deg, rgba(245,230,200,0.04), transparent); }
    .ed-nav-num { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: ${sub};
      width: 18px; }
    .ed-nav-item.active .ed-nav-num { color: ${bone}; }
    .ed-foot { padding: 20px 24px; border-top: 1px solid ${border}; }
    .ed-foot-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: ${dim};
      letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
    .ed-foot-val { font-family: 'IBM Plex Serif', Georgia, serif; font-style: italic;
      color: ${ok}; font-size: 14px; font-weight: 600; }

    .ed-main { flex: 1; padding: 32px 40px; overflow: hidden; display: flex; flex-direction: column; }
    .ed-rule { display: flex; align-items: baseline; justify-content: space-between;
      border-bottom: 1px solid ${border}; padding-bottom: 18px; margin-bottom: 24px; }
    .ed-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: ${dim};
      letter-spacing: 0.25em; text-transform: uppercase; }
    .ed-headline { font-family: 'IBM Plex Serif', Georgia, serif; font-size: 38px;
      font-weight: 400; color: ${bone}; letter-spacing: -0.02em; line-height: 1; margin: 6px 0 0; font-style: italic; }
    .ed-time { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: ${dim}; text-align: right; }
    .ed-time strong { color: ${bone}; font-weight: 500; display: block; font-size: 15px; }

    .ed-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 0; flex: 1; min-height: 0; }
    .ed-col { padding: 0 24px; }
    .ed-col + .ed-col { border-left: 1px solid ${border}; }
    .ed-col:first-child { padding-left: 0; }
    .ed-col:last-child { padding-right: 0; }

    .ed-section { margin-bottom: 28px; }
    .ed-section-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 14px; }
    .ed-section-num { font-family: 'IBM Plex Mono', monospace; font-size: 10px;
      color: ${bone}; letter-spacing: 0.15em; }
    .ed-section-title { font-family: 'IBM Plex Sans', sans-serif; font-size: 11px;
      color: ${text}; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; }
    .ed-section-rule { flex: 1; height: 1px; background: ${border}; }

    .ed-stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; }
    .ed-stat { padding: 12px 16px 12px 0; }
    .ed-stat + .ed-stat { padding-left: 16px; border-left: 1px solid ${border}; }
    .ed-stat-lab { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: ${dim};
      letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 6px; }
    .ed-stat-val { font-family: 'IBM Plex Serif', Georgia, serif; font-size: 32px;
      color: ${bone}; font-weight: 400; line-height: 1; font-feature-settings: 'tnum'; }
    .ed-stat-unit { font-family: 'IBM Plex Mono', monospace; font-size: 11px;
      color: ${dim}; margin-left: 4px; }
    .ed-stat-bar { height: 1px; background: ${border}; margin-top: 10px; position: relative; }
    .ed-stat-bar > i { position: absolute; left: 0; top: -1px; height: 3px; background: ${bone}; }
    .ed-stat-bar.warn > i { background: ${warn}; }

    .ed-feed-item { padding: 12px 0; border-bottom: 1px solid ${border}; display: flex;
      align-items: baseline; gap: 16px; }
    .ed-feed-item:last-child { border-bottom: 0; }
    .ed-feed-id { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: ${sub};
      width: 48px; flex-shrink: 0; }
    .ed-feed-title { flex: 1; font-size: 13px; color: ${text}; }
    .ed-feed-time { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: ${dim};
      letter-spacing: 0.05em; }
    .ed-feed-mark { display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      margin-right: 12px; transform: translateY(-2px); }

    .ed-quote { padding: 18px 0 0; border-top: 1px solid ${border}; margin-top: 12px; }
    .ed-q { font-family: 'IBM Plex Serif', Georgia, serif; font-style: italic; font-size: 18px;
      color: ${bone}; line-height: 1.35; letter-spacing: -0.01em; }
    .ed-q-cite { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: ${dim};
      letter-spacing: 0.2em; text-transform: uppercase; margin-top: 12px; }

    .ed-svc { display: flex; align-items: baseline; justify-content: space-between;
      padding: 9px 0; border-bottom: 1px solid ${border}; }
    .ed-svc:last-child { border-bottom: 0; }
    .ed-svc-name { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: ${text}; }
    .ed-svc-status { font-family: 'IBM Plex Mono', monospace; font-size: 9px;
      letter-spacing: 0.25em; text-transform: uppercase; }
    .ed-ok { color: ${ok}; }
    .ed-warn { color: ${warn}; }
    .ed-err { color: ${err}; }
  `;

  return (
    <div>
      <style>{css}</style>
      <div className="ed">
        <aside className="ed-side">
          <div className="ed-brand">
            <div className="ed-brand-mark">Ataraxia</div>
            <div className="ed-brand-sub">Alfred · vol.iv</div>
          </div>
          <nav className="ed-nav">
            <div className="ed-nav-item active"><span className="ed-nav-num">01</span>Kokpit</div>
            <div className="ed-nav-item"><span className="ed-nav-num">02</span>Görevler</div>
            <div className="ed-nav-item"><span className="ed-nav-num">03</span>Ajanlar</div>
            <div className="ed-nav-item"><span className="ed-nav-num">04</span>Otomasyon</div>
            <div className="ed-nav-item"><span className="ed-nav-num">05</span>Onaylar</div>
            <div className="ed-nav-item"><span className="ed-nav-num">06</span>Hafıza</div>
            <div className="ed-nav-item"><span className="ed-nav-num">07</span>Logs</div>
            <div className="ed-nav-item"><span className="ed-nav-num">08</span>DeFi APM</div>
          </nav>
          <div className="ed-foot">
            <div className="ed-foot-label">OpenClaw</div>
            <div className="ed-foot-val">— aktif</div>
          </div>
        </aside>

        <main className="ed-main">
          <header className="ed-rule">
            <div>
              <div className="ed-eyebrow">Bölüm I · Sistem Bülteni</div>
              <h1 className="ed-headline">Kokpit, Pazartesi sabahı.</h1>
            </div>
            <div className="ed-time">
              <strong>09:42</strong>27.04.2026 · GMT+3
            </div>
          </header>

          <div className="ed-grid">
            <section className="ed-col">
              <div className="ed-section">
                <div className="ed-section-head">
                  <span className="ed-section-num">§ 01</span>
                  <span className="ed-section-title">Vital Bulgular</span>
                  <span className="ed-section-rule"></span>
                </div>
                <div className="ed-stat-row">
                  <div className="ed-stat">
                    <div className="ed-stat-lab">RAM</div>
                    <div className="ed-stat-val">62<span className="ed-stat-unit">%</span></div>
                    <div className="ed-stat-bar"><i style={{ width: '62%' }}></i></div>
                  </div>
                  <div className="ed-stat">
                    <div className="ed-stat-lab">CPU</div>
                    <div className="ed-stat-val">34<span className="ed-stat-unit">%</span></div>
                    <div className="ed-stat-bar"><i style={{ width: '34%' }}></i></div>
                  </div>
                  <div className="ed-stat">
                    <div className="ed-stat-lab">Disk</div>
                    <div className="ed-stat-val" style={{ color: warn }}>88<span className="ed-stat-unit">%</span></div>
                    <div className="ed-stat-bar warn"><i style={{ width: '88%' }}></i></div>
                  </div>
                </div>
              </div>

              <div className="ed-section">
                <div className="ed-section-head">
                  <span className="ed-section-num">§ 02</span>
                  <span className="ed-section-title">Sprint — Hafta 17</span>
                  <span className="ed-section-rule"></span>
                </div>
                <div className="ed-stat-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
                  <div className="ed-stat">
                    <div className="ed-stat-lab">İlerleme</div>
                    <div className="ed-stat-val">62<span className="ed-stat-unit">%</span></div>
                  </div>
                  <div className="ed-stat">
                    <div className="ed-stat-lab">Kalan görev / 18 toplam</div>
                    <div className="ed-stat-val">07</div>
                  </div>
                </div>
              </div>

              <div className="ed-section">
                <div className="ed-section-head">
                  <span className="ed-section-num">§ 03</span>
                  <span className="ed-section-title">Servisler</span>
                  <span className="ed-section-rule"></span>
                </div>
                <div className="ed-svc"><span className="ed-svc-name">postgres</span><span className="ed-svc-status ed-ok">çalışıyor · 14d</span></div>
                <div className="ed-svc"><span className="ed-svc-name">openclaw</span><span className="ed-svc-status ed-ok">çalışıyor · 6s</span></div>
                <div className="ed-svc"><span className="ed-svc-name">home-assistant</span><span className="ed-svc-status ed-ok">çalışıyor · 14d</span></div>
                <div className="ed-svc"><span className="ed-svc-name">telegram-bridge</span><span className="ed-svc-status ed-warn">yeniden başl. · 23dk</span></div>
              </div>
            </section>

            <section className="ed-col">
              <div className="ed-section">
                <div className="ed-section-head">
                  <span className="ed-section-num">§ 04</span>
                  <span className="ed-section-title">Son Görevler</span>
                  <span className="ed-section-rule"></span>
                </div>
                <div className="ed-feed-item">
                  <span className="ed-feed-mark" style={{ background: ok }}></span>
                  <span className="ed-feed-id">T-024</span>
                  <span className="ed-feed-title">Sprint planı tamamlandı, sonraki haftaya devredildi</span>
                  <span className="ed-feed-time">23dk</span>
                </div>
                <div className="ed-feed-item">
                  <span className="ed-feed-mark" style={{ background: warn }}></span>
                  <span className="ed-feed-id">T-019</span>
                  <span className="ed-feed-title">Telegram bridge yeniden başlatıldı</span>
                  <span className="ed-feed-time">1s</span>
                </div>
                <div className="ed-feed-item">
                  <span className="ed-feed-mark" style={{ background: bone }}></span>
                  <span className="ed-feed-id">T-018</span>
                  <span className="ed-feed-title">DeFi APM tarama tamamlandı, 3 yeni havuz</span>
                  <span className="ed-feed-time">2s</span>
                </div>
                <div className="ed-feed-item">
                  <span className="ed-feed-mark" style={{ background: ok }}></span>
                  <span className="ed-feed-id">T-017</span>
                  <span className="ed-feed-title">Pi 400 düzenli yedek alındı (12.4 GB)</span>
                  <span className="ed-feed-time">4s</span>
                </div>
              </div>

              <div className="ed-section ed-quote">
                <div className="ed-q">"Sistem değil, bir ev. Alfred ona bakıyor."</div>
                <div className="ed-q-cite">— Sistem Notu, T-001</div>
              </div>

              <div className="ed-section">
                <div className="ed-section-head">
                  <span className="ed-section-num">§ 05</span>
                  <span className="ed-section-title">DeFi Vurgusu</span>
                  <span className="ed-section-rule"></span>
                </div>
                <div className="ed-stat-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="ed-stat">
                    <div className="ed-stat-lab">İzlenen havuz</div>
                    <div className="ed-stat-val">147</div>
                  </div>
                  <div className="ed-stat">
                    <div className="ed-stat-lab">En yüksek APY</div>
                    <div className="ed-stat-val" style={{ color: ok }}>%12.4</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { EditorialBone });
