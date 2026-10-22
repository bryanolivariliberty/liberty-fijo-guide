// ═══════════════════════════════════════════════════════════════════════════
// ATLAS — virtual assistant for the B2B Sales Tools (UAT)
// Answers come ONLY from this tool's own data (plans, prices, scripts, rules),
// matched by keywords in English and Spanish. Nothing is sent anywhere: no AI
// service, no Salesforce connection. For anything beyond the tool, Atlas builds
// a MyKnowledge search (same Salesforce deep link the Quote Assistant uses) that
// opens in a new tab, where the rep is already signed in.
// Each tool plugs in its knowledge with atlasConfig({...}) (see the tool pack).
// ═══════════════════════════════════════════════════════════════════════════
const ATLAS = { cfg:null, open:false, msgs:[] };
const ATLAS_SF_BASE = 'https://cwc.lightning.force.com/one/one.app#';

function atlasEs(){ return typeof lang!=='undefined' && lang==='es'; }
function atlasT(en, es){ return atlasEs() ? es : en; }
function atlasEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function atlasNorm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$.+\- ]/g,' ').replace(/\s+/g,' ').trim(); }
function atlasHas(n, words){ return words.some(w=>(' '+n+' ').indexOf(' '+w)>=0 || n.indexOf(w)>=0 && w.length>4); }
function atlasMoney(v){ return '$'+(+v).toFixed(2); }

// ── MyKnowledge search link (same format as the Mobile tool's Quote Assistant) ──
function atlasUuid(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
}
function atlasKbUrl(term){
  const payload={componentDef:'forceSearch:searchPageDesktop',attributes:{term:String(term),
    scopeMap:{type:'TOP_RESULTS',namespace:'',label:'Top Results',labelPlural:'Top Results',resultsCmp:'forceSearch:predictedResults'},
    context:{FILTERS:{},searchSource:'ASSISTANT_DIALOG',disableIntentQuery:false,disableSpellCorrection:false,
      searchDialogSessionId:atlasUuid(),
      debugInfo:{appName:'My_Knowledge',appType:'Console',appNamespace:'c',location:'force:objectHomeDesktop',sobjectType:'Knowledge__kav'}},
    groupId:'DEFAULT'},state:{}};
  return ATLAS_SF_BASE + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
}
const ATLAS_STOP = new Set(('a al como con cual cuales cuanto cuanta cuesta de del donde el en es esta este hay la las le lo los me mi para por que qué se si sin su sus tiene un una uno y o ' +
  'hago hacer hace puedo puede podemos necesito quiero quiere debo tengo hay favor ayuda ayudame dime explica ' +
  'the a an and are can do does for from how i in is it me my of on or the this to what when where which who why with you your much many cost price please tell need know about help explain want').split(' '));
function atlasTerms(q){
  const words = atlasNorm(q).split(' ').filter(w=>w.length>2 && !ATLAS_STOP.has(w));
  const t = words.slice(0,6).join(' ');
  return (ATLAS.cfg && ATLAS.cfg.kbPrefix ? ATLAS.cfg.kbPrefix+' ' : '') + t;
}

// ── Engine ──────────────────────────────────────────────────────────────────
// A pack provides: matchers (functions q,n → answer|null, tried in order) and
// intents ({kw:[...], answer:()=>answer}); best keyword score wins.
// answer = {html, actions:[{label, run}], kb:'search terms' (optional)}
function atlasAnswer(q){
  const n = atlasNorm(q), cfg = ATLAS.cfg;
  for(const m of (cfg.matchers||[])){ try{ const a = m(q, n); if(a) return a; }catch(e){ console.warn('Atlas', e); } }
  let best = null, bestScore = 0;
  (cfg.intents||[]).forEach(it=>{
    const s = it.kw.reduce((acc,w)=>acc + ((' '+n+' ').indexOf(' '+atlasNorm(w)) >= 0 ? (w.length>6?2:1) : 0), 0);
    if(s > bestScore){ best = it; bestScore = s; }
  });
  if(best) return best.answer(q, n);
  return null;
}

