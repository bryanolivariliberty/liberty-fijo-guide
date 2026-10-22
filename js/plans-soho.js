// ═══════════════════════════════════════════════════════════════════════════
// OUR PLANS (UAT) — Fixed plans (COAX / FTTx), organized the way a rep sells:
//   ① pick the product: 1P · 2P · 3P · Liberty Business in a Box (Safety Connection)
//   ② pick the speed (MB / GB) — one card per speed, with price, codes and
//     "Quote this plan", which fills the Cart.
// Data: SOHO_OFFERS (SOHO Plan Configuration workbook) and BIAB_SAFETY (js/data.js).
// The previous list/promo grid is kept in app.js as renderPlansTabLegacy.
// ═══════════════════════════════════════════════════════════════════════════
function sohoState(){
  if(!state.soho || !state.soho.product) state.soho = {product:'2P', tech:'HFC', term:36, fmc:false};
  return state.soho;
}
function sohoEs(){ return lang==='es'; }
const SOHO_PRODUCTS = [
  {id:'1P',   icon:'internet', en:'1P Internet',                es:'1P Internet',                subEn:'Internet only',               subEs:'Solo internet'},
  {id:'2P',   icon:'phone',    en:'2P Internet + Voice',        es:'2P Internet + Voz',          subEn:'Internet and phone line',     subEs:'Internet y línea de teléfono'},
  {id:'3P',   icon:'tv',       en:'3P Internet + Voice + Video',es:'3P Internet + Voz + Video',  subEn:'Adds Español De Primera or Ultimate', subEs:'Añade Español De Primera o Ultimate'},
  {id:'BIAB', icon:'shield',   en:'Liberty Business in a Box',  es:'Liberty Business in a Box',  subEn:'Safety Connection · LTE backup',subEs:'Safety Connection · respaldo LTE'}
];
const BW_ORDER = {'500MB':1,'600MB':2,'1GB':3};

function sohoSvcName(o, es){
  if(o.svc==='1P') return '1P Internet';
  if(o.svc==='2P') return es?'2P Internet + Voz':'2P Internet + Voice';
  return es?'3P Internet + Voz + Video':'3P Internet + Voice + Video';
}
function sohoSpeedRow(bw, tech){
  const coax = tech==='HFC';
  const key = bw==='500' ? (coax?'500/30':'500/500') : bw==='600' ? (coax?'600/30':'600/600') : (coax?'1G/30':'1G/1G');
  return (coax ? COAX_OFFER : FTTX_OFFER).find(x=>x.speed===key) || null;
}
function sohoListPrice(o, tech){
  if(o.quote.tech==='FMC') return null;
  const sp = sohoSpeedRow(o.quote.speed, tech);
  return sp && sp.list ? sp.list[o.quote.bundle] : null;
}
// Speed groups for a product: one card per speed (+ video package for 3P).
// Each group has 1–2 variants (with / without FMC); the FMC switch picks one.
function sohoGroups(product){
  const map = {};
  SOHO_OFFERS.filter(o=>o.svc===product).forEach(o=>{
    const k = o.bw+'|'+(o.video||''); (map[k] = map[k] || {bw:o.bw, video:o.video, variants:[]}).variants.push(o);
  });
  return Object.values(map).sort((a,b)=>(BW_ORDER[a.bw]-BW_ORDER[b.bw]) || String(a.video).localeCompare(String(b.video)));
}
function sohoPick(g, fmcOn){
  const want = fmcOn ? ['yes','both'] : ['no','both'];
  const hit = g.variants.find(v=>want.includes(v.fmc));
  return {o: hit || g.variants[0], exact: !!hit};
}
function sohoFrom(product){
  if(product==='BIAB') return Math.min(...BIAB_SAFETY.map(b=>b.total));
  return Math.min(...SOHO_OFFERS.filter(o=>o.svc===product).map(o=>o.mrr));
}

