/* Quick Tips tour — same window and options as the B2B Mobile Sales Tool */
// ═══════════════════════════════════════════════════════════════════════════
// QUICK TIPS (UAT, Fixed) — dims the screen when the tool opens and offers a 7-tip tour
// that spotlights each part of the tool.
//   • "Skip for now"         → asks again next session
//   • "Don't ask for 30 days" (or finishing the tour) → quiet for 30 days
//   • "▶ Quick tips" button in How to Use replays it anytime
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  const SNOOZE_KEY = 'lf_tips_snooze_until', SESSION_KEY = 'lf_tips_skipped', DAYS = 30;
  const es = () => (typeof lang !== 'undefined' && lang === 'es');
  const store = {
    get(k, s){ try{ return (s?sessionStorage:localStorage).getItem(k); }catch(e){ return null; } },
    set(k, v, s){ try{ (s?sessionStorage:localStorage).setItem(k, v); }catch(e){} }
  };
  const go = id => { if(typeof setTab==='function') setTab(id); };

  // ── The tips (7). `show` switches to the tab the tip talks about first ──
  const STEPS = [
    { el:'.tabs-wrap', show:'guide', en:['Tabs in the order of the call','Everything lives in these tabs. Start at How to Use for a refresher; the tabs stay at the top while you scroll.'],
                   es:['Pestañas en el orden de la llamada','Todo está en estas pestañas. Empieza en Cómo Usar si necesitas repasar; las pestañas se quedan arriba mientras haces scroll.'] },
    { el:'.tab-btn[data-tab="flow"]', show:'flow', en:['Sales Flow: your conversation guide','Discover → Build the offer → Objections (AIM) → Close. You can quote right there, and the savings update live.'],
                   es:['Flujo de Venta: tu guía de la conversación','Descubrir → Armar la oferta → Objeciones (AIM) → Cerrar. Puedes cotizar ahí mismo y el ahorro se actualiza en vivo.'] },
    { el:'.sp-products', show:'planes', en:['Our Plans: product, then speed','Pick 1P, 2P, 3P or Liberty Business in a Box, then the speed. Each card shows the price and the codes; "Quote this plan" fills the Cart.'],
                   es:['Nuestros Planes: producto y luego velocidad','Escoge 1P, 2P, 3P o Liberty Business in a Box, y luego la velocidad. Cada tarjeta muestra el precio y los códigos; "Cotizar este plan" llena la Cotización.'] },
    { el:'.tab-btn[data-tab="vsclaro"]', show:'vsclaro', en:['vs Claro','Side-by-side prices by speed, where Liberty wins and what not to claim. Use it when the customer is comparing.'],
                   es:['vs Claro','Precios lado a lado por velocidad, dónde gana Liberty y qué no decir. Úsalo cuando el cliente esté comparando.'] },
    { el:'.tab-btn[data-tab="proposal"]', show:'proposal', en:['Cart','8 steps from technology to contract. Generate the PDF proposal and the auto-filled SOHO contract here.'],
                   es:['Cotización','8 pasos de la tecnología al contrato. Aquí generas la propuesta en PDF y el contrato SOHO auto-llenado.'] },
    { el:'#header-switch', show:'guide', en:['Mobile Sales Tool and FMC','Mobile lines too? Jump to the Mobile Sales Tool (new tab). In the Sales Flow, the FMC card sends the customer\u2019s details across.'],
                   es:['Mobile Sales Tool y FMC','¿También líneas móviles? Pasa al Mobile Sales Tool (pestaña nueva). En el Flujo de Venta, la tarjeta FMC envía los datos del cliente.'] },
    { el:'#atlasLaunch', show:'guide', en:['Meet Atlas, your assistant','Ask about prices, plans, objections or rules, in English or Spanish. If it isn\u2019t in the tool, Atlas prepares the MyKnowledge search for you.'],
                   es:['Conoce a Atlas, tu asistente','Pregúntale por precios, planes, objeciones o reglas, en inglés o español. Si no está en la herramienta, Atlas te prepara la búsqueda en MyKnowledge.'] },
  ];

  let dim, modal, hole, tip, i = 0, active = false;
  const T = () => es()
    ? {kick:'Consejos rápidos', title:'¿Te muestro la herramienta en 1 minuto?',
       body:'7 consejos rápidos para moverte por el B2B Fixed Sales Tool. Te iluminamos cada parte mientras la explicamos.',
       list:['Pestañas y Cómo Usar','Flujo de Venta','Nuestros Planes','vs Claro','Cotización','Mobile / FMC','Atlas, tu asistente'],
       start:'Ver los consejos rápidos', later:'Saltar por ahora', snooze:'No preguntar en 30 días',
       of:'de', back:'Atrás', next:'Siguiente', done:'Listo', skip:'Salir', replay:'▶ Consejos rápidos'}
    : {kick:'Quick tips', title:'Want a 1-minute tour of the tool?',
       body:'7 quick tips to find your way around the B2B Fixed Sales Tool. We highlight each part while we explain it.',
       list:['Tabs & How to Use','Sales Flow','Our Plans','vs Claro','Cart','Mobile / FMC','Atlas, your assistant'],
       start:'Show me the quick tips', later:'Skip for now', snooze:'Don\u2019t ask again for 30 days',
       of:'of', back:'Back', next:'Next', done:'Done', skip:'Exit', replay:'▶ Quick tips'};

  function el(tag, cls, html){ const n = document.createElement(tag); if(cls) n.className = cls; if(html!=null) n.innerHTML = html; return n; }
  function cleanup(){
    active = false;
    [modal, hole, tip].forEach(n=>n && n.remove());
    if(dim){ dim.classList.remove('on'); const d = dim; setTimeout(()=>d.remove(), 250); }
    dim = modal = hole = tip = null;
    window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true);
    document.removeEventListener('keydown', onKey);
  }
  function snooze(){ store.set(SNOOZE_KEY, String(Date.now() + DAYS*864e5)); }

  // ── Welcome modal ──
  function openIntro(){
    if(active) return; active = true;
    const t = T();
    dim = el('div','qt-dim'); document.body.appendChild(dim); requestAnimationFrame(()=>dim.classList.add('on'));
    modal = el('div','qt-modal');
    modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-labelledby','qtTitle');
    modal.innerHTML = `<div class="qt-card">
      <div class="qt-card-head"><div class="qt-kick">${t.kick} · B2B Fixed Sales Tool</div>
        <h2 id="qtTitle">${t.title}</h2></div>
      <div class="qt-card-body"><p>${t.body}</p>
        <div class="qt-list">${t.list.map(x=>`<span>${x}</span>`).join('')}</div>
        <button class="qt-btn primary" data-a="start">${t.start} →</button>
        <div class="qt-row"><button class="qt-btn ghost" data-a="later">${t.later}</button><button class="qt-btn ghost" data-a="snooze">${t.snooze}</button></div>
      </div></div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(()=>modal.querySelector('.qt-card').classList.add('on'));
    modal.querySelector('[data-a="start"]').focus();
    modal.addEventListener('click', e=>{
      const a = e.target.closest('[data-a]'); if(!a) return;
      if(a.dataset.a==='start'){ modal.remove(); modal = null; startTour(); }
      else if(a.dataset.a==='later'){ store.set(SESSION_KEY,'1',true); cleanup(); }
      else { snooze(); cleanup(); }
    });
    document.addEventListener('keydown', onKey);
  }

  // ── Spotlight tour ──
  function startTour(){
    i = 0;
    if(dim){ dim.remove(); dim = null; }            // the spotlight draws its own dimming
    hole = el('div','qt-hole'); tip = el('div','qt-tip');
    tip.setAttribute('role','dialog'); tip.setAttribute('aria-live','polite');
    document.body.appendChild(hole); document.body.appendChild(tip);
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    tip.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b) return;
      if(b.classList.contains('qt-next')) next();
      else if(b.classList.contains('qt-back')) show(i-1);
      else if(b.classList.contains('qt-skip')) finish();
    });
    show(0);
  }
  function target(){ return document.querySelector(STEPS[i].el); }
  function show(n){
    if(n < 0) return; i = n;
    const s = STEPS[i], t = T(), txt = es() ? s.es : s.en;
    if(s.show) go(s.show);
    tip.innerHTML = `<div class="qt-step">${i+1} ${t.of} ${STEPS.length}</div><h3>${txt[0]}</h3><p>${txt[1]}</p>
      <div class="qt-dots">${STEPS.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
      <div class="qt-nav"><button class="qt-skip">${t.skip}</button>${i?`<button class="qt-back">${t.back}</button>`:''}<button class="qt-next">${i===STEPS.length-1?t.done+' ✓':t.next+' →'}</button></div>`;
    tip.querySelector('.qt-next').focus();
    setTimeout(()=>{
      const tg = target();
      if(tg){ const r = tg.getBoundingClientRect(); if(r.top < 80 || r.bottom > innerHeight - 40) tg.scrollIntoView({block:'center', behavior:'smooth'}); }
      place(); setTimeout(place, 380);
    }, 60);
  }
  function place(){
    if(!hole || !tip) return;
    const tg = target(), pad = 8, gap = 14;
    let r = tg ? tg.getBoundingClientRect() : {top:innerHeight/2, left:innerWidth/2, width:0, height:0, bottom:innerHeight/2, right:innerWidth/2};
    const box = {top:r.top-pad, left:r.left-pad, width:r.width+pad*2, height:r.height+pad*2};
    Object.assign(hole.style, {top:box.top+'px', left:box.left+'px', width:box.width+'px', height:box.height+'px'});
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let top = box.top + box.height + gap;
    if(top + th > innerHeight - 12) top = Math.max(12, box.top - th - gap);   // above if no room below
    if(top + th > innerHeight - 12) top = innerHeight - th - 12;               // big targets: keep it on screen
    let left = Math.min(Math.max(12, box.left + box.width/2 - tw/2), innerWidth - tw - 12);
    tip.style.top = top+'px'; tip.style.left = left+'px';
  }
  function next(){ if(i < STEPS.length-1) show(i+1); else finish(); }
  function finish(){ snooze(); cleanup(); go('guide'); window.scrollTo({top:0, behavior:'smooth'}); }
  function onKey(e){
    if(e.key==='Escape'){ if(tip) finish(); else { store.set(SESSION_KEY,'1',true); cleanup(); } }
    else if(tip && (e.key==='ArrowRight')) next();
    else if(tip && (e.key==='ArrowLeft')) show(i-1);
  }

  // ── When to offer it: after the rep info screen is gone, once per session ──
  function due(){
    if(store.get(SESSION_KEY, true)) return false;
    const until = +store.get(SNOOZE_KEY) || 0;
    return Date.now() > until;
  }
  // Wait until the rep welcome form is closed (UAT Oct 21)
  function waitForOnboarding(){
    const ob = document.getElementById('onboardOverlay');
    const hidden = !ob || getComputedStyle(ob).display === 'none';
    if(hidden){ setTimeout(()=>{ if(due()) openIntro(); }, 500); } else setTimeout(waitForOnboarding, 400);
  }
  window.addEventListener('load', ()=>setTimeout(waitForOnboarding, 700));

  // ── Replay button in How to Use ──
  function addReplay(){
    const hero = document.querySelector('#howto-root .howto-hero'); if(!hero) return;
    let b = document.getElementById('qtReplay');
    if(!b){ b = el('button','qt-replay'); b.id = 'qtReplay'; b.type = 'button'; hero.appendChild(b);
            b.addEventListener('click', ()=>{ if(!active){ active = true; startTour(); } }); }
    b.textContent = T().replay;
  }
  if(typeof renderGuide === 'function'){ const _rg = renderGuide; renderGuide = function(){ _rg.apply(this, arguments); addReplay(); }; }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addReplay); else addReplay();
  window.lbQuickTips = { open: openIntro, tour: ()=>{ if(!active){ active = true; startTour(); } } };
})();