function atlasAsk(q){
  q = String(q||'').trim(); if(!q) return;
  ATLAS.msgs.push({who:'me', html:atlasEsc(q)});
  const a = atlasAnswer(q);
  const terms = atlasTerms(q);
  if(a){
    ATLAS.msgs.push({who:'atlas', html:a.html, actions:a.actions||[], kb:a.kb || terms});
  } else {
    ATLAS.msgs.push({who:'atlas', html:atlasT(
      `I don’t have that in this tool. Search it in <b>MyKnowledge</b> — I prepared the search for you:`,
      `Eso no lo tengo en esta herramienta. Búscalo en <b>MyKnowledge</b> — te preparé la búsqueda:`),
      actions:[], kb:terms, kbMain:true});
  }
  atlasRender(true);
}

// ── UI ──────────────────────────────────────────────────────────────────────
function atlasMount(){
  if(document.getElementById('atlasLaunch')) return;
  const b = document.createElement('button');
  b.id = 'atlasLaunch'; b.type = 'button'; b.className = 'atlas-launch';
  b.setAttribute('aria-controls','atlasPanel'); b.setAttribute('aria-expanded','false');
  b.innerHTML = `<span class="atlas-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg></span><span class="atlas-launch-lbl">Atlas</span>`;
  b.addEventListener('click', ()=>atlasToggle(true));
  document.body.appendChild(b);

  const p = document.createElement('aside');
  p.id = 'atlasPanel'; p.className = 'atlas-panel'; p.setAttribute('role','dialog'); p.setAttribute('aria-labelledby','atlasTitle');
  p.innerHTML = `
    <div class="atlas-head">
      <div class="atlas-av" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg></div>
      <div><h2 id="atlasTitle">Atlas</h2><p id="atlasSub"></p></div>
      <button type="button" class="atlas-x" id="atlasClose" aria-label="Close">&times;</button>
    </div>
    <div class="atlas-body" id="atlasBody" aria-live="polite"></div>
    <div class="atlas-chips" id="atlasChips"></div>
    <form class="atlas-input" id="atlasForm" autocomplete="off">
      <input id="atlasQ" type="text" maxlength="200">
      <button type="submit" id="atlasSend" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
    </form>
    <div class="atlas-foot" id="atlasFoot"></div>`;
  document.body.appendChild(p);
  document.getElementById('atlasClose').addEventListener('click', ()=>atlasToggle(false));
  document.getElementById('atlasForm').addEventListener('submit', e=>{ e.preventDefault(); const i = document.getElementById('atlasQ'); atlasAsk(i.value); i.value=''; });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && ATLAS.open) atlasToggle(false); });
  p.addEventListener('click', e=>{
    const btn = e.target.closest('[data-atlas]'); if(!btn) return;
    const kind = btn.dataset.atlas;
    if(kind==='chip'){ atlasAsk(btn.dataset.q); return; }
    if(kind==='act'){ const m = ATLAS.msgs[+btn.dataset.m], a = m && m.actions[+btn.dataset.a]; if(a){ a.run(); if(!a.stay && window.innerWidth<700) atlasToggle(false); } return; }
    if(kind==='kb-open'){ window.open(atlasKbUrl(btn.dataset.q), '_blank', 'noopener'); return; }
    if(kind==='kb-copy'){ try{ navigator.clipboard.writeText(btn.dataset.q); }catch(e){} const o = btn.textContent; btn.textContent = atlasT('Copied!','¡Copiado!'); setTimeout(()=>btn.textContent=o, 1200); }
  });
  atlasRender(false);
}
function atlasToggle(open){
  ATLAS.open = open;
  document.body.classList.toggle('atlas-open', open);
  const b = document.getElementById('atlasLaunch'); if(b) b.setAttribute('aria-expanded', String(open));
  if(open){ atlasRender(false); setTimeout(()=>{ const i=document.getElementById('atlasQ'); if(i && window.innerWidth>700) i.focus(); }, 60); }
}
function atlasRender(scroll){
  const cfg = ATLAS.cfg; if(!cfg || !document.getElementById('atlasPanel')) return;
  document.getElementById('atlasSub').textContent = atlasT('Your sales assistant · '+cfg.toolName, 'Tu asistente de ventas · '+cfg.toolName);
  document.getElementById('atlasQ').placeholder = atlasT('Ask about prices, plans, objections…', 'Pregunta por precios, planes, objeciones…');
  document.getElementById('atlasClose').setAttribute('aria-label', atlasT('Close Atlas','Cerrar Atlas'));
  document.getElementById('atlasFoot').innerHTML = atlasT(
    'Atlas answers from this tool’s content. For processes and policies, it prepares a <b>MyKnowledge</b> search.',
    'Atlas responde con el contenido de esta herramienta. Para procesos y políticas, prepara una búsqueda en <b>MyKnowledge</b>.');
  const greet = `<div class="atlas-msg atlas"><div class="atlas-bub">${atlasT(
      `Hi, I’m <b>Atlas</b> 🧭 Ask me about prices, plans, objections or where to find something in the tool. If it isn’t here, I’ll prepare the <b>MyKnowledge</b> search for you.`,
      `Hola, soy <b>Atlas</b> 🧭 Pregúntame por precios, planes, objeciones o dónde encontrar algo en la herramienta. Si no está aquí, te preparo la búsqueda en <b>MyKnowledge</b>.`)}</div></div>`;
  const body = document.getElementById('atlasBody');
  body.innerHTML = greet + ATLAS.msgs.map((m,mi)=>{
    if(m.who==='me') return `<div class="atlas-msg me"><div class="atlas-bub">${m.html}</div></div>`;
    const acts = (m.actions||[]).map((a,ai)=>`<button type="button" class="atlas-act" data-atlas="act" data-m="${mi}" data-a="${ai}">${atlasEsc(a.label)} →</button>`).join('');
    const kb = m.kb ? `<div class="atlas-kb ${m.kbMain?'main':''}">
        <span>🔎 MyKnowledge: <q>${atlasEsc(m.kb)}</q></span>
        <span class="atlas-kb-btns"><button type="button" data-atlas="kb-open" data-q="${atlasEsc(m.kb)}">${atlasT('Open search','Abrir búsqueda')} ↗</button><button type="button" data-atlas="kb-copy" data-q="${atlasEsc(m.kb)}">${atlasT('Copy','Copiar')}</button></span>
      </div>` : '';
    return `<div class="atlas-msg atlas"><div class="atlas-bub">${m.html}${acts?`<div class="atlas-acts">${acts}</div>`:''}${kb}</div></div>`;
  }).join('');
  const chips = (cfg.chips ? cfg.chips() : []);
  document.getElementById('atlasChips').innerHTML = chips.map(c=>`<button type="button" class="atlas-chip" data-atlas="chip" data-q="${atlasEsc(c)}">${atlasEsc(c)}</button>`).join('');
  if(scroll) body.scrollTop = body.scrollHeight;
}
function atlasConfig(cfg){
  ATLAS.cfg = cfg;
  const go = ()=>atlasMount();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', go); else go();
}

