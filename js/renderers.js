// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const fmt = n => (n==null||n===undefined) ? '—' : '$'+n.toFixed(2);
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ═══════════════════════════════════════════════════════════════════════════
// USE CASES MAP — by speed bracket (download Mbps)
// ═══════════════════════════════════════════════════════════════════════════
const USE_CASES = {
  es: [
    {max:50,   text:'Oficina pequeña · <strong>1-3 empleados</strong> · POS, email, navegación básica'},
    {max:150,  text:'Negocio standard · <strong>3-8 empleados</strong> · video llamadas HD, cloud apps'},
    {max:350,  text:'PYME activa · <strong>8-20 empleados</strong> · backup en nube, multi-sucursal ligero'},
    {max:600,  text:'SMB con alto tráfico · <strong>20-40 empleados</strong> · streaming, video conferencias 4K'},
    {max:1000, text:'Empresa intensiva · <strong>40+ empleados</strong> · servidores locales, transferencias pesadas'},
    {max:99999,text:'Operaciones críticas · <strong>centro de datos / video producción</strong> · uso simétrico extremo'}
  ],
  en: [
    {max:50,   text:'Small office · <strong>1-3 employees</strong> · POS, email, basic browsing'},
    {max:150,  text:'Standard business · <strong>3-8 employees</strong> · HD video calls, cloud apps'},
    {max:350,  text:'Active SMB · <strong>8-20 employees</strong> · cloud backup, light multi-branch'},
    {max:600,  text:'High-traffic SMB · <strong>20-40 employees</strong> · streaming, 4K video conf.'},
    {max:1000, text:'Intensive enterprise · <strong>40+ employees</strong> · local servers, heavy transfers'},
    {max:99999,text:'Critical operations · <strong>data center / video production</strong> · extreme symmetric use'}
  ]
};
function getUseCase(speedStr){
  const dl = parseInt(speedStr) || 0;
  // 1G/30 → 1000, 1.5G/1.5G → 1500
  let mbps = dl;
  if (speedStr.startsWith('1G')) mbps = 1000;
  if (speedStr.startsWith('1.5G')) mbps = 1500;
  const list = USE_CASES[lang] || USE_CASES.es;
  return list.find(u=>mbps<=u.max) || list[list.length-1];
}
function getSpeedPercent(speedStr){
  let mbps = parseInt(speedStr) || 0;
  if (speedStr.startsWith('1G')) mbps = 1000;
  if (speedStr.startsWith('1.5G')) mbps = 1500;
  // log-ish scaling so smaller plans aren't tiny
  return Math.min(100, Math.round(20 + (Math.log10(mbps+1) / Math.log10(1500)) * 80));
}

// "Featured" plans — highlighted as best value
const FEATURED_SPEEDS = ['500/30','500/500','600/30','600/600'];