// ── Quote → Cart ──────────────────────────────────────────────────────────
function sohoQuote(id){
  const o = SOHO_OFFERS.find(x=>x.id===id); if(!o) return;
  const S = sohoState(), coax = S.tech==='HFC';
  propInit(); const p = state.prop;
  if(o.quote.tech==='FMC'){
    p.tech = 'FMC';
    p.speed = FMC_PLANS.find(x=>x.baseSpeed===(coax?'600/30':'600/600') && x.sourceTech===(coax?'COAX':'FTTx')) || null;
  } else {
    p.tech = coax ? 'COAX' : 'FTTx';
    p.speed = sohoSpeedRow(o.quote.speed, S.tech);
  }
  p.bundle = o.quote.bundle;
  p.priceType = (o.fmc==='both' && S.fmc) ? 'lto-fmc' : o.quote.price;
  p.voice.included = (o.quote.bundle==='p1') ? 0 : Math.max(1, p.voice.included||0);
  sohoClearBiabParts(p);
  sohoFinishQuote(p, S);
}
function biabQuote(i){
  const b = BIAB_SAFETY[i]; if(!b) return;
  const S = sohoState(), coax = S.tech==='HFC';
  const speeds = {'100M':['100/10','100/100'], '300M':['300/30','300/300'], '500M':['500/30','500/500'], '1000M':['1G/30','1G/1G']}[b.speed];
  propInit(); const p = state.prop;
  p.tech = coax ? 'COAX' : 'FTTx';
  // The bundle's 2P line, priced as in Safety Connection
  p.speed = {_biab:true, biabIndex:i, tier:'BIAB', tech:p.tech, speed:speeds[coax?0:1], displaySpeed:speeds[coax?0:1],
             label:b.speed.replace('M',' MB'), voip:4, list:{p2:b.wan}, promo:null};
  p.bundle = 'p2';
  p.priceType = 'list';
  p.voice.included = Math.max(1, p.voice.included||0);
  // Its components, as separate Cart lines
  sohoClearBiabParts(p);
  p.hw[b.hwPrice===50 ? 'bx-f50' : 'bx-f30'] = b.hwPrice;
  p.hw['bx-wan'] = b.wanMss;
  p.hw['bx-sim'] = b.sim;
  p.hw['bx-ip']  = b.ip;
  sohoFinishQuote(p, S);
}
function sohoClearBiabParts(p){ Object.keys(p.hw||{}).forEach(k=>{ if(k.indexOf('bx-')===0) delete p.hw[k]; }); }
function sohoFinishQuote(p, S){
  p.contract = S.term===24 ? '24m' : '36m';
  p.contractFee = null;                    // the rep still chooses the activation fee
  p.step = 4;                              // land on Extras
  setTab('proposal');
  window.scrollTo({top:0});
}
function sohoCopy(btn, text){
  const done = ()=>{ const o = btn.textContent; btn.textContent = sohoEs()?'¡Copiado!':'Copied!'; setTimeout(()=>btn.textContent=o, 1300); };
  try{ navigator.clipboard.writeText(text).then(done, ()=>{}); }catch(e){}
}

