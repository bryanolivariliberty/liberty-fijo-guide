// ═══════════════════════════════════════════════════════════════════════════
// LIBERTY BUSINESS — DATA
// Last updated: 2026-08-28 — sub-500 Mbps tiers retired (business decision).
// Previous: LTO 3P prices +$2.00 (Lead & FMC) · 500/30 & 500/500 added
// ═══════════════════════════════════════════════════════════════════════════
const COAX = [
  /* ── REMOVED 2026-08-28 — Business decision (Astrid M. Fuentes):
     only 500 Mbps and above are offered going forward.
     Rows kept commented for reference / revert. ──────────────────
  { tier:'Retention', speed:'50/5',   fmc:null,    tech:'COAX', voip:1,
    list:{p1:61.99,  p2:66.99,  p3b:85.49, p3e:null,   p3u:null  },
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  { tier:'Retention', speed:'150/30', fmc:'300/30',tech:'COAX', voip:3,
    list:{p1:91.99,  p2:96.99,  p3b:null,  p3e:123.49, p3u:171.49},
    promo:{p1:71.99, p2:76.99,  p3b:null,  p3e:101.49, p3u:149.49}},
  ─────────────────────────────────────────────────────────────── */
  // 350/30 — NOT offered standalone (below 500). Kept only as the base row
  // that feeds the 700/30 FMC offer, which sells at 700 Mbps. fmcOnly hides it.
  { tier:'Retention', speed:'350/30', fmc:'700/30',tech:'COAX', voip:4, fmcOnly:true,
    list:{p1:128.99, p2:136.99, p3b:null,  p3e:163.49, p3u:211.49},
    promo:{p1:108.99,p2:116.99, p3b:null,  p3e:141.49, p3u:189.49}},
  /* ── REMOVED 2026-08-28 — Business decision (Astrid M. Fuentes):
     only 500 Mbps and above are offered going forward.
     Rows kept commented for reference / revert. ──────────────────
  { tier:'Retention', speed:'400/30', fmc:null,    tech:'COAX', voip:4,
    list:{p1:178.99, p2:186.99, p3b:null,  p3e:213.49, p3u:261.49},
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  ─────────────────────────────────────────────────────────────── */
  // ── 500/30 — LTO tier (added) ──────────────────────────────────────────
  { tier:'Retention', speed:'500/30', fmc:null,    tech:'COAX', voip:4,
    list:{p1:null,   p2:296.99, p3b:null,  p3e:323.49, p3u:371.49},
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  // ───────────────────────────────────────────────────────────────────────
  { tier:'Retention', speed:'600/30', fmc:'1G/30', tech:'COAX', voip:4,
    list:{p1:276.99, p2:286.99, p3b:null,  p3e:313.49, p3u:361.49},
    promo:{p1:160.99,p2:170.99, p3b:null,  p3e:197.49, p3u:245.49}},
  { tier:'Docsis3.1', speed:'1G/30',  fmc:null,    tech:'D3.1', voip:4,
    list:{p1:356.99, p2:366.99, p3b:null,  p3e:393.49, p3u:441.49},
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }}
];