// ═══════════════════════════════════════════════════════════════════════════
// PLANS RENDERING (v2)
// ═══════════════════════════════════════════════════════════════════════════
function renderPlans(){
  const tech = state.planTech;
  const priceMode = state.planPrice;
  const bundle = state.planBundle;
  const grid = $('#plan-grid');
  const isEs = lang === 'es';

  // ── Voz 1P standalone ─────────────────────────────────────────────────
  if (bundle === 'p1v') {
    grid.innerHTML = `
      <div class="plan-card-v2 t-VOICE" style="grid-column:1/-1;max-width:420px">
        <div class="pcv2-top">
          <div class="pcv2-tech-row"><span class="tech-chip" style="background:#e0e7ff;color:#3730a3">${icon('phone')} ${isEs?'Voz Standalone':'Standalone Voice'}</span></div>
          <div class="pcv2-speed-block">
            <span class="pcv2-speed" style="font-size:28px">${isEs?'Voz 1P':'Voice 1P'}</span>
          </div>
        </div>
        <div class="pcv2-chips">
          <span class="pcv2-chip voice">${icon('phone')} ${isEs?'Solo Voz':'Voice Only'}</span>
        </div>
        <div style="padding:12px 16px 0">
          <div style="display:grid;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--ink-faint,#f5f7fa);border-radius:8px">
              <div>
                <div style="font-weight:700;font-size:13px">${t('voice.first')}</div>
                <div style="font-size:11px;color:var(--muted-2)">${t('voice.first.sub')}</div>
              </div>
              <div style="font-size:20px;font-weight:800;color:var(--blue)">${fmt(34.99)}<small style="font-size:10px;font-weight:500">/${isEs?'mes':'mo'}</small></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--ink-faint,#f5f7fa);border-radius:8px">
              <div>
                <div style="font-weight:700;font-size:13px">${t('voice.add')}</div>
                <div style="font-size:11px;color:var(--muted-2)">${t('voice.add.sub')}</div>
              </div>
              <div style="font-size:20px;font-weight:800;color:var(--blue)">${fmt(29.99)}<small style="font-size:10px;font-weight:500">/${isEs?'mes':'mo'}</small></div>
            </div>
          </div>
        </div>
        <button class="pcv2-cta" data-cta-plan="VOZ1P|VOICE|p1v|list" style="margin:16px 16px 16px">
          ${isEs?'Cotizar este plan':'Quote this plan'} ${icon('arrow')}
        </button>
      </div>
    `;
    // bind CTA
    $$('[data-cta-plan]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        e.stopPropagation();
        propInit();
        const vTech = state.planTech === 'FTTx' ? 'FTTx' : 'COAX';
        state.prop.tech = vTech;
        state.prop.speed = {
          speed: 'Voz 1P', displaySpeed: 'Voz Standalone',
          tech: vTech, list:{p1v: 34.99}, promo:null, voip:0, _voz1p: true
        };
        state.prop.bundle = 'p1v';
        state.prop.priceType = 'list';
        state.prop.step = 4;
        setTab('proposal');
      });
    });
    return;
  }

  // ── 2P-E / 2P-U Video Bundles ─────────────────────────────────────────
  if (bundle === 'p2e' || bundle === 'p2u') {
    const vp = VIDEO_2P_PLANS.find(v=>v.bundleId===bundle);
    if (!vp) { grid.innerHTML = `<div class="na-row" style="grid-column:1/-1">—</div>`; return; }
    const techsToShow = tech === 'FMC'
      ? [{t:'COAX', spd:vp.coaxSpeed},{t:'FTTx', spd:vp.fttxSpeed}]
      : [{t:tech, spd:tech==='COAX'?vp.coaxSpeed:vp.fttxSpeed}];
    grid.innerHTML = techsToShow.map(({t:tk, spd})=>`
      <div class="plan-card-v2 t-${tk}">
        <div class="pcv2-top">
          <div class="pcv2-tech-row"><span class="tech-chip tc-${tk}">${tk}</span></div>
          <div class="pcv2-speed-block">
            <span class="pcv2-speed">${spd.split('/')[0]}</span>
            <span class="pcv2-speed-up">/${spd.split('/')[1]}</span>
            <span class="pcv2-mbps">Mbps</span>
          </div>
        </div>
        <div class="pcv2-chips">
          <span class="pcv2-chip">${icon('internet')} Internet</span>
          <span class="pcv2-chip tv">${icon('tv')} ${vp.name}</span>
        </div>
        <div class="pcv2-price">
          <div class="pcv2-price-left">
            <div class="pcv2-price-lbl">${isEs?'Precio Fijo':'Fixed Price'}</div>
            <div class="pcv2-price-val">${fmt(vp.price)}<small>/${isEs?'mes':'mo'}</small></div>
          </div>
        </div>
        <button class="pcv2-cta" data-cta-2pv="${bundle}|${tk}|${spd}">${isEs?'Cotizar este plan':'Quote this plan'} ${icon('arrow')}</button>
      </div>
    `).join('');
    // bind CTAs
    $$('[data-cta-2pv]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        e.stopPropagation();
        const [bun, planTech] = btn.getAttribute('data-cta-2pv').split('|');
        propInit();
        state.prop.tech = planTech;
        // Use synthetic speed object for proposal
        const techForProp = planTech === 'FTTx' ? 'FTTx' : 'COAX';
        const spd2p = techForProp === 'COAX' ? vp.coaxSpeed : vp.fttxSpeed;
        state.prop.speed = {speed: spd2p, tech: planTech, list:{}, promo:null, voip:0, _vid2p: true, _vid2pPrice: vp.price, _vid2pName: vp.name};
        state.prop.bundle = bun;
        state.prop.priceType = 'list';
        state.prop.step = 4;
        setTab('proposal');
      });
    });
    return;
  }

  let plans;
  if (tech==='COAX') plans = COAX_OFFER;
  else if (tech==='FTTx') plans = FTTX_OFFER;
  else plans = FMC_PLANS;

  plans = plans.filter(p=>{
    return p.list && p.list[bundle] != null;
  });

  const q = (state.planSearch || '').toLowerCase().trim();
  if (q) {
    plans = plans.filter(p=>{
      return ((p.speed||'') + (p.displaySpeed||'') + (p.tech||'')).toLowerCase().includes(q);
    });
  }

  if (!plans.length){
    grid.innerHTML = `<div class="na-row" style="grid-column:1/-1">— ${lang==='es'?'Sin opciones':'No options'} —</div>`;
    return;
  }

  grid.innerHTML = plans.map(p=>{
    const techKey = p.tech;
    const techLabel = techKey==='D3.1' ? 'DOCSIS 3.1' : techKey==='FTTx15' ? 'FTTx 1.5G' : techKey;
    const speedDisplay = p.displaySpeed || p.speed;
    const speedNum = speedDisplay.split('/')[0];
    const speedUp = speedDisplay.split('/')[1];

    const list = p.list?.[bundle];
    const promo = p.promo?.[bundle];
    const showPromo = priceMode==='promo' && promo!=null;
    const displayPrice = showPromo ? promo : list;
    const savings = (list && promo) ? (list - promo) : 0;

    const isFeatured = FEATURED_SPEEDS.includes(p.speed);
    const useCase = getUseCase(speedDisplay);

    let chips = `<span class="pcv2-chip">${icon('internet')} Internet</span>`;
    if (bundle==='p2' || bundle.startsWith('p3')) chips += `<span class="pcv2-chip voice">${icon('phone')} ${lang==='es'?'Voz':'Voice'}</span>`;
    if (bundle==='p3b') chips += `<span class="pcv2-chip tv">${icon('tv')} Broadcast</span>`;
    if (bundle==='p3e') chips += `<span class="pcv2-chip tv">${icon('tv')} Español</span>`;
    if (bundle==='p3u') chips += `<span class="pcv2-chip tv">${icon('tv')} Ultimate</span>`;
    if (p.voip) chips += `<span class="pcv2-chip voip">${icon('phone')} ${lang==='es'?'Hasta':'Up to'} ${p.voip} ${lang==='es'?'líneas':'lines'}</span>`;

    return `
      <div class="plan-card-v2 t-${techKey} ${isFeatured?'featured':''}">
        ${isFeatured?`<div class="pcv2-ribbon">${icon('check')} ${lang==='es'?'Más vendido':'Best seller'}</div>`:''}
        <div class="pcv2-top">
          <div class="pcv2-tech-row">
            <span class="tech-chip tc-${techKey}">${techLabel}</span>
            ${p.fmc ? `<span class="pcv2-tier fmc-eligible">${icon('fmc')} FMC</span>` : ''}
          </div>
          <div class="pcv2-speed-block">
            <span class="pcv2-speed">${speedNum}</span>
            <span class="pcv2-speed-up">/${speedUp}</span>
            <span class="pcv2-mbps">Mbps</span>
          </div>
          ${p.fmc ? `<div class="pcv2-fmc-strip">${icon('fmc')}<span><strong>FMC:</strong> ${lang==='es'?'duplica a':'doubles to'} ${p.fmc}</span></div>` : ''}
        </div>
        <div class="pcv2-usecase">
          <div class="pcv2-usecase-icon">${icon('user')}</div>
          <div class="pcv2-usecase-text">${useCase.text}</div>
        </div>
        <div class="pcv2-chips">${chips}</div>
        <div class="pcv2-price">
          <div class="pcv2-price-left">
            <div class="pcv2-price-lbl">${showPromo ? (lang==='es'?'Precio Promo':'Promo Price') : (lang==='es'?'Precio Lista':'List Price')}</div>
            <div class="pcv2-price-val">${fmt(displayPrice)}<small>/${lang==='es'?'mes':'mo'}</small></div>
            ${showPromo ? `<div class="pcv2-listprice">${lang==='es'?'Lista':'List'}: ${fmt(list)}</div>` : ''}
          </div>
          ${showPromo && savings>0 ? `<div class="pcv2-savings">${icon('trend')} ${lang==='es'?'Ahorras':'Save'} ${fmt(savings)}</div>` : ''}
        </div>
        <button class="pcv2-cta" data-cta-plan="${p.speed}|${p.tech}|${bundle}|${priceMode}">${lang==='es'?'Cotizar este plan':'Quote this plan'} ${icon('arrow')}</button>
      </div>
    `;
  }).join('');

  $$('[data-cta-plan]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const [speed, planTech, bundleId, pMode] = btn.dataset.ctaPlan.split('|');
      propInit();
      if (planTech === 'FMC') {
        const found = FMC_PLANS.find(p=>p.speed===speed);
        if (found) {
          state.prop.tech = 'FMC';
          state.prop.speed = found;
          state.prop.bundle = bundleId;
          state.prop.priceType = 'lto';
          state.prop.step = 4;
        }
      } else {
        const techForProp = (planTech==='FTTx' || planTech==='FTTx15') ? 'FTTx' : 'COAX';
        const dataset = techForProp==='COAX' ? COAX : FTTX;
        const found = dataset.find(p=>p.speed===speed && p.tech===planTech);
        if (found) {
          state.prop.tech = techForProp;
          state.prop.speed = found;
          state.prop.bundle = bundleId;
          state.prop.priceType = pMode==='promo' ? 'promo' : 'list';
          state.prop.step = 4;
        }
      }
      setTab('proposal');
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LTO RENDERING
// ═══════════════════════════════════════════════════════════════════════════
function renderLTO(){
  const tech = state.ltoTech;
  const data = tech==='COAX' ? COAX_LTO : FTTX_LTO;

  const head = `
    <thead>
      <tr>
        <th class="group-head first" rowspan="2">${lang==='es'?'Velocidad':'Speed'}</th>
        <th class="group-head gh-list" colspan="2">${t('lto.listprice')}</th>
        <th class="group-head gh-lead" colspan="2">${t('lto.lead')}</th>
        <th class="group-head gh-fmc"  colspan="2">${t('lto.fmc')}</th>
      </tr>
      <tr class="sub-head">
        <th>2P</th><th>3P</th>
        <th>2P</th><th>3P</th>
        <th>2P</th><th>3P</th>
      </tr>
    </thead>`;

  const rows = data.map(r=>{
    return `
      <tr>
        <td>
          <div style="font-weight:800;font-size:14px;color:var(--ink)">${r.speed}</div>
          ${r.tech?`<div style="font-size:10px;color:var(--orange);font-weight:700;margin-top:2px">${r.tech}</div>`:''}
        </td>
        <td class="${r.l2p==null?'cell-na':'cell-list'}">${fmt(r.l2p)}</td>
        <td class="${r.l3p==null?'cell-na':'cell-list'}">${fmt(r.l3p)}</td>
        <td class="${r.ld2p==null?'cell-na':'cell-lead'}">${fmt(r.ld2p)}</td>
        <td class="${r.ld3p==null?'cell-na':'cell-lead'}">${fmt(r.ld3p)}</td>
        <td class="${r.f2p==null?'cell-na':'cell-fmc'}">${fmt(r.f2p)}</td>
        <td class="${r.f3p==null?'cell-na':'cell-fmc'}">${fmt(r.f3p)}</td>
      </tr>`;
  }).join('');

  $('#lto-table').innerHTML = head + '<tbody>' + rows + '</tbody>';

  $('#lto-legend').innerHTML = `
    <span class="legend-item"><span class="legend-dot" style="background:#384256"></span>${t('leg.list')}</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--orange)"></span>${t('leg.lead')}</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--purple)"></span>${t('leg.fmc')}</span>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALS / 1P HSD STANDALONE
// ═══════════════════════════════════════════════════════════════════════════
function renderSpecials(){
  const tech = state.specTech;
  const data = tech==='COAX' ? COAX_OFFER : FTTX_OFFER;
  const cards = data
    .filter(p=>p.list?.p1 != null)
    .map(p=>`
      <div class="special-card">
        <div class="speed">${p.speed.split('/')[0]}<small>/${p.speed.split('/')[1]}</small></div>
        <div class="price">${fmt(p.list.p1)}</div>
        <div class="mo">/${lang==='es'?'mes':'mo'}</div>
      </div>
    `).join('');
  $('#spec-grid').innerHTML = cards;
}

// ═══════════════════════════════════════════════════════════════════════════
// STB COST HELPER (for Add-Ons tab calculator)
// QTY = additional STBs (not counting the 1 included in 3P bundle)
// QTY=1 → $6.99 · QTY≥2 → ((QTY-2)*3.99)+12.48
// ═══════════════════════════════════════════════════════════════════════════
function calcStbRef(qty){
  if (qty <= 0) return 0;
  if (qty === 1) return 6.99;
  return Math.round(((qty - 2) * 3.99 + 12.48) * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ONS / VOICE / VIDEO / HW
// ═══════════════════════════════════════════════════════════════════════════
function renderAddons(){
  const isEs = lang === 'es';

  // Add-ons internet & voice (include Hunting with one-time note)
  $('#addons-grid').innerHTML = ADDONS.map(a=>{
    const iconKey = a.id==='ao1'?'cog':a.id==='ao2'?'phone':a.id==='ao3'?'link':a.id==='ao4'?'shield':a.id==='ao5'?'cloud':a.id==='ao6'?'store':'phone';
    const colorCls = a.id==='ao4'?'green':a.id==='ao5'?'purple':a.id==='ao6'?'orange':'';
    const subLine = a.oneTime
      ? `${a.sub} · <span style="color:var(--orange);font-weight:700">${isEs?'Incluye cargo único de':'Includes one-time fee of'} ${fmt(a.oneTime)}</span>`
      : a.sub;
    return `
      <div class="feature-card">
        <div class="feature-icon ${colorCls}">${icon(iconKey)}</div>
        <div class="feature-body">
          <div class="feature-name">${a.name}${a.lto?`<span class="tag-lto">LTO ${fmt(a.lto)}</span>`:''}</div>
          <div class="feature-sub">${subLine}</div>
        </div>
        <div class="feature-price-block">
          <div class="feature-price">${fmt(a.price)}</div>
          <div class="feature-mo">/${isEs?'mes':'mo'}</div>
        </div>
      </div>
    `;
  }).join('');

  // Voice — 1P Standalone
  $('#voice-grid').innerHTML = `
    <div class="feature-card">
      <div class="feature-icon"><span style="font-weight:800;font-size:14px">1</span></div>
      <div class="feature-body">
        <div class="feature-name">${t('voice.first')}</div>
        <div class="feature-sub">${t('voice.first.sub')}</div>
      </div>
      <div class="feature-price-block">
        <div class="feature-price">${fmt(34.99)}</div>
        <div class="feature-mo">/${isEs?'mes':'mo'}</div>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon"><span style="font-weight:800;font-size:14px">+</span></div>
      <div class="feature-body">
        <div class="feature-name">${t('voice.add')}</div>
        <div class="feature-sub">${t('voice.add.sub')}</div>
      </div>
      <div class="feature-price-block">
        <div class="feature-price">${fmt(29.99)}</div>
        <div class="feature-mo">/${isEs?'mes':'mo'}</div>
      </div>
    </div>
  `;

  // Fox Deportes — always visible, compatibility badge
  $('#fox-grid').innerHTML = `
    <div class="feature-card" style="border-left:3px solid var(--orange)">
      <div class="feature-icon orange">${icon('tv')}</div>
      <div class="feature-body">
        <div class="feature-name">Fox Deportes
          <span style="font-size:10px;background:#ffe1cf;color:#9d3a00;border-radius:4px;padding:2px 6px;margin-left:6px;font-weight:700">
            2P-E · 2P-U · 3P-E · 3P-U
          </span>
        </div>
        <div class="feature-sub">${t('s.fox.compat')}</div>
      </div>
      <div class="feature-price-block">
        <div class="feature-price">${fmt(25.00)}</div>
        <div class="feature-mo">/${isEs?'mes':'mo'}</div>
      </div>
    </div>
  `;

  // STB grid — redesign with visual reference tiles + interactive calculator
  let stbCalcQty = 0; // local state for the reference calculator
  const renderStbSection = (qty) => {
    const totalCost = calcStbRef(qty);
    return `
      <div class="stb-ref-tiles">
        <div class="stb-card"><div class="stb-lbl">${isEs?'1° STB':'1st STB'}</div><div class="stb-price free">${t('stb.1')}</div></div>
        <div class="stb-card"><div class="stb-lbl">${isEs?'+1 Adic.':'+1 Add.'}</div><div class="stb-price">${fmt(6.99)}<small>/${isEs?'mes':'mo'}</small></div></div>
        <div class="stb-card"><div class="stb-lbl">${isEs?'+2 Adic.':'+2 Add.'}</div><div class="stb-price">${fmt(5.99)}<small>/${isEs?'mes':'mo'}</small></div></div>
        <div class="stb-card featured"><div class="stb-lbl">${isEs?'Outlet Adic.':'Add. Outlet'}</div><div class="stb-price">${fmt(7.50)}<small>/${isEs?'mes':'mo'}</small></div></div>
      </div>
      <div class="stb-calc-wrap" style="margin-top:14px;padding:14px 16px;background:var(--ink-faint,#f5f7fa);border-radius:10px">
        <div style="font-size:12px;font-weight:700;color:var(--ink);margin-bottom:10px">
          ${icon('cog')} ${isEs?'Calculadora de STBs adicionales':'Additional STB Calculator'}
        </div>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-size:12px;font-weight:600;color:var(--muted-2)">${isEs?'¿Cuántos STBs adicionales?':'How many additional STBs?'}</label>
            <input type="number" id="stb-ref-qty" min="0" max="30" value="${qty}"
              style="width:64px;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:14px;font-weight:700;text-align:center">
          </div>
          ${qty > 0 ? `
            <div style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:white;border-radius:8px;border:1.5px solid var(--border)">
              <span style="font-size:11px;color:var(--muted-2);font-weight:600">${isEs?'Total mensual:':'Monthly total:'}</span>
              <span style="font-size:18px;font-weight:800;color:var(--blue)">${fmt(totalCost)}</span>
              <span style="font-size:10px;color:var(--muted-2)">/${isEs?'mes':'mo'}</span>
            </div>
          ` : `<span style="font-size:12px;color:var(--muted-2)">${isEs?'Ingresa la cantidad de STBs para calcular':'Enter STB quantity to calculate'}</span>`}
        </div>
      </div>
    `;
  };

  $('#stb-grid').innerHTML = renderStbSection(stbCalcQty);

  // Bind STB calculator input — uses event delegation so re-renders don't break binding
  $('#stb-grid').addEventListener('input', function(e){
    if (e.target && e.target.id === 'stb-ref-qty') {
      const v = Math.max(0, parseInt(e.target.value) || 0);
      const cursorPos = e.target.selectionStart;
      $('#stb-grid').innerHTML = renderStbSection(v);
      const ni = document.getElementById('stb-ref-qty');
      if (ni) { ni.focus(); try { ni.setSelectionRange(cursorPos, cursorPos); } catch(err){} }
    }
  });

  // Ultimate add-ons
  $('#ult-grid').innerHTML = ULT_ADDONS.map(u=>`
    <div class="feature-card">
      <div class="feature-icon purple">${icon('tv')}</div>
      <div class="feature-body">
        <div class="feature-name">${u.name}</div>
        <div class="feature-sub">${isEs?'Add-on Ultimate':'Ultimate Add-on'}</div>
      </div>
      <div class="feature-price-block">
        <div class="feature-price">${fmt(u.price)}</div>
        <div class="feature-mo">/${isEs?'mes':'mo'}</div>
      </div>
    </div>
  `).join('');

  // Hardware
  $('#hw-grid').innerHTML = HARDWARE.map(h=>`
    <div class="feature-card">
      <div class="feature-icon green">${icon(h.id==='hw1'?'shield':h.id==='hw2'||h.id==='hw3'?'hardware':'cog')}</div>
      <div class="feature-body">
        <div class="feature-name">${h.name}</div>
        <div class="feature-sub">${h.sub}</div>
      </div>
      <div class="feature-price-block">
        <div class="feature-price">${fmt(h.price)}</div>
        <div class="feature-mo">/${isEs?'mes':'mo'}</div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMOS
// ═══════════════════════════════════════════════════════════════════════════
function renderPromos(){
  $('#promos-wrap').innerHTML = `
    <div class="promo-card">
      <div class="promo-title">${icon('promos')} ${t('promo.penalty')}</div>
      <ul class="promo-rules">
        <li>${t('promo.p1')}</li>
        <li>${t('promo.p2')}</li>
        <li>${t('promo.p3')}</li>
      </ul>
    </div>
    <div class="promo-card referral">
      <div class="promo-title">${icon('user')} ${t('promo.referral')}</div>
      <ul class="promo-rules">
        <li>${t('promo.r1')}</li>
        <li>${t('promo.r2')}</li>
      </ul>
    </div>
  `;
}
