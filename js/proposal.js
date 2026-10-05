// ═══════════════════════════════════════════════════════════════════════════
// PROPOSAL JOURNEY — 6-step flow
// State: tech, speed (plan obj), bundle, priceType, addons{}, customer{}
// ═══════════════════════════════════════════════════════════════════════════

// ── Voice additional lines — pricing ─────────────────────────────────────
// 1st additional: $34.99 · 2nd+: $29.99  (max 9 additional)
function calcVoiceAdditionalCost(qty){
  let total = 0;
  for(let i=1; i<=qty; i++){
    total += (i===1) ? 34.99 : 29.99;
  }
  return Math.round(total * 100) / 100;
}

// ── STB additional units — formula pricing ───────────────────────────────
// QTY = number of additional STBs (not counting the 1 included in bundle)
// QTY=1 → $6.99 · QTY≥2 → ((QTY-2)*3.99)+12.48
function calcStbCost(qty){
  if (qty <= 0) return 0;
  if (qty === 1) return 6.99;
  return Math.round(((qty - 2) * 3.99 + 12.48) * 100) / 100;
}
const PROP_STEPS = [
  {key:'tech',     es:'Tecnología',      en:'Technology'},
  {key:'speed',    es:'Velocidad',       en:'Speed'},
  {key:'bundle',   es:'Bundle',          en:'Bundle'},
  {key:'price',    es:'Tipo de Precio',  en:'Price Type'},
  {key:'extras',   es:'Extras',          en:'Extras'},
  {key:'contract', es:'Término',         en:'Term'},
  {key:'info',     es:'Cliente',         en:'Customer'},
  {key:'doc',      es:'Contrato',        en:'Contract'}
];

// Contract term options — all fees are ONE-TIME (not monthly).
// Each term carries TWO possible activation fees because the same term is sold at
// two different costs depending on the offer the rep is authorised to give. The rep
// picks which one applies; nothing is assumed, so `contractFee` starts null and the
// step stays incomplete until an explicit choice is made.
const CONTRACT_TERMS = [
  {id:'none', months:0,  fees:[69.99, 0]},
  {id:'12m',  months:12, fees:[34.99, 69.99]},
  {id:'24m',  months:24, fees:[69.99, 0]},
  {id:'36m',  months:36, fees:[69.99, 0]},
];

// LTO variants → the columns they read in COAX_LTO / FTTX_LTO. Same three columns
// the LTO tab already shows, so the quote and the rate table can't disagree.
const LTO_COLS = {
  'lto-list': {p2:'l2p',  p3:'l3p',  es:'LTO · Precio de Lista', en:'LTO · List Price'},
  'lto-lead': {p2:'ld2p', p3:'ld3p', es:'LTO · Lead Offer',      en:'LTO · Lead Offer'},
  'lto-fmc':  {p2:'f2p',  p3:'f3p',  es:'LTO · FMC',             en:'LTO · FMC'},
  'lto':      {p2:'f2p',  p3:'f3p',  es:'LTO · FMC',             en:'LTO · FMC'}   // legacy
};

// Short name for a price type — used by the stepper, the sidebar and the proposal
// PDF, all of which are width-constrained. The SOHO contract spells it out in full
// (see ptNames in js/contract.js). Four separate copies of this map had drifted;
// now there is one.
function propPriceTypeShort(priceType, isEs){
  if (!priceType) return '';
  if (isEs == null) isEs = (lang === 'es');
  const m = {
    list:       isEs ? 'Lista'      : 'List',
    promo:      'Promo',
    'lto-list': isEs ? 'LTO Lista'  : 'LTO List',
    'lto-lead': 'LTO Lead',
    'lto-fmc':  'LTO FMC',
    lto:        'LTO FMC'            // legacy value from before the choice existed
  };
  return m[priceType] || priceType;
}

// The activation fee the rep chose, or null while the choice is still pending.
// Everything downstream (sidebar, proposal PDF, contract CNR) reads this — never a
// price baked into CONTRACT_TERMS, which no longer holds a single one.
function propContractFee(p){
  p = p || state.prop || {};
  const ct = CONTRACT_TERMS.find(t => t.id === p.contract);
  if (!ct) return null;
  const f = Number(p.contractFee);
  return (p.contractFee == null || isNaN(f) || ct.fees.indexOf(f) < 0) ? null : f;
}
// True once the term AND its fee are both settled.
function propContractDone(p){
  p = p || state.prop || {};
  return !!p.contract && propContractFee(p) !== null;
}

function propInit(){
  if (!state.prop) state.prop = {
    tech:null, speed:null, bundle:null, priceType:null,
    addons:{}, voice:{first:false, additional:0, included:0},
    video:{stb1:false, stb2qty:0, outlets:0, foxDeportes:false, ultAddons:{}},
    hw:{},
    contract: null,
    contractFee: null,          // one of CONTRACT_TERMS[].fees — chosen, never defaulted
    customer:{name:'', company:'', account:'', rep:'', date:new Date().toISOString().slice(0,10), notes:''},
    // Extra fields the SOHO "Solicitud de Servicio" needs but the quote doesn't.
    // Populated lazily by contractExtraInit() in js/contract.js.
    contractExtra: null,
    step:0
  };
}

