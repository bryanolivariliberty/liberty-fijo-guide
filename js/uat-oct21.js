// ═══════════════════════════════════════════════════════════════════════════
// UAT Oct 21 2026 — Fixed Sales Tool
//  · Rep welcome form after login (same fields as the Mobile Sales Tool)
//  · Existing / New customer → Sales Flow scenario
//  · Home button (B2B Sales Hub) and seamless switch to the Mobile Sales Tool
//  · Rep details pre-fill the Cart (Rep) and the SOHO contract
// Rep details are shared with the Mobile tool through sessionStorage 'lb_onboard'.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  const HUB = 'https://libertysalestools.vercel.app/';
  const MOBILE = 'https://liberty-business-sales-guide.vercel.app/guide.html';
  const es = () => lang==='es';
  const getRep = () => { try{ return JSON.parse(sessionStorage.getItem('lb_onboard')||'null'); }catch(e){ return null; } };
  const repOk = r => !!(r && r.name && r.title && r.email && r.phone && r.customerType);

  // ── Welcome form ─────────────────────────────────────────────────────────
  let ctype = '';
  const T = () => es() ? {
      h:'Bienvenido, representante', p:'Completa tu información para entrar a la herramienta',
      name:'Nombre completo', title:'Título', email:'Email', phone:'Teléfono', type:'Tipo de propuesta',
      ex:'🏢 Cliente existente', nw:'✨ Cliente nuevo', go:'Entrar a la herramienta →', err:'Completa todos los campos y escoge el tipo de propuesta.'
    } : {
      h:'Welcome, sales rep', p:'Complete your info to access the Sales Tool',
      name:'Full name', title:'Title', email:'Email', phone:'Phone', type:'Proposal type',
      ex:'🏢 Existing Customer', nw:'✨ New Customer', go:'Enter Sales Tool →', err:'Please complete all fields and choose a proposal type.'
    };
  function vals(){ const v = id => (document.getElementById(id)?.value||'').trim(); return {name:v('ob-name'), title:v('ob-title'), email:v('ob-email'), phone:v('ob-phone'), customerType:ctype}; }
  function renderForm(keep){
    const o = document.getElementById('onboardOverlay'); if(!o) return;
    const t = T(), v = keep || vals();
    o.innerHTML = `<div class="ob-card" role="dialog" aria-modal="true" aria-labelledby="obH">
      <div class="ob-lang"><div><button type="button" data-l="en" class="${es()?'':'on'}">EN</button><button type="button" data-l="es" class="${es()?'on':''}">ES</button></div></div>
      <div class="ob-head"><img src="assets/liberty-logo.png" alt="Liberty Business"><div><h2 id="obH">${t.h}</h2><p>${t.p}</p></div></div>
      <div class="ob-grid">
        <div class="ob-f full"><label for="ob-name">${t.name} <i>*</i></label><input id="ob-name" autocomplete="name" value="${(v.name||'').replace(/"/g,'&quot;')}"></div>
        <div class="ob-f"><label for="ob-title">${t.title} <i>*</i></label><input id="ob-title" autocomplete="organization-title" value="${(v.title||'').replace(/"/g,'&quot;')}"></div>
        <div class="ob-f"><label for="ob-email">${t.email} <i>*</i></label><input id="ob-email" type="email" autocomplete="email" value="${(v.email||'').replace(/"/g,'&quot;')}"></div>
        <div class="ob-f"><label for="ob-phone">${t.phone} <i>*</i></label><input id="ob-phone" type="tel" autocomplete="tel" value="${(v.phone||'').replace(/"/g,'&quot;')}"></div>
        <div class="ob-f full"><label>${t.type} <i>*</i></label><div class="ob-type">
          <button type="button" data-t="existing" class="${ctype==='existing'?'on':''}">${t.ex}</button>
          <button type="button" data-t="new" class="${ctype==='new'?'on':''}">${t.nw}</button></div></div>
      </div>
      <div class="ob-err" id="ob-err">${t.err}</div>
      <button type="button" class="ob-go" id="ob-go">${t.go}</button>
    </div>`;
    const check = () => { document.getElementById('ob-go').disabled = !repOk(vals()); };
    o.querySelectorAll('input').forEach(i=>i.addEventListener('input', check));
    o.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click', ()=>{ ctype = b.dataset.t; renderForm(); }));
    o.querySelectorAll('[data-l]').forEach(b=>b.addEventListener('click', ()=>{ const v0 = vals(); setLang(b.dataset.l); renderForm(v0); }));
    document.getElementById('ob-go').addEventListener('click', submit);
    check();
  }
  function submit(){
    const v = vals();
    if(!repOk(v)){ document.getElementById('ob-err').style.display='block'; return; }
    sessionStorage.setItem('lb_onboard', JSON.stringify(v));
    document.getElementById('onboardOverlay').style.display = 'none';
    applyRep();
  }
  function showFormIfNeeded(){
    if(repOk(getRep())) return;
    let o = document.getElementById('onboardOverlay');
    if(!o){ o = document.createElement('div'); o.id = 'onboardOverlay'; document.body.appendChild(o); }
    o.style.display = 'flex'; renderForm();
    setTimeout(()=>document.getElementById('ob-name')?.focus(), 50);
  }

  // ── Apply the rep's details ──────────────────────────────────────────────
  function applyRep(){
    const r = getRep(); if(!repOk(r)) return;
    // Sales Flow scenario follows Existing / New
    if(typeof SELL!=='undefined' && (SELL.disc==='new' || SELL.disc==='existing')){
      SELL.disc = r.customerType==='existing' ? 'existing' : 'new';
      try{ if(state.tab==='flow') renderFlow(); }catch(e){}
    }
    prefillProp();
  }
  function prefillProp(){
    const r = getRep(); if(!repOk(r) || !state.prop) return;
    if(state.prop.customer && !state.prop.customer.rep) state.prop.customer.rep = r.name;
    if(state.prop.contractExtra){
      if(!state.prop.contractExtra.vendorPhone) state.prop.contractExtra.vendorPhone = r.phone;
    }
  }
  if(typeof propInit==='function'){ const _pi = propInit; propInit = function(){ const x = _pi.apply(this, arguments); prefillProp(); return x; }; }
  if(typeof contractExtraInit==='function'){ const _ce = contractExtraInit; contractExtraInit = function(){ const x = _ce.apply(this, arguments); prefillProp(); return x; }; }

  // ── Header: Home + seamless switch to the Mobile Sales Tool ─────────────
  function quoteInProgress(){ return !!(state.prop && (state.prop.speed || state.prop.tech)); }
  function headerUi(){
    const sw = document.getElementById('header-switch'); if(!sw) return;
    let home = document.getElementById('header-home');
    if(!home){
      home = document.createElement('a'); home.id = 'header-home'; home.className = 'header-home'; home.href = HUB;
      home.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg><span></span>`;
      home.addEventListener('click', e=>{
        e.preventDefault();
        if(quoteInProgress() && !confirm(es()?'¿Ir al inicio? Tu cotización en esta pestaña se perderá.':'Go to Home? Your quote in this tab will be lost.')) return;
        location.href = window.lbSsoUrl ? lbSsoUrl(HUB, lang) : HUB;
      });
      sw.parentNode.insertBefore(home, sw);
    }
    home.querySelector('span').textContent = es()?'Inicio':'Home';
    home.title = es()?'Ir al B2B Sales Hub':'Go to the B2B Sales Hub'; home.setAttribute('aria-label', home.title);
    if(!sw.dataset.sso){
      sw.dataset.sso = '1'; sw.href = MOBILE;
      sw.addEventListener('click', e=>{ e.preventDefault(); window.open(window.lbSsoUrl ? lbSsoUrl(MOBILE, lang) : MOBILE, '_blank', 'noopener'); });
    }
  }
  const _sl = setLang;
  setLang = function(l){ const x = _sl.apply(this, arguments); headerUi(); const o = document.getElementById('onboardOverlay'); if(o && o.style.display!=='none' && o.innerHTML) renderForm(); return x; };

  function boot(){
    let want = ''; try{ want = sessionStorage.getItem('lb_sso_lang')||''; sessionStorage.removeItem('lb_sso_lang'); }catch(e){}
    if((want==='es'||want==='en') && want!==lang) setLang(want);
    headerUi(); showFormIfNeeded(); applyRep();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
