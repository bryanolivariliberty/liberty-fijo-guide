// ═══════════════════════════════════════════════════════════════════════════
// SOLICITUD DE SERVICIO SOHO — auto-fill of the approved format
//
// Fills the Legal-approved "Solicitud de Servicio" (assets/solicitud-template.html)
// from the quote the rep already built, and prints it from an isolated iframe so
// the output is exactly the layout that was reviewed and approved.
//
// Replaced (2026-08-07) the previous approach, which overlaid text onto the old
// scanned form at measured PDF coordinates. That template and its coordinate map
// are gone; the format of record is now the HTML template.
//
// Requires (globals):
//   state · lang · t() · fmt · icon() · $ · $$ · ADDONS · HARDWARE · ULT_ADDONS
//   FOX_DEPORTES · CONTRACT_TERMS · propBundlePrice · propGetTotal
//   calcVoiceAdditionalCost · calcStbCost · propGetOneTimeFees · propInit · propRender
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SPEED PARSING — "350/30" → "350 Mbps" / "30 Mbps" · "1.5G/1.5G" → "1.5 Gbps"
// Plans with no internet component (Voz 1P) return blanks.
// ═══════════════════════════════════════════════════════════════════════════
function contractSpeedLabel(part){
  const v = String(part || '').trim();
  if (!v) return '';
  const g = /^([\d.]+)\s*G$/i.exec(v);
  if (g) return g[1] + ' Gbps';
  return /^[\d.]+$/.test(v) ? v + ' Mbps' : '';
}

