// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════
let lang = localStorage.getItem('lf-lang') || 'es';

const state = {
  tab: localStorage.getItem('lf-tab') || 'guide',
  planTech: 'COAX',  // COAX | FTTx | FMC
  planPrice: 'list', // list | promo
  planBundle: 'p2',  // p1 | p2 | p3b | p3e | p3u
  ltoTech: 'COAX',
  specTech: 'COAX',
  prop: null
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════════════════
function setTab(tabId){
  state.tab = tabId;
  localStorage.setItem('lf-tab', tabId);
  $$('.tab-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===tabId);
  });
  $$('.tab-pane').forEach(p=>{
    p.classList.toggle('active', p.id==='pane-'+tabId);
  });
  // Re-render proposal when switching to it (in case data changed)
  if (tabId==='proposal') propRender();
}

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE
// ═══════════════════════════════════════════════════════════════════════════
function setLang(l){
  lang = l;
  localStorage.setItem('lf-lang', l);
  $$('.lang-btn').forEach(b=>b.classList.toggle('on', b.dataset.lang===l));
  document.documentElement.lang = l;
  buildShell();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════════════════
// SHELL — text content that depends on language
// ═══════════════════════════════════════════════════════════════════════════
function buildShell(){
  // Header pill
  $('#header-pill').innerHTML = `<span class="dot"></span>${lang==='es'?'2026 RATE':'2026 RATE'}`;
  $('#header-meta-eyebrow').textContent = 'Liberty Business';
  $('#header-meta-title').textContent = 'B2B Fijo Sales Tool';

  // Tabs
  const tabs = [
    {id:'guide',     icon:'guide',    label:t('tab.guide')},
    {id:'planes',    icon:'plans',    label:t('tab.planes')},
    {id:'lto',       icon:'lto',      label:t('tab.lto'), badge:'LTO'},
    {id:'especiales',icon:'specials', label:t('tab.especiales')},
    {id:'addons',    icon:'addons',   label:t('tab.addons')},
    {id:'promos',    icon:'promos',   label:t('tab.promos')},
    {id:'proposal',  icon:'proposal', label:t('tab.proposal')}
  ];
  $('#tabs-nav').innerHTML = tabs.map(tb=>`
    <button class="tab-btn ${state.tab===tb.id?'active':''}" data-tab="${tb.id}">
      ${icon(tb.icon)}
      <span>${tb.label}</span>
      ${tb.badge?`<span class="tab-badge">${tb.badge}</span>`:''}
    </button>
  `).join('');
  $$('.tab-btn').forEach(b=>{
    b.addEventListener('click', ()=>setTab(b.dataset.tab));
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GUIDE TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderGuide(){
  $('#guide-hero').innerHTML = `
    <div class="hero-eyebrow">${icon('package')} Liberty Business</div>
    <h1>${lang==='es'?'Guía Rápida — Fijo SOHO/SMB 2026':'Quick Guide — Fijo SOHO/SMB 2026'}</h1>
    <p>${lang==='es'
      ? 'Tu referencia visual para Internet, Voz, Video, Add-ons y promociones. Selecciona pestañas para ver planes, ofertas limitadas (LTO), y construir cotizaciones rápidas para tus clientes.'
      : 'Your visual reference for Internet, Voice, Video, Add-ons and promotions. Select tabs to view plans, limited time offers (LTO), and build quick quotes for your customers.'
    }</p>
  `;

  const cards = [
    {icon:'plans', tone:'blue', ttl:t('tab.planes'), body: lang==='es'
      ? 'Compara planes <strong>1P, 2P y 3P</strong> filtrando por tecnología (<strong>COAX, FTTx, FMC</strong>) y tipo de precio (<strong>Lista o Promo</strong>).'
      : 'Compare <strong>1P, 2P and 3P</strong> plans, filtering by technology (<strong>COAX, FTTx, FMC</strong>) and price type (<strong>List or Promo</strong>).'},
    {icon:'lto', tone:'orange', ttl:t('tab.lto'), body: lang==='es'
      ? 'Ofertas de <strong>tiempo limitado</strong> con <strong>Lead Offer y FMC</strong>. Requieren contrato — si no se renueva, el precio sube a Lista automáticamente.'
      : 'Time-<strong>limited</strong> offers with <strong>Lead Offer and FMC</strong>. Require contract — if not renewed, price reverts to List automatically.'},
    {icon:'specials', tone:'green', ttl:t('tab.especiales'), body: lang==='es'
      ? 'Precios <strong>especiales 1P</strong> solo internet (sin voz ni video) — útiles para empresas que ya tienen telefonía propia.'
      : 'Special <strong>1P pricing</strong> for internet only (no voice or video) — useful for businesses with their own phone systems.'},
    {icon:'addons', tone:'purple', ttl:t('tab.addons'), body: lang==='es'
      ? 'Catálogo de <strong>complementos</strong>: voz, antivirus, almacenamiento en nube, tienda online, hardware Fortinet y más.'
      : 'Catalog of <strong>add-ons</strong>: voice, antivirus, cloud storage, online store, Fortinet hardware and more.'},
    {icon:'promos', tone:'orange', ttl:t('tab.promos'), body: lang==='es'
      ? '<strong>Promociones especiales</strong>: pago de penalidad por cambio de competidor y referidos de clientes con 90 días de retención.'
      : '<strong>Special promotions</strong>: competitor switch penalty payment and customer referrals with 90-day retention.'},
    {icon:'proposal', tone:'blue', ttl:t('tab.proposal'), body: lang==='es'
      ? 'Construye <strong>cotizaciones</strong> seleccionando plan, add-ons, hardware y servicios — luego imprime una propuesta lista para el cliente.'
      : 'Build <strong>quotes</strong> by selecting plan, add-ons, hardware and services — then print a customer-ready proposal.'}
  ];

  $('#how-grid').innerHTML = cards.map(c=>`
    <div class="how-card">
      <div class="how-card-hdr">
        <div class="how-icon ${c.tone}">${icon(c.icon)}</div>
        <div class="how-title">${c.ttl}</div>
      </div>
      <div class="how-body">${c.body}</div>
    </div>
  `).join('');

  // Key business rules
  const rules = [
    {tone:'',  icon:'trend', ttl:lang==='es'?'Rate Increase 2026':'2026 Rate Increase',
      body:lang==='es'?'Aplica a clientes existentes en <strong>renovación o actualización</strong> de servicio. Los precios mostrados ya incluyen este incremento.':'Applies to existing customers on <strong>renewal or service update</strong>. Prices shown already include this increase.'},
    {tone:'o', icon:'warn', ttl:lang==='es'?'LTO sin contrato':'LTO without contract',
      body:lang==='es'?'Si el cliente <strong>no renueva contrato</strong> al precio LTO, su costo mensual se actualiza automáticamente al <strong>Precio de Lista</strong>.':'If customer <strong>does not renew</strong> at LTO price, monthly cost auto-updates to <strong>List Price</strong>.'},
    {tone:'p', icon:'fmc',  ttl:'FMC — Double Bandwidth',
      body:lang==='es'?'<strong>FMC duplica</strong> velocidad cuando hay un móvil <strong>B2B activo</strong>. Confirma elegibilidad en <strong>MyKnowledge / Salesforce</strong>.':'<strong>FMC doubles</strong> speed when there is an <strong>active B2B mobile</strong>. Confirm eligibility in <strong>MyKnowledge / Salesforce</strong>.'},
    {tone:'g', icon:'rules',  ttl:lang==='es'?'Equal to Equal RGU':'Equal to Equal RGU',
      body:lang==='es'?'Para penalidad de competidor: el cliente debe <strong>activar un servicio equivalente</strong> al que tenía con el competidor (mismo tipo de RGU).':'For competitor penalty: customer must <strong>activate an equivalent service</strong> to what they had with the competitor (same RGU type).'}
  ];

  $('#rules-section-head').innerHTML = `${icon('rules')}<h2>${t('s.rules')}</h2><div class="line"></div>`;

  $('#rules-wrap').innerHTML = rules.map(r=>`
    <div class="rule-box ${r.tone}">
      ${icon(r.icon)}
      <div class="rule-content">
        <div class="rule-title">${r.ttl}</div>
        <div class="rule-body">${r.body}</div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANS TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderPlansTab(){
  $('#plans-head').innerHTML = `
    <div class="page-head-eyebrow">${t('tab.planes')}</div>
    <h1>${lang==='es'?'Planes de Internet':'Internet Plans'}</h1>
    <p>${lang==='es'
      ? 'Compara precios por tecnología, bundle y tipo de tarifa. Toggle FMC para ver el beneficio Double Bandwidth con móvil B2B activo.'
      : 'Compare prices by technology, bundle and price type. Toggle FMC to see the Double Bandwidth benefit with active B2B mobile.'
    }</p>
  `;

  // Controls
  $('#plans-controls').innerHTML = `
    <div class="ctrl-group">
      <span class="ctrl-label">${t('ctrl.tech')}</span>
      <div class="segmented">
        <button class="seg-btn ${state.planTech==='COAX'?'on':''}" data-ptech="COAX">${icon('coax')}<span>COAX</span></button>
        <button class="seg-btn ${state.planTech==='FTTx'?'on':''}" data-ptech="FTTx">${icon('fttx')}<span>FTTx</span></button>
        <button class="seg-btn ${state.planTech==='FMC'?'on-fmc':''}" data-ptech="FMC">${icon('fmc')}<span>FMC</span></button>
      </div>
    </div>
    <div class="ctrl-group">
      <span class="ctrl-label">${t('ctrl.price')}</span>
      <div class="segmented">
        <button class="seg-btn ${state.planPrice==='list'?'on':''}" data-pprice="list">${t('btn.list')}</button>
        <button class="seg-btn ${state.planPrice==='promo'?'on':''}" data-pprice="promo">${t('btn.promo')}</button>
      </div>
    </div>
    <div class="ctrl-group">
      <span class="ctrl-label">Bundle</span>
      <div class="segmented" style="flex-wrap:wrap">
        <button class="seg-btn ${state.planBundle==='p1v'?'on':''}" data-pbun="p1v" title="${lang==='es'?'Voz Standalone':'Standalone Voice'}">${icon('phone')} Voz 1P</button>
        <button class="seg-btn ${state.planBundle==='p1'?'on':''}" data-pbun="p1">1P</button>
        <button class="seg-btn ${state.planBundle==='p2'?'on':''}" data-pbun="p2">2P</button>
        <button class="seg-btn ${state.planBundle==='p2e'?'on':''}" data-pbun="p2e">2P-E</button>
        <button class="seg-btn ${state.planBundle==='p2u'?'on':''}" data-pbun="p2u">2P-U</button>
        <button class="seg-btn ${state.planBundle==='p3b'?'on':''}" data-pbun="p3b">3P-B</button>
        <button class="seg-btn ${state.planBundle==='p3e'?'on':''}" data-pbun="p3e">3P-E</button>
        <button class="seg-btn ${state.planBundle==='p3u'?'on':''}" data-pbun="p3u">3P-U</button>
      </div>
    </div>
    <div class="ctrl-group ctrl-search">
      <span class="ctrl-label">${lang==='es'?'Buscar':'Search'}</span>
      <div class="search-wrap">
        <svg class="search-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="plan-search-inp" placeholder="${lang==='es'?'ej. 600, 1G, FTTx…':'e.g. 600, 1G, FTTx…'}" value="${state.planSearch||''}">
        ${state.planSearch ? `<button class="search-clear" id="plan-search-clear" aria-label="clear">×</button>` : ''}
      </div>
    </div>
  `;

  $$('[data-ptech]').forEach(b=>b.addEventListener('click', ()=>{ state.planTech=b.dataset.ptech; renderPlansTab(); }));
  $$('[data-pprice]').forEach(b=>b.addEventListener('click', ()=>{ state.planPrice=b.dataset.pprice; renderPlansTab(); }));
  $$('[data-pbun]').forEach(b=>b.addEventListener('click', ()=>{ state.planBundle=b.dataset.pbun; renderPlansTab(); }));

  const sInp = $('#plan-search-inp');
  if (sInp) {
    sInp.addEventListener('input', e=>{
      state.planSearch = e.target.value;
      renderPlans();
      // Keep focus on the input across re-render
      const v = state.planSearch;
      const ni = $('#plan-search-inp');
      if (ni && ni !== sInp){ ni.focus(); ni.setSelectionRange(v.length, v.length); }
    });
  }
  const sClr = $('#plan-search-clear');
  if (sClr) sClr.addEventListener('click', ()=>{ state.planSearch=''; renderPlansTab(); });

  // Info pills
  $('#plans-info').innerHTML = `
    <span class="info-pill">${icon('check')}<span>${t('info.nocontract')}</span></span>
    <span class="info-pill">${icon('check')}<span>${t('info.2p')}</span></span>
    <span class="info-pill">${icon('check')}<span>${t('info.3p')}</span></span>
    <span class="info-pill">${icon('fmc')}<span>${t('info.fmc')}</span></span>
  `;

  // Callouts
  $('#plans-callout').innerHTML = `
    <div class="callout callout-info">${icon('info')}<div>${t('disc.rate')}</div></div>
    ${state.planTech==='FMC' ? `<div class="callout callout-purple">${icon('fmc')}<div>${t('disc.fmc.planes')}</div></div>` : ''}
  `;

  renderPlans();
}

// ═══════════════════════════════════════════════════════════════════════════
// LTO TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderLTOTab(){
  $('#lto-head').innerHTML = `
    <div class="page-head-eyebrow" style="color:var(--orange)">${t('tab.lto')}</div>
    <h1>${lang==='es'?'Ofertas de Tiempo Limitado':'Limited Time Offers'}</h1>
    <p>${lang==='es'
      ? 'Lead Offer y FMC con descuentos especiales. Requieren contrato — al vencer, el precio se ajusta automáticamente al Precio de Lista.'
      : 'Lead Offer and FMC with special discounts. Require contract — at expiration, price auto-adjusts to List Price.'}</p>
  `;
  $('#lto-controls').innerHTML = `
    <div class="ctrl-group">
      <span class="ctrl-label">${t('ctrl.tech')}</span>
      <div class="segmented">
        <button class="seg-btn ${state.ltoTech==='COAX'?'on':''}" data-ltech="COAX">${icon('coax')}<span>COAX</span></button>
        <button class="seg-btn ${state.ltoTech==='FTTx'?'on':''}" data-ltech="FTTx">${icon('fttx')}<span>FTTx</span></button>
      </div>
    </div>
  `;
  $$('[data-ltech]').forEach(b=>b.addEventListener('click', ()=>{ state.ltoTech=b.dataset.ltech; renderLTOTab(); }));

  $('#lto-callout').innerHTML = `
    <div class="callout callout-warn">${icon('warn')}<div>${t('disc.lto.warn')}</div></div>
    <div class="callout callout-purple">${icon('fmc')}<div>${t('disc.fmc.lto')}</div></div>
  `;
  renderLTO();
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALS TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderSpecialsTab(){
  $('#spec-head').innerHTML = `
    <div class="page-head-eyebrow" style="color:var(--green)">${t('tab.especiales')}</div>
    <h1>${t('s.hsd')}</h1>
    <p>${t('s.hsd.sub')}</p>
  `;
  $('#spec-controls').innerHTML = `
    <div class="ctrl-group">
      <span class="ctrl-label">${t('ctrl.tech')}</span>
      <div class="segmented">
        <button class="seg-btn ${state.specTech==='COAX'?'on':''}" data-stech="COAX">${icon('coax')}<span>COAX</span></button>
        <button class="seg-btn ${state.specTech==='FTTx'?'on':''}" data-stech="FTTx">${icon('fttx')}<span>FTTx</span></button>
      </div>
    </div>
  `;
  $$('[data-stech]').forEach(b=>b.addEventListener('click', ()=>{ state.specTech=b.dataset.stech; renderSpecialsTab(); }));
  renderSpecials();
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDONS TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderAddonsTab(){
  $('#ao-head').innerHTML = `
    <div class="page-head-eyebrow" style="color:var(--purple)">${t('tab.addons')}</div>
    <h1>${lang==='es'?'Add-ons & Servicios':'Add-ons & Services'}</h1>
    <p>${lang==='es'?'Complementa tu plan con voz, video, hardware y servicios administrados.':'Complete your plan with voice, video, hardware and managed services.'}</p>
  `;
  // Section headers — vid1p and vid2p sections removed (moved to Plans tab)
  $('#ao-h-addons').innerHTML  = `${icon('cog')}<h2>${t('s.addons.inet')}</h2><div class="line"></div>`;
  $('#ao-h-voice').innerHTML   = `${icon('phone')}<h2>${t('s.voice')}</h2><div class="line"></div>`;
  $('#ao-h-fox').innerHTML     = `${icon('tv')}<h2>Fox Deportes</h2><div class="line"></div>`;
  $('#ao-h-stb').innerHTML     = `${icon('tv')}<h2>${t('s.stb')}</h2><div class="line"></div>`;
  $('#ao-stb-note').innerHTML  = t('s.stb.note');
  $('#ao-h-ult').innerHTML     = `${icon('tv')}<h2>${t('s.ultaddons')}</h2><div class="line"></div>`;
  $('#ao-ult-sub').textContent = t('s.ultaddons.sub');
  $('#ao-h-hw').innerHTML      = `${icon('hardware')}<h2>${t('s.hw')}</h2><div class="line"></div>`;
  renderAddons();
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMOS TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderPromosTab(){
  $('#promos-head').innerHTML = `
    <div class="page-head-eyebrow" style="color:var(--orange)">${t('tab.promos')}</div>
    <h1>${lang==='es'?'Promociones Especiales':'Special Promotions'}</h1>
    <p>${lang==='es'?'Reglas y requisitos para las promociones de adquisición y referidos de clientes.':'Rules and requirements for acquisition and customer referral promotions.'}</p>
  `;
  renderPromos();
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPOSAL TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderProposalTab(){
  $('#prop-head').innerHTML = `
    <div class="page-head-eyebrow">${t('tab.proposal')}</div>
    <h1>${lang==='es'?'Generador de Cotizaciones':'Proposal Generator'}</h1>
    <p>${lang==='es'?'Construye una cotización paso a paso. Genera una propuesta lista para imprimir o enviar al cliente.':'Build a quote step by step. Generate a proposal ready to print or send to the customer.'}</p>
  `;
  propRender();
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER RENDER
// ═══════════════════════════════════════════════════════════════════════════
function renderAll(){
  renderGuide();
  renderPlansTab();
  renderLTOTab();
  renderSpecialsTab();
  renderAddonsTab();
  renderPromosTab();
  renderProposalTab();
  setTab(state.tab);
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // Lang buttons
  $$('.lang-btn').forEach(b=>{
    b.classList.toggle('on', b.dataset.lang===lang);
    b.addEventListener('click', ()=>setLang(b.dataset.lang));
  });
  document.documentElement.lang = lang;
  buildShell();
  renderAll();
});
