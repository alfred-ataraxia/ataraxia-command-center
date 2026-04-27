// DIRECTION 3: BRUTALIST MONO
// Heavy gray tonal layering, bone single accent, oversized display type, character-driven.

function BrutalistMono() {
  const bg = '#1a1a1a';
  const layer1 = '#222222';
  const layer2 = '#2a2a2a';
  const border = '#333333';
  const bone = '#F5E6C8';
  const text = '#d4d4d0';
  const dim = '#888880';
  const sub = '#555550';
  const ok = '#a8c690';
  const err = '#c97060';

  const css = `
    .br * { box-sizing: border-box; }
    .br { font-family: 'Inter', system-ui, sans-serif; color: ${text};
      background: ${bg}; width: 1280px; height: 800px; display: flex; }
    .br-side { width: 200px; background: ${bg}; padding: 32px 24px; display: flex; flex-direction: column; }
    .br-mark { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 26px; color: ${bone};
      letter-spacing: -0.04em; line-height: 0.9; margin-bottom: 4px; font-style: italic; }
    .br-mark-sub { font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 10px;
      color: ${dim}; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 48px; }
    .br-nav { display: flex; flex-direction: column; gap: 2px; }
    .br-nav-item { display: flex; align-items: center; padding: 10px 0; font-size: 14px; color: ${dim};
      cursor: pointer; font-weight: 500; letter-spacing: -0.01em;
      border-bottom: 1px solid ${layer2}; }
    .br-nav-item:last-child { border-bottom: 0; }
    .br-nav-item.active { color: ${bone}; font-weight: 700; }
    .br-nav-item.active::before { content: '→'; margin-right: 10px; color: ${bone}; font-family: ui-monospace, monospace; }
    .br-nav-item:hover { color: ${text}; }
    .br-side-foot { margin-top: auto; }
    .br-foot-card { background: ${layer1}; padding: 14px; }
    .br-foot-lab { font-family: ui-monospace, monospace; font-size: 9px; letter-spacing: 0.2em;
      text-transform: uppercase; color: ${dim}; margin-bottom: 6px; }
    .br-foot-val { font-size: 13px; color: ${ok}; font-weight: 700; }

    .br-main { flex: 1; padding: 0; overflow: hidden; display: flex; flex-direction: column;
      background: ${layer1}; }
    .br-hero { padding: 36px 40px 28px; background: ${layer1}; }
    .br-hero-eyebrow { font-family: ui-monospace, monospace; font-size: 11px; color: ${dim};
      letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 14px;
      display: flex; align-items: center; gap: 14px; }
    .br-hero-eyebrow span { display: inline-block; }
    .br-pulse { width: 8px; height: 8px; border-radius: 50%; background: ${ok}; }
    .br-hero-title { font-size: 56px; font-weight: 900; color: ${bone}; line-height: 0.95;
      letter-spacing: -0.04em; margin: 0 0 14px; font-style: italic; }
    .br-hero-meta { font-family: ui-monospace, monospace; font-size: 13px; color: ${dim}; }
    .br-hero-meta strong { color: ${text}; font-weight: 500; }

    .br-vitals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0;
      background: ${layer2}; padding: 0; border-top: 1px solid ${border}; border-bottom: 1px solid ${border}; }
    .br-vital { padding: 24px 32px; background: ${layer1}; border-right: 1px solid ${border}; }
    .br-vital:last-child { border-right: 0; }
    .br-vital-lab { font-family: ui-monospace, monospace; font-size: 11px; color: ${dim};
      letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 10px; }
    .br-vital-val { font-size: 64px; font-weight: 900; color: ${bone}; line-height: 0.9;
      letter-spacing: -0.04em; font-feature-settings: 'tnum'; font-style: italic; }
    .br-vital-val.warn { color: ${err}; }
    .br-vital-trail { font-family: ui-monospace, monospace; font-size: 11px; color: ${dim};
      margin-top: 10px; }

    .br-grid { flex: 1; display: grid; grid-template-columns: 1.4fr 1fr; gap: 0;
      min-height: 0; overflow: hidden; }
    .br-col { padding: 28px 36px; overflow: hidden; }
    .br-col + .br-col { background: ${layer2}; }

    .br-sec { margin-bottom: 28px; }
    .br-sec-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 14px;
      padding-bottom: 10px; border-bottom: 1px solid ${border}; }
    .br-sec-num { font-family: ui-monospace, monospace; font-size: 11px; color: ${dim};
      letter-spacing: 0.15em; }
    .br-sec-title { font-size: 18px; font-weight: 800; color: ${bone}; letter-spacing: -0.02em; font-style: italic; }
    .br-sec-meta { margin-left: auto; font-family: ui-monospace, monospace; font-size: 10px;
      color: ${dim}; letter-spacing: 0.15em; text-transform: uppercase; }

    .br-feed { display: flex; align-items: baseline; gap: 14px; padding: 12px 0;
      border-bottom: 1px solid ${border}; }
    .br-feed:last-child { border-bottom: 0; }
    .br-feed-id { font-family: ui-monospace, monospace; font-size: 11px; color: ${sub};
      width: 56px; flex-shrink: 0; }
    .br-feed-title { flex: 1; font-size: 14px; color: ${text}; line-height: 1.4; letter-spacing: -0.005em; }
    .br-feed-time { font-family: ui-monospace, monospace; font-size: 11px; color: ${dim};
      min-width: 50px; text-align: right; }
    .br-feed.done .br-feed-id { color: ${ok}; }
    .br-feed.warn .br-feed-id { color: ${err}; }

    .br-svc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${border}; }
    .br-svc-cell { background: ${layer2}; padding: 14px 16px; }
    .br-svc-name { font-family: ui-monospace, monospace; font-size: 13px; color: ${text}; }
    .br-svc-meta { font-family: ui-monospace, monospace; font-size: 10px; color: ${dim};
      letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }

    .br-defi-num { font-size: 48px; font-weight: 900; color: ${bone}; line-height: 1;
      letter-spacing: -0.04em; font-style: italic; font-feature-settings: 'tnum'; }
    .br-defi-num.up { color: ${ok}; }
    .br-defi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
    .br-defi-trail { font-family: ui-monospace, monospace; font-size: 11px; color: ${dim};
      letter-spacing: 0.1em; text-transform: uppercase; margin-top: 6px; }
  `;

  return (
    <div>
      <style>{css}</style>
      <div className="br">
        <aside className="br-side">
          <div className="br-mark">Ataraxia<br/>Command.</div>
          <div className="br-mark-sub">vol — IV</div>
          <nav className="br-nav">
            <div className="br-nav-item active">Kokpit</div>
            <div className="br-nav-item">Görevler</div>
            <div className="br-nav-item">Ajanlar</div>
            <div className="br-nav-item">Otomasyon</div>
            <div className="br-nav-item">Onaylar</div>
            <div className="br-nav-item">Hafıza</div>
            <div className="br-nav-item">Logs</div>
            <div className="br-nav-item">DeFi APM</div>
          </nav>
          <div className="br-side-foot">
            <div className="br-foot-card">
              <div className="br-foot-lab">OpenClaw</div>
              <div className="br-foot-val">— Aktif · 6s</div>
            </div>
          </div>
        </aside>

        <main className="br-main">
          <div className="br-hero">
            <div className="br-hero-eyebrow">
              <span className="br-pulse"></span>
              <span>Pazartesi · 27 Nisan 2026</span>
              <span style={{ marginLeft: 'auto', color: dim }}>09:42 GMT+3</span>
            </div>
            <h1 className="br-hero-title">Her şey<br/>kontrol altında.</h1>
            <p className="br-hero-meta"><strong>Alfred</strong> — minimax-m2.7 · OpenClaw · 14 gün uptime · 47 cron aktif</p>
          </div>

          <div className="br-vitals">
            <div className="br-vital">
              <div className="br-vital-lab">RAM</div>
              <div className="br-vital-val">62</div>
              <div className="br-vital-trail">4.98 / 8.00 GB</div>
            </div>
            <div className="br-vital">
              <div className="br-vital-lab">CPU</div>
              <div className="br-vital-val">34</div>
              <div className="br-vital-trail">load 0.42 0.38 0.31</div>
            </div>
            <div className="br-vital">
              <div className="br-vital-lab">DİSK</div>
              <div className="br-vital-val warn">88</div>
              <div className="br-vital-trail" style={{ color: err }}>uyarı eşiği · 56.4 GB</div>
            </div>
          </div>

          <div className="br-grid">
            <section className="br-col">
              <div className="br-sec">
                <div className="br-sec-head">
                  <span className="br-sec-num">01</span>
                  <span className="br-sec-title">Son görevler</span>
                  <span className="br-sec-meta">son 24s</span>
                </div>
                <div className="br-feed done">
                  <span className="br-feed-id">T-024</span>
                  <span className="br-feed-title">Sprint planı tamamlandı, sonraki haftaya devredildi</span>
                  <span className="br-feed-time">23dk</span>
                </div>
                <div className="br-feed warn">
                  <span className="br-feed-id">T-019</span>
                  <span className="br-feed-title">Telegram bridge yeniden başlatıldı, 3. defa bu hafta</span>
                  <span className="br-feed-time">1s</span>
                </div>
                <div className="br-feed">
                  <span className="br-feed-id">T-018</span>
                  <span className="br-feed-title">DeFi APM tarama, 3 yeni havuz keşfedildi</span>
                  <span className="br-feed-time">2s</span>
                </div>
                <div className="br-feed done">
                  <span className="br-feed-id">T-017</span>
                  <span className="br-feed-title">Pi 400 düzenli yedek alındı, 12.4 GB sıkıştırıldı</span>
                  <span className="br-feed-time">4s</span>
                </div>
              </div>

              <div className="br-sec">
                <div className="br-sec-head">
                  <span className="br-sec-num">02</span>
                  <span className="br-sec-title">Servisler</span>
                  <span className="br-sec-meta">11 / 12 up</span>
                </div>
                <div className="br-svc-grid">
                  <div className="br-svc-cell">
                    <div className="br-svc-name">postgres</div>
                    <div className="br-svc-meta" style={{ color: ok }}>up · 14g</div>
                  </div>
                  <div className="br-svc-cell">
                    <div className="br-svc-name">openclaw</div>
                    <div className="br-svc-meta" style={{ color: ok }}>up · 6s</div>
                  </div>
                  <div className="br-svc-cell">
                    <div className="br-svc-name">home-assistant</div>
                    <div className="br-svc-meta" style={{ color: ok }}>up · 14g</div>
                  </div>
                  <div className="br-svc-cell">
                    <div className="br-svc-name">telegram-bridge</div>
                    <div className="br-svc-meta" style={{ color: err }}>restart · 23dk</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="br-col">
              <div className="br-sec">
                <div className="br-sec-head">
                  <span className="br-sec-num">03</span>
                  <span className="br-sec-title">Sprint W17</span>
                  <span className="br-sec-meta">7 kalan</span>
                </div>
                <div className="br-defi-row">
                  <div>
                    <div className="br-defi-num">62%</div>
                    <div className="br-defi-trail">İlerleme</div>
                  </div>
                  <div>
                    <div className="br-defi-num up">11/18</div>
                    <div className="br-defi-trail">Tamamlanan</div>
                  </div>
                </div>
              </div>

              <div className="br-sec">
                <div className="br-sec-head">
                  <span className="br-sec-num">04</span>
                  <span className="br-sec-title">DeFi vurgusu</span>
                  <span className="br-sec-meta">3 alarm</span>
                </div>
                <div className="br-defi-row">
                  <div>
                    <div className="br-defi-num">147</div>
                    <div className="br-defi-trail">İzlenen havuz</div>
                  </div>
                  <div>
                    <div className="br-defi-num up">%12.4</div>
                    <div className="br-defi-trail">En yüksek APY</div>
                  </div>
                </div>
                <div className="br-defi-row">
                  <div>
                    <div className="br-defi-num" style={{ fontSize: 32 }}>$8,247</div>
                    <div className="br-defi-trail">Portföy değer</div>
                  </div>
                  <div>
                    <div className="br-defi-num up" style={{ fontSize: 32 }}>+2.31%</div>
                    <div className="br-defi-trail">24 saat</div>
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

Object.assign(window, { BrutalistMono });