function propBundlePrice(plan, priceType, bundle){
  if (!plan || !bundle) return null;
  // Voz 1P standalone — first line price is the base plan
  if (plan._voz1p) return 34.99;
  // Video 2P bundles (p2e / p2u) — fixed price stored on the speed object
  if (plan._vid2p) return plan._vid2pPrice ?? null;
  // LTO: the rep picks which column of the LTO table applies.
  //   lto-list → l2p  / l3p    (Precio de Lista)
  //   lto-lead → ld2p / ld3p   (Lead Offer)
  //   lto-fmc  → f2p  / f3p    (FMC)
  // Plain 'lto' is the legacy value from before the choice existed; it resolved to
  // the FMC column, so it keeps doing that for quotes saved under the old flow.
  if (priceType && priceType.indexOf('lto') === 0) {
    const isFMC = plan.tech === 'FMC';
    const isFTTx = plan.tech==='FTTx' || plan.tech==='FTTx15' || (isFMC && plan.sourceTech==='FTTx');
    const ltoRows = isFTTx ? FTTX_LTO : COAX_LTO;
    // FMC plans: look up by displaySpeed; regular plans: by base speed
    const speedKey = isFMC ? plan.displaySpeed : plan.speed;
    const row = ltoRows.find(r=>r.speed===speedKey);
    if (!row) {
      // Plan not in LTO table: fall back to promo/list price
      const src = plan.promo || plan.list;
      return src?.[bundle] ?? null;
    }
    const cols = LTO_COLS[priceType] || LTO_COLS['lto'];
    return bundle==='p2' ? row[cols.p2] : bundle.startsWith('p3') ? row[cols.p3] : null;
  }
  const src = priceType==='promo' && plan.promo ? plan.promo : plan.list;
  return src?.[bundle] ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER STEPPER
// ═══════════════════════════════════════════════════════════════════════════
function propRenderStepper(){
  const html = PROP_STEPS.map((s,i)=>{
    const done = i < state.prop.step;
    const active = i === state.prop.step;
    const cls = done ? 'done' : active ? 'active' : '';
    const label = lang==='es'? s.es : s.en;
    return `
      <div class="js-step ${cls}" data-jstep="${i}" ${done?'role="button" tabindex="0"':''}>
        <div class="js-num">${done ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>` : i+1}</div>
        <div class="js-lbl">${label}</div>
      </div>
      ${i<PROP_STEPS.length-1 ? '<div class="js-sep"></div>' : ''}
    `;
  }).join('');
  $('#j-stepper').innerHTML = html;
  $$('.js-step.done').forEach(el=>{
    el.addEventListener('click', ()=>{
      state.prop.step = parseInt(el.dataset.jstep);
      propRender();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: TECH
// ═══════════════════════════════════════════════════════════════════════════
function propStepTech(){
  const techs = [
    {id:'COAX', name:'COAX', sub:lang==='es'?'Cable coaxial — disponibilidad amplia':'Coax cable — wide availability', icon:'coax'},
    {id:'FTTx', name:'FTTx', sub:lang==='es'?'Fibra óptica — velocidades simétricas':'Fiber optic — symmetric speeds', icon:'fttx'},
    {id:'FMC',  name:'FMC',  sub:lang==='es'?'Double Bandwidth con móvil B2B activo':'Double Bandwidth with active B2B mobile', icon:'fmc'}
  ];
  return `
    <div class="j-cards c2">
      ${techs.map(tt=>`
        <div class="j-card ${state.prop.tech===tt.id?'sel':''}" data-tech="${tt.id}">
          <div class="j-card-icon">${icon(tt.icon)}</div>
          <div class="j-card-name">${tt.name}</div>
          <div class="j-card-sub">${tt.sub}</div>
        </div>
      `).join('')}
    </div>
  `;
}
function propBindStepTech(){
  $$('[data-tech]').forEach(el=>{
    el.addEventListener('click', ()=>{
      state.prop.tech = el.dataset.tech;
      // Reset downstream if tech changed
      state.prop.speed = null; state.prop.bundle = null; state.prop.priceType = null;
      state.prop.voice.included = 0;
      state.prop.step = 1;
      propRender();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: SPEED
// ═══════════════════════════════════════════════════════════════════════════
function propStepSpeed(){
  const isFMC = state.prop.tech === 'FMC';
  const data = state.prop.tech==='COAX' ? COAX_OFFER : isFMC ? FMC_PLANS : FTTX_OFFER;
  return `
    ${isFMC ? `<div class="jao-note" style="margin-bottom:12px">${icon('info')} ${lang==='es'?'Requiere móvil B2B activo. Confirmar elegibilidad en MyKnowledge (Salesforce).':'Requires active B2B mobile. Confirm eligibility in MyKnowledge (Salesforce).'}</div>` : ''}
    <div class="j-cards ca">
      ${data.map((p,i)=>{
        const displaySpd = p.displaySpeed || p.speed;
        const sel = state.prop.speed?.speed===p.speed && state.prop.speed?.tech===p.tech;
        const techLabel = isFMC ? p.sourceTech : (p.tech==='D3.1' ? 'DOCSIS 3.1' : p.tech==='FTTx15' ? 'FTTx 1.5G' : p.tech);
        return `
          <div class="j-card ${sel?'sel':''}" data-speed-idx="${i}">
            <span class="j-cbadge tc-${isFMC?'FMC':p.tech}">${techLabel}</span>
            <div class="j-card-name">${displaySpd}</div>
            ${isFMC ? `<div class="j-card-fmc" style="font-size:11px;color:var(--muted-2)">${lang==='es'?'Base':'Base'}: ${p.speed}</div>` : (p.fmc ? `<div class="j-card-fmc">${icon('fmc')} FMC: ${p.fmc}</div>` : '')}
            <div class="j-card-range">${lang==='es'?'Desde':'From'} ${fmt(Math.min(...Object.values(p.list).filter(v=>v!=null)))}/mo</div>
          </div>
        `;
      }).join('')}
    </div>
    <button class="j-cont" id="j-cont-speed" ${!state.prop.speed?'disabled style="opacity:.4;cursor:not-allowed"':''}>
      ${lang==='es'?'Continuar':'Continue'} ${icon('arrow')}
    </button>
  `;
}
function propBindStepSpeed(){
  const isFMC = state.prop.tech === 'FMC';
  const data = state.prop.tech==='COAX' ? COAX_OFFER : isFMC ? FMC_PLANS : FTTX_OFFER;
  $$('[data-speed-idx]').forEach(el=>{
    el.addEventListener('click', ()=>{
      state.prop.speed = data[parseInt(el.dataset.speedIdx)];
      state.prop.bundle = null; state.prop.priceType = null;
      state.prop.voice.included = 0;
      propRender();
    });
  });
  const cont = $('#j-cont-speed');
  if (cont) cont.addEventListener('click', ()=>{
    if (!state.prop.speed) return;
    state.prop.step = 2; propRender();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: BUNDLE
// ═══════════════════════════════════════════════════════════════════════════
function propStepBundle(){
  const p = state.prop.speed;
  const isEs = lang === 'es';
  const bundles = [
    {id:'p1',  name:'1P',          sub:isEs?'Solo Internet':'Internet only',            icon:'internet'},
    {id:'p2',  name:'2P',          sub:isEs?'Internet + Voz':'Internet + Voice',         icon:'phone'},
    {id:'p3b', name:'3P Broadcast',sub:isEs?'+ Video Broadcast':'+ Broadcast Video',     icon:'tv'},
    {id:'p3e', name:'3P Español',  sub:isEs?'+ Español De Primera':'+ Español De Primera',icon:'tv'},
    {id:'p3u', name:'3P Ultimate', sub:isEs?'+ Video Ultimate':'+ Ultimate Video',        icon:'tv'}
  ];

  const selBundle  = state.prop.bundle;
  const hasVoice   = selBundle === 'p2' || (selBundle && selBundle.startsWith('p3'));
  const voipMax    = state.prop.speed?.voip || 1;
  const inclLines  = state.prop.voice.included || 0;
  const canCont    = selBundle && (!hasVoice || inclLines > 0);

  // Voice lines selector — only shown for 2P/3P bundles
  const voiceHtml = hasVoice ? `
    <div class="jao-grp" style="margin-top:18px">
      <div class="jao-gtl">${icon('phone')} ${isEs ? 'Líneas de Voz Incluidas en el Bundle' : 'Voice Lines Included in Bundle'}</div>
      <p class="section-head-sub" style="margin:4px 0 12px">
        ${isEs
          ? `Este plan incluye hasta <strong>${voipMax}</strong> línea(s) VoIP sin cargo adicional. Selecciona cuántas deseas activar.`
          : `This plan includes up to <strong>${voipMax}</strong> VoIP line(s) at no extra charge. Select how many to activate.`}
      </p>
      <div class="j-cards ca">
        ${Array.from({length: voipMax}, (_,i) => i+1).map(n => `
          <div class="j-card ${inclLines===n?'sel':''}" data-voicelines="${n}" style="text-align:center;padding:16px 10px">
            <div class="j-card-name" style="font-size:26px;font-weight:800;line-height:1.1">${n}</div>
            <div class="j-card-sub">${isEs ? (n===1?'línea':'líneas') : (n===1?'line':'lines')}</div>
            <div style="font-size:10px;color:#16a34a;font-weight:700;margin-top:4px">${isEs?'Incluida':'Included'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="j-cards ca">
      ${bundles.map(b=>{
        const list = p.list?.[b.id];
        const promo = p.promo?.[b.id];
        const avail = list != null;
        const sel = selBundle === b.id;
        return `
          <div class="j-card ${sel?'sel':''} ${!avail?'off':''}" data-bundle="${b.id}">
            <div class="j-card-icon">${icon(b.icon)}</div>
            <div class="j-card-name">${b.name}</div>
            <div class="j-card-sub">${b.sub}</div>
            <div class="j-card-price ${!avail?'na':''}">
              ${avail
                ? `${fmt(list)}<small>/${isEs?'mes':'mo'}</small>${promo!=null?` <small style="color:var(--orange);font-weight:800">→ ${fmt(promo)}</small>`:''}`
                : (isEs?'No disponible':'Not available')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ${voiceHtml}
    <button class="j-cont" id="j-cont-bundle" ${!canCont?'disabled style="opacity:.4;cursor:not-allowed"':''}>
      ${isEs?'Continuar':'Continue'} ${icon('arrow')}
    </button>
  `;
}
function propBindStepBundle(){
  $$('[data-bundle]').forEach(el=>{
    if (el.classList.contains('off')) return;
    el.addEventListener('click', ()=>{
      const newBundle = el.dataset.bundle;
      if (state.prop.bundle !== newBundle) {
        state.prop.bundle = newBundle;
        state.prop.priceType = null;
        state.prop.voice.included = 0; // reset when bundle type changes
      }
      propRender();
    });
  });
  $$('[data-voicelines]').forEach(el=>{
    el.addEventListener('click', ()=>{
      state.prop.voice.included = parseInt(el.dataset.voicelines);
      propRender();
    });
  });
  const cont = $('#j-cont-bundle');
  if (cont) cont.addEventListener('click', ()=>{
    if (!state.prop.bundle) return;
    const needsVoice = state.prop.bundle==='p2' || state.prop.bundle.startsWith('p3');
    if (needsVoice && !state.prop.voice.included) return;
    state.prop.step = 3; propRender();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: PRICE TYPE
// ═══════════════════════════════════════════════════════════════════════════
function propStepPrice(){
  const p = state.prop.speed;
  const b = state.prop.bundle;
  const list = p.list?.[b];
  const promo = p.promo?.[b];

  const isEs = lang === 'es';
  const ltoRows = (p.tech==='FTTx' || p.tech==='FTTx15') ? FTTX_LTO : COAX_LTO;
  const ltoRow = ltoRows.find(r=>r.speed===p.speed);
  // The three LTO columns are separate offers with separate prices — the rep says
  // which one they are authorised to give instead of the app assuming FMC.
  const ltoVariants = ['lto-list','lto-lead','lto-fmc'].map(id=>{
    const c = LTO_COLS[id];
    return {
      id,
      name: isEs ? c.es.replace('LTO · ','') : c.en.replace('LTO · ',''),
      val:  ltoRow ? (b==='p2' ? ltoRow[c.p2] : b.startsWith('p3') ? ltoRow[c.p3] : null) : null
    };
  });
  const anyLto = ltoVariants.some(v=>v.val != null);

  const opts = [
    {id:'list',  name:isEs?'Precio Lista':'List Price', sub:isEs?'Tarifa estándar 2026':'Standard 2026 rate', val:list,  color:'blue'},
    {id:'promo', name:isEs?'Promoción':'Promo',         sub:isEs?'Descuento aplicable':'Applicable discount', val:promo, color:'orange'}
  ];

  return `
    <div class="j-cards c2">
      ${opts.map(o=>{
        const avail = o.val != null;
        const sel = state.prop.priceType === o.id;
        return `
          <div class="j-card ${sel?'sel':''} ${!avail?'off':''}" data-price="${o.id}">
            <span class="j-cbadge" style="background:${o.color==='blue'?'#dbeafe':'#ffe1cf'};color:${o.color==='blue'?'#0a4a85':'#9d3a00'}">${o.name}</span>
            <div class="j-card-sub">${o.sub}</div>
            <div class="j-card-price ${!avail?'na':''}">
              ${avail ? `${fmt(o.val)}<small>/${isEs?'mes':'mo'}</small>` : (isEs?'No disponible':'Not available')}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="j-card ${String(state.prop.priceType).indexOf('lto')===0?'sel':''} ${!anyLto?'off':''}"
         style="margin-top:12px; cursor:default">
      <span class="j-cbadge" style="background:#e6dcfa;color:#4527a0">LTO</span>
      <div class="j-card-sub">${isEs?'Oferta limitada con contrato — escoge cuál aplica':'Limited offer w/ contract — pick which one applies'}</div>
      ${anyLto ? `
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px">
          ${ltoVariants.map(v=>{
            const avail = v.val != null;
            const sel = state.prop.priceType === v.id;
            return `
              <button type="button" data-price="${v.id}" ${!avail?'disabled':''}
                style="flex:1 1 140px; text-align:left; padding:9px 12px; border-radius:9px; cursor:${avail?'pointer':'not-allowed'};
                       border:1.5px solid ${sel?'#4527a0':'var(--line)'}; background:${sel?'#efe9fb':'var(--surface)'};
                       opacity:${avail?1:.4}; font-family:inherit">
                <div style="font-size:11px; font-weight:700; color:${sel?'#4527a0':'var(--muted-2)'}; text-transform:uppercase; letter-spacing:.3px">${v.name}</div>
                <div style="font-size:15px; font-weight:800; color:${sel?'#4527a0':'var(--ink-2)'}; margin-top:2px">
                  ${avail ? `${fmt(v.val)}<small style="font-size:10px;font-weight:500">/${isEs?'mes':'mo'}</small>` : (isEs?'N/D':'N/A')}
                </div>
              </button>`;
          }).join('')}
        </div>` : `<div class="j-card-price na">${isEs?'No disponible para esta velocidad':'Not available for this speed'}</div>`}
    </div>

    <button class="j-cont" id="j-cont-price" ${!state.prop.priceType?'disabled style="opacity:.4;cursor:not-allowed"':''}>
      ${isEs?'Continuar':'Continue'} ${icon('arrow')}
    </button>
  `;
}
function propBindStepPrice(){
  $$('[data-price]').forEach(el=>{
    if (el.classList.contains('off') || el.disabled) return;
    el.addEventListener('click', ()=>{
      state.prop.priceType = el.dataset.price;
      propRender();
    });
  });
  const cont = $('#j-cont-price');
  if (cont) cont.addEventListener('click', ()=>{
    if (!state.prop.priceType) return;
    state.prop.step = 4; propRender();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: EXTRAS
// ═══════════════════════════════════════════════════════════════════════════
function propStepExtras(){
  const b = state.prop.bundle;
  const isVoz1P = b === 'p1v';
  const isVoiceIncluded = b==='p2' || b.startsWith('p3');
  const isVideoIncluded = b.startsWith('p3');

  const aoToggle = (id, checked) => {
    if (checked) state.prop.addons[id] = ADDONS.find(a=>a.id===id).price;
    else delete state.prop.addons[id];
  };

  return `
    <!-- Add-ons -->
    <div class="jao-grp">
      <div class="jao-gtl">${icon('cog')} ${t('prop.extras.addons')}</div>
      <div class="jao-grid">
        ${ADDONS.map(a=>{
          const on = state.prop.addons[a.id] != null;
          return `
            <label class="jao-item ${on?'on':''}">
              <input type="checkbox" data-ao="${a.id}" ${on?'checked':''}>
              <div style="flex:1">
                <div class="jao-iname">${a.name}</div>
                <div class="jao-isub">${a.sub}</div>
              </div>
              <div class="jao-iprice">${fmt(a.price)}</div>
            </label>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Voice -->
    <div class="jao-grp">
      <div class="jao-gtl">${icon('phone')} ${t('prop.extras.voice')}</div>
      ${isVoz1P ? `<div class="jao-inc">${icon('check')} ${lang==='es'?'Primera línea incluida en el plan ($34.99). Agrega líneas adicionales abajo.':'First line included in plan ($34.99). Add additional lines below.'}</div>` :
        isVoiceIncluded ? `<div class="jao-inc">${icon('check')} ${
          state.prop.voice.included
            ? (lang==='es'
                ? `${state.prop.voice.included} ${state.prop.voice.included===1?'línea VoIP incluida':'líneas VoIP incluidas'} en el bundle. Las líneas de abajo son <strong>adicionales</strong>.`
                : `${state.prop.voice.included} VoIP ${state.prop.voice.included===1?'line':'lines'} included in bundle. Lines below are <strong>additional</strong>.`)
            : (lang==='es'?'Voz incluida en el bundle.':'Voice included in bundle.')
        }</div>` : `
          <div class="jao-grid">
            <label class="jao-item ${state.prop.voice.first?'on':''}">
              <input type="checkbox" data-voice="first" ${state.prop.voice.first?'checked':''}>
              <div style="flex:1">
                <div class="jao-iname">${t('voice.first')}</div>
                <div class="jao-isub">${t('voice.first.sub')}</div>
              </div>
              <div class="jao-iprice">${fmt(34.99)}</div>
            </label>
          </div>
        `}
      <div class="jao-grid" style="margin-top:8px">
        <div class="jao-qty">
          <div style="flex:1">
            <div class="jao-iname">${t('voice.add')}</div>
            <div class="jao-isub">${(isVoiceIncluded || isVoz1P) ? t('voice.add.inbundle.sub') : (lang==='es'?'1ra: $34.99 · 2da+: $29.99 · máx 9':'1st: $34.99 · 2nd+: $29.99 · max 9')}</div>
          </div>
          <input type="number" min="0" max="9" value="${Math.min(state.prop.voice.additional, 9)}" data-voice-qty>
        </div>
      </div>
    </div>

    <!-- Video / STB -->
    <div class="jao-grp">
      <div class="jao-gtl">${icon('tv')} ${t('prop.extras.video')}</div>
      ${isVideoIncluded ? `<div class="jao-inc">${icon('check')} ${lang==='es'?'1 STB incluido en el bundle 3P. STB adicionales abajo.':'1 STB included in 3P bundle. Additional STBs below.'}</div>` : `
        <div class="jao-note">${icon('info')} ${lang==='es'?'Bundle no incluye Video. Selecciona equipos individualmente o cambia a 3P.':'Bundle does not include Video. Select equipment individually or switch to 3P.'}</div>
      `}
      <div class="jao-grid">
        <div class="jao-qty">
          <div style="flex:1">
            <div class="jao-iname">${lang==='es'?'STBs Adicionales':'Additional STBs'}</div>
            <div class="jao-isub">+1: $6.99 · +2: $5.99 · +3: $3.99</div>
          </div>
          <input type="number" min="0" max="30" value="${state.prop.video.stb2qty}" data-vid="stb2qty">
        </div>
        <div class="jao-qty">
          <div style="flex:1">
            <div class="jao-iname">${lang==='es'?'Outlets Adic.':'Add. Outlets'}</div>
            <div class="jao-isub">${fmt(7.5)} ${lang==='es'?'cada uno':'each'}</div>
          </div>
          <input type="number" min="0" max="20" value="${state.prop.video.outlets}" data-vid="outlets">
        </div>
      </div>

      ${(b==='p3u'||b==='p2u') ? `
        <div style="margin-top:14px">
          <div class="jao-prem-hdr">${icon('check')} ${t('s.ultaddons')}</div>
          <div class="jao-grid">
            ${ULT_ADDONS.map(u=>{
              const on = state.prop.video.ultAddons[u.id] != null;
              return `
                <label class="jao-item ${on?'on':''}">
                  <input type="checkbox" data-ult="${u.id}" ${on?'checked':''}>
                  <div style="flex:1">
                    <div class="jao-iname">${u.name}</div>
                  </div>
                  <div class="jao-iprice">${fmt(u.price)}</div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${FOX_DEPORTES.compat.includes(b) ? `
        <div style="margin-top:14px">
          <div class="jao-prem-hdr">${icon('tv')} Fox Deportes</div>
          <div class="jao-grid">
            <label class="jao-item ${state.prop.video.foxDeportes?'on':''}">
              <input type="checkbox" data-fox="1" ${state.prop.video.foxDeportes?'checked':''}>
              <div style="flex:1">
                <div class="jao-iname">Fox Deportes</div>
                <div class="jao-isub">${t('s.fox.compat')}</div>
              </div>
              <div class="jao-iprice">${fmt(FOX_DEPORTES.price)}</div>
            </label>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Hardware -->
    <div class="jao-grp">
      <div class="jao-gtl">${icon('hardware')} ${t('prop.extras.hw')}</div>
      <div class="jao-grid">
        ${HARDWARE.map(h=>{
          const on = state.prop.hw[h.id] != null;
          return `
            <label class="jao-item ${on?'on':''}">
              <input type="checkbox" data-hw="${h.id}" ${on?'checked':''}>
              <div style="flex:1">
                <div class="jao-iname">${h.name}</div>
                <div class="jao-isub">${h.sub}</div>
              </div>
              <div class="jao-iprice">${fmt(h.price)}</div>
            </label>
          `;
        }).join('')}
      </div>
    </div>

    <button class="j-cont" id="j-cont-extras">${lang==='es'?'Continuar':'Continue'} ${icon('arrow')}</button>
  `;
}
function propBindStepExtras(){
  $$('[data-ao]').forEach(el=>{
    el.addEventListener('change', ()=>{
      const id = el.dataset.ao;
      const a = ADDONS.find(x=>x.id===id);
      if (el.checked) state.prop.addons[id] = a.price;
      else delete state.prop.addons[id];
      propRenderSidebar();
      el.closest('.jao-item').classList.toggle('on', el.checked);
    });
  });
  $$('[data-voice]').forEach(el=>{
    el.addEventListener('change', ()=>{
      state.prop.voice.first = el.checked;
      propRenderSidebar();
      el.closest('.jao-item').classList.toggle('on', el.checked);
    });
  });
  const vq = $('[data-voice-qty]');
  if (vq) vq.addEventListener('input', e=>{ state.prop.voice.additional = +e.target.value || 0; propRenderSidebar(); });
  $$('[data-vid]').forEach(el=>{
    el.addEventListener('input', ()=>{
      state.prop.video[el.dataset.vid] = +el.value || 0;
      propRenderSidebar();
    });
  });
  $$('[data-ult]').forEach(el=>{
    el.addEventListener('change', ()=>{
      const id = el.dataset.ult;
      const u = ULT_ADDONS.find(x=>x.id===id);
      if (el.checked) state.prop.video.ultAddons[id] = u.price;
      else delete state.prop.video.ultAddons[id];
      propRenderSidebar();
      el.closest('.jao-item').classList.toggle('on', el.checked);
    });
  });
  $$('[data-fox]').forEach(el=>{
    el.addEventListener('change', ()=>{
      state.prop.video.foxDeportes = el.checked;
      propRenderSidebar();
      el.closest('.jao-item').classList.toggle('on', el.checked);
    });
  });
  $$('[data-hw]').forEach(el=>{
    el.addEventListener('change', ()=>{
      const id = el.dataset.hw;
      const h = HARDWARE.find(x=>x.id===id);
      if (el.checked) state.prop.hw[id] = h.price;
      else delete state.prop.hw[id];
      propRenderSidebar();
      el.closest('.jao-item').classList.toggle('on', el.checked);
    });
  });
  $('#j-cont-extras').addEventListener('click', ()=>{ state.prop.step = 5; propRender(); });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: CONTRACT TERM
// ═══════════════════════════════════════════════════════════════════════════
function propStepContract(){
  const isEs = lang === 'es';
  const meta = {
    none: {badge: isEs?'Sin Contrato':'No Contract',  sub: isEs?'Mes a mes':'Month to month',        color:'gray'},
    '12m':{badge: isEs?'12 Meses':'12 Months',        sub: isEs?'Contrato anual':'Annual contract',  color:'orange'},
    '24m':{badge: isEs?'24 Meses':'24 Months',        sub: isEs?'Contrato bienal':'Biennial contract', color:'blue'},
    '36m':{badge: isEs?'36 Meses':'36 Months',        sub: isEs?'Contrato trienal':'Triennial contract', color:'purple'}
  };
  const terms = CONTRACT_TERMS.map(t => Object.assign({}, t, meta[t.id]));

  const colorMap = {
    gray:   {bg:'#f3f4f6', fg:'#4b5563'},
    orange: {bg:'#ffe1cf', fg:'#9d3a00'},
    blue:   {bg:'#dbeafe', fg:'#0a4a85'},
    purple: {bg:'#e6dcfa', fg:'#4527a0'}
  };
  const oneTimeLabel = isEs ? 'Pago único' : 'One-time fee';

  return `
    <div class="jao-note" style="margin-bottom:12px">${icon('info')} ${isEs?'Estos son cargos únicos de activación, no cargos mensuales. Cada término tiene dos costos posibles — escoge el que aplica al deal.':'These are one-time activation fees, not monthly charges. Each term has two possible costs — pick the one that applies to the deal.'}</div>
    <div class="j-cards c2">
      ${terms.map(t => {
        const selTerm = state.prop.contract === t.id;
        const clr = colorMap[t.color];
        return `
          <div class="j-card ${selTerm?'sel':''}" style="cursor:default">
            <span class="j-cbadge" style="background:${clr.bg};color:${clr.fg}">${t.badge}</span>
            <div class="j-card-sub">${t.sub}</div>
            <div style="display:flex; gap:8px; margin-top:10px">
              ${t.fees.map(f => {
                // Selected only when BOTH the term and this exact fee are chosen —
                // two terms can share a price, so the term must match too.
                const sel = selTerm && propContractFee() === f;
                const free = f === 0;
                return `
                  <button type="button" data-contract="${t.id}" data-fee="${f}"
                    style="flex:1; padding:9px 6px; border-radius:9px; cursor:pointer; font-family:inherit;
                           border:1.5px solid ${sel?clr.fg:'var(--line)'};
                           background:${sel?clr.bg:'var(--surface)'}">
                    <div style="font-size:15px; font-weight:800; color:${sel?clr.fg:(free?'#16a34a':'var(--ink-2)')}">
                      ${free ? (isEs?'Gratis':'Free') : fmt(f)}
                    </div>
                    <div style="font-size:9px; font-weight:600; color:var(--muted-2); text-transform:uppercase; letter-spacing:.3px; margin-top:1px">
                      ${oneTimeLabel}
                    </div>
                  </button>`;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <button class="j-cont" id="j-cont-contract" ${!propContractDone()?'disabled style="opacity:.4;cursor:not-allowed"':''}>
      ${isEs?'Continuar':'Continue'} ${icon('arrow')}
    </button>
  `;
}
function propBindStepContract(){
  $$('[data-contract]').forEach(el => {
    el.addEventListener('click', () => {
      state.prop.contract = el.dataset.contract;
      // The fee rides with the click, so the term can never be left with a stale
      // price from a different term.
      state.prop.contractFee = el.dataset.fee != null ? Number(el.dataset.fee) : null;
      propRender();
    });
  });
  const cont = $('#j-cont-contract');
  if (cont) cont.addEventListener('click', () => {
    if (!propContractDone()) return;
    state.prop.step = 6; propRender();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7: CUSTOMER INFO
// ═══════════════════════════════════════════════════════════════════════════
function propStepInfo(){
  const c = state.prop.customer;
  return `
    <div class="jc-form">
      <div class="jc-fg full">
        <label class="jc-fl">${t('prop.company')}</label>
        <input class="jc-fi" type="text" id="jc-company" value="${c.company||''}" placeholder="${lang==='es'?'Ej. ABC Corp':'e.g. ABC Corp'}">
      </div>
      <div class="jc-fg">
        <label class="jc-fl">${t('prop.customer')}</label>
        <input class="jc-fi" type="text" id="jc-name" value="${c.name||''}" placeholder="${lang==='es'?'Ej. Juan Pérez':'e.g. John Doe'}">
      </div>
      <div class="jc-fg">
        <label class="jc-fl">${t('prop.account')}</label>
        <input class="jc-fi" type="text" id="jc-acc" value="${c.account||''}" placeholder="000-000-000">
      </div>
      <div class="jc-fg">
        <label class="jc-fl">${t('prop.rep')}</label>
        <input class="jc-fi" type="text" id="jc-rep" value="${c.rep||''}">
      </div>
      <div class="jc-fg">
        <label class="jc-fl">${t('prop.date')}</label>
        <input class="jc-fi" type="date" id="jc-date" value="${c.date||''}">
      </div>
      <div class="jc-fg full">
        <label class="jc-fl">${lang==='es'?'Notas':'Notes'}</label>
        <textarea class="jc-fi" id="jc-notes" rows="3" placeholder="${t('prop.notes')}">${c.notes||''}</textarea>
      </div>
    </div>

    ${propRenderSummaryInline()}

    <div class="j-actions">
      <button class="btn-secondary" id="jc-back">${icon('back')} ${lang==='es'?'Atrás':'Back'}</button>
      <button class="j-cont" id="jc-cont" style="margin-top:0;flex:1">
        ${lang==='es'?'Continuar al contrato':'Continue to contract'} ${icon('arrow')}
      </button>
    </div>
  `;
}
function propBindStepInfo(){
  ['company','name','acc','rep','date','notes'].forEach(k=>{
    const el = $('#jc-'+k);
    if (!el) return;
    el.addEventListener('input', ()=>{
      const map = {company:'company',name:'name',acc:'account',rep:'rep',date:'date',notes:'notes'};
      state.prop.customer[map[k]] = el.value;
    });
  });
  $('#jc-back').addEventListener('click', ()=>{ state.prop.step = 5; propRender(); });
  const cont = $('#jc-cont');
  if (cont) cont.addEventListener('click', ()=>{ state.prop.step = 7; propRender(); });
}

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME FEES helper
// ═══════════════════════════════════════════════════════════════════════════
function propGetOneTimeFees(){
  const p = state.prop;
  const fees = [];
  // Hunting one-time fee
  if (p.addons['ao2'] != null) {
    const h = ADDONS.find(x=>x.id==='ao2');
    if (h && h.oneTime) fees.push({name: h.name, price: h.oneTime});
  }
  return fees;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY (inline at step 6 + sidebar)
// ═══════════════════════════════════════════════════════════════════════════
function propGetTotal(){
  const p = state.prop;
  let tot = 0;
  if (p.speed && p.bundle && p.priceType) {
    tot += propBundlePrice(p.speed, p.priceType, p.bundle) || 0;
  }
  Object.values(p.addons).forEach(v=>tot+=v);
  if (p.voice.first) tot += 34.99;
  tot += calcVoiceAdditionalCost(p.voice.additional||0);
  if (p.video.stb2qty) tot += calcStbCost(p.video.stb2qty);
  tot += (p.video.outlets||0) * 7.5;
  if (p.video.foxDeportes) tot += FOX_DEPORTES.price;
  Object.values(p.video.ultAddons).forEach(v=>tot+=v);
  Object.values(p.hw).forEach(v=>tot+=v);
  // NOTE: contract fee is one-time, NOT included in monthly total
  return tot;
}

function propGetItems(){
  const p = state.prop;
  const items = [];
  if (p.speed && p.bundle && p.priceType) {
    const price = propBundlePrice(p.speed, p.priceType, p.bundle);
    const bundleNames = {p1:'1P Data',p2:'2P HSD+VoIP',p3b:'3P Broadcast',p3e:'3P Español/EDP',p3u:'3P Ultimate',
                         p2e:'2P Español De Primera',p2u:'2P Ultimate',p1v:'Voz 1P Standalone'};
    const ptName = propPriceTypeShort(p.priceType);
    const hasVoiceBundle = p.bundle==='p2' || p.bundle.startsWith('p3');
    const voiceLineStr = hasVoiceBundle && p.voice.included
      ? ` · ${p.voice.included} ${lang==='es' ? (p.voice.included===1?'línea VoIP':'líneas VoIP') : (p.voice.included===1?'VoIP line':'VoIP lines')} incl.`
      : '';
    const planName = p.speed._vid2p
      ? `${bundleNames[p.bundle]} — ${p.speed.tech} ${p.speed.speed}`
      : `${bundleNames[p.bundle]||p.bundle} ${p.speed.displaySpeed||p.speed.speed}`;
    items.push({
      name: planName,
      desc: `${p.speed.tech} · ${ptName}${voiceLineStr}`,
      price: price || 0
    });
  }
  Object.entries(p.addons).forEach(([id,price])=>{
    const a = ADDONS.find(x=>x.id===id);
    items.push({name:a.name, desc:a.sub, price});
  });
  if (p.voice.first) items.push({name:t('voice.first'), desc:t('voice.first.sub'), price:34.99});
  if (p.voice.additional) {
    const vCost = calcVoiceAdditionalCost(p.voice.additional);
    items.push({name:`${t('voice.add')} ×${p.voice.additional}`, desc:t('voice.add.sub'), price:vCost});
  }
  if (p.video.stb2qty) {
    const stbCost = calcStbCost(p.video.stb2qty);
    items.push({name:`${lang==='es'?'STB Adicional':'Additional STB'} ×${p.video.stb2qty}`, desc:lang==='es'?'Tarifa escalonada':'Tiered rate', price:stbCost});
  }
  if (p.video.outlets) items.push({name:`${lang==='es'?'Outlet Adic.':'Add. Outlets'} ×${p.video.outlets}`, desc:'', price:p.video.outlets*7.5});
  if (p.video.foxDeportes) items.push({name:'Fox Deportes', desc:t('s.fox.compat'), price:FOX_DEPORTES.price});
  Object.entries(p.video.ultAddons).forEach(([id,price])=>{
    const u = ULT_ADDONS.find(x=>x.id===id);
    items.push({name:u.name, desc:'Ultimate Add-on', price});
  });
  Object.entries(p.hw).forEach(([id,price])=>{
    const h = HARDWARE.find(x=>x.id===id);
    items.push({name:h.name, desc:h.sub, price});
  });
  // Contract fee is one-time — not part of monthly items
  return items;
}

function propRenderSummaryInline(){
  const items = propGetItems();
  const tot = propGetTotal();
  return `
    <div class="jc-summary">
      <div class="jc-summary-ttl">${t('prop.summary')}</div>
      ${items.length ? items.map((it,i)=>`
        <div class="jc-summary-row ${i===0?'lead':''}">
          <span class="name">${it.name}</span>
          <span class="price">${fmt(it.price)}</span>
        </div>
      `).join('') : `<div style="text-align:center;padding:20px;color:var(--muted-2);font-size:13px">${t('prop.empty')}</div>`}
      <div class="jc-summary-tot">
        <span class="lbl">${t('prop.total')}</span>
        <span class="val">${fmt(tot)}</span>
      </div>
      ${(()=>{
        const fees = propGetOneTimeFees();
        if (!fees.length) return '';
        return `<div class="jc-summary-onetime">
          <div class="jc-summary-otlbl">${lang==='es'?'Cargos únicos':'One-time fees'}</div>
          ${fees.map(f=>`
            <div class="jc-summary-row">
              <span class="name">${f.name}</span>
              <span class="price" style="color:var(--orange)">${fmt(f.price)} <small style="font-size:10px;color:var(--muted-2)">${lang==='es'?'(único)':'(1x)'}</small></span>
            </div>
          `).join('')}
        </div>`;
      })()}
    </div>
  `;
}

function propRenderSidebar(){
  const p = state.prop;
  const sb = $('#j-sumbox-content');
  if (!sb) return;

  let planHtml = '';
  if (p.speed && p.bundle && p.priceType) {
    const price = propBundlePrice(p.speed, p.priceType, p.bundle);
    const bundleNames = {p1:'1P Data',p2:'2P HSD+VoIP',p3b:'3P Broadcast',p3e:'3P Español/EDP',p3u:'3P Ultimate',p2e:'2P Español De Primera',p2u:'2P Ultimate',p1v:'Voz 1P Standalone'};
    const hasVoiceS = p.bundle==='p2' || p.bundle.startsWith('p3');
    const voiceLineTag = hasVoiceS && p.voice.included
      ? `<div style="font-size:11px;color:var(--muted-2);margin-top:2px">${p.voice.included} ${lang==='es'?(p.voice.included===1?'línea VoIP incl.':'líneas VoIP incl.'):(p.voice.included===1?'VoIP line incl.':'VoIP lines incl.')}</div>`
      : '';
    planHtml = `
      <div class="j-sumbox-plan">
        <div class="j-sumbox-pname">${bundleNames[p.bundle]} · ${p.speed.displaySpeed||p.speed.speed} · ${p.speed.tech}</div>
        ${voiceLineTag}
        <div class="j-sumbox-pprice">${fmt(price)}<small>/${lang==='es'?'mes':'mo'}</small></div>
      </div>
    `;
  }

  const aos = [];
  Object.entries(p.addons).forEach(([id,price])=>{
    const a = ADDONS.find(x=>x.id===id);
    aos.push({name:a.name, price});
  });
  if (p.voice.first) aos.push({name:t('voice.first'), price:34.99});
  if (p.voice.additional) aos.push({name:`${t('voice.add')} ×${p.voice.additional}`, price:calcVoiceAdditionalCost(p.voice.additional)});
  if (p.video.stb2qty) aos.push({name:`STB Adic. ×${p.video.stb2qty}`, price:calcStbCost(p.video.stb2qty)});
  if (p.video.outlets) aos.push({name:`Outlets ×${p.video.outlets}`, price:p.video.outlets*7.5});
  if (p.video.foxDeportes) aos.push({name:'Fox Deportes', price:FOX_DEPORTES.price});
  Object.entries(p.video.ultAddons).forEach(([id,price])=>{
    const u = ULT_ADDONS.find(x=>x.id===id); aos.push({name:u.name, price});
  });
  Object.entries(p.hw).forEach(([id,price])=>{
    const h = HARDWARE.find(x=>x.id===id); aos.push({name:h.name, price});
  });

  const tot = propGetTotal();
  const totalCount = (p.speed && p.bundle && p.priceType ? 1 : 0) + aos.length;

  sb.innerHTML = `
    <div class="j-sumbox-ttl">
      <span>${t('prop.summary')}</span>
      <span class="j-sumbox-count">${totalCount}</span>
    </div>
    ${planHtml || `<div class="j-sumbox-empty">${t('prop.empty')}</div>`}
    ${aos.length ? `<div class="j-sumbox-aos">${aos.map(a=>`
      <div class="j-sumbox-ao"><span class="name">${a.name}</span><span class="price">${fmt(a.price)}</span></div>
    `).join('')}</div>` : ''}
    <div class="j-sumbox-divider"></div>
    <div class="j-sumbox-tot">
      <span class="lbl">${t('prop.total')}</span>
      <span class="val">${fmt(tot)}</span>
    </div>
    ${(()=>{
      const ct = CONTRACT_TERMS.find(x=>x.id===p.contract);
      if (!ct) return '';
      const lbl = ct.id==='none' ? (lang==='es'?'Sin Contrato':'No Contract') : `${ct.months} ${lang==='es'?'Meses':'Months'}`;
      const fee = propContractFee();
      const val = fee === null
        ? `<span style="color:var(--muted-2);font-weight:600">${lang==='es'?'costo pendiente':'cost pending'}</span>`
        : fee === 0 ? `<span style="color:#16a34a;font-weight:700">${lang==='es'?'Gratis':'Free'}</span>`
        : `<span style="font-weight:700;color:var(--orange)">${fmt(fee)}</span>`;
      return `<div class="j-sumbox-contract"><span>${lang==='es'?'Contrato':'Contract'}: ${lbl}</span><span>${val} <small style="color:var(--muted-2);font-size:10px">${lang==='es'?'(único)':'(1x)'}</small></span></div>`;
    })()}
    ${(()=>{
      const fees = propGetOneTimeFees();
      if (!fees.length) return '';
      return fees.map(f=>`
        <div class="j-sumbox-contract" style="border-color:var(--orange)">
          <span>${f.name}</span>
          <span style="font-weight:700;color:var(--orange)">${fmt(f.price)} <small style="color:var(--muted-2);font-size:10px;font-weight:400">${lang==='es'?'(único)':'(1x)'}</small></span>
        </div>
      `).join('');
    })()}
    <div class="j-sumbox-actions">
      <button class="btn-gen" id="sb-gen" ${totalCount===0?'disabled':''}>${icon('print')} ${t('prop.generate')}</button>
      <button class="btn-pdf" id="sb-pdf" ${totalCount===0?'disabled':''}>${icon('download')} ${t('prop.download')}</button>
      <button class="btn-ctr" id="sb-ctr" ${totalCount===0?'disabled':''}>${icon('doc')} ${t('prop.contractdoc')}</button>
      <button class="btn-rst" id="sb-rst">${icon('refresh')} ${lang==='es'?'Reiniciar':'Reset'}</button>
    </div>
  `;
  const gen = $('#sb-gen');
  if (gen) gen.addEventListener('click', ()=>{
    if (state.prop.step < 6) { state.prop.step = 6; propRender(); }
    else { buildPrintView(); window.print(); }
  });
  const pdf = $('#sb-pdf');
  if (pdf) pdf.addEventListener('click', ()=>{
    if (state.prop.step < 6) { state.prop.step = 6; propRender(); return; }
    downloadProposalPDF();
  });
  // Jump to the contract step. Always scroll — otherwise clicking this while
  // already on step 8 re-renders the identical view and looks like a dead button.
  const ctr = $('#sb-ctr');
  if (ctr) ctr.addEventListener('click', ()=>{
    if (state.prop.step !== 7) { state.prop.step = 7; propRender(); }
    requestAnimationFrame(()=>{
      const target = $('#ctr-top') || $('#ctr-dl');
      if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
  $('#sb-rst').addEventListener('click', ()=>{
    if (confirm(lang==='es'?'¿Reiniciar la propuesta?':'Reset the proposal?')) {
      state.prop = null; propInit(); propRender();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN RENDER — switches on step
// ═══════════════════════════════════════════════════════════════════════════
function propRender(){
  propInit();
  // FMC auto-sets LTO and skips the price type step. An FMC plan *is* the FMC
  // offer, so the variant is named explicitly rather than left to the legacy alias.
  if (state.prop.tech==='FMC' && state.prop.step===3) {
    state.prop.priceType = 'lto-fmc';
    state.prop.step = 4;
  }
  propRenderStepper();

  const main = $('#j-main');
  const stepKey = PROP_STEPS[state.prop.step].key;

  // Build "done" panels above current
  let panelsHtml = '';
  for (let i=0; i<state.prop.step; i++){
    panelsHtml += propRenderDonePanel(i);
  }

  // Current panel
  const titles = {
    tech:     {es:'Selecciona la tecnología',   en:'Select the technology',   eyebrow:lang==='es'?'Paso 1':'Step 1'},
    speed:    {es:'Elige la velocidad',          en:'Choose the speed',        eyebrow:lang==='es'?'Paso 2':'Step 2'},
    bundle:   {es:'Selecciona el bundle',        en:'Select the bundle',       eyebrow:lang==='es'?'Paso 3':'Step 3'},
    price:    {es:'Tipo de precio',              en:'Price type',              eyebrow:lang==='es'?'Paso 4':'Step 4'},
    extras:   {es:'Agrega extras',               en:'Add extras',              eyebrow:lang==='es'?'Paso 5':'Step 5'},
    contract: {es:'Término de contrato',         en:'Contract term',           eyebrow:lang==='es'?'Paso 6':'Step 6'},
    info:     {es:'Información del cliente',     en:'Customer information',    eyebrow:lang==='es'?'Paso 7':'Step 7'},
    doc:      {es:'Contrato — Solicitud de Servicio', en:'Contract — Service Request', eyebrow:lang==='es'?'Paso 8':'Step 8'}
  };
  const tt = titles[stepKey];
  const ttl = lang==='es' ? tt.es : tt.en;

  let body = '';
  if (stepKey==='tech')     body = propStepTech();
  if (stepKey==='speed')    body = propStepSpeed();
  if (stepKey==='bundle')   body = propStepBundle();
  if (stepKey==='price')    body = propStepPrice();
  if (stepKey==='extras')   body = propStepExtras();
  if (stepKey==='contract') body = propStepContract();
  if (stepKey==='info')     body = propStepInfo();
  if (stepKey==='doc')      body = propStepContractDoc();

  panelsHtml += `
    <div class="j-panel">
      <div class="j-phdr">
        <div class="j-phdr-eyebrow">${tt.eyebrow}</div>
        <div class="j-phdr-ttl">${ttl}</div>
      </div>
      <div class="j-pbody">${body}</div>
    </div>
  `;

  main.innerHTML = panelsHtml;

  // Bind clickable done panels (jump back)
  $$('.j-panel.done').forEach(el=>{
    el.addEventListener('click', ()=>{
      state.prop.step = parseInt(el.dataset.step);
      propRender();
    });
  });

  // Bind current step
  if (stepKey==='tech')     propBindStepTech();
  if (stepKey==='speed')    propBindStepSpeed();
  if (stepKey==='bundle')   propBindStepBundle();
  if (stepKey==='price')    propBindStepPrice();
  if (stepKey==='extras')   propBindStepExtras();
  if (stepKey==='contract') propBindStepContract();
  if (stepKey==='info')     propBindStepInfo();
  if (stepKey==='doc')      propBindStepContractDoc();

  propRenderSidebar();
}

function propRenderDonePanel(stepIdx){
  const key = PROP_STEPS[stepIdx].key;
  const labels = {
    tech:     lang==='es'?'Tecnología':'Technology',
    speed:    lang==='es'?'Velocidad':'Speed',
    bundle:   'Bundle',
    price:    lang==='es'?'Tipo de Precio':'Price Type',
    extras:   'Extras',
    contract: lang==='es'?'Término':'Term',
    info:     lang==='es'?'Cliente':'Customer'
  };
  let val = '';
  const p = state.prop;
  if (key==='tech')   val = p.tech;
  if (key==='speed')  val = (p.speed?.displaySpeed || p.speed?.speed) + ' · ' + p.speed?.tech;
  if (key==='bundle') {
    const names = {p1:'1P Data',p2:'2P HSD+VoIP',p3b:'3P Broadcast',p3e:'3P Español/EDP',p3u:'3P Ultimate',p2e:'2P Español De Primera',p2u:'2P Ultimate',p1v:'Voz 1P Standalone'};
    val = names[p.bundle] || '';
    const hasVoiceB = p.bundle==='p2' || p.bundle.startsWith('p3');
    if (hasVoiceB && p.voice.included) {
      val += ` · ${p.voice.included} ${lang==='es' ? (p.voice.included===1?'línea VoIP':'líneas VoIP') : (p.voice.included===1?'VoIP line':'VoIP lines')}`;
    }
  }
  if (key==='price') {
    val = propPriceTypeShort(p.priceType);
    const price = propBundlePrice(p.speed, p.priceType, p.bundle);
    val += ' · ' + fmt(price);
  }
  if (key==='extras') {
    const cnt = Object.keys(p.addons).length + Object.keys(p.video.ultAddons).length + Object.keys(p.hw).length
      + (p.voice.first?1:0) + (p.voice.additional?1:0) + (p.video.stb2qty?1:0) + (p.video.outlets?1:0) + (p.video.foxDeportes?1:0);
    val = cnt + ' ' + (lang==='es'?'extras seleccionados':'extras selected');
  }
  if (key==='contract') {
    const ct = CONTRACT_TERMS.find(t=>t.id===p.contract);
    if (ct) {
      const fee = propContractFee(p);
      const feeTxt = fee === null ? (lang==='es'?'costo pendiente':'cost pending')
                   : fee > 0 ? fmt(fee) : (lang==='es'?'Gratis':'Free');
      const lbl = ct.id==='none' ? (lang==='es'?'Sin contrato':'No contract')
                                 : `${ct.months} ${lang==='es'?'Meses':'Months'}`;
      val = `${lbl} · ${feeTxt}`;
    }
  }
  if (key==='info') {
    val = [p.customer.company, p.customer.name].filter(Boolean).join(' · ')
       || (lang==='es'?'Sin completar':'Not completed');
  }
  return `
    <div class="j-panel done" data-step="${stepIdx}">
      <div class="j-pdone">
        <div class="j-pdone-chk">${icon('check')}</div>
        <div class="j-pdone-ttl">${labels[key]}:</div>
        <div class="j-pdone-val">${val}</div>
        <div class="j-pdone-chg">${lang==='es'?'Cambiar':'Change'} ${icon('arrow')}</div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF DOWNLOAD — jsPDF direct (no html2canvas, no print dialog)
// ═══════════════════════════════════════════════════════════════════════════
function downloadProposalPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'letter', orientation:'portrait', compress: true, putOnlyUsedFonts: true });

  const c     = state.prop.customer;
  const items = propGetItems();
  const tot   = propGetTotal();
  const isEs  = lang === 'es';

  // ── File name ────────────────────────────────────────────────────────────
  const safeCompany = (c.company||'Propuesta').replace(/[^a-z0-9]/gi,'_').slice(0,30);
  const dateStr     = (c.date || new Date().toISOString().slice(0,10)).replace(/-/g,'');
  const filename    = `Liberty_${safeCompany}_${dateStr}.pdf`;

  // ── Layout ───────────────────────────────────────────────────────────────
  const W=612, M=36, cW=W-M*2;
  const BLUE=[0,101,189], ORANGE=[255,83,0];
  const INK=[31,41,55], MUTED=[107,114,128], LIGHT=[248,250,252], LINE=[229,231,235];
  const col1=M+12, col2=M+cW/2+6;

  // ── HEADER ───────────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);  doc.rect(0, 0, W, 58, 'F');
  doc.setFillColor(...ORANGE); doc.rect(0, 58, W, 5, 'F');

  // BW Logo from hidden #proposal-logo img element
  let logoAdded = false;
  try {
    const logoEl = document.getElementById('proposal-logo');
    if (logoEl && logoEl.complete && logoEl.naturalWidth > 0) {
      const lh = 32, lw = lh * (logoEl.naturalWidth / logoEl.naturalHeight);
      const scale = 3; // 3× display size — sufficient for print quality
      const cvs = document.createElement('canvas');
      cvs.width = Math.round(lw * scale); cvs.height = Math.round(lh * scale);
      const ctx = cvs.getContext('2d');
      ctx.fillStyle = '#ffffff'; // white background so BW logo renders cleanly
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(logoEl, 0, 0, cvs.width, cvs.height);
      doc.addImage(cvs.toDataURL('image/jpeg', 0.85), 'JPEG', M, 12, lw, lh);
      doc.setTextColor(255,255,255);
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      doc.text('Fijo SOHO / SMB', M, 52);
      logoAdded = true;
    }
  } catch(e) { /* fallback */ }

  // Fallback: try the colored nav logo (img.brand-logo) and convert pixels to white
  if (!logoAdded) {
    try {
      const brandEl = document.querySelector('img.brand-logo');
      if (brandEl && brandEl.complete && brandEl.naturalWidth > 0) {
        const lh = 32, lw = lh * (brandEl.naturalWidth / brandEl.naturalHeight);
        const scale = 3; // 3× display size — sufficient for print quality
        const cvs = document.createElement('canvas');
        cvs.width = Math.round(lw * scale); cvs.height = Math.round(lh * scale);
        const ctx = cvs.getContext('2d');
        ctx.drawImage(brandEl, 0, 0, cvs.width, cvs.height);
        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i+3] > 10) { d[i]=255; d[i+1]=255; d[i+2]=255; }
        }
        ctx.putImageData(imgData, 0, 0);
        doc.addImage(cvs.toDataURL('image/png'), 'PNG', M, 12, lw, lh);
        doc.setTextColor(255,255,255);
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
        doc.text('Fijo SOHO / SMB', M, 52);
        logoAdded = true;
      }
    } catch(e) { /* fallback to text */ }
  }

  if (!logoAdded) {
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');   doc.setFontSize(16); doc.text('LIBERTY BUSINESS', M, 26);
    doc.setFont('helvetica','normal'); doc.setFontSize(9);  doc.text('Fijo SOHO / SMB', M, 42);
  }

  // Right: proposal title + date
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');   doc.setFontSize(12);
  doc.text(isEs ? 'Propuesta de Servicios' : 'Service Proposal', W-M, 24, { align:'right' });
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.text(c.date || new Date().toISOString().slice(0,10), W-M, 40, { align:'right' });

  let y = 82;

  // ── CUSTOMER INFO ─────────────────────────────────────────────────────────
  // Single-pass render: company row (full width) + 2 paired rows side-by-side
  const hasCompany = !!(c.company && c.company.trim());
  const pairs = [
    [{ lbl: isEs?'CONTACTO':'CONTACT', val: c.name||'—'    }, { lbl: isEs?'CUENTA':'ACCOUNT', val: c.account||'—' }],
    [{ lbl: isEs?'VENDEDOR':'REP',     val: c.rep||'—'     }, { lbl: isEs?'FECHA':'DATE',      val: c.date||'—'   }]
  ];
  const boxH = (hasCompany ? 32 : 0) + pairs.length * 30 + 18;

  doc.setFillColor(...LIGHT); doc.setDrawColor(...LINE);
  doc.roundedRect(M, y, cW, boxH, 4, 4, 'FD');

  let iy = y + 16;

  if (hasCompany) {
    doc.setTextColor(...MUTED); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text(isEs?'EMPRESA':'COMPANY', col1, iy);
    doc.setTextColor(...INK);   doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text(c.company, col1, iy+14);
    iy += 32;
  }

  pairs.forEach(([left, right]) => {
    doc.setTextColor(...MUTED); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text(left.lbl,  col1, iy);
    doc.text(right.lbl, col2, iy);
    doc.setTextColor(...INK); doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(String(left.val),  col1, iy+13);
    doc.text(String(right.val), col2, iy+13);
    iy += 30;
  });

  y += boxH + 12;

  // ── PLAN OVERVIEW CARD ───────────────────────────────────────────────────
  const p = state.prop;
  if (p.speed && p.bundle && p.priceType) {
    const bundleNames = {p1:'1P Data',p2:'2P HSD+VoIP',p3b:'3P Broadcast',p3e:'3P Español/EDP',p3u:'3P Ultimate'};
    // one shared name so the PDF badge can't disagree with the stepper
    const planPrice = propBundlePrice(p.speed, p.priceType, p.bundle);
    const displaySpd = p.speed.displaySpeed || p.speed.speed;
    const bundleName = bundleNames[p.bundle] || p.bundle;
    const ptLabel = propPriceTypeShort(p.priceType, isEs);
    const tKey = p.speed.tech || '';
    const techColorMap = {COAX:[0,101,189],'D3.1':[0,101,189],FTTx:[22,163,74],FTTx15:[22,163,74],FMC:[109,40,217]};
    const tColor = techColorMap[tKey] || BLUE;

    const features = [isEs?'Internet':'Internet'];
    if (p.bundle==='p2' || p.bundle.startsWith('p3')) {
      const lineCount = p.voice.included || 1;
      features.push(`${lineCount} ${isEs ? (lineCount===1?'línea VoIP':'líneas VoIP') : (lineCount===1?'VoIP line':'VoIP lines')}`);
    }
    if (p.bundle.startsWith('p3')) features.push('Video');

    const cardH = 78;
    doc.setFillColor(235,245,255); doc.setDrawColor(180,210,240);
    doc.roundedRect(M, y, cW, cardH, 4, 4, 'FD');

    // Tech badge (top-left)
    doc.setFillColor(...tColor);
    doc.roundedRect(col1, y+10, 52, 17, 3, 3, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.text(tKey, col1+26, y+21, {align:'center'});

    // Speed (large, below badge)
    doc.setTextColor(...INK); doc.setFont('helvetica','bold'); doc.setFontSize(21);
    doc.text(displaySpd, col1, y+60);

    // Bundle name
    doc.setTextColor(...INK); doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text(bundleName, col1+100, y+27);

    // Features string
    doc.setTextColor(...MUTED); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    doc.text(features.join(' · '), col1+100, y+42);

    // Price type badge
    // Same colour identity as step 4: blue = list, purple = LTO, orange = promo
    const isLto = String(p.priceType).indexOf('lto') === 0;
    const ptBg = p.priceType==='list' ? [219,234,254] : isLto ? [230,220,250] : [255,225,207];
    const ptFg = p.priceType==='list' ? [10,74,133]   : isLto ? [69,39,160]   : [157,58,0];
    doc.setFillColor(...ptBg);
    doc.roundedRect(col1+100, y+50, 56, 15, 2, 2, 'F');
    doc.setTextColor(...ptFg); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text(ptLabel, col1+128, y+60, {align:'center'});

    // Plan price (right side)
    if (planPrice != null) {
      doc.setTextColor(...BLUE); doc.setFont('helvetica','bold'); doc.setFontSize(26);
      doc.text(fmt(planPrice), W-M-8, y+50, {align:'right'});
      doc.setTextColor(...MUTED); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      doc.text('/'+(isEs?'mes':'mo'), W-M-8, y+63, {align:'right'});
    }

    y += cardH + 10;
  }

  // ── SERVICES ─────────────────────────────────────────────────────────────
  doc.setTextColor(...BLUE); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
  doc.text(isEs ? 'SERVICIOS SELECCIONADOS' : 'SELECTED SERVICES', M, y);
  doc.setDrawColor(...BLUE); doc.line(M, y+4, M+cW, y+4);
  y += 16;

  // Table header
  doc.setFillColor(...BLUE); doc.roundedRect(M, y, cW, 20, 3, 3, 'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
  doc.text(isEs?'PLAN':'PLAN', col1, y+13);
  doc.text(isEs?'DESCRIPCIÓN':'DESCRIPTION', M+220, y+13);
  doc.text(isEs?'MENSUAL':'MONTHLY', W-M-6, y+13, { align:'right' });
  y += 20;

  // Table rows
  const rowH = 18;
  items.forEach((it, i) => {
    if (i%2===0) { doc.setFillColor(249,250,251); doc.rect(M, y, cW, rowH, 'F'); }
    doc.setDrawColor(...LINE); doc.line(M, y+rowH, M+cW, y+rowH);

    doc.setTextColor(...INK);
    doc.setFont('helvetica', i===0 ? 'bold' : 'normal'); doc.setFontSize(8.5);
    doc.text(it.name.length>42 ? it.name.slice(0,40)+'…' : it.name, col1, y+12);

    if (it.desc) {
      doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED); doc.setFontSize(7.5);
      doc.text(it.desc, M+220, y+12);
    }

    doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE); doc.setFontSize(9.5);
    doc.text(fmt(it.price), W-M-6, y+12, { align:'right' });
    y += rowH;
  });

  y += 6;

  // ── TOTAL MENSUAL bar ─────────────────────────────────────────────────────
  doc.setFillColor(...BLUE); doc.roundedRect(M, y, cW, 32, 4, 4, 'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
  doc.setFontSize(9.5);
  doc.text(isEs?'Total Mensual Estimado':'Estimated Monthly Total', col1, y+20);
  doc.setFontSize(20);
  doc.text(fmt(tot), W-M-6, y+22, { align:'right' });
  y += 42;

  // ── TOTAL PAGO ÚNICO bar ──────────────────────────────────────────────────
  // Collect all one-time charges: contract fee + per-service fees (Hunting, etc.)
  const ct = CONTRACT_TERMS.find(t => t.id === state.prop.contract);
  const ctFee = propContractFee();
  const oneTimeFees = propGetOneTimeFees();
  const hasContract = ctFee !== null && ctFee > 0;
  const hasOTFees = oneTimeFees.length > 0;

  if (hasContract || hasOTFees) {
    let otTotal = 0;
    const otLines = [];

    if (ct && ctFee !== null) {
      const ctLabel = ct.id==='none'
        ? (isEs?'Sin Contrato (mes a mes)':'No Contract (month to month)')
        : `${ct.months} ${isEs?'Meses':'Months'}`;
      if (ctFee > 0) {
        otTotal += ctFee;
        otLines.push({label: isEs?`Contrato: ${ctLabel}`:`Contract: ${ctLabel}`, price: ctFee});
      } else {
        otLines.push({label: isEs?`Contrato: ${ctLabel} — Gratis`:`Contract: ${ctLabel} — Free`, price: 0});
      }
    }
    oneTimeFees.forEach(f => {
      otTotal += f.price;
      otLines.push({label: f.name, price: f.price});
    });

    // Orange bar with total
    doc.setFillColor(...ORANGE); doc.roundedRect(M, y, cW, 32, 4, 4, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
    doc.setFontSize(9.5);
    doc.text(isEs?'Total Pago Único':'Total One-time Payment', col1, y+20);
    doc.setFontSize(20);
    doc.text(otTotal > 0 ? fmt(otTotal) : (isEs?'Gratis':'Free'), W-M-6, y+22, { align:'right' });
    y += 36;

    // Detail rows beneath
    otLines.forEach(ol => {
      doc.setFillColor(255, 244, 235); doc.setDrawColor(255, 83, 0);
      doc.roundedRect(M, y, cW, 18, 2, 2, 'FD');
      doc.setTextColor(157,58,0); doc.setFont('helvetica','normal'); doc.setFontSize(8);
      doc.text(ol.label, col1, y+12);
      if (ol.price > 0) {
        doc.setFont('helvetica','bold');
        doc.text(fmt(ol.price), W-M-6, y+12, {align:'right'});
      }
      y += 20;
    });
    y += 10;
  } else if (ct && ct.id !== 'none') {
    // Contract is free — show it as a small info row
    const ctLabel = `${ct.months} ${isEs?'Meses':'Months'}`;
    doc.setFillColor(220,252,231); doc.setDrawColor(22,163,74);
    doc.roundedRect(M, y, cW, 18, 2, 2, 'FD');
    doc.setTextColor(15,100,50); doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.text(isEs?`Contrato ${ctLabel} — Gratis (Pago único)`:`Contract ${ctLabel} — Free (One-time)`, col1, y+12);
    y += 28;
  }

  // Notes
  if (c.notes && c.notes.trim()) {
    const noteLines = doc.splitTextToSize(c.notes.trim(), cW-22);
    const noteH     = noteLines.length*13 + 28;
    doc.setFillColor(...LIGHT); doc.setDrawColor(...LINE);
    doc.roundedRect(M, y, cW, noteH, 4, 4, 'FD');
    doc.setTextColor(...MUTED); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text(isEs?'NOTAS':'NOTES', col1, y+14);
    doc.setTextColor(...INK); doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text(noteLines, col1, y+26);
    y += noteH + 16;
  }

  // Disclaimer
  const disc = isEs
    ? 'Precios sujetos a cambios sin previo aviso. Impuestos y cargos regulatorios no incluidos. Esta propuesta tiene validez de 30 días.'
    : 'Prices subject to change without notice. Taxes and regulatory fees not included. This proposal is valid for 30 days.';
  const discLines = doc.splitTextToSize(disc, cW);
  doc.setFillColor(255, 237, 213); doc.setDrawColor(255, 83, 0);
  doc.roundedRect(M, y-6, cW, discLines.length*13+16, 3, 3, 'FD');
  doc.setTextColor(100, 40, 0); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
  doc.text(discLines, col1, y+8);
  y += discLines.length*13 + 24;

  // Signatures
  const sigW = (cW-30)/2;
  doc.setDrawColor(...INK);
  doc.line(M, y, M+sigW, y);
  doc.line(M+sigW+30, y, W-M, y);
  doc.setTextColor(...MUTED); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
  doc.text(isEs?'Firma del Cliente':'Customer Signature', M, y+13);
  // Rep signature: label + auto-filled rep name
  const repSigLbl = isEs?'Firma del Representante':'Representative Signature';
  doc.text(repSigLbl, M+sigW+30, y+13);
  if (c.rep && c.rep.trim()) {
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(c.rep.trim(), M+sigW+30, y-6);
  }

  doc.save(filename);
}

// ═══════════════════════════════════════════════════════════════════════════
// PRINT VIEW
// ═══════════════════════════════════════════════════════════════════════════
function buildPrintView(){
  const items = propGetItems();
  const tot = propGetTotal();
  const c = state.prop.customer;

  const html = `
    <div class="pv-wrap">
      <div class="pv-header">
        <div>
          <img src="assets/liberty-logo.png" alt="Liberty Business" class="pv-logo-img">
          <span class="pv-logo-cap">Fijo SOHO/SMB</span>
        </div>
        <div class="pv-date-box">
          <strong>${t('pv.proposal')}</strong>
          ${c.date || new Date().toISOString().slice(0,10)}
        </div>
      </div>

      <div class="pv-info-grid">
        ${c.company ? `<div class="pv-info-item pv-info-full"><label>${t('prop.company')}</label><span>${c.company}</span></div>` : ''}
        <div class="pv-info-item"><label>${t('prop.customer')}</label><span>${c.name||'—'}</span></div>
        <div class="pv-info-item"><label>${t('prop.account')}</label><span>${c.account||'—'}</span></div>
        <div class="pv-info-item"><label>${t('prop.rep')}</label><span>${c.rep||'—'}</span></div>
        <div class="pv-info-item"><label>${t('prop.date')}</label><span>${c.date||'—'}</span></div>
      </div>

      <div class="pv-sec-title">${t('pv.services')}</div>
      <table class="pv-table">
        <thead><tr><th>${t('pv.plan')}</th><th>${t('pv.description')}</th><th>${t('pv.monthly')}</th></tr></thead>
        <tbody>
          ${items.map(it=>`
            <tr><td><strong>${it.name}</strong></td><td>${it.desc||''}</td><td>${fmt(it.price)}</td></tr>
          `).join('')}
        </tbody>
      </table>

      <div class="pv-total-row">
        <span class="pv-total-label">${t('pv.total')}</span>
        <span class="pv-total-value">${fmt(tot)}</span>
      </div>

      ${c.notes ? `<div class="pv-notes"><label>${t('pv.notes')}</label>${c.notes}</div>`:''}

      <p class="pv-disc">${t('pv.disc')}</p>

      <div class="pv-sig">
        <div><div class="pv-sig-line">${t('pv.sig.client')}</div></div>
        <div><div class="pv-sig-line">${t('pv.sig.rep')}</div></div>
      </div>
    </div>
  `;
  $('#print-view').innerHTML = html;
}