const FTTX = [
  /* ── REMOVED 2026-08-28 — Business decision (Astrid M. Fuentes):
     only 500 Mbps and above are offered going forward.
     Rows kept commented for reference / revert. ──────────────────
  { tier:'Retention', speed:'50/50',     fmc:null,      tech:'FTTx',   voip:1,
    list:{p1:61.99,  p2:66.99,  p3b:85.49, p3e:null,   p3u:null  },
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  { tier:'Retention', speed:'150/150',   fmc:'300/300', tech:'FTTx',   voip:2,
    list:{p1:91.99,  p2:96.99,  p3b:null,  p3e:123.49, p3u:171.49},
    promo:{p1:71.99, p2:76.99,  p3b:null,  p3e:101.49, p3u:149.49}},
  ─────────────────────────────────────────────────────────────── */
  // 350/350 — NOT offered standalone (below 500). Base row for the 700/700 FMC
  // offer only. fmcOnly hides it from the Plans, Specials and quote-builder lists.
  { tier:'Retention', speed:'350/350',   fmc:'700/700', tech:'FTTx',   voip:2, fmcOnly:true,
    list:{p1:128.99, p2:136.99, p3b:null,  p3e:163.49, p3u:211.49},
    promo:{p1:108.99,p2:116.99, p3b:null,  p3e:141.49, p3u:189.49}},
  /* ── REMOVED 2026-08-28 — Business decision (Astrid M. Fuentes):
     only 500 Mbps and above are offered going forward.
     Rows kept commented for reference / revert. ──────────────────
  { tier:'Retention', speed:'400/400',   fmc:null,      tech:'FTTx',   voip:2,
    list:{p1:178.99, p2:186.99, p3b:null,  p3e:213.49, p3u:261.49},
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  ─────────────────────────────────────────────────────────────── */
  // ── 500/500 — LTO tier (added) ─────────────────────────────────────────
  { tier:'Retention', speed:'500/500',   fmc:null,      tech:'FTTx',   voip:2,
    list:{p1:null,   p2:296.99, p3b:null,  p3e:323.49, p3u:371.49},
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  // ───────────────────────────────────────────────────────────────────────
  { tier:'Retention', speed:'600/600',   fmc:'1G/1G',   tech:'FTTx',   voip:2,
    list:{p1:276.99, p2:286.99, p3b:null,  p3e:313.49, p3u:361.49},
    promo:{p1:160.99,p2:170.99, p3b:null,  p3e:197.49, p3u:245.49}},
  { tier:'Retention', speed:'1G/1G',     fmc:null,      tech:'FTTx',   voip:2,
    list:{p1:356.99, p2:366.99, p3b:null,  p3e:393.49, p3u:441.49},
    promo:{p1:null,  p2:null,   p3b:null,  p3e:null,   p3u:null  }},
  { tier:'Retention', speed:'1.5G/1.5G', fmc:null,      tech:'FTTx15', voip:2,
    list:{p1:401.99, p2:431.99, p3b:null,  p3e:438.99, p3u:499.99},
    promo:null}
];

const FMC_PLANS = [
  ...COAX.filter(p=>p.fmc).map(p=>({...p,displaySpeed:p.fmc,baseSpeed:p.speed,tech:'FMC',sourceTech:p.tech==='D3.1'?'COAX D3.1':'COAX'})),
  ...FTTX.filter(p=>p.fmc).map(p=>({...p,displaySpeed:p.fmc,baseSpeed:p.speed,tech:'FMC',sourceTech:'FTTx'}))
];

// ── OFFERABLE PLANS ─────────────────────────────────────────────────────────
// Everything the rep can actually sell. Excludes rows flagged fmcOnly, which
// exist only to feed FMC_PLANS (2026-08-28: 350/30 and 350/350, whose FMC
// offers are 700/30 and 700/700 — above the 500 Mbps floor).
// Use these, not COAX / FTTX, anywhere a plan list is shown to a rep.
const COAX_OFFER = COAX.filter(p=>!p.fmcOnly);
const FTTX_OFFER = FTTX.filter(p=>!p.fmcOnly);

// ── LTO PRICING ─────────────────────────────────────────────────────────────
// Change log: ld3p and f3p (3P Lead Offer & FMC) +$2.00 on 500/30 and 1G tiers
// ─────────────────────────────────────────────────────────────────────────────
const COAX_LTO = [
  /* ── REMOVED 2026-08-28 — Business decision (Astrid M. Fuentes):
     only 500 Mbps and above are offered going forward.
     Rows kept commented for reference / revert. ──────────────────
  {speed:'100/10', tech:'',         voip:1, l2p:138.99,l3p:null,  ld2p:57.99,ld3p:null, f2p:52.99,f3p:null },
  {speed:'300/30', tech:'',         voip:4, l2p:183.99,l3p:null,  ld2p:82.99,ld3p:null, f2p:57.99,f3p:null },
  ─────────────────────────────────────────────────────────────── */
  // 3P: ld3p 74.49→76.49 · f3p 74.49→76.49 (+$2.00)
  {speed:'500/30', tech:'',         voip:4, l2p:296.99,l3p:151.49,ld2p:67.99,ld3p:76.49,f2p:60.99,f3p:76.49},
  // 3P: ld3p 79.49→81.49 · f3p 79.49→81.49 (+$2.00)
  {speed:'1G/30',  tech:'Docsis3.1',voip:4, l2p:366.99,l3p:391.49,ld2p:84.99,ld3p:81.49,f2p:62.99,f3p:81.49}
];

const FTTX_LTO = [
  /* ── REMOVED 2026-08-28 — Business decision (Astrid M. Fuentes):
     only 500 Mbps and above are offered going forward.
     Rows kept commented for reference / revert. ──────────────────
  {speed:'100/100',voip:1, l2p:138.99,l3p:null,  ld2p:57.99,ld3p:null, f2p:52.99,f3p:null },
  {speed:'300/300',voip:2, l2p:183.99,l3p:null,  ld2p:82.99,ld3p:null, f2p:57.99,f3p:null },
  ─────────────────────────────────────────────────────────────── */
  // 3P: ld3p 74.49→76.49 · f3p 74.49→76.49 (+$2.00)
  {speed:'500/500',voip:2, l2p:296.99,l3p:151.49,ld2p:67.99,ld3p:76.49,f2p:60.99,f3p:76.49},
  // 3P: ld3p 79.49→81.49 · f3p 79.49→81.49 (+$2.00)
  {speed:'1G/1G',  voip:2, l2p:366.99,l3p:391.49,ld2p:84.99,ld3p:81.49,f2p:62.99,f3p:81.49}
];

const ADDONS = [
  {id:'ao1',name:'Liberty Business Ongoing',sub:'Any HSD Plan',price:20.00,lto:9.99 },
  {id:'ao2',name:'Hunting',                 sub:'Any VoIP Plan',price:9.99, oneTime:25.00, lto:null},
  {id:'ao3',name:'IP Estático (Add-on)',      sub:'Any HSD Plan', price:40.00,lto:null},
  {id:'ao4',name:'Antivirus',               sub:'Any Bundle',   price:9.99, lto:null},
  {id:'ao5',name:'Nube (Storage)',          sub:'Any Bundle',   price:15.99,lto:null},
  {id:'ao6',name:'Tienda Online',           sub:'Any Bundle',   price:15.99,lto:null},
  {id:'ao7',name:'Voicemail',               sub:'Any VoIP Plan',price:4.99, lto:null}
];

// VIDEO_2P_PLANS — shown in Plans tab as bundles p2e / p2u
// Fixed speed: COAX 10/1 · FTTx 10/10 · Fixed price regardless of speed
const VIDEO_2P_PLANS = [
  {id:'v2pe', name:'Español De Primera', bundleId:'p2e', coaxSpeed:'10/1', fttxSpeed:'10/10', price:67.49},
  {id:'v2pu', name:'Ultimate',           bundleId:'p2u', coaxSpeed:'10/1', fttxSpeed:'10/10', price:111.49}
];

// Fox Deportes — conditional add-on for 2P-E, 2P-U, 3P-E, 3P-U
const FOX_DEPORTES = {id:'fox1', name:'Fox Deportes', price:25.00, compat:['p2e','p2u','p3e','p3u']};

const ULT_ADDONS = [
  {id:'u1',name:'Ultimate News & Education',price:3.99},
  {id:'u2',name:'Ultimate Spanish',         price:4.99},
  {id:'u3',name:'Ultimate Kids',            price:2.99},
  {id:'u4',name:'Ultimate Sports',          price:4.99},
  {id:'u5',name:'Ultimate Movies',          price:4.99},
  {id:'u6',name:'Ultimate Plus',            price:14.99}
];

const HARDWARE = [
  {id:'hw1',name:'Forti Wifi30G', sub:'Seguridad WiFi / WiFi Security', price:28.25},
  {id:'hw2',name:'FEX-101G',      sub:'Switch / Network Extension',     price:11.75},
  {id:'hw3',name:'Managed WAN',   sub:'Managed WAN Service',            price:45.00},
  {id:'hw4',name:'Managed MSS',   sub:'Managed Security Service',       price:22.00},
  {id:'hw5',name:'IP Estático (HW)',sub:'Any HSD Plan',                  price:20.00}
];

// ═══════════════════════════════════════════════════════════════════════════
// SOHO OFFERS — source: "SOHO Plan Configuration" workbook (Reference Data),
// Oct 2026. Same MRR on 24- and 36-month terms; the discount code changes by term,
// the billing code changes by technology (HFC = COAX · FTTx = fiber).
// `quote` says how "Quote this plan" fills the Cart (speed row + price type), so
// the Cart total always equals `mrr` — verified for every offer and technology.
// ═══════════════════════════════════════════════════════════════════════════
const SOHO_OFFERS = [
  {id:'1p-600',      svc:'1P', bw:'600MB', fmc:'no',   video:null, mrr:276.99, bill:{HFC:'T26DX', FTTx:'K26DX'}, discAmt:null, disc:null,
   quote:{speed:'600', bundle:'p1', price:'list'}},
  {id:'1p-1g-fmc',   svc:'1P', bw:'1GB',   fmc:'yes',  video:null, mrr:160.99, bill:{HFC:'T21GF', FTTx:'K261F'}, discAmt:116,  disc:{24:'81162',36:'81163'},
   quote:{speed:'600', bundle:'p1', price:'promo', tech:'FMC'}},
  {id:'2p-500',      svc:'2P', bw:'500MB', fmc:'no',   video:null, mrr:67.99,  bill:{HFC:'T6U5C', FTTx:'K6U5C'}, discAmt:229,  disc:{24:'82292',36:'82293'},
   quote:{speed:'500', bundle:'p2', price:'lto-lead'}},
  {id:'2p-500-fmc',  svc:'2P', bw:'500MB', fmc:'yes',  video:null, mrr:60.99,  bill:{HFC:'T6U5C', FTTx:'K6U5C'}, discAmt:236,  disc:{24:'82362',36:'82363'},
   quote:{speed:'500', bundle:'p2', price:'lto-fmc'}},
  {id:'2p-600',      svc:'2P', bw:'600MB', fmc:'no',   video:null, mrr:286.99, bill:{HFC:'T6UDX', FTTx:'K6UDX'}, discAmt:null, disc:null,
   quote:{speed:'600', bundle:'p2', price:'list'}},
  {id:'2p-1g',       svc:'2P', bw:'1GB',   fmc:'no',   video:null, mrr:84.99,  bill:{HFC:'T61GB', FTTx:'K6UDC'}, discAmt:282,  disc:{24:'82822',36:'82823'},
   quote:{speed:'1G', bundle:'p2', price:'lto-lead'}},
  {id:'2p-1g-fmc',   svc:'2P', bw:'1GB',   fmc:'yes',  video:null, mrr:62.99,  bill:{HFC:'T61GB', FTTx:'K6UDC'}, discAmt:304,  disc:{24:'83042',36:'83043'},
   quote:{speed:'1G', bundle:'p2', price:'lto-fmc'}},
  {id:'3p-edp-500',  svc:'3P', bw:'500MB', fmc:'both', video:'Español De Primera', mrr:76.49, bill:{HFC:'T7EDH', FTTx:'K7EDI'}, discAmt:77, disc:{24:'80772',36:'80773'},
   quote:{speed:'500', bundle:'p3e', price:'lto-lead'}},
  {id:'3p-edp-1g',   svc:'3P', bw:'1GB',   fmc:'both', video:'Español De Primera', mrr:81.49, bill:{HFC:'T7E1G', FTTx:'K7E6I'}, discAmt:312, disc:{24:'83122',36:'83123'},
   quote:{speed:'1G', bundle:'p3e', price:'lto-lead'}},
  {id:'3p-edp-600',  svc:'3P', bw:'600MB', fmc:'no',   video:'Español De Primera', mrr:313.49, bill:{HFC:'T7EDI, T7EDX', FTTx:'K7EI5'}, discAmt:null, disc:null,
   quote:{speed:'600', bundle:'p3e', price:'list'}},
  {id:'3p-ult-600',  svc:'3P', bw:'600MB', fmc:'no',   video:'Ultimate', mrr:361.49, bill:{HFC:'T7UDX, T7UDI', FTTx:'K7UI5'}, discAmt:null, disc:null,
   quote:{speed:'600', bundle:'p3u', price:'list'}}
];

// ═══════════════════════════════════════════════════════════════════════════
// LIBERTY BUSINESS IN A BOX — SAFETY CONNECTION (Oct 2026)
// Bundle = Primary WAN (2P) + FortiWiFi/FortiGate + FortiExtender 101G (LTE
// backup, supports up to 300 Mbps) + WAN & MSS + SIM Card + Static IP. What changes per plan is the speed.
// ═══════════════════════════════════════════════════════════════════════════
const BIAB_SAFETY = [
  {speed:'300M',  wan:57.99, hw:'Forti WiFi 30G + FEX-101G', hwPrice:40.00, wanMss:70.00, sim:20.00, ip:20.00, total:207.99},
  {speed:'500M',  wan:60.99, hw:'Forti WiFi 30G + FEX-101G', hwPrice:40.00, wanMss:70.00, sim:20.00, ip:20.00, total:210.99},
  {speed:'1000M', wan:62.99, hw:'Forti WiFi 50G + FEX-101G', hwPrice:50.00, wanMss:70.00, sim:20.00, ip:20.00, total:222.99}
];

// ═══════════════════════════════════════════════════════════════════════════
// VS CLARO — SOHO fixed packages by speed tier (Competitive Landscape, Oct 2026).
// null = not offered at that tier. Liberty prices come from SOHO_OFFERS.
// ═══════════════════════════════════════════════════════════════════════════
const VS_CLARO = [
  {svc:'2P', en:'2P Internet + Phone · 500–600 MB',            es:'2P Internet + Telefonía · 500–600 MB',            lib:67.99, libNote:'500 MB', claro:50.00, claroNote:'600 MB'},
  {svc:'2P', en:'2P Internet + Phone · 1000 MB',               es:'2P Internet + Telefonía · 1000 MB',               lib:84.99, libNote:'',       claro:55.00, claroNote:''},
  {svc:'3P', en:'3P Internet + Video (EDP) + Phone · 300 MB',   es:'3P Internet + Video (EDP) + Telefonía · 300 MB',   lib:null,  libNote:'',       claro:67.99, claroNote:''},
  {svc:'3P', en:'3P Internet + Video (EDP) + Phone · 500–600 MB',es:'3P Internet + Video (EDP) + Telefonía · 500–600 MB',lib:76.49, libNote:'500 MB', claro:77.99, claroNote:'600 MB'},
  {svc:'3P', en:'3P Internet + Video (EDP) + Phone · 1000 MB',  es:'3P Internet + Video (EDP) + Telefonía · 1000 MB',  lib:81.49, libNote:'',       claro:82.99, claroNote:''},
  {svc:'1P', en:'1P Internet · 100 MB',                         es:'1P Internet · 100 MB',                             lib:null,  libNote:'',       claro:null,  claroNote:''},
  {svc:'1P', en:'1P Internet · 1000 MB',                        es:'1P Internet · 1000 MB',                            lib:null,  libNote:'',       claro:null,  claroNote:''}
];

// Safety Connection components as Cart lines. They live in HARDWARE so the Cart,
// proposal PDF and SOHO contract list them like any other line; `biab:true` keeps
// them out of the Extras / Add-ons pickers (they only come in with the bundle).
HARDWARE.push(
  {id:'bx-f30', name:'Forti WiFi 30G + FEX-101G', sub:'Liberty Business in a Box · Safety Connection', price:40.00, biab:true},
  {id:'bx-f50', name:'Forti WiFi 50G + FEX-101G', sub:'Liberty Business in a Box · Safety Connection', price:50.00, biab:true},
  {id:'bx-wan', name:'WAN & MSS',                 sub:'Liberty Business in a Box · Safety Connection', price:70.00, biab:true},
  {id:'bx-sim', name:'SIM Card (LTE backup)',      sub:'Liberty Business in a Box · Safety Connection', price:20.00, biab:true},
  {id:'bx-ip',  name:'Static IP',                 sub:'Liberty Business in a Box · Safety Connection', price:20.00, biab:true}
);

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ON / HARDWARE NAMES IN BOTH LANGUAGES (UAT)
// `name` and `sub` now follow the ES/EN toggle everywhere they're shown (Extras,
// Add-ons tab, Cart summary, proposal PDF). The SOHO contract is a Spanish form,
// so it reads the Spanish name through lbEs().  [en, es]
// ═══════════════════════════════════════════════════════════════════════════
const LB_I18N = {
  ao1:{sub:['Any HSD Plan','Cualquier plan HSD']},
  ao2:{sub:['Any VoIP Plan','Cualquier plan VoIP']},
  ao3:{name:['Static IP (Add-on)','IP Estático (Add-on)'], sub:['Any HSD Plan','Cualquier plan HSD']},
  ao4:{sub:['Any Bundle','Cualquier bundle']},
  ao5:{name:['Cloud Storage','Nube (Almacenamiento)'], sub:['Any Bundle','Cualquier bundle']},
  ao6:{name:['Online Store','Tienda Online'], sub:['Any Bundle','Cualquier bundle']},
  ao7:{name:['Voicemail','Buzón de voz'], sub:['Any VoIP Plan','Cualquier plan VoIP']},
  hw1:{name:['FortiWiFi 30G','Forti Wifi30G'], sub:['WiFi Security','Seguridad WiFi']},
  hw2:{sub:['Network Extension','Extensión de red']},
  hw3:{sub:['Managed WAN Service','Servicio WAN administrado']},
  hw4:{sub:['Managed Security Service','Servicio de seguridad administrada']},
  hw5:{name:['Static IP (HW)','IP Estático (HW)'], sub:['Any HSD Plan','Cualquier plan HSD']},
  'bx-sim':{name:['SIM Card (LTE backup)','SIM Card (respaldo LTE)']},
  'bx-ip': {name:['Static IP','IP Estático']}
};
function lbLocalize(list){
  list.forEach(x=>{
    const m = LB_I18N[x.id]; if(!m) return;
    x._i18n = m;
    Object.keys(m).forEach(k=>{
      const pair = m[k];
      Object.defineProperty(x, k, {enumerable:true, configurable:true,
        get(){ return (typeof lang!=='undefined' && lang==='es') ? pair[1] : pair[0]; }});
    });
  });
}
// Spanish name regardless of the toggle (SOHO contract)
function lbEs(x, k){ return (x && x._i18n && x._i18n[k]) ? x._i18n[k][1] : (x ? x[k] : ''); }
lbLocalize(ADDONS); lbLocalize(HARDWARE);