// ── Render ────────────────────────────────────────────────────────────────
function renderPlansTab(){
  const S = sohoState(), es = sohoEs(), mo = es?'mes':'mo';
  $('#plans-head').innerHTML = `
    <div class="page-head-eyebrow">${t('tab.planes')}</div>
    <h1>${es?'Planes Fijos (COAX / FTTx)':'Fixed Plans (COAX / FTTx)'}</h1>
    <p>${es?'Escoge el producto y luego la velocidad. Cada plan muestra el precio mensual, los códigos para entrar la orden y "Cotizar este plan", que llena la Cotización.'
           :'Pick the product, then the speed. Each plan shows the monthly price, the codes for order entry and "Quote this plan", which fills the Cart.'}</p>`;

  // ① Products
  $('#plans-controls').innerHTML = `
    <div class="sp-step"><span class="sp-n">1</span>${es?'Escoge el producto':'Pick the product'}</div>
    <div class="sp-products" role="tablist">${SOHO_PRODUCTS.map(pr=>{
      const n = pr.id==='BIAB' ? BIAB_SAFETY.length : sohoGroups(pr.id).length;
      return `<button class="sp-prod ${S.product===pr.id?'on':''} ${pr.id==='BIAB'?'is-biab':''}" role="tab" aria-selected="${S.product===pr.id}" data-prod="${pr.id}">
        <span class="sp-ic">${icon(pr.icon)}</span>
        <span class="sp-pt"><b>${es?pr.es:pr.en}</b><small>${es?pr.subEs:pr.subEn}</small></span>
        <span class="sp-from">${es?'Desde':'From'} <b>${fmt(sohoFrom(pr.id))}</b>/${mo}<i>${n} ${es?(n===1?'velocidad':'velocidades'):(n===1?'speed':'speeds')}</i></span>
      </button>`;}).join('')}</div>`;

  // Options that apply to the chosen product
  const seg = (key, opts) => `<div class="segmented">${opts.map(o=>`<button class="seg-btn ${String(S[key])===String(o[0])?'on':''}" data-sopt="${key}" data-val="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  $('#plans-info').innerHTML = `
    <div class="sp-step"><span class="sp-n">2</span>${es?'Escoge la velocidad':'Pick the speed'}</div>
    <div class="sp-opts">
      <div class="ctrl-group"><span class="ctrl-label">${t('ctrl.tech')}</span>${seg('tech',[['HFC','HFC (COAX)'],['FTTx','FTTx']])}</div>
      <div class="ctrl-group"><span class="ctrl-label">${es?'Término':'Term'}</span>${seg('term',[[24,es?'24 meses':'24 mo'],[36,es?'36 meses':'36 mo']])}</div>
      ${S.product!=='BIAB' ? `<label class="sp-fmc ${S.fmc?'on':''}"><input type="checkbox" id="spFmc" ${S.fmc?'checked':''}><span class="sp-sw"></span>
        <span><b>${es?'Cliente con móvil B2B (FMC)':'Customer has B2B mobile (FMC)'}</b><small>${es?'Muestra el precio FMC donde aplica':'Shows the FMC price where it applies'}</small></span></label>` : ''}
    </div>`;
  $$('[data-prod]').forEach(b=>b.addEventListener('click', ()=>{ S.product = b.dataset.prod; renderPlansTab(); }));
  $$('[data-sopt]').forEach(b=>b.addEventListener('click', ()=>{ const k=b.dataset.sopt; S[k] = k==='term' ? +b.dataset.val : b.dataset.val; renderPlansTab(); }));
  const fx = $('#spFmc'); if(fx) fx.addEventListener('change', ()=>{ S.fmc = fx.checked; renderPlansTab(); });
  $('#plans-callout').innerHTML = '';

  $('#plan-grid').innerHTML = S.product==='BIAB' ? renderBiabCards() : renderSpeedCards(S.product);
}

function renderSpeedCards(product){
  const S = sohoState(), es = sohoEs(), mo = es?'mes':'mo';
  const groups = sohoGroups(product);
  return `<div class="sp-grid">${groups.map(g=>{
    const {o, exact} = sohoPick(g, S.fmc);
    const bw = o.bw.replace('MB',' MB').replace('GB',' GB');
    const lp = sohoListPrice(o, S.tech), save = (lp && lp > o.mrr) ? lp - o.mrr : 0;
    const bill = o.bill[S.tech], disc = o.disc ? o.disc[S.term] : null;
    let badge = '';
    if(o.fmc==='yes') badge = exact ? `<span class="soho-tag fmc">${es?'Precio FMC':'FMC price'}</span>` : `<span class="soho-tag warn">${es?'Requiere FMC':'Requires FMC'}</span>`;
    else if(o.fmc==='both') badge = `<span class="soho-tag fmc">${es?'Igual con o sin FMC':'Same with or without FMC'}</span>`;
    else if(S.fmc && !exact) badge = `<span class="soho-tag muted">${es?'Sin precio FMC':'No FMC price'}</span>`;
    const other = g.variants.filter(v=>v!==o)[0];
    const otherLine = other ? `<div class="sp-alt">${other.fmc==='yes'?(es?'Con FMC':'With FMC'):(es?'Sin FMC':'Without FMC')}: <b>${fmt(other.mrr)}</b>/${mo}</div>` : '';
    const codes = `${es?'Facturación':'Billing'}: ${bill}${disc?` · ${es?'Descuento':'Discount'}: ${disc}`:''}`;
    return `<article class="soho-card ${o.fmc!=='no'?'is-fmc':''}">
      <div class="soho-top">${badge}${o.video?`<span class="soho-tag vid">${o.video}</span>`:''}</div>
      <div class="soho-speed">${bw}</div>
      <div class="soho-name">${sohoSvcName(o, es)}${o.video?` · ${o.video}`:''}</div>
      <div class="soho-price"><b>${fmt(o.mrr)}</b><small>/${mo}</small></div>
      <div class="soho-sub">${save ? `${es?'Lista':'List'} <s>${fmt(lp)}</s> · <span class="soho-save">${es?'Ahorra':'Save'} ${fmt(save)}</span>` : (o.quote.price==='list'?(es?'Precio de lista':'List price'):'&nbsp;')}</div>
      ${otherLine}
      <div class="soho-codes">
        <div><span>${es?'Código de facturación':'Billing code'} · ${S.tech}</span><code>${bill}</code></div>
        <div><span>${es?'Código de descuento':'Discount code'} · ${S.term} ${es?'meses':'mo'}</span><code>${disc || (es?'No aplica':'N/A')}</code></div>
      </div>
      <div class="soho-actions">
        <button class="soho-cta" onclick="sohoQuote('${o.id}')">${es?'Cotizar este plan':'Quote this plan'} ${icon('arrow')}</button>
        <button class="soho-copy" onclick="sohoCopy(this, '${(sohoSvcName(o,false)+' '+o.bw+(o.video?' '+o.video:'')+' '+S.tech+' · '+codes).replace(/'/g,'')}')">${es?'Copiar códigos':'Copy codes'}</button>
      </div>
    </article>`;
  }).join('')}</div>`;
}

function renderBiabCards(){
  const es = sohoEs(), mo = es?'mes':'mo';
  const row = (l, v) => `<div class="biab-row"><span>${l}</span><b>${v}</b></div>`;
  return `<div class="biab-intro">
      <div><b>🔒 Liberty Business in a Box · Safety Connection</b>
      <p>${es?'Internet + voz con respaldo LTE y seguridad administrada, en un solo paquete. Lo que cambia entre planes es la velocidad; los add-ons incluidos vienen con cada plan.'
             :'Internet + voice with LTE backup and managed security, in one bundle. What changes between plans is the speed; the included add-ons come with every plan.'}</p></div>
      <span class="biab-badge">${es?'Respaldo LTE incluido':'LTE backup included'}</span>
    </div>
    <div class="sp-grid">${BIAB_SAFETY.map((b,i)=>`
      <article class="soho-card biab-card2">
        <div class="soho-top"><span class="soho-tag biab">Safety Connection</span></div>
        <div class="soho-speed">${b.speed.replace('M',' MB')}</div>
        <div class="soho-name">${es?'2P Internet + Voz':'2P Internet + Voice'} · <b>${fmt(b.wan)}</b>/${mo}</div>
        <div class="soho-price"><b>${fmt(b.total)}</b><small>/${mo} ${es?'total':'total'}</small></div>
        <div class="biab-addons">
          <div class="biab-addons-h">${es?'Add-ons incluidos':'Included add-ons'}</div>
          ${row(b.hw, fmt(b.hwPrice))}
          ${row('WAN & MSS', fmt(b.wanMss))}
          ${row(es?'SIM Card (respaldo LTE)':'SIM Card (LTE backup)', fmt(b.sim))}
          ${row(es?'IP estático':'Static IP', fmt(b.ip))}
        </div>
        <div class="soho-actions">
          <button class="soho-cta" onclick="biabQuote(${i})">${es?'Cotizar este plan':'Quote this plan'} ${icon('arrow')}</button>
        </div>
      </article>`).join('')}</div>
    <div class="biab-what">
      <b>${es?'Qué incluye cada add-on':'What each add-on is'}</b>
      <ul>
        <li><b>FortiWiFi / FortiGate 30G ${es?'o':'or'} 50G + FortiExtender 101G (FEX-101G)</b> — ${es?'firewall con WiFi y el equipo de respaldo LTE que mantiene el negocio conectado si falla la conexión principal; el respaldo soporta hasta 300 Mbps. El plan de 1000 MB usa el 50G.':'firewall with WiFi, and the LTE backup unit that keeps the business online if the main connection fails; the backup supports up to 300 Mbps. The 1000 MB plan uses the 50G.'}</li>
        <li><b>WAN & MSS</b> — ${es?'WAN administrado y servicio de seguridad administrada (Managed Security Service).':'managed WAN and Managed Security Service.'}</li>
        <li><b>SIM Card</b> — ${es?'la línea de datos LTE que usa el FortiExtender para el respaldo.':'the LTE data line the FortiExtender uses for the backup.'}</li>
        <li><b>${es?'IP estático':'Static IP'}</b> — ${es?'dirección IP fija para cámaras, acceso remoto o servidores.':'a fixed IP address for cameras, remote access or servers.'}</li>
      </ul>
      <p>${es?'"Cotizar este plan" pone en la Cotización el 2P y cada add-on como su propia línea, así el total coincide con el precio del paquete.':'"Quote this plan" puts the 2P and each add-on in the Cart as their own lines, so the total matches the bundle price.'}</p>
    </div>`;
}
