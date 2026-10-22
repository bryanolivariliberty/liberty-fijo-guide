// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════
let lang = localStorage.getItem('lf-lang') || 'es';

const state = {
  // UAT: How to Use is always the landing page when the tool opens
  tab: 'guide',
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
  // Phones: keep the active tab visible in the scrollable top tab bar
  const nav = $('#tabs-nav'), act = nav && nav.querySelector('.tab-btn.active');
  if (nav && act && nav.scrollWidth > nav.clientWidth){
    nav.scrollTo({left: Math.max(0, act.offsetLeft - (nav.clientWidth - act.offsetWidth)/2), behavior:'smooth'});
  }
  $$('.tab-pane').forEach(p=>{
    p.classList.toggle('active', p.id==='pane-'+tabId);
  });
  // Re-render proposal when switching to it (in case data changed)
  if (tabId==='proposal') propRender();
  // Sales Flow reads the Fijo quote, so refresh it when it comes into view
  if (tabId==='flow' && typeof renderFlow==='function') renderFlow();
  if (tabId==='proposal' && typeof sfRenderPropBar==='function') sfRenderPropBar();
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
  // Same wording as the Mobile Sales Tool
  $('#header-pill').innerHTML = `<span class="dot"></span>${lang==='es'?'TARIFAS · OCT 2026':'RATES · OCT 2026'}`;
  $('#header-pill').title = lang==='es' ? 'Tarifas actualizadas en octubre 2026' : 'Rates updated October 2026';
  $('#header-meta-title').textContent = 'B2B Fixed Sales Tool';
  setTimeout(()=>{ if(typeof lbTabsHint==='function') lbTabsHint('#tabs-nav'); }, 0);
  // Header line + footer, same wording as the B2B Sales Hub
  if ($('#header-meta-sub')) $('#header-meta-sub').textContent = lang==='es' ? 'Solo para uso interno' : 'Internal use only';
  if ($('#lbf-ip')) $('#lbf-ip').textContent = lang==='es' ? 'Propiedad Intelectual y Confidencial' : 'Intellectual Property & Confidential';
  if ($('#lbf-nd')) $('#lbf-nd').textContent = lang==='es' ? 'No para distribución a clientes' : 'Not for customer distribution';
  const sw = $('#header-switch');
  if (sw) sw.setAttribute('title', lang==='es' ? 'Abrir la herramienta de ventas móvil (pestaña nueva)' : 'Open the mobile sales tool (new tab)');

  // Tabs
  const tabs = [
    {id:'guide',     icon:'guide',    label:t('tab.guide')},
    {id:'flow',      icon:'user',     label:t('tab.flow')},
    {id:'planes',    icon:'plans',    label:t('tab.planes')},
    {id:'vsclaro',   icon:'lto',      label:t('tab.vsclaro')},
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
  const es = lang === 'es';
  const T = (en, sp) => es ? sp : en;
  const pill = (go, label) => `<span class="hwc-tab-pill" data-go="${go}">${label}</span>`;
  const card = c => `
    <div class="howto-card howto-card--${c.tone}" id="${c.id}">
      <div class="hwc-icon-wrap"><div class="hwc-icon">${c.icon}</div></div>
      <div class="hwc-num">${c.num}</div>
      <h3 class="hwc-title">${c.title}</h3>
      <p class="hwc-lead">${c.lead}</p>
      ${c.rules ? `<div class="hwc-rules">${c.rules.map(r=>`
        <div class="hwc-rule"><span class="hwc-rule-icon">${r[0]}</span><div><strong>${r[1]}</strong><br><span>${r[2]}</span></div></div>`).join('')}</div>`
      : `<div class="hwc-steps">${c.steps.map(x=>`<div class="hwc-step"><span class="hwc-step-dot"></span><span>${x}</span></div>`).join('')}</div>`}
      ${c.tip ? `<div class="hwc-tip"><span class="hwc-tip-icon">💡</span><span>${c.tip}</span></div>` : ''}
      <div class="hwc-tabs-row">${c.pills.join('')}</div>
    </div>`;

  const journey = [
    ['card-explore', T('Explore','Explorar')],
    ['card-flow',    T('Sales Flow','Flujo de Venta')],
    ['card-extras',  T('Extras','Extras')],
    ['card-quote',   T('Quote','Cotizar')],
    ['card-close',   T('Close','Cerrar')]
  ];

  const cards = [
    {id:'card-explore', tone:'blue', icon:'📋', num:'01',
     title:T('Explore Plans','Explora los Planes'),
     lead:T('Start here before any customer conversation.','Empieza aquí antes de cualquier conversación con un cliente.'),
     steps:[
       T('Go to <strong>Our Plans</strong> — the fixed plans (COAX / FTTx). Pick <strong>HFC or FTTx</strong>, the <strong>24- or 36-month</strong> term, and turn on <strong>FMC</strong> if the customer has B2B mobile.',
         'Ve a <strong>Nuestros Planes</strong> — los planes fijos (COAX / FTTx). Escoge <strong>HFC o FTTx</strong>, el término de <strong>24 o 36 meses</strong>, y activa <strong>FMC</strong> si el cliente tiene móvil B2B.'),
       T('Pick the product — <strong>1P, 2P, 3P or Liberty Business in a Box · Safety Connection</strong> — then the speed. Each card shows the monthly price, the savings vs. list and the <strong>billing and discount codes</strong> for order entry.',
         'Escoge el producto — <strong>1P, 2P, 3P o Liberty Business in a Box · Safety Connection</strong> — y luego la velocidad. Cada tarjeta muestra el precio mensual, el ahorro vs. lista y los <strong>códigos de facturación y descuento</strong> para entrar la orden.'),
       T('Tap <strong>Quote this plan</strong> to fill the Cart. If the customer is comparing, open <strong>vs Claro</strong>.',
         'Toca <strong>Cotizar este plan</strong> para llenar la Cotización. Si el cliente está comparando, abre <strong>vs Claro</strong>.')],
     tip:T('Pro tip: the monthly price is the same on 24 and 36 months — only the discount code changes.',
           'Tip: el precio mensual es el mismo en 24 y 36 meses — solo cambia el código de descuento.'),
     pills:[pill('planes','📋 '+t('tab.planes')), pill('vsclaro','⚡ '+t('tab.vsclaro'))]},

    {id:'card-flow', tone:'navy', icon:'📈', num:'02',
     title:T('Run the Sales Flow','Usa el Flujo de Venta'),
     lead:T('Your guide for the conversation itself — from the first question to the close.','Tu guía para la conversación — de la primera pregunta al cierre.'),
     steps:[
       T('<strong>Discover:</strong> pick the scenario, ask the open questions and capture the need in the customer&#39;s words. Tap what they value — the <strong>Customer Brief</strong> stays visible on every step.',
         '<strong>Descubrir:</strong> escoge el escenario, haz las preguntas abiertas y anota la necesidad con las palabras del cliente. Marca lo que valora — el <strong>Resumen del cliente</strong> se ve en todos los pasos.'),
       T('<strong>Build the offer:</strong> quote technology, speed, bundle and price type right there — it is the same quote as the <strong>Cart</strong>. Enter what they pay today and see the monthly, annual and 3-year savings, then read <em>How the offer sounds</em>.',
         '<strong>Armar la oferta:</strong> cotiza tecnología, velocidad, bundle y tipo de precio ahí mismo — es la misma cotización de <strong>Cotización</strong>. Escribe lo que paga hoy y ve el ahorro mensual, anual y de 3 años; luego lee <em>Así suena la oferta</em>.'),
       T('<strong>Handle objections</strong> with AIM (Acknowledge, Inform, Move on), then <strong>Close</strong> with the checklist, a dated next step and a deal summary you can copy.',
         '<strong>Maneja las objeciones</strong> con AIM (Reconoce, Informa, Avanza) y <strong>cierra</strong> con la lista, un próximo paso con fecha y un resumen del trato para copiar.')],
     tip:T('Pro tip: the customer&#39;s name and company typed in the brief carry over to the Cart automatically.',
           'Tip: el nombre y la compañía que escribes en el resumen pasan a la Cotización automáticamente.'),
     pills:[pill('flow','📈 '+t('tab.flow')), pill('proposal','🧾 '+t('tab.proposal'))]},

    {id:'card-extras', tone:'orange', icon:'🎁', num:'03',
     title:T('Add-ons & Promotions','Add-ons y Promociones'),
     lead:T('Add value and remove the reasons to say no.','Suma valor y quita las razones para decir que no.'),
     steps:[
       T('In <strong>Add-ons</strong>, check prices for extra voice lines, video STBs and outlets, Fox Deportes, antivirus, cloud, online store and Fortinet hardware.',
         'En <strong>Add-ons</strong> revisa los precios de voz adicional, STB y outlets de video, Fox Deportes, antivirus, nube, tienda en línea y hardware Fortinet.'),
       T('You add them in the Cart&#39;s <strong>Extras</strong> step — the totals update instantly.',
         'Se agregan en el paso <strong>Extras</strong> de la Cotización — los totales se actualizan al instante.'),
       T('In <strong>Promotions</strong>, use the competitor penalty payment (Equal to Equal RGU) and customer referrals (90-day retention) to remove the switching barrier.',
         'En <strong>Promociones</strong> usa el pago de penalidad del competidor (Equal to Equal RGU) y los referidos (90 días de retención) para quitar la barrera del cambio.')],
     tip:T('Pro tip: if the objection is the competitor&#39;s early termination fee, go straight to Promotions.',
           'Tip: si la objeción es la penalidad del competidor, ve directo a Promociones.'),
     pills:[pill('addons','➕ '+t('tab.addons')), pill('promos','🎁 '+t('tab.promos'))]},

    {id:'card-quote', tone:'teal', icon:'🧾', num:'04',
     title:T('Build the Quote','Crea la Cotización'),
     lead:T('Three ways in, one quote.','Tres formas de empezar, una sola cotización.'),
     steps:[
       T('Start from <strong>Our Plans</strong> (Quote this plan), from the <strong>Sales Flow</strong> (Build the offer) or directly in the <strong>Cart</strong> — they all fill the same quote.',
         'Empieza en <strong>Nuestros Planes</strong> (Cotizar este plan), en el <strong>Flujo de Venta</strong> (Armar la oferta) o directo en <strong>Cotización</strong> — todas llenan la misma cotización.'),
       T('The <strong>Cart</strong> walks 8 steps: technology, speed, bundle, price type, extras, term, customer and contract.',
         'La <strong>Cotización</strong> tiene 8 pasos: tecnología, velocidad, bundle, tipo de precio, extras, término, cliente y contrato.'),
       T('LTO prices (List, Lead Offer, FMC) are in the price type step and require a contract.',
         'Los precios LTO (Lista, Lead Offer, FMC) están en el paso de tipo de precio y requieren contrato.')],
     tip:T('Pro tip: from the Sales Flow, <em>Continue in Cart</em> lands you on the Extras step with the plan already picked.',
           'Tip: desde el Flujo de Venta, <em>Continuar en Cotización</em> te lleva al paso Extras con el plan ya escogido.'),
     pills:[pill('planes','📋 '+t('tab.planes')), pill('flow2','📈 '+t('tab.flow')), pill('proposal','🧾 '+t('tab.proposal'))]},

    {id:'card-close', tone:'green', icon:'🤝', num:'05',
     title:T('Close with a Proposal','Cierra con una Propuesta'),
     lead:T('Leave the customer with something professional and personalized.','Deja al cliente algo profesional y personalizado.'),
     steps:[
       T('In the <strong>Cart</strong>, confirm the term, the activation fee and the customer&#39;s details.',
         'En <strong>Cotización</strong> confirma el término, el cargo de activación y los datos del cliente.'),
       T('Hit <strong>Generate Proposal</strong> or <strong>Download PDF</strong> for a branded, print-ready proposal.',
         'Presiona <strong>Generar Propuesta</strong> o <strong>Descargar PDF</strong> para una propuesta imprimible con la marca Liberty.'),
       T('Go to the <strong>SOHO Contract</strong> — it fills in from the quote. Finish in the <strong>Sales Flow</strong> Close step: checklist, dated next step and deal summary.',
         'Ve al <strong>Contrato SOHO</strong> — se llena con la cotización. Termina en el paso Cerrar del <strong>Flujo de Venta</strong>: lista, próximo paso con fecha y resumen del trato.')],
     tip:T('Pro tip: the bar at the top of the Cart takes you back to the Sales Flow in one click.',
           'Tip: la barra arriba de la Cotización te regresa al Flujo de Venta en un clic.'),
     pills:[pill('proposal','🧾 '+t('tab.proposal')), pill('flow4','📈 '+T('Sales Flow · Close','Flujo de Venta · Cerrar'))]},

    {id:'card-fmc', tone:'dark', icon:'📱', num:'✦',
     title:T('Quote Mobile Too (FMC)','Cotiza Móvil También (FMC)'),
     lead:T('Fixed + mobile from one provider.','Fijo + móvil con un solo proveedor.'),
     steps:[
       T('Tap <strong>Mobile Sales Tool</strong> in the header — it opens in a new tab, so your fixed quote stays here.',
         'Toca <strong>Mobile Sales Tool</strong> en el encabezado — abre en una pestaña nueva y tu cotización fija se queda aquí.'),
       T('Quote the mobile lines there, then type the mobile total in the Sales Flow&#39;s <strong>Mobile</strong> row to see the combined FMC savings.',
         'Cotiza las líneas móviles allá y escribe el total móvil en la fila <strong>Móvil</strong> del Flujo de Venta para ver el ahorro FMC combinado.'),
       T('FMC requires an active B2B mobile line — confirm eligibility in MyKnowledge (Salesforce).',
         'FMC requiere un móvil B2B activo — confirma la elegibilidad en MyKnowledge (Salesforce).')],
     tip:T('Pro tip: only enter an FMC credit in the Sales Flow once it is confirmed.',
           'Tip: escribe un crédito FMC en el Flujo de Venta solo cuando esté confirmado.'),
     pills:[pill('mobile','📱 Mobile Sales Tool'), pill('flow2','📈 '+t('tab.flow'))]},

    {id:'card-atlas', tone:'blue', icon:'🧭', num:'✦',
     title:T('Ask Atlas','Pregúntale a Atlas'),
     lead:T('Your assistant, always in the bottom-right corner.','Tu asistente, siempre en la esquina inferior derecha.'),
     steps:[
       T('Ask in English or Spanish: prices (“2P 1 GB with FMC”), add-ons, rules or objections (“the customer says it’s too expensive”).',
         'Pregunta en inglés o español: precios (“2P 1 GB con FMC”), add-ons, reglas u objeciones (“el cliente dice que es muy caro”).'),
       T('Answers come with buttons: <strong>Quote this plan</strong>, or open the right tab or Sales Flow step.',
         'Las respuestas traen botones: <strong>Cotizar este plan</strong>, o abrir la pestaña o el paso del Flujo de Venta.'),
       T('Not in the tool? Atlas prepares the <strong>MyKnowledge</strong> search — tap <em>Open search</em> or <em>Copy</em>.',
         '¿No está en la herramienta? Atlas te prepara la búsqueda en <strong>MyKnowledge</strong> — toca <em>Abrir búsqueda</em> o <em>Copiar</em>.')],
     tip:T('Pro tip: Atlas only uses this tool’s content, so its prices always match Our Plans and the Cart.',
           'Tip: Atlas solo usa el contenido de esta herramienta, así que sus precios siempre coinciden con Nuestros Planes y la Cotización.'),
     pills:[pill('atlas','🧭 Atlas')]},

    {id:'card-rules', tone:'purple', icon:'⚡', num:'✦',
     title:T('Key Business Rules','Reglas de Negocio Clave'),
     lead:T('Know these — they&#39;ll come up in every conversation.','Conócelas — aparecen en cada conversación.'),
     rules:[
       ['📈', T('2026 Rate Increase','Rate Increase 2026'),
        T('Applies to existing customers on <strong>renewal or service update</strong>. Prices shown already include it.','Aplica a clientes existentes en <strong>renovación o actualización</strong> de servicio. Los precios mostrados ya lo incluyen.')],
       ['⚠️', T('LTO without contract','LTO sin contrato'),
        T('If the customer <strong>does not renew</strong> at the LTO price, the monthly cost moves to <strong>List Price</strong> automatically.','Si el cliente <strong>no renueva contrato</strong> al precio LTO, su costo mensual pasa automáticamente al <strong>Precio de Lista</strong>.')],
       ['🔗', 'FMC — Double Bandwidth',
        T('<strong>FMC doubles</strong> the speed with an <strong>active B2B mobile</strong> line. Confirm eligibility in <strong>MyKnowledge / Salesforce</strong>.','<strong>FMC duplica</strong> la velocidad con un móvil <strong>B2B activo</strong>. Confirma elegibilidad en <strong>MyKnowledge / Salesforce</strong>.')],
       ['🔁', 'Equal to Equal RGU',
        T('For the competitor penalty, the customer must <strong>activate an equivalent service</strong> to the one they had (same type of RGU).','Para la penalidad de competidor, el cliente debe <strong>activar un servicio equivalente</strong> al que tenía (mismo tipo de RGU).')]],
     pills:[pill('planes','📋 '+t('tab.planes')), pill('promos','🎁 '+t('tab.promos'))]}
  ];

  $('#howto-root').innerHTML = `
    <div class="howto-hero">
      <div class="howto-hero-badge">🚀 ${T('Quick Start','Inicio Rápido')}</div>
      <h2 class="howto-hero-title">${T('Welcome to the B2B Fixed Sales Tool','Bienvenido al B2B Fixed Sales Tool')}</h2>
      <p class="howto-hero-sub">${T('Everything you need to prepare, run the conversation, quote and close — in one place, in the order you use it.',
        'Todo lo que necesitas para prepararte, llevar la conversación, cotizar y cerrar — en un solo lugar y en el orden en que lo usas.')}</p>
    </div>
    <div class="howto-journey" id="howto-journey">
      ${journey.map((j,i)=>`${i?'<div class="howto-journey-line"></div>':''}
        <div class="howto-journey-step ${i===0?'active':''}" data-card="${j[0]}"><div class="hj-dot">${i+1}</div><span>${j[1]}</span></div>`).join('')}
    </div>
    <div class="howto-grid">${cards.map(card).join('')}</div>`;

  // Journey: scroll to the card and mark the step
  $$('#howto-journey .howto-journey-step').forEach((st,i)=>st.addEventListener('click', ()=>{
    const el = document.getElementById(st.dataset.card); if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    $$('#howto-journey .howto-journey-step').forEach((x,k)=>x.classList.toggle('active', k===i));
  }));
  // Tab pills open their tab (flow2/flow4 = Sales Flow on that step)
  $$('#howto-root .hwc-tab-pill[data-go]').forEach(p=>p.addEventListener('click', ()=>{
    const go = p.dataset.go;
    if (go==='mobile'){ const u = 'https://liberty-business-sales-guide.vercel.app/guide.html'; window.open(window.lbSsoUrl ? lbSsoUrl(u, lang) : u, '_blank', 'noopener'); return; }
    if (go==='atlas'){ if(typeof atlasToggle==='function') atlasToggle(true); return; }
    if (go.indexOf('flow')===0){ setTab('flow'); if(typeof flowGo==='function') flowGo(+(go.slice(4)||1)); return; }
    setTab(go); window.scrollTo({top:0, behavior:'smooth'});
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANS TAB
// ═══════════════════════════════════════════════════════════════════════════
// Replaced in UAT by js/plans-soho.js (SOHO offers). Kept for reference / revert.
function renderPlansTabLegacy(){
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
    <h1>${lang==='es'?'Generador de Cotizaciones':'Cart · Proposal Generator'}</h1>
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
  renderAddonsTab();
  renderPromosTab();
  renderProposalTab();
  if (typeof renderVsClaro==='function') renderVsClaro();
  if (typeof sfRenderAll==='function') sfRenderAll();
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

// ── Phones: make it obvious the tab bar scrolls ───────────────────────────
// Adds a "›" button pinned to the right edge (scrolls to the next tabs), a left
// fade once scrolled, and a one-time "peek" the first time the tool opens.
function lbTabsHint(sel){
  const bar = document.querySelector(sel); if(!bar) return;
  bar.classList.add('lb-scroll-hint');
  if(bar.querySelector('.lb-tabs-more')){ return; }      // already set up (tabs re-render on language change)
  const more = document.createElement('button');
  more.type = 'button'; more.className = 'lb-tabs-more';
  more.setAttribute('aria-label', (typeof lang!=='undefined' && lang==='es') ? 'Más pestañas' : 'More tabs');
  more.innerHTML = '<span aria-hidden="true">›</span>';
  more.addEventListener('click', e=>{ e.stopPropagation(); bar.scrollBy({left: bar.clientWidth*0.7, behavior:'smooth'}); });
  bar.appendChild(more);
  const update = ()=>{
    const over = bar.scrollWidth - bar.clientWidth > 4;
    bar.classList.toggle('can-right', over && bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 8);
    bar.classList.toggle('can-left',  over && bar.scrollLeft > 24);
  };
  if(!bar.dataset.hint){ bar.dataset.hint='1'; bar.addEventListener('scroll', ()=>bar._lbUpdate && bar._lbUpdate(), {passive:true});
    window.addEventListener('resize', ()=>bar._lbUpdate && bar._lbUpdate()); }
  bar._lbUpdate = update;
  setTimeout(update, 50); setTimeout(update, 600);
  // First visit this session: peek right and back so the rep sees it moves
  try{
    if(!sessionStorage.getItem('lb_tabs_peek') && bar.scrollWidth - bar.clientWidth > 4){
      sessionStorage.setItem('lb_tabs_peek','1');
      setTimeout(()=>{ const x = bar.scrollLeft; bar.scrollTo({left:x+90, behavior:'smooth'}); setTimeout(()=>bar.scrollTo({left:x, behavior:'smooth'}), 650); }, 900);
    }
  }catch(e){}
}