function contractSplitSpeed(plan){
  const blank = { down: '', up: '' };
  if (!plan || plan._voz1p) return blank;
  const s = String(plan.displaySpeed || plan.speed || '');
  if (!/\d/.test(s)) return blank;                 // e.g. "Voz Standalone"
  const parts = s.split('/');
  return {
    down: contractSpeedLabel(parts[0]),
    up:   contractSpeedLabel(parts[1] != null ? parts[1] : parts[0])
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD — translate state.prop into everything the form needs
// ═══════════════════════════════════════════════════════════════════════════
function contractBuildData(){
  const p  = state.prop;
  const c  = p.customer || {};
  const x  = p.contractExtra || {};
  const b  = p.bundle || '';
  const isVoz1P = b === 'p1v';

  const planPrice = (p.speed && b && p.priceType)
    ? (propBundlePrice(p.speed, p.priceType, b) || 0) : 0;

  // ── Precio de lista vs. precio cotizado ──
  // "Precio regular" en el formulario significa lista, no lo cotizado. Cuando el
  // rep vende Promo/LTO las dos cifras difieren y esa diferencia es el ahorro que
  // el cliente debe ver en el documento que firma.
  const listPrice = (p.speed && b)
    ? (propBundlePrice(p.speed, 'list', b) || 0) : 0;
  // Sólo cuenta como ahorro si lista es mayor; si la tabla de lista no tiene esa
  // combinación, propBundlePrice devuelve 0 y no inventamos un descuento.
  const planSaving = (listPrice && planPrice && listPrice > planPrice)
    ? +(listPrice - planPrice).toFixed(2) : 0;
  const regularPrice = planSaving ? listPrice : (planPrice || null);

  const bundleNames = {
    p1:'1P Data (HSD)', p2:'2P HSD + VoIP', p3b:'3P Broadcast',
    p3e:'3P Español De Primera', p3u:'3P Ultimate',
    p2e:'2P Español De Primera', p2u:'2P Ultimate', p1v:'Voz 1P Standalone'
  };
  // El contrato lo lee el cliente, así que el tipo va con la palabra "Precio" y con
  // la variante de LTO explícita — "LTO" solo no le dice nada a quien firma.
  const ptNames = {
    list:       'Precio de Lista',
    promo:      'Precio Promo',
    // Paréntesis y no "·": la nota ya usa "·" como separador entre plan, velocidad y
    // tecnología, y "FTTx · Precio LTO · Lead Offer" se leía como tres cosas sueltas.
    'lto-list': 'Precio LTO (Lista)',
    'lto-lead': 'Precio LTO (Lead Offer)',
    'lto-fmc':  'Precio LTO (FMC)',
    lto:        'Precio LTO (FMC)'          // valor legacy de antes de poder escoger
  };

  // ── Paquete: Sencillo (1P) / Doble (2P) / Triple (3P) ──
  let pkg = null;
  if (b === 'p1' || isVoz1P)      pkg = 1;
  else if (b.indexOf('p2') === 0) pkg = 2;
  else if (b.indexOf('p3') === 0) pkg = 3;

  // ── Video tier carried by the bundle ──
  let videoRow = null;                                  // broadcast | espPrim | ultimate
  if (b === 'p3b')                    videoRow = 'broadcast';
  else if (b === 'p3e' || b === 'p2e') videoRow = 'espPrim';
  else if (b === 'p3u' || b === 'p2u') videoRow = 'ultimate';

  // ── Voz ──
  const voiceIncluded = (b === 'p2' || b.indexOf('p3') === 0);
  const inclLines = voiceIncluded ? (p.voice.included || 0) : 0;
  const addLines  = p.voice.additional || 0;
  const addLinesCost = addLines ? calcVoiceAdditionalCost(addLines) : 0;

  // Telefonía PR/USA row: ✓ when the bundle carries voice, when the rep added
  // a standalone first line, or on the Voz-1P plan.
  const telChecked = voiceIncluded || isVoz1P || !!p.voice.first;
  let telQty   = inclLines || ((isVoz1P || p.voice.first) ? 1 : 0);
  let telPrice = null;
  if (isVoz1P)            telPrice = planPrice;   // no internet line on this plan
  else if (p.voice.first) telPrice = 34.99;

  // ── Convertidores (STB) ──
  const bundleStb = (b.indexOf('p3') === 0) ? 1 : 0;      // 3P includes 1 STB
  const addStb    = p.video.stb2qty || 0;
  const totalStb  = bundleStb + addStb;
  const addStbCost = addStb ? calcStbCost(addStb) : 0;
  // Split by type — prefilled to HD, adjustable in step 8
  let stb = {
    hd:    x.stbHD    != null ? +x.stbHD    : totalStb,
    hubtv: x.stbHubTV != null ? +x.stbHubTV : 0,
    dvr:   x.stbDVR   != null ? +x.stbDVR   : 0
  };
  const stbFirstType = stb.hd ? 'hd' : stb.hubtv ? 'hubtv' : stb.dvr ? 'dvr' : null;

  // ── Ultimate packs ──
  const ua = p.video.ultAddons || {};
  const ultSel = {
    kids:    ua['u3'] != null,
    sports:  ua['u4'] != null,
    news:    ua['u1'] != null,
    spanish: ua['u2'] != null,
    movies:  ua['u5'] != null,
    plus:    ua['u6'] != null
  };
  const ultTotal = Object.values(ua).reduce((s, v) => s + v, 0);
  const ultOtro  = [ultSel.movies ? 'Movies' : null, ultSel.plus ? 'Plus' : null]
                     .filter(Boolean).join(' + ');
  const anyUlt = Object.keys(ua).length > 0;

  // ── Outlets ──
  const outlets = p.video.outlets || 0;

  // ── Servicios adicionales: add-ons + hardware (4 usable rows) ──
  const svcAll = [];
  Object.entries(p.addons || {}).forEach(([id, price]) => {
    const a = ADDONS.find(v => v.id === id);
    if (a) svcAll.push({ name: a.name, price });
  });
  Object.entries(p.hw || {}).forEach(([id, price]) => {
    const h = HARDWARE.find(v => v.id === id);
    if (h) svcAll.push({ name: h.name, price });
  });
  const svcRows = svcAll.slice(0, 4);
  const svcOver = svcAll.slice(4);

  // ── Cargos no recurrentes ──
  const term = CONTRACT_TERMS.find(v => v.id === p.contract) || null;
  // El costo de instalación es el que el rep escogió en el Paso 6, no un precio fijo
  // del término: el mismo término se vende a dos costos distintos.
  const termFee = (typeof propContractFee === 'function') ? propContractFee(p) : null;
  const cnr = [];
  if (term && termFee !== null) cnr.push({ row: 0, label: null, price: termFee });  // Costo Instalación
  const oneTime = (typeof propGetOneTimeFees === 'function') ? propGetOneTimeFees() : [];
  oneTime.forEach(f => cnr.push({ row: 2, label: f.name, price: f.price }));
  const cnrTotal = cnr.reduce((s, v) => s + (v.price || 0), 0);

  // ── Término del contrato ──
  let termKey = null, termOtro = null;
  if (term){
    if (term.months === 12)      termKey = 'anual';
    else if (term.months === 24) termKey = 'y2';
    else if (term.months === 36) termKey = 'y3';
    else { termKey = 'otro'; termOtro = 'Mes a mes'; }
  }

  // ── Nota de instrucciones especiales ──
  // El cuadro sólo aguanta ~5 renglones, así que el orden importa: primero lo
  // que NO cupo en ninguna fila del formulario, luego el contexto del plan.
  const noteBits = [];
  if (p.speed && b){
    const sp = p.speed.displaySpeed || p.speed.speed;
    noteBits.push(`Plan: ${bundleNames[b] || b} · ${sp} · ${p.speed.tech}` +
                  (p.priceType ? ` · ${ptNames[p.priceType] || p.priceType}` : '') + '.');
  }
  if (svcOver.length){
    noteBits.push('Servicios adicionales (sin fila): ' +
      svcOver.map(s => `${s.name} $${s.price.toFixed(2)}`).join(', ') + '.');
  }
  if (addStb) noteBits.push(`STB adic. ×${addStb} = $${addStbCost.toFixed(2)}/mes (tarifa escalonada).`);
  if (!isVoz1P && planPrice){
    noteBits.push('Bundle consolidado en la línea de Internet; video y telefonía incluidos.');
  }
  // El ahorro NO se repite aquí: ya tiene su propia fila ("Ahorro mensual") y el
  // precio de lista aparece en "Precio reg." — el cuadro sólo aguanta ~5 renglones.
  if (String(p.priceType).indexOf('lto') === 0){
    noteBits.push('LTO requiere contrato; de no renovar pasa a Precio de Lista.');
  }
  if (c.notes) noteBits.push(String(c.notes));

  return {
    clientType: x.clientType || (c.account ? 'existing' : 'new'),
    account: c.account, company: c.company, contact: c.name,
    contactTitle: x.contactTitle,
    phoneOffice: x.phoneOffice, phoneCell: x.phoneCell, email: x.email,
    reqDate: contractFmtDate(c.date),
    installBlock: x.installBlock, authPerson: x.authPerson,
    postal: contractSplitLines(x.postal), fisica: contractSplitLines(x.fisica),
    pkg, videoRow,
    stb, stbFirstType, addStbCost, totalStb,
    telChecked, telQty, telPrice, addLines, addLinesCost,
    net: contractSplitSpeed(p.speed), netPrice: isVoz1P ? null : (planPrice || null),
    planRegular: regularPrice, planSaving,
    priceTypeName: p.priceType ? (ptNames[p.priceType] || p.priceType) : '',
    fox: !!p.video.foxDeportes, foxPrice: p.video.foxDeportes ? FOX_DEPORTES.price : null,
    ultSel, ultTotal, ultOtro, anyUlt,
    outlets, outletsPrice: outlets ? 7.5 : null, outletsTotal: outlets ? outlets * 7.5 : null,
    svcRows,
    monthlyTotal: propGetTotal(),
    // El ahorro del bundle es el único descuento que la cotización modela hoy, así
    // que el total regular es el cotizado más ese delta.
    monthlyRegular: planSaving ? +(propGetTotal() + planSaving).toFixed(2) : propGetTotal(),
    monthlySaving: planSaving,
    cnr, cnrTotal,
    termKey, termOtro,
    billing: x.billing || 'ebill',
    authSms: x.authSms || null,
    contador: x.contadorAEE, installDate: contractFmtDate(x.installDate),
    signCompany: c.company, signNombre: c.name, signPosicion: x.contactTitle,
    signFecha: contractFmtDate(c.date),
    repName: c.rep, vendorNo: x.vendorNo, vendorPhone: x.vendorPhone,
    territory: x.territory,
    note: noteBits.join(' ')
  };
}

function contractSplitLines(v){
  if (!v) return ['', '', ''];
  const ls = String(v).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  return [ls[0] || '', ls[1] || '', ls[2] || ''];
}

// Une las líneas de una dirección en un solo renglón. Quita comas colgando al
// final de cada línea para no producir "calle,, pueblo".
function contractJoinAddress(lines){
  return (lines || [])
    .map(s => String(s || '').trim().replace(/[,;]+$/, ''))
    .filter(Boolean)
    .join(', ');
}

function contractFmtDate(iso){
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso);
}

// ═══════════════════════════════════════════════════════════════════════════
// FILL — map contractBuildData() onto the approved template's field names
// ═══════════════════════════════════════════════════════════════════════════
// The template's own field names are the contract of record here. They were
// generated from the approved HTML, so this map is what keeps the app and the
// approved artifact in sync. If a name changes in the template, change it here.
const SOL_ROW = {
  broadcast:  'broadcast',
  espPrim:    'espanol_de_primera',
  ultimate:   'ultimate',
  hd:         'hd',
  hubtv:      'hubtv',
  dvr:        'dvr',
  fox:        'fox_deportes',
  telUnl:     'telefonia_pr_usa_ilimitado',
  telAdd:     'linea_telefonica_adicional',
  outNet:     'internet_de_alta_velocidad',
  outVideo:   'video'
};

const _money = v => (v == null ? '' : Number(v).toFixed(2));

// Raw ISO dates — the template uses <input type="date">, which only accepts
// yyyy-mm-dd. contractBuildData() hands back dd/mm/yyyy for the PDF path, so we
// read the originals straight off the state instead of re-parsing.
function solicitudISODates(){
  const p = state.prop || {};
  return {
    solicitud: (p.customer && p.customer.date) || '',
    instalacion: (p.contractExtra && p.contractExtra.installDate) || ''
  };
}

// Returns { text:{name:value}, check:[name], radio:{name:value}, mark:[name] }
// `mark` = inputs to highlight because the customer must sign/initial them.
function solicitudFieldValues(d){
  const iso  = solicitudISODates();
  const text = {}, check = [], radio = {}, mark = [];
  const T = (n, v) => { if (v != null && v !== '') text[n] = String(v); };

  // ── Cliente ──
  radio.tipo_cliente = d.clientType === 'new' ? 'nuevo' : 'existente';
  T('num_cuenta', d.account);
  T('fecha_solicitud', iso.solicitud);
  T('compania', d.company);
  // Seguro Social Patronal: NUNCA se pobla. Es un dato patronal sensible que la
  // cotización no debe cargar ni el documento debe traer pre-escrito — el espacio
  // sale en blanco y resaltado para que el cliente lo escriba de su puño.
  mark.push('seguro_social');
  T('contacto', d.contact);
  T('titulo', d.contactTitle);
  T('tel_oficina', d.phoneOffice);
  T('celular', d.phoneCell);
  T('email', d.email);
  if (d.installBlock) radio.bloque = d.installBlock;
  T('autorizada', d.authPerson);

  // ── Direcciones ── un solo campo por bloque: la intake es texto libre de varias
  // líneas, así que se une en una sola línea sin perder nada.
  T('postal_1', contractJoinAddress(d.postal));
  T('fisica_1', contractJoinAddress(d.fisica));
  T('num_contador', d.contador);
  T('fecha_instalacion', iso.instalacion);

  // ── Paquete ──
  if (d.pkg === 1) radio.paquete = 'sencillo';
  if (d.pkg === 2) radio.paquete = 'doble';
  if (d.pkg === 3) radio.paquete = 'triple';

  // ── Nivel de video incluido en el bundle ──
  if (d.videoRow){
    const r = SOL_ROW[d.videoRow];
    check.push('sv_' + r); T(r + '_cant', '1'); T(r + '_tot', 'Incl.');
  }

  // ── Convertidores ──
  ['hd', 'hubtv', 'dvr'].forEach(k => {
    if (!d.stb[k]) return;
    const r = SOL_ROW[k];
    check.push('sv_' + r); T(r + '_cant', d.stb[k]);
    if (k === d.stbFirstType && d.addStbCost) T(r + '_tot', _money(d.addStbCost));
  });

  // ── Paquetes de TV ──
  if (d.fox){
    const r = SOL_ROW.fox;
    check.push('sv_' + r); T(r + '_cant', '1');
    T(r + '_prec', _money(d.foxPrice)); T(r + '_tot', _money(d.foxPrice));
  }
  if (d.anyUlt){
    check.push('pk_ultimate');
    if (d.ultSel.kids)    check.push('pk_kids');
    if (d.ultSel.sports)  check.push('pk_sports');
    if (d.ultSel.news)    check.push('pk_news');
    if (d.ultSel.spanish) check.push('pk_spanish');
    if (d.ultOtro){ check.push('pk_otro'); T('pk_otro_desc', d.ultOtro); }
    if (d.ultTotal){ T('pk_prec', _money(d.ultTotal)); T('pk_tot', _money(d.ultTotal)); }
  }

  // ── Internet — now has Cant. / Precio reg. / Total ──
  if (d.net.down){
    // Short notation ("150/30") — the labelled form duplicates down/up and gets
    // clipped in the narrow print cell.
    const sp = (state.prop.speed && (state.prop.speed.displaySpeed || state.prop.speed.speed)) || '';
    T('int_velocidad', sp);
    T('int_down', d.net.down);
    T('int_up',   d.net.up);
  }
  if (d.netPrice != null){
    T('int_cant', '1');
    // "Precio reg." = lista. Si hay Promo/LTO, Total muestra lo cotizado y las dos
    // cifras dejan ver el descuento en la misma fila.
    T('int_prec', _money(d.planRegular != null ? d.planRegular : d.netPrice));
    T('int_tot',  _money(d.netPrice));
  }

  // ── Telefonía ──
  if (d.telChecked){
    const r = SOL_ROW.telUnl;
    check.push('sv_' + r);
    T(r + '_cant', d.telQty || '');
    if (d.telPrice != null){
      // En Voz 1P el precio del plan vive en esta fila, así que el descuento
      // (si lo hay) se muestra aquí y no en la línea de Internet.
      const telReg = (d.netPrice == null && d.planRegular != null) ? d.planRegular : d.telPrice;
      T(r + '_prec', _money(telReg)); T(r + '_tot', _money(d.telPrice));
    }
    else T(r + '_tot', 'Incl.');
  }
  if (d.addLines){
    const r = SOL_ROW.telAdd;
    check.push('sv_' + r); T(r + '_cant', d.addLines); T(r + '_tot', _money(d.addLinesCost));
  }

  // ── Additional outlet (Video) ──
  if (d.outlets){
    const r = SOL_ROW.outVideo;
    check.push('sv_' + r); T(r + '_cant', d.outlets);
    T(r + '_prec', _money(d.outletsPrice)); T(r + '_tot', _money(d.outletsTotal));
  }

  // ── Servicios adicionales — the template offers Wi-Fi + Otros only ──
  const extra = [];
  if (d.svcRows.length === 1){
    check.push('sv_otros');
    T('otros_desc', d.svcRows[0].name);
    T('otros_cant', '1');
    T('otros_prec', _money(d.svcRows[0].price));
    T('otros_tot',  _money(d.svcRows[0].price));
  } else if (d.svcRows.length > 1){
    const sum   = d.svcRows.reduce((a, s) => a + s.price, 0);
    const names = d.svcRows.map(s => s.name);
    check.push('sv_otros');
    // Inputs clip instead of wrapping, so summarise here and itemise with prices
    // in Instrucciones especiales below — the document still shows everything.
    T('otros_desc', names.length <= 2
        ? names.join(' · ')
        : names.slice(0, 2).join(' · ') + ` + ${names.length - 2} más`);
    T('otros_cant', d.svcRows.length);
    T('otros_tot',  _money(sum));
    extra.push('Desglose adicionales: ' +
      d.svcRows.map(s => `${s.name} $${s.price.toFixed(2)}`).join(', ') + '.');
  }

  // ── Totales ── sin descuento sólo se llena "Total de mensualidad regular", igual
  // que antes; con descuento se añaden el ahorro y el total a pagar para que el
  // cliente vea qué está ganando.
  if (d.monthlySaving){
    T('total_mensual',   _money(d.monthlyRegular));
    // Sin signo: la fila ya rotula el menos ("– $") en la plantilla y en el PDF.
    T('ahorro_mensual',  _money(d.monthlySaving));
    T('total_pagar',     _money(d.monthlyTotal));
  } else {
    T('total_mensual',   _money(d.monthlyTotal));
  }

  // ── Cargos no recurrentes ──
  d.cnr.forEach(item => {
    if (item.row === 0){ check.push('cnr_inst'); T('cnr_inst_v', _money(item.price)); }
    if (item.row === 2){
      check.push('cnr_otro');
      T('cnr_otro_desc', item.label || '');
      T('cnr_otro_v', _money(item.price));
    }
  });
  T('total_cnr', _money(d.cnrTotal));

  T('instrucciones', [d.note, extra.join(' ')].filter(Boolean).join(' '));

  // ── Término y facturación ──
  if (d.termKey === 'anual') radio.termino = 'anual';
  if (d.termKey === 'y2')    radio.termino = '2';
  if (d.termKey === 'y3')    radio.termino = '3';
  if (d.termKey === 'otro'){ radio.termino = 'otro'; T('termino_otro', d.termOtro); }
  mark.push('termino_ini');

  radio.facturacion = d.billing === 'paper' ? 'papel' : 'electronica';
  mark.push(d.billing === 'paper' ? 'papel_ini' : 'elec_ini');

  if (d.authSms) radio.autoriza_msg = d.authSms;

  // ── Firmas del cliente ──
  T('firma_compania', d.signCompany);
  T('firma_nombre',   d.signNombre);
  T('firma_posicion', d.signPosicion);
  T('firma_fecha',    iso.solicitud);
  mark.push('firma_firma');

  // ── Representante ──
  T('rep_nombre',     d.repName);
  T('rep_num',        d.vendorNo);
  T('rep_tel',        d.vendorPhone);
  T('rep_territorio', d.territory);
  T('rep_fecha',      iso.solicitud);

  return { text, check, radio, mark };
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER — the approved template, filled, printed from an isolated iframe
// ═══════════════════════════════════════════════════════════════════════════
// An iframe is used on purpose: it keeps the approved document's CSS completely
// isolated from the app's, so what prints is byte-for-byte the layout Legal
// reviewed. No selector scoping, no cascade collisions, no surprises.
const SOLICITUD_TEMPLATE_URL = 'assets/solicitud-template.html';
let _solTplCache = null;

async function solicitudLoadTemplate(){
  if (_solTplCache) return _solTplCache;
  const res = await fetch(SOLICITUD_TEMPLATE_URL);
  if (!res.ok) throw new Error('No se pudo cargar la plantilla (' + res.status + ')');
  _solTplCache = await res.text();
  return _solTplCache;
}

// Highlight band for the blanks the customer must sign or initial — same intent
// as the yellow bands on the PDF format, expressed in CSS here.
const SOL_MARK_CSS = `
  .sol-mark{background:#fff3a8 !important; box-shadow:0 0 0 2px #fff3a8}
  @media print{ .sol-mark{background:#fff3a8 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact} }
`;

// Locks the whole preview. It is a review surface, not an editor — if a price is
// wrong the rep fixes the quote, which is what keeps one source of truth.
function solicitudLockDocument(doc){
  doc.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio'){
      el.addEventListener('click', e => e.preventDefault());
      el.setAttribute('onclick', 'return false');
      el.style.pointerEvents = 'none';
    } else {
      el.readOnly = true;
    }
    el.setAttribute('tabindex', '-1');
  });
  const st = doc.createElement('style');
  st.textContent = `
    input,textarea,select{cursor:default !important; caret-color:transparent !important}
    input:focus,textarea:focus{outline:none !important; box-shadow:none !important}
    .sol-ro{position:fixed; left:0; right:0; top:0; z-index:9999;
      background:#0071CE; color:#fff; font:600 12px "Segoe UI",Arial,sans-serif;
      padding:7px 14px; text-align:center; letter-spacing:.2px}
    body{padding-top:32px}
    @media print{ .sol-ro{display:none !important} body{padding-top:0} }`;
  doc.head.appendChild(st);
  const banner = doc.createElement('div');
  banner.className = 'sol-ro';
  banner.textContent = (typeof lang !== 'undefined' && lang === 'en')
    ? 'Preview — read only. To change a price or a service, go back to the quote.'
    : 'Vista previa — solo lectura. Para cambiar un precio o un servicio, regresa a la cotización.';
  doc.body.insertBefore(banner, doc.body.firstChild);
}