// ── Shared: objection scripts from the Sales Flow (OBJ), both tools ─────────
const ATLAS_OBJ_KW = {
  price:['caro','expensive','precio alto','too much','muy caro','cheaper','barato','costoso','presupuesto','budget'],
  happy:['contento','happy','satisfecho','no quiero cambiar','estoy bien'],
  device:['debo','owe','balance','financiamiento','pagando el telefono','pagando el equipo'],
  coverage:['cobertura','coverage','senal','signal','no llega'],
  hassle:['molestia','hassle','complicado','dificil cambiar','switching','proceso de cambio'],
  think:['pensarlo','think about','pensar','lo pienso','dejame pensar'],
  offer:['me ofrecio','offered','oferta de claro','oferta de t-mobile','claro me','t-mobile me','competencia ofrece'],
  decider:['socio','partner','contador','accountant','consultarlo','consultar con']
};
function atlasObjectionMatcher(q, n){
  if(typeof OBJ==='undefined') return null;
  let hit = null;
  for(const id in ATLAS_OBJ_KW){ if(ATLAS_OBJ_KW[id].some(w=>n.indexOf(atlasNorm(w))>=0)){ hit = id; break; } }
  if(!hit) return null;
  const o = OBJ.find(x=>x.id===hit); if(!o) return null;
  const L = atlasEs()?'es':'en';
  return {html:`<div class="atlas-k">${atlasT('Objection','Objeción')} · ${atlasEsc(atlasEs()?o.es:o.en)}</div>
      <p><b>A</b> · ${atlasEsc(o.A[L])}</p><p><b>I</b> · ${atlasEsc(o.I[L])}</p><p><b>M</b> · ${atlasEsc(o.M[L])}</p>
      <p class="atlas-note">${atlasEsc(o.note[L])}</p>`,
    actions:[{label:atlasT('Open it in the Sales Flow','Abrirla en el Flujo de Venta'), run:()=>{ SELL.obj=o.id; SELL.objHeard[o.id]=true; ATLAS.cfg.goFlow(3); }}],
    kb:(ATLAS.cfg.kbPrefix||'')+' '+(o.id==='offer'?'competencia':'objeciones')};
}