function solicitudApplyData(doc, d){
  const v = solicitudFieldValues(d);
  const q = n => doc.querySelector(`[name="${n}"]`);

  Object.entries(v.text).forEach(([n, val]) => { const e = q(n); if (e) e.value = val; });
  v.check.forEach(n => { const e = q(n); if (e) e.checked = true; });
  Object.entries(v.radio).forEach(([n, val]) => {
    const e = doc.querySelector(`[name="${n}"][value="${val}"]`); if (e) e.checked = true;
  });
  v.mark.forEach(n => { const e = q(n); if (e) e.classList.add('sol-mark'); });

  const st = doc.createElement('style');
  st.textContent = SOL_MARK_CSS;
  doc.head.appendChild(st);
}

function solicitudFilename(){
  const c = (state.prop && state.prop.customer) || {};
  const safe = (c.company || 'Cliente').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  const ds   = (c.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return `Liberty_Solicitud_${safe}_${ds}`;
}

// Builds the filled document in a hidden iframe and opens the print dialog.
// The rep chooses "Guardar como PDF" to get a file.
async function solicitudPrint(){
  const tpl = await solicitudLoadTemplate();
  const d   = contractBuildData();

  const prev = document.getElementById('solicitud-frame');
  if (prev) prev.remove();

  const ifr = document.createElement('iframe');
  ifr.id = 'solicitud-frame';
  ifr.setAttribute('title', 'Solicitud de Servicio');
  ifr.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:1400px;border:0';
  document.body.appendChild(ifr);

  const doc = ifr.contentDocument || ifr.contentWindow.document;
  doc.open(); doc.write(tpl); doc.close();

  // Title drives the default filename Chrome suggests in "Save as PDF"
  doc.title = solicitudFilename();
  solicitudApplyData(doc, d);

  await new Promise(r => setTimeout(r, 350));   // let layout settle
  ifr.contentWindow.focus();
  ifr.contentWindow.print();
  setTimeout(() => { const f = document.getElementById('solicitud-frame'); if (f) f.remove(); }, 60000);
  return solicitudFilename();
}

// Opens the filled document in a new tab so the rep can review it before printing.
async function solicitudPreview(){
  const tpl = await solicitudLoadTemplate();
  const d   = contractBuildData();
  const w = window.open('', '_blank');
  if (!w) throw new Error('El navegador bloqueó la ventana. Permite ventanas emergentes e intenta de nuevo.');
  w.document.open(); w.document.write(tpl); w.document.close();
  w.document.title = solicitudFilename();
  solicitudApplyData(w.document, d);
  solicitudLockDocument(w.document);
  return solicitudFilename();
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8 UI — extra intake fields + download
// ═══════════════════════════════════════════════════════════════════════════
function contractExtraInit(){
  propInit();
  if (!state.prop.contractExtra){
    const b = state.prop.bundle || '';
    const bundleStb = (b.indexOf('p3') === 0) ? 1 : 0;
    state.prop.contractExtra = {
      clientType: state.prop.customer.account ? 'existing' : 'new',
      contactTitle:'', phoneOffice:'', phoneCell:'', email:'',
      postal:'', fisica:'', installDate:'', installBlock:'', authPerson:'',
      contadorAEE:'', billing:'ebill', authSms:'',
      stbHD: bundleStb + (state.prop.video.stb2qty || 0), stbHubTV:0, stbDVR:0,
      vendorNo:'', vendorPhone:'', territory:''
    };
  }
  return state.prop.contractExtra;
}

function propStepContractDoc(){
  const x = contractExtraInit();
  const isEs = lang === 'es';
  const b = state.prop.bundle || '';
  const bundleStb = (b.indexOf('p3') === 0) ? 1 : 0;
  const totalStb  = bundleStb + (state.prop.video.stb2qty || 0);
  const stbSum    = (+x.stbHD || 0) + (+x.stbHubTV || 0) + (+x.stbDVR || 0);
  const ready     = !!(state.prop.speed && state.prop.bundle && state.prop.priceType);

  const fld = (id, label, val, ph, type) => `
    <div class="jc-fg">
      <label class="jc-fl">${label}</label>
      <input class="jc-fi" type="${type || 'text'}" data-cx="${id}" value="${val || ''}" placeholder="${ph || ''}">
    </div>`;

  return `
    <div id="ctr-top"></div>
    <div class="ctr-intro">
      ${icon('doc')}
      <div>
        <strong>${isEs ? 'Solicitud de Servicio — llenado automático'
                       : 'Service Request — auto-fill'}</strong><br>
        ${isEs
          ? 'Se rellena la Solicitud de Servicio con todo lo que seleccionaste. Los campos de abajo son <strong>opcionales</strong>: complétalos para que el documento salga listo para firmar. Las firmas e iniciales quedan en blanco.'
          : 'The Service Request is filled with everything you selected. The fields below are <strong>optional</strong>: complete them so the document comes out ready to sign. Signatures and initials are left blank.'}
      </div>
    </div>

    ${!ready ? `<div class="jao-note" style="margin-bottom:14px">${icon('warn')} ${
      isEs ? 'Selecciona un plan y tipo de precio antes de generar el contrato.'
           : 'Select a plan and price type before generating the contract.'}</div>` : ''}

    <!-- Cliente -->
    <div class="ctr-grp">
      <div class="ctr-gtl">${icon('user')} ${isEs ? 'Datos del cliente' : 'Customer details'}</div>
      <div class="ctr-seg">
        <span class="ctr-seg-lbl">${isEs ? 'Tipo de cliente' : 'Customer type'}</span>
        <button class="ctr-chip ${x.clientType==='new'?'on':''}"      data-cxset="clientType" data-v="new">${isEs?'Cliente nuevo':'New customer'}</button>
        <button class="ctr-chip ${x.clientType==='existing'?'on':''}" data-cxset="clientType" data-v="existing">${isEs?'Cliente existente':'Existing customer'}</button>
      </div>
      <div class="jc-form">
        ${fld('contactTitle', isEs?'Título del contacto':'Contact title', x.contactTitle, isEs?'Ej. Gerente General':'e.g. General Manager')}
        <!-- Seguro Social Patronal: visible para que el rep sepa que el documento lo
             pide, pero bloqueado. No se captura aquí ni viaja al PDF; el cliente lo
             escribe a mano sobre el espacio resaltado. -->
        <div class="jc-fg">
          <label class="jc-fl">${isEs?'Seguro Social Patronal':'Employer SSN'}</label>
          <input class="jc-fi" type="text" value="" readonly disabled
                 placeholder="${isEs?'Lo llena el cliente a mano':'Customer fills this in by hand'}"
                 style="background:#f3f4f6; color:var(--muted-2); cursor:not-allowed">
          <span style="display:block; margin-top:4px; font-size:11px; color:var(--muted-2)">${isEs
            ? 'Resaltado en el documento para que el cliente lo complete.'
            : 'Highlighted on the document for the customer to complete.'}</span>
        </div>
        ${fld('phoneOffice', isEs?'Teléfono de oficina':'Office phone', x.phoneOffice, '787-000-0000', 'tel')}
        ${fld('phoneCell',   isEs?'Celular / personal':'Cell / personal', x.phoneCell, '787-000-0000', 'tel')}
        <div class="jc-fg full">
          <label class="jc-fl">${isEs?'E-Mail':'E-mail'}</label>
          <input class="jc-fi" type="email" data-cx="email" value="${x.email||''}" placeholder="cliente@empresa.com">
        </div>
        <div class="jc-fg full">
          <label class="jc-fl">${isEs?'Persona autorizada en la cuenta (nombre y título)':'Authorized person on account (name and title)'}</label>
          <input class="jc-fi" type="text" data-cx="authPerson" value="${x.authPerson||''}">
        </div>
      </div>
    </div>

    <!-- Direcciones -->
    <div class="ctr-grp">
      <div class="ctr-gtl">${icon('store')} ${isEs?'Direcciones':'Addresses'}</div>
      <div class="jc-form">
        <div class="jc-fg">
          <label class="jc-fl">${isEs?'Dirección Postal (Factura)':'Mailing address (Billing)'}</label>
          <textarea class="jc-fi" rows="3" data-cx="postal" placeholder="${isEs?'Máx. 3 renglones':'Max 3 lines'}">${x.postal||''}</textarea>
        </div>
        <div class="jc-fg">
          <label class="jc-fl">${isEs?'Dirección Física (Instalación)':'Physical address (Installation)'}</label>
          <textarea class="jc-fi" rows="3" data-cx="fisica" placeholder="${isEs?'Máx. 3 renglones':'Max 3 lines'}">${x.fisica||''}</textarea>
        </div>
      </div>
    </div>

    <!-- Instalación -->
    <div class="ctr-grp">
      <div class="ctr-gtl">${icon('cog')} ${isEs?'Instalación y facturación':'Installation and billing'}</div>
      <div class="jc-form">
        ${fld('installDate', isEs?'Fecha de instalación':'Installation date', x.installDate, '', 'date')}
        ${fld('contadorAEE', isEs?'Núm. de contador / AEE':'Meter / AEE number', x.contadorAEE, isEs?'Opcional':'Optional')}
      </div>
      <div class="ctr-seg">
        <span class="ctr-seg-lbl">${isEs?'Bloque de instalación':'Installation block'}</span>
        <button class="ctr-chip ${x.installBlock==='am'?'on':''}" data-cxset="installBlock" data-v="am">8AM - 12PM</button>
        <button class="ctr-chip ${x.installBlock==='pm'?'on':''}" data-cxset="installBlock" data-v="pm">1PM - 5PM</button>
      </div>
      <div class="ctr-seg">
        <span class="ctr-seg-lbl">${isEs?'Método de facturación':'Billing method'}</span>
        <button class="ctr-chip ${x.billing==='ebill'?'on':''}" data-cxset="billing" data-v="ebill">${isEs?'Electrónica (E-bill)':'Electronic (E-bill)'}</button>
        <button class="ctr-chip ${x.billing==='paper'?'on':''}" data-cxset="billing" data-v="paper">${isEs?'Papel (+$3.00/mes)':'Paper (+$3.00/mo)'}</button>
      </div>
      <div class="ctr-seg">
        <span class="ctr-seg-lbl">${isEs?'Autoriza llamadas y mensajes de texto':'Authorizes calls and text messages'}</span>
        <button class="ctr-chip ${x.authSms==='si'?'on':''}" data-cxset="authSms" data-v="si">${isEs?'Sí':'Yes'}</button>
        <button class="ctr-chip ${x.authSms==='no'?'on':''}" data-cxset="authSms" data-v="no">${isEs?'No':'No'}</button>
      </div>
    </div>

    <!-- Convertidores -->
    <div class="ctr-grp">
      <div class="ctr-gtl">${icon('tv')} ${isEs?'Tipo de convertidor (STB)':'Converter type (STB)'}</div>
      <div class="jao-note" style="margin-bottom:10px">${icon('info')} ${
        isEs ? `La cotización tiene <strong>${totalStb} STB</strong> en total${bundleStb?' (1 incluido en el bundle 3P)':''}. Reparte la cantidad por tipo — el contrato pide HD / HubTV / DVR.`
             : `The quote has <strong>${totalStb} STB</strong> total${bundleStb?' (1 included in the 3P bundle)':''}. Split the quantity by type — the contract asks for HD / HubTV / DVR.`}</div>
      <div class="jc-form">
        ${fld('stbHD',    'HD',    x.stbHD,    '0', 'number')}
        ${fld('stbHubTV', 'HubTV', x.stbHubTV, '0', 'number')}
        ${fld('stbDVR',   'DVR',   x.stbDVR,   '0', 'number')}
      </div>
      ${stbSum !== totalStb ? `<div class="ctr-warn">${icon('warn')} ${
        isEs ? `La suma por tipo es <strong>${stbSum}</strong> y la cotización tiene <strong>${totalStb}</strong>.`
             : `The per-type sum is <strong>${stbSum}</strong> but the quote has <strong>${totalStb}</strong>.`}</div>` : ''}
    </div>

    <!-- Representante -->
    <div class="ctr-grp">
      <div class="ctr-gtl">${icon('doc')} ${isEs?'Datos del representante':'Sales Executive Details'}</div>
      <div class="jc-form">
        ${fld('vendorNo',    isEs?'Número de vendedor':'Sales Executive Number', x.vendorNo, '')}
        ${fld('vendorPhone', isEs?'Teléfono de vendedor':'Sales Executive Phone', x.vendorPhone, '787-000-0000', 'tel')}
        ${fld('territory',   isEs?'Territorio':'Territory', x.territory, '')}
      </div>
    </div>

    <div class="ctr-actions">
      <button class="btn-secondary" id="ctr-back">${icon('back')} ${isEs?'Atrás':'Back'}</button>
      <button class="ctr-prev" id="ctr-prev" ${!ready?'disabled':''}>
        ${icon('doc')} ${isEs?'Ver documento':'Preview document'}
      </button>
      <button class="ctr-dl" id="ctr-dl" ${!ready?'disabled':''}>
        ${icon('download')} ${isEs?'Descargar PDF':'Download PDF'}
      </button>
      <button class="ctr-print" id="ctr-print" ${!ready?'disabled':''}>
        ${icon('print')} ${isEs?'Imprimir':'Print'}
      </button>
    </div>
    <div class="ctr-hint">${isEs
      ? '<strong>Descargar PDF</strong> genera el archivo directamente — sin diálogo, sin URL ni fecha impresa. Usa <strong>Imprimir</strong> solo si necesitas enviarlo a papel.'
      : '<strong>Download PDF</strong> generates the file directly — no dialog, no URL or date printed on it. Use <strong>Print</strong> only if you need paper.'}</div>
    <div class="ctr-status" id="ctr-status"></div>
  `;
}

function propBindStepContractDoc(){
  const isEs = lang === 'es';

  $$('[data-cx]').forEach(el => {
    el.addEventListener('input', () => {
      const k = el.dataset.cx;
      state.prop.contractExtra[k] = el.type === 'number' ? (+el.value || 0) : el.value;
    });
  });

  $$('[data-cxset]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.cxset;
      state.prop.contractExtra[k] = (state.prop.contractExtra[k] === el.dataset.v) ? '' : el.dataset.v;
      propRender();
    });
  });

  const back = $('#ctr-back');
  if (back) back.addEventListener('click', () => { state.prop.step = 6; propRender(); });

  // Both buttons render the SAME approved template; one previews, one prints.
  const run = async (btn, fn, okMsg) => {
    const st = $('#ctr-status');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${icon('refresh')} ${isEs ? 'Preparando…' : 'Preparing…'}`;
    if (st){ st.className = 'ctr-status'; st.textContent = ''; }
    try {
      const name = await fn();
      if (st){ st.className = 'ctr-status ok'; st.textContent = okMsg(name); }
    } catch (err){
      if (st){
        st.className = 'ctr-status err';
        st.textContent = (isEs ? 'No se pudo generar la solicitud. ' : 'Could not generate the request. ')
                       + (err && err.message ? err.message : '');
      }
    } finally { btn.disabled = false; btn.innerHTML = original; }
  };

  const prev = $('#ctr-prev');
  if (prev) prev.addEventListener('click', () => run(prev, solicitudPreview,
    n => isEs ? 'Documento abierto en una pestaña nueva.' : 'Document opened in a new tab.'));

  const dl = $('#ctr-dl');
  if (dl) dl.addEventListener('click', () => run(dl, solicitudDownloadPDF,
    n => (isEs ? 'PDF descargado: ' : 'PDF downloaded: ') + n));

  const pr = $('#ctr-print');
  if (pr) pr.addEventListener('click', () => run(pr, solicitudPrint,
    n => isEs ? 'Diálogo de impresión abierto.' : 'Print dialog open.'));
}