// ═══════════════════════════════════════════════════════════════════════════
// ATLAS · B2B Fixed Sales Tool pack — reads SOHO_OFFERS, BIAB_SAFETY, ADDONS,
// HARDWARE, VS_CLARO and OBJ, so answers always match the tool.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  const go = tab => { setTab(tab); window.scrollTo({top:0, behavior:'smooth'}); };
  const goFlow = step => { setTab('flow'); flowGo(step); };
  const act = (en, es, run) => ({label:atlasT(en, es), run});

  function speedOf(n){
    if(/\b(1000|1 ?g|1 ?gb|1 ?giga|giga|gig)\b/.test(n)) return '1GB';
    if(/\b600\b/.test(n)) return '600MB';
    if(/\b500\b/.test(n)) return '500MB';
    if(/\b300\b/.test(n)) return '300';
    if(/\b100\b/.test(n)) return '100';
    return null;
  }
  function productOf(n){
    if(/\b(biab|box|safety|in a box)\b/.test(n)) return 'BIAB';
    if(/\b(1p|1 p|solo internet|internet only)\b/.test(n)) return '1P';
    if(/\b(3p|3 p|video|tv|triple|edp|espanol de primera|ultimate)\b/.test(n)) return '3P';
    if(/\b(2p|2 p|voz|voice|telefono|phone|doble play)\b/.test(n)) return '2P';
    return null;
  }
  const fmcOf = n => /\b(fmc|movil b2b|mobile line|con movil|with mobile)\b/.test(n) && !/\b(sin fmc|no fmc|without fmc)\b/.test(n);
  const svcName = o => o.svc==='1P' ? '1P Internet' : o.svc==='2P' ? atlasT('2P Internet + Voice','2P Internet + Voz') : atlasT('3P Internet + Voice + Video','3P Internet + Voz + Video');

  // "How much is 2P 1 GB with FMC?" → the matching SOHO offer(s) + Quote
  function priceMatcher(q, n){
    const prod = productOf(n), spd = speedOf(n);
    if(!prod && !spd) return null;
    if(!/\b(precio|price|cuanto|how much|cuesta|cost|mrr|plan|cotiz|quote|\$)/.test(n) && !(prod && spd)) return null;
    if(prod==='BIAB' || (spd==='100' || spd==='300')){
      const map = {'100':'100M','300':'300M','500MB':'500M','1GB':'1000M'};
      const list = spd && map[spd] ? BIAB_SAFETY.filter(b=>b.speed===map[spd]) : BIAB_SAFETY;
      return {html:`<div class="atlas-k">Liberty Business in a Box · Safety Connection</div>`+
        list.map(b=>`<p><b>${b.speed.replace('M',' MB')}</b> — ${atlasMoney(b.total)}/${atlasT('mo','mes')} <span class="atlas-note">(2P ${atlasMoney(b.wan)} + ${atlasEsc(b.hw)} ${atlasMoney(b.hwPrice)} + WAN & MSS ${atlasMoney(b.wanMss)} + SIM ${atlasMoney(b.sim)} + IP ${atlasMoney(b.ip)})</span></p>`).join(''),
        actions: list.length===1 ? [act('Quote this plan','Cotizar este plan', ()=>{ const i = BIAB_SAFETY.indexOf(list[0]); state.soho = Object.assign(state.soho||{}, {product:'BIAB'}); biabQuote(i); })]
                                 : [act('See them in Our Plans','Verlos en Nuestros Planes', ()=>{ state.soho = Object.assign(state.soho||{tech:'HFC',term:36,fmc:false}, {product:'BIAB'}); go('planes'); })],
        kb:'Liberty Business in a Box Safety Connection'};
    }
    const fmc = fmcOf(n);
    let list = SOHO_OFFERS.filter(o=>(!prod || o.svc===prod) && (!spd || o.bw===spd));
    if(/\bultimate\b/.test(n)) list = list.filter(o=>o.video==='Ultimate');
    if(!list.length) return {html:atlasT(`There’s no ${prod||''} ${spd||''} offer in Our Plans. Available speeds are 500 MB, 600 MB and 1 GB (and 100–1000 MB in Safety Connection).`,
                                         `No hay oferta ${prod||''} ${spd||''} en Nuestros Planes. Las velocidades son 500 MB, 600 MB y 1 GB (y 100–1000 MB en Safety Connection).`),
                             actions:[act('Open Our Plans','Abrir Nuestros Planes', ()=>go('planes'))]};
    // prefer the FMC / non-FMC variant the rep asked for
    const pick = list.filter(o => fmc ? o.fmc!=='no' : o.fmc!=='yes');
    const show = (pick.length ? pick : list).slice(0,4);
    const term = (state.soho && state.soho.term) || 36, tech = (state.soho && state.soho.tech) || 'HFC';
    return {html:show.map(o=>`<p><b>${svcName(o)} · ${o.bw.replace('MB',' MB').replace('GB',' GB')}${o.video?' · '+o.video:''}</b><br>
        ${atlasMoney(o.mrr)}/${atlasT('mo','mes')} ${o.fmc==='yes'?'· FMC':o.fmc==='both'?atlasT('· same with or without FMC','· igual con o sin FMC'):''}
        <span class="atlas-note">${atlasT('Billing','Facturación')} ${tech}: ${o.bill[tech]}${o.disc?` · ${atlasT('Discount','Descuento')} ${term} ${atlasT('mo','meses')}: ${o.disc[term]}`:''}</span></p>`).join('') +
        (fmc && !pick.length ? `<p class="atlas-note">${atlasT('No FMC price for this one.','Este no tiene precio FMC.')}</p>` : ''),
      actions: show.length===1
        ? [act('Quote this plan','Cotizar este plan', ()=>{ state.soho = Object.assign(state.soho||{tech:'HFC',term:36}, {product:show[0].svc, fmc}); sohoQuote(show[0].id); })]
        : [act('Compare in Our Plans','Comparar en Nuestros Planes', ()=>{ state.soho = Object.assign(state.soho||{tech:'HFC',term:36}, {product:prod||show[0].svc, fmc}); go('planes'); })],
      kb:`SOHO ${prod||''} ${spd||''}`.replace(/\s+/g,' ').trim()};
  }

  // "How much is Static IP / antivirus?" → add-on or hardware price
  function addonMatcher(q, n){
    const all = ADDONS.concat(HARDWARE.filter(h=>!h.biab));
    const syn = {ao1:['ongoing'], ao2:['hunting'], ao3:['ip estatico','static ip','ip fija'], ao4:['antivirus'], ao5:['nube','storage','almacenamiento','cloud'],
                 ao6:['tienda','online store','ecommerce'], ao7:['voicemail','buzon'], hw1:['forti','fortiwifi','wifi security'], hw2:['switch','extension de red'],
                 hw3:['managed wan','wan administrado'], hw4:['mss','managed security','seguridad administrada'], hw5:['ip estatico hw','static ip hw']};
    const hits = all.filter(x=>(syn[x.id]||[]).some(w=>n.indexOf(w)>=0));
    if(!hits.length) return null;
    return {html:`<div class="atlas-k">${atlasT('Add-ons','Add-ons')}</div>`+hits.slice(0,3).map(x=>`<p><b>${atlasEsc(x.name)}</b> — ${atlasMoney(x.price)}/${atlasT('mo','mes')}${x.sub?` <span class="atlas-note">${atlasEsc(x.sub)}</span>`:''}</p>`).join('')+
      `<p class="atlas-note">${atlasT('You add them in the Cart’s Extras step.','Se agregan en el paso Extras de la Cotización.')}</p>`,
      actions:[act('Open Add-ons','Abrir Add-ons', ()=>go('addons')), act('Go to the Cart','Ir a la Cotización', ()=>go('proposal'))],
      kb:hits[0].name};
  }

  // "Claro" → vs Claro numbers
  function claroMatcher(q, n){
    if(!/\bclaro\b/.test(n) || ATLAS_OBJ_KW.offer.some(w=>n.indexOf(atlasNorm(w))>=0)) return null;
    const rows = VS_CLARO.filter(r=>r.lib!=null && r.claro!=null);
    return {html:`<div class="atlas-k">Liberty vs Claro</div>`+rows.map(r=>`<p>${atlasEsc(atlasEs()?r.es:r.en)}: <b>${atlasMoney(r.lib)}</b> vs ${atlasMoney(r.claro)}</p>`).join('')+
      `<p class="atlas-note">${atlasT('Claro is lower on 2P — lead with 3P, coverage, FMC and backup. Don’t say “cheaper” or “faster”.','Claro está más bajo en 2P — habla de 3P, cobertura, FMC y respaldo. No digas “más barato” ni “más rápido”.')}</p>`,
      actions:[act('Open vs Claro','Abrir vs Claro', ()=>go('vsclaro')), act('Objection script','Guion de objeción', ()=>{ SELL.obj='offer'; SELL.objHeard.offer=true; goFlow(3); })],
      kb:'Claro competencia fijo'};
  }

  const I = (kw, fn) => ({kw, answer:fn});
  const intents = [
    I(['lto','sin contrato','without contract','no renueva','lead offer','oferta limitada'], ()=>({html:atlasT(
      `<b>LTO without contract:</b> if the customer doesn’t renew at the LTO price, the monthly cost moves to the <b>List Price</b> automatically. LTO prices (List, Lead Offer, FMC) are in the Cart’s price-type step and require a contract.`,
      `<b>LTO sin contrato:</b> si el cliente no renueva al precio LTO, el costo mensual pasa automáticamente al <b>Precio de Lista</b>. Los precios LTO (Lista, Lead Offer, FMC) están en el paso de tipo de precio de la Cotización y requieren contrato.`),
      actions:[act('Go to the Cart','Ir a la Cotización', ()=>go('proposal'))], kb:'LTO contrato SOHO'})),
    I(['rgu','equal to equal','equivalente','penalidad','penalty','early termination'], ()=>({html:atlasT(
      `<b>Equal to Equal RGU:</b> for the competitor penalty payment, the customer must activate a service equivalent to the one they had (same type of RGU). Details in Promotions.`,
      `<b>Equal to Equal RGU:</b> para el pago de penalidad del competidor, el cliente debe activar un servicio equivalente al que tenía (mismo tipo de RGU). Detalles en Promociones.`),
      actions:[act('Open Promotions','Abrir Promociones', ()=>go('promos'))], kb:'pago penalidad competidor Equal to Equal RGU'})),
    I(['fmc','double bandwidth','doble velocidad','duplica','movil b2b'], ()=>({html:atlasT(
      `<b>FMC:</b> with an active B2B mobile line, the internet qualifies for <b>Double Bandwidth</b> and FMC prices (2P: $60.99 at 500 MB, $62.99 at 1 GB). There is no FMC offer on the mobile side. Confirm eligibility in MyKnowledge (Salesforce).`,
      `<b>FMC:</b> con un móvil B2B activo, el internet califica para <b>Double Bandwidth</b> y precios FMC (2P: $60.99 en 500 MB, $62.99 en 1 GB). No hay oferta FMC del lado móvil. Confirma la elegibilidad en MyKnowledge (Salesforce).`),
      actions:[act('Show FMC prices','Ver precios FMC', ()=>{ state.soho = Object.assign(state.soho||{tech:'HFC',term:36,product:'2P'}, {fmc:true}); go('planes'); }),
               act('FMC card in the Sales Flow','Tarjeta FMC en el Flujo', ()=>goFlow(2))], kb:'FMC Double Bandwidth elegibilidad'})),
    I(['rate increase','aumento','incremento','renovacion','renewal'], ()=>({html:atlasT(
      `<b>2026 Rate Increase:</b> applies to existing customers on renewal or service update. The prices in the tool already include it.`,
      `<b>Rate Increase 2026:</b> aplica a clientes existentes en renovación o actualización de servicio. Los precios de la herramienta ya lo incluyen.`), kb:'Rate Increase 2026'})),
    I(['codigo','code','billing','facturacion','descuento','discount code','orden','order entry'], ()=>({html:atlasT(
      `Each plan in <b>Our Plans</b> shows its <b>billing code</b> (changes with HFC/FTTx) and <b>discount code</b> (changes with the 24/36-month term). Use “Copy codes” on the card.`,
      `Cada plan en <b>Nuestros Planes</b> muestra su <b>código de facturación</b> (cambia con HFC/FTTx) y su <b>código de descuento</b> (cambia con el término de 24/36 meses). Usa “Copiar códigos” en la tarjeta.`),
      actions:[act('Open Our Plans','Abrir Nuestros Planes', ()=>go('planes'))], kb:'códigos facturación SOHO'})),
    I(['24','36','termino','term','meses','contract term'], ()=>({html:atlasT(
      `SOHO offers have the <b>same monthly price on 24 or 36 months</b>; only the discount code changes. Pick the term in Our Plans or in the Cart’s Term step.`,
      `Las ofertas SOHO tienen el <b>mismo precio mensual en 24 o 36 meses</b>; solo cambia el código de descuento. Escoge el término en Nuestros Planes o en el paso Término de la Cotización.`),
      actions:[act('Open Our Plans','Abrir Nuestros Planes', ()=>go('planes'))], kb:'término contrato SOHO'})),
    I(['safety','box','biab','respaldo','backup','5g','fortiextender','fortigate','fex','sim card','add-ons incluidos'], ()=>({html:atlasT(
      `<b>Liberty Business in a Box · Safety Connection</b>: 2P + FortiWiFi/FortiGate + FortiExtender 101F (5G backup) + WAN & MSS + SIM Card + Static IP. 100 MB $199.99 · 300 MB $207.99 · 500 MB $210.99 · 1000 MB $222.99. “Quote this plan” puts each add-on in the Cart as its own line.`,
      `<b>Liberty Business in a Box · Safety Connection</b>: 2P + FortiWiFi/FortiGate + FortiExtender 101F (respaldo 5G) + WAN & MSS + SIM Card + IP estático. 100 MB $199.99 · 300 MB $207.99 · 500 MB $210.99 · 1000 MB $222.99. “Cotizar este plan” pone cada add-on en la Cotización como su propia línea.`),
      actions:[act('See Safety Connection','Ver Safety Connection', ()=>{ state.soho = Object.assign(state.soho||{tech:'HFC',term:36,fmc:false}, {product:'BIAB'}); go('planes'); })], kb:'Liberty Business in a Box Safety Connection'})),
    I(['contrato','contract','soho contract','solicitud','pdf','propuesta','proposal'], ()=>({html:atlasT(
      `In the <b>Cart</b>: “Generate Proposal” or “Download PDF” for the proposal, and “Go to SOHO Contract” for the auto-filled contract.`,
      `En la <b>Cotización</b>: “Generar Propuesta” o “Descargar PDF” para la propuesta, y “Ir al Contrato SOHO” para el contrato auto-llenado.`),
      actions:[act('Go to the Cart','Ir a la Cotización', ()=>go('proposal'))], kb:'contrato SOHO solicitud'})),
    I(['promo','promocion','promotion','referido','referral'], ()=>({html:atlasT(
      `<b>Promotions</b>: competitor penalty payment (Equal to Equal RGU) and customer referrals (90-day retention).`,
      `<b>Promociones</b>: pago de penalidad del competidor (Equal to Equal RGU) y referidos de clientes (90 días de retención).`),
      actions:[act('Open Promotions','Abrir Promociones', ()=>go('promos'))], kb:'promociones SOHO referidos'})),
    I(['flujo','sales flow','descubr','discover','preguntas','questions','cierre','close','checklist'], ()=>({html:atlasT(
      `The <b>Sales Flow</b> guides the call: Discover → Build the offer → Objections (AIM) → Close, with the Customer Brief always visible.`,
      `El <b>Flujo de Venta</b> guía la llamada: Descubrir → Armar la oferta → Objeciones (AIM) → Cerrar, con el Resumen del cliente siempre visible.`),
      actions:[act('Start at Discover','Empezar en Descubrir', ()=>goFlow(1)), act('Go to Close','Ir a Cerrar', ()=>goFlow(4))], kb:'proceso de venta SOHO'})),
    I(['cotizar','quote','cotizacion','cart','carrito'], ()=>({html:atlasT(
      `Three ways to quote, one quote: <b>Our Plans</b> (Quote this plan), the <b>Sales Flow</b> (Build the offer) or the <b>Cart</b> directly.`,
      `Tres formas de cotizar, una sola cotización: <b>Nuestros Planes</b> (Cotizar este plan), el <b>Flujo de Venta</b> (Armar la oferta) o directo en la <b>Cotización</b>.`),
      actions:[act('Open Our Plans','Abrir Nuestros Planes', ()=>go('planes')), act('Build the offer','Armar la oferta', ()=>goFlow(2))], kb:'cotizar SOHO'})),
    I(['add-on','addon','extras','antivirus','hardware'], ()=>({html:atlasT(
      `<b>Add-ons</b> lists voice, video, security, cloud and hardware prices. You add them in the Cart’s Extras step.`,
      `<b>Add-ons</b> tiene precios de voz, video, seguridad, nube y hardware. Se agregan en el paso Extras de la Cotización.`),
      actions:[act('Open Add-ons','Abrir Add-ons', ()=>go('addons'))], kb:'add-ons SOHO'})),
    I(['plan','planes','plans','velocidad','speed','precio','price'], ()=>({html:atlasT(
      `In <b>Our Plans</b> pick the product (1P, 2P, 3P or Liberty Business in a Box), then the speed. Tip: ask me something like “2P 1 GB with FMC”.`,
      `En <b>Nuestros Planes</b> escoge el producto (1P, 2P, 3P o Liberty Business in a Box) y luego la velocidad. Tip: pregúntame algo como “2P 1 GB con FMC”.`),
      actions:[act('Open Our Plans','Abrir Nuestros Planes', ()=>go('planes'))]}))
  ];

  atlasConfig({
    toolName:'B2B Fixed Sales Tool', kbPrefix:'SOHO', goFlow,
    matchers:[atlasObjectionMatcher, claroMatcher, addonMatcher, priceMatcher],
    intents,
    chips:()=>atlasEs()
      ? ['¿Cuánto es 2P 1 GB con FMC?','El cliente dice que es muy caro','¿Qué incluye Safety Connection?','LTO sin contrato','¿Cuánto cuesta el IP estático?']
      : ['How much is 2P 1 GB with FMC?','The customer says it’s too expensive','What’s in Safety Connection?','LTO without contract','How much is Static IP?']
  });
  // Keep the panel's language in sync with the ES/EN toggle
  if(typeof setLang==='function'){ const _sl = setLang; setLang = function(){ _sl.apply(this, arguments); atlasRender(false); }; }
})();
