// ═══════════════════════════════════════════════════════════════════════════
// SOLICITUD DE SERVICIO — native PDF renderer (pdf-lib)
//
// Produces the download: one click, a real vector PDF, and — the reason this
// exists — no browser print chrome. CSS cannot suppress Chrome's header/footer
// (URL, timestamp, page numbers); only a generated file can.
//
// CONTENT COMES FROM THE APPROVED TEMPLATE, NOT FROM THIS FILE.
// Labels, section titles, the right-column legal prose, the page-2 disclosure and
// the logo are all harvested at runtime from assets/solicitud-template.html. This
// file owns *layout only*. If Legal revises wording, the template changes and this
// renderer follows automatically — the two can't drift apart.
//
// Requires: window.PDFLib · solicitudLoadTemplate() · solicitudFieldValues()
//           contractBuildData() · solicitudFilename()
// ═══════════════════════════════════════════════════════════════════════════

const SP = {
  W: 612, H: 792,
  ML: 22, MR: 22, MT: 18, MB: 14,
  gap: 7,
  leftFrac: 0.545,
  fs: { title:14, brand:6.2, bar:7.4, label:5.3, value:7.4, th:5.4, td:6.5,
        sub:5.6, terms:5.4, termsH:6.1, legal:5.35, legalH:6.2, foot:5.2, tot:9 },
  row:{ grid:15.2, td:9.2, sub:7.8 },
  c: {
    blue:   [0, 0.443, 0.808],
    blueD:  [0, 0.361, 0.659],
    orange: [1, 0.325, 0],
    line:   [0.718, 0.737, 0.769],
    soft:   [0.800, 0.824, 0.851],
    muted:  [0.353, 0.380, 0.420],
    ink:    [0.125, 0.141, 0.169],
    subBg:  [0.898, 0.949, 0.984],
    payBg:  [0.847, 0.922, 0.980],
    saveBg: [1, 0.945, 0.910],
    saveFg: [0.780, 0.247, 0],
    mark:   [1, 0.953, 0.659],
    white:  [1, 1, 1]
  }
};

// ── primitives ─────────────────────────────────────────────────────────────
function _sp(d){ return window.PDFLib.rgb(d[0], d[1], d[2]); }
function _spY(c, yTop){ return SP.H - yTop; }

function _spFit(txt, font, size, maxW){
  let s = size, t = String(txt);
  while (s > 4 && font.widthOfTextAtSize(t, s) > maxW) s -= 0.15;
  if (font.widthOfTextAtSize(t, s) <= maxW) return { t, s };
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', s) > maxW) t = t.slice(0, -1);
  return { t: t + '…', s };
}

function _spText(c, txt, x, yTop, o){
  if (txt == null || txt === '') return;
  o = o || {};
  const font = o.bold ? c.bold : c.font;
  const size = o.size || SP.fs.value;
  const col  = o.color || SP.c.ink;
  let t = String(txt), s = size;
  if (o.maxW){ const f = _spFit(t, font, size, o.maxW); t = f.t; s = f.s; }
  let xx = x;
  if (o.align === 'right')  xx = x - font.widthOfTextAtSize(t, s);
  if (o.align === 'center') xx = x - font.widthOfTextAtSize(t, s) / 2;
  c.page.drawText(t, { x: xx, y: _spY(c, yTop), size: s, font, color: _sp(col) });
}

function _spRect(c, x, yTop, w, h, o){
  o = o || {};
  const spec = { x, y: _spY(c, yTop + h), width: w, height: h };
  if (o.fill) spec.color = _sp(o.fill);
  if (o.border){ spec.borderColor = _sp(o.border); spec.borderWidth = o.bw || 0.4; }
  if (o.opacity != null) spec.opacity = o.opacity;
  c.page.drawRectangle(spec);
}

function _spLine(c, x1, yTop, x2, o){
  o = o || {};
  c.page.drawLine({
    start: { x: x1, y: _spY(c, yTop) }, end: { x: x2, y: _spY(c, yTop) },
    thickness: o.w || 0.4, color: _sp(o.color || SP.c.soft)
  });
}

// Radio / checkbox glyphs — filled when selected
function _spRadio(c, cx, cyTop, on, r){
  r = r || 2.3;
  c.page.drawCircle({ x: cx, y: _spY(c, cyTop), size: r, borderColor: _sp(SP.c.muted), borderWidth: 0.5 });
  if (on) c.page.drawCircle({ x: cx, y: _spY(c, cyTop), size: r - 0.9, color: _sp(SP.c.blue) });
}
function _spCheck(c, x, yTop, on, s){
  s = s || 4.6;
  _spRect(c, x, yTop, s, s, { border: SP.c.muted, bw: 0.5, fill: on ? SP.c.blue : null });
  if (on){
    c.page.drawLine({ start:{x:x+0.9, y:_spY(c,yTop+2.6)}, end:{x:x+1.9, y:_spY(c,yTop+3.7)}, thickness:0.7, color:_sp(SP.c.white) });
    c.page.drawLine({ start:{x:x+1.9, y:_spY(c,yTop+3.7)}, end:{x:x+3.8, y:_spY(c,yTop+1.1)}, thickness:0.7, color:_sp(SP.c.white) });
  }
}

// Word-wrap. Returns the y after the block. `justify` spreads inner spaces.
function _spWrap(c, txt, x, yTop, w, o){
  o = o || {};
  const font = o.bold ? c.bold : c.font;
  const size = o.size || SP.fs.legal;
  const lh   = o.lh || size * 1.28;
  const words = String(txt).replace(/\s+/g, ' ').trim().split(' ');
  const lines = []; let cur = [];
  for (const wd of words){
    const probe = cur.concat(wd).join(' ');
    if (font.widthOfTextAtSize(probe, size) <= w || !cur.length) cur.push(wd);
    else { lines.push(cur); cur = [wd]; }
  }
  if (cur.length) lines.push(cur);

  let y = yTop;
  lines.forEach((ln, i) => {
    const last = i === lines.length - 1;
    const text = ln.join(' ');
    if (o.justify && !last && ln.length > 1){
      const natural = font.widthOfTextAtSize(text, size);
      const extra = (w - natural) / (ln.length - 1);
      let xx = x;
      ln.forEach((wd, k) => {
        c.page.drawText(wd, { x: xx, y: _spY(c, y + size), size, font, color: _sp(o.color || SP.c.ink) });
        xx += font.widthOfTextAtSize(wd, size) + font.widthOfTextAtSize(' ', size) + extra;
      });
    } else {
      c.page.drawText(text, { x, y: _spY(c, y + size), size, font, color: _sp(o.color || SP.c.ink) });
    }
    y += lh;
  });
  return y;
}
function _spWrapH(c, txt, w, o){          // measure only
  o = o || {};
  const font = o.bold ? c.bold : c.font;
  const size = o.size || SP.fs.legal;
  const lh   = o.lh || size * 1.28;
  const words = String(txt).replace(/\s+/g,' ').trim().split(' ');
  let n = 1, cur = [];
  for (const wd of words){
    const probe = cur.concat(wd).join(' ');
    if (font.widthOfTextAtSize(probe, size) <= w || !cur.length) cur.push(wd);
    else { n++; cur = [wd]; }
  }
  return n * lh;
}

// Section bar — dark blue with the orange left edge, matching the approved design
function _spBar(c, x, yTop, w, text, o){
  o = o || {};
  const h = o.h || 11;
  _spRect(c, x, yTop, w, h, { fill: SP.c.blue });
  _spRect(c, x, yTop, 2.2, h, { fill: SP.c.orange });
  _spText(c, text, x + 5.5, yTop + h - 3.2, { bold:true, size:o.size || SP.fs.bar, color:SP.c.white, maxW:w - 12 });
  return yTop + h;
}

// An option rendered inside a blue section bar (cliente nuevo/existente, paquete).
// Selected reads at a glance: orange pill behind the label, filled white bullet,
// bold text. A 4pt ring alone was too quiet on a document a customer signs.
function _spBarOpt(c, x, yTop, barH, label, on){
  const cy = yTop + barH/2;
  const tw = (on ? c.bold : c.font).widthOfTextAtSize(label, SP.fs.bar);
  if (on){
    _spRect(c, x - 4.2, yTop + 1.4, tw + 13, barH - 2.8, { fill: SP.c.orange });
    c.page.drawCircle({ x, y: _spY(c, cy), size: 2.4, color: _sp(SP.c.white) });
    c.page.drawCircle({ x, y: _spY(c, cy), size: 1.15, color: _sp(SP.c.orange) });
  } else {
    c.page.drawCircle({ x, y: _spY(c, cy), size: 2.4,
                        borderColor: _sp(SP.c.white), borderWidth: 0.5 });
  }
  _spText(c, label, x + 4.5, yTop + barH - 3.4,
          { size: SP.fs.bar, color: SP.c.white, bold: on });
}

// A radio option on white ground. Selected gets bold text and a blue bullet.
function _spOpt(c, x, cyTop, baseTop, label, on, size, r){
  _spRadio(c, x, cyTop, on, r);
  _spText(c, label, x + (r ? r + 2.4 : 4.7), baseTop,
          { size: size || SP.fs.value, bold: on, color: on ? SP.c.blueD : SP.c.ink });
  return (r ? r + 2.4 : 4.7) + (on ? c.bold : c.font).widthOfTextAtSize(label, size || SP.fs.value);
}

// Label-over-value cell with a hairline box
function _spCell(c, x, yTop, w, h, label, value, o){
  o = o || {};
  _spRect(c, x, yTop, w, h, { border: SP.c.soft, bw: 0.35 });
  _spText(c, (label || '').toUpperCase(), x + 3.5, yTop + 5.6,
          { size: SP.fs.label, bold:true, color: SP.c.muted, maxW: w - 7 });
  // Tall cells anchor the value just under the label; normal ones sit on the baseline.
  const vy = o.valueTop ? yTop + 14 : yTop + h - 3.4;
  if (o.mark) _spRect(c, x + 3, vy - 5, w - 6, 7, { fill: SP.c.mark, opacity: 0.75 });
  _spText(c, value, x + 3.5, vy,
          { size: o.size || SP.fs.value, maxW: w - 7, bold: !!o.boldValue });
}

// ── harvest: pull every piece of copy out of the approved template ─────────
function solicitudHarvest(tplHTML){
  const doc = new DOMParser().parseFromString(tplHTML, 'text/html');
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();

  const logo = (/src="data:image\/png;base64,([^"]+)"/.exec(tplHTML) || [])[1] || null;

  // bar titles, in document order
  const bars = [...doc.querySelectorAll('.bar')].map(b => {
    const n = b.cloneNode(true);
    n.querySelectorAll('.choices, .hint').forEach(e => e.remove());
    return clean(n.textContent);
  });

  // name → label for every .cell field
  const labels = {};
  doc.querySelectorAll('.cell').forEach(cell => {
    const l = cell.querySelector('label.f'), i = cell.querySelector('[name]');
    if (l && i) labels[i.getAttribute('name')] = clean(l.textContent);
  });

  // services table rows
  const svc = [];
  doc.querySelectorAll('#svcBody tr').forEach(tr => {
    if (tr.classList.contains('sub')){ svc.push({ sub: clean(tr.textContent) }); return; }
    const cb = tr.querySelector('td.item input[type=checkbox]');
    const qty = tr.querySelector('td.qty input');
    const item = tr.querySelector('td.item');
    if (item && item.querySelector('.choices')){          // Ultimate Packs row
      const main = item.querySelector('label.chip');
      svc.push({
        packs: clean(main ? main.textContent : 'Ultimate Packs'),
        opts: [...item.querySelectorAll('.choices label.chip')].map(l => ({
          name: l.querySelector('input').getAttribute('name'), label: clean(l.textContent)
        })),
        // "Otro:" carries a free-text field; without it the pack the rep picked
        // shows as a bare checkbox with no name next to it.
        descs: [...item.querySelectorAll('.choices input[type=text]')].map(i => i.getAttribute('name')),
        cells: [...tr.querySelectorAll('td:not(.item) input')].map(i => i.getAttribute('name'))
      });
      return;
    }
    const n = clean(item ? item.textContent : '');
    svc.push({ label:n, check: cb ? cb.getAttribute('name') : null,
               cells: [...tr.querySelectorAll('td:not(.item) input')].map(i => i.getAttribute('name')) });
  });

  // the four compact tables that follow (internet / adicionales / total / cnr)
  const tables = [...doc.querySelectorAll('table.svc')].slice(1).map(t => ({
    head: [...t.querySelectorAll('thead th')].map(th => clean(th.textContent)),
    rows: [...t.querySelectorAll('tbody tr')].map(tr => {
      if (tr.classList.contains('sub')){
        // The money input, not just the first input — a totals row may grow an
        // inline description field later and silently steal this binding.
        const inp = tr.querySelector('td.money-in input') || tr.querySelector('input');
        return { sub: clean(tr.querySelector('td').textContent),
                 field: inp ? inp.getAttribute('name') : null,
                 kind: tr.classList.contains('save') ? 'save'
                     : tr.classList.contains('pay')  ? 'pay' : null };
      }
      const item = tr.querySelector('td.item');
      const cb   = item && item.querySelector('input[type=checkbox]');
      const inputs = [...tr.querySelectorAll('td:not(.item) input')].map(i => i.getAttribute('name'));
      const inline = item ? [...item.querySelectorAll('input[type=text]')].map(i => i.getAttribute('name')) : [];
      // When the cell has a checkbox chip *and* an inline field, the whole
      // textContent runs them together ("Wi-Fi Hot Spot Velocidad:"). Read the chip
      // as the row label and keep the inline caption separate.
      const chip = item && item.querySelector('label.chip');
      const cap  = item ? clean([...item.querySelectorAll('.inline-in > span')]
                                  .map(s => s.textContent).join(' ')) : '';
      return { label: clean(chip ? chip.textContent : (item ? item.textContent : '')),
               caption: cap, check: cb ? cb.getAttribute('name') : null,
               cells: inputs, inline };
    })
  }));

  // right column: heading / paragraph / radio-row / initials, in order
  const terms = [];
  const tc = doc.querySelector('.pad.terms');
  if (tc) [...tc.children].forEach(el => {
    if (el.tagName === 'H4'){ terms.push({ h: clean(el.textContent) }); return; }
    if (el.classList.contains('choices')){
      terms.push({
        radios: [...el.querySelectorAll('input[type=radio]')].map(i => ({
          name: i.getAttribute('name'), value: i.getAttribute('value'),
          label: clean(i.parentElement.textContent)
        })),
        free: [...el.querySelectorAll('input[type=text]')].map(i => i.getAttribute('name'))
      });
      return;
    }
    if (el.tagName === 'P'){
      const radio = el.querySelector('input[type=radio]');
      const init  = el.querySelector('.init input');
      const n = el.cloneNode(true);
      n.querySelectorAll('.init').forEach(e => e.remove());
      terms.push({ p: clean(n.textContent),
                   radio: radio ? { name: radio.getAttribute('name'), value: radio.getAttribute('value') } : null,
                   init: init ? init.getAttribute('name') : null });
      return;
    }
    if (el.classList.contains('signgrid')){
      terms.push({ sign: [...el.querySelectorAll('.cell')].map(cl => ({
        label: clean(cl.querySelector('label.f').textContent),
        name:  cl.querySelector('[name]').getAttribute('name')
      })) });
    }
  });

  const footNote = clean((doc.querySelector('.foot-note') || {}).textContent);

  // page 2 legal disclosure
  const legal = [];
  const lb = doc.querySelector('.p2-body');
  if (lb) [...lb.children].forEach(el => {
    if (el.tagName === 'HR'){ legal.push({ rule: true }); return; }   // before the empty-text guard
    const t = clean(el.textContent);
    if (!t) return;
    if (el.classList.contains('p2-lang')) legal.push({ lang: t });
    else if (el.tagName === 'H3')         legal.push({ h: t });
    else if (el.tagName === 'P')          legal.push({ p: t });
  });

  // Match by content, not index — the two-column DOM order is easy to get wrong.
  const barInstr = bars.find(b => /instruccion/i.test(b)) || '';
  const barTerms = bars.find(b => /datos importantes/i.test(b)) || '';
  const barRep   = bars.find(b => /uso interno|representante/i.test(b)) || '';
  return { logo, bars, barInstr, barTerms, barRep, labels, svc, tables, terms, footNote, legal };
}

// ── render ─────────────────────────────────────────────────────────────────
async function solicitudRenderPDF(){
  if (!window.PDFLib) throw new Error('pdf-lib no está disponible.');
  const { PDFDocument, StandardFonts } = window.PDFLib;

  const tpl = await solicitudLoadTemplate();
  const H   = solicitudHarvest(tpl);
  const d   = contractBuildData();
  const V   = solicitudFieldValues(d);
  const val = n => V.text[n] || '';
  const on  = n => V.check.indexOf(n) >= 0;
  const rad = (n, v) => V.radio[n] === v;
  const marked = n => V.mark.indexOf(n) >= 0;

  const pdf  = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([SP.W, SP.H]);
  const c = { page, font, bold };

  const X0 = SP.ML, X1 = SP.W - SP.MR, CW = X1 - X0;
  let y = SP.MT;

  // ── header ──
  if (H.logo){
    try {
      const img = await pdf.embedPng(H.logo);
      const h = 30, w = h * (img.width / img.height);
      c.page.drawImage(img, { x: X0, y: _spY(c, y + h), width: w, height: h });
    } catch (e){ /* logo optional */ }
  }
  _spText(c, 'Servicio al Cliente (787) 355-0606', X1, y + 7,  { size: SP.fs.brand, color: SP.c.muted, align:'right' });
  _spText(c, 'libertybusinesspr.com',              X1, y + 14, { size: SP.fs.brand, color: SP.c.muted, align:'right' });
  _spText(c, 'SOLICITUD DE SERVICIO',              X1, y + 30, { size: SP.fs.title, bold:true, color: SP.c.blueD, align:'right' });
  y += 34;

  // ── Información del cliente ──
  const barH = 11;
  _spRect(c, X0, y, CW, barH, { fill: SP.c.blue });
  _spRect(c, X0, y, 2.2, barH, { fill: SP.c.orange });
  _spText(c, H.bars[0] || 'Información del cliente', X0 + 5.5, y + barH - 3.2,
          { bold:true, size: SP.fs.bar, color: SP.c.white });
  // cliente nuevo / existente, inside the bar
  let rx = X0 + 150;
  [['nuevo','Cliente nuevo'], ['existente','Cliente existente']].forEach(([v, lbl]) => {
    _spBarOpt(c, rx, y, barH, lbl, rad('tipo_cliente', v));
    rx += 4.5 + bold.widthOfTextAtSize(lbl, SP.fs.bar) + 16;
  });
  y += barH;

  const R = SP.row.grid;
  const half = CW / 2, third = CW / 3;
  _spCell(c, X0,        y, half,        R, H.labels.num_cuenta,      val('num_cuenta'));
  _spCell(c, X0+half,   y, CW-half,     R, H.labels.fecha_solicitud, val('fecha_solicitud')); y += R;
  _spCell(c, X0,        y, half,        R, H.labels.compania,        val('compania'));
  // Seguro Social Patronal never carries a value — it is highlighted so the
  // customer knows it is one of the blanks they have to fill in.
  _spCell(c, X0+half,   y, CW-half,     R, H.labels.seguro_social,   val('seguro_social'),
          { mark: marked('seguro_social') }); y += R;
  _spCell(c, X0,        y, half*1.35,   R, H.labels.contacto,        val('contacto'));
  _spCell(c, X0+half*1.35, y, CW-half*1.35, R, H.labels.titulo,      val('titulo')); y += R;
  _spCell(c, X0,          y, third, R, H.labels.tel_oficina, val('tel_oficina'));
  _spCell(c, X0+third,    y, third, R, H.labels.celular,     val('celular'));
  _spCell(c, X0+third*2,  y, CW-third*2, R, H.labels.email,  val('email')); y += R;

  // bloque de instalación + persona autorizada
  _spRect(c, X0, y, half, R, { border: SP.c.soft, bw: 0.35 });
  _spText(c, (H.labels.bloque || 'Bloque de instalación').toUpperCase(), X0+3.5, y+5.6,
          { size: SP.fs.label, bold:true, color: SP.c.muted });
  let bx = X0 + 6;
  [['am','8:00 AM – 12:00 PM'], ['pm','1:00 PM – 5:00 PM']].forEach(([v,lbl]) => {
    bx += 2.3 + _spOpt(c, bx + 2.3, y + R - 5.2, y + R - 3.4, lbl,
                       rad('bloque', v), SP.fs.value - 0.6, 2.3) + 12;
  });
  _spCell(c, X0+half, y, CW-half, R, H.labels.autorizada, val('autorizada'), { size: SP.fs.value - 0.5 });
  y += R + 3;

  // ── direcciones (dos columnas) ──
  // One address line per block. The postal column has nothing under it, so its
  // box is drawn double-height with the value under the label instead of leaving
  // the two columns ending at different heights.
  const dW = (CW - SP.gap) / 2;
  const addrH = R * 2;
  let ay = _spBar(c, X0, y, dW, H.bars[1] || '');
  _spCell(c, X0, ay, dW, addrH, H.labels.postal_1, val('postal_1'), { valueTop: true });

  ay = _spBar(c, X0+dW+SP.gap, y, dW, H.bars[2] || '');
  _spCell(c, X0+dW+SP.gap, ay, dW, R, H.labels.fisica_1, val('fisica_1'));
  const hw = dW / 2;
  _spCell(c, X0+dW+SP.gap,      ay+R, hw,    R, H.labels.num_contador,     val('num_contador'));
  _spCell(c, X0+dW+SP.gap+hw,   ay+R, dW-hw, R, H.labels.fecha_instalacion, val('fecha_instalacion'));
  y += 11 + addrH + 3;

  // ── Paquete ──
  _spRect(c, X0, y, CW, barH, { fill: SP.c.blue });
  _spRect(c, X0, y, 2.2, barH, { fill: SP.c.orange });
  _spText(c, H.bars[3] || 'Paquete', X0 + 5.5, y + barH - 3.2, { bold:true, size: SP.fs.bar, color: SP.c.white });
  let px = X0 + 60;
  [['sencillo','Sencillo'], ['doble','Doble'], ['triple','Triple']].forEach(([v,lbl]) => {
    _spBarOpt(c, px, y, barH, lbl, rad('paquete', v));
    px += 4.5 + bold.widthOfTextAtSize(lbl, SP.fs.bar) + 16;
  });
  y += barH + 3;

  // ── main two-column region ──
  const LW = Math.round(CW * SP.leftFrac), RW = CW - LW - SP.gap;
  const LX = X0, RX = X0 + LW + SP.gap;
  const yTop = y;

  // helper: money columns inside a table of width w
  const cols = w => { const nu = 26, mo = 46; return { lbl: w - nu - mo*2, nu, mo }; };

  // ---- LEFT: services ----
  let ly = yTop;
  // Money columns are filled from the RIGHT. A table may declare 3 money cells
  // (Cant./Precio/Total) or just 1 (CNR's single "Precio regular"), so slots are
  // assigned right-to-left instead of assuming a fixed prefix_cant/_prec/_tot trio.
  const slots = (x, w) => { const k = cols(w); return [
    { x: x + k.lbl + k.nu/2,               align:'center', money:false },
    { x: x + k.lbl + k.nu + k.mo - 4,      align:'right',  money:true  },
    { x: x + k.lbl + k.nu + k.mo*2 - 4,    align:'right',  money:true  }
  ]; };
  const drawTableHead = (x, w, heads) => {
    const hh = 12, k = cols(w), sl = slots(x, w);
    _spRect(c, x, ly, w, hh, { fill: SP.c.blue });
    _spText(c, heads[0], x + 4, ly + hh - 4, { bold:true, size: SP.fs.th, color: SP.c.white, maxW: k.lbl });
    const rest = heads.slice(1);
    rest.forEach((h, i) => {
      const s2 = sl[3 - rest.length + i];
      _spText(c, h, s2.align === 'right' ? s2.x + 2 : s2.x, ly + hh - 4,
              { bold:true, size: SP.fs.th, color: SP.c.white, align: s2.align === 'right' ? 'right' : 'center' });
    });
    ly += hh;
  };
  const placeCells = (x, w, names) => {
    const sl = slots(x, w), rest = (names || []).filter(Boolean);
    rest.forEach((n, i) => {
      const s2 = sl[Math.max(0, 3 - rest.length + i)];
      const v = val(n);
      if (!v) return;
      const isNum = /^[\d.]+$/.test(v);
      _spText(c, (s2.money && isNum) ? '$ ' + v : v, s2.x, ly + SP.row.td - 2.6,
              { size: SP.fs.td, align: s2.align, bold: (3 - rest.length + i) === 2 });
    });
  };

  drawTableHead(LX, LW, ['Servicio','Cant.','Precio reg.','Total']);
  H.svc.forEach(r => {
    if (r.sub){
      _spRect(c, LX, ly, LW, SP.row.sub, { fill: SP.c.subBg });
      _spText(c, r.sub.toUpperCase(), LX + 4, ly + SP.row.sub - 2.2, { bold:true, size: SP.fs.sub, color: SP.c.blueD });
      ly += SP.row.sub; return;
    }
    const h = r.packs ? SP.row.td * 2 : SP.row.td;
    if (r.packs){
      const pk = on('pk_ultimate');
      _spCheck(c, LX + 4, ly + 2, pk);
      _spText(c, r.packs, LX + 11, ly + SP.row.td - 2.6,
              { size: SP.fs.td, maxW: cols(LW).lbl - 14, bold: pk, color: pk ? SP.c.blueD : SP.c.ink });
      let ox = LX + 11;
      r.opts.forEach(o => {
        const os = on(o.name);
        _spCheck(c, ox, ly + SP.row.td + 1.6, os, 3.8);
        _spText(c, o.label, ox + 5.2, ly + SP.row.td*2 - 2.8,
                { size: SP.fs.td - 0.7, bold: os, color: os ? SP.c.blueD : SP.c.ink });
        ox += 5.2 + (os ? bold : font).widthOfTextAtSize(o.label, SP.fs.td - 0.7) + 5;
      });
      (r.descs || []).forEach(n => {
        const dv = val(n); if (!dv) return;
        _spText(c, dv, ox - 3, ly + SP.row.td*2 - 2.8,
                { size: SP.fs.td - 0.7, bold:true, color: SP.c.blueD, maxW: cols(LW).lbl - (ox - LX) });
        ox += font.widthOfTextAtSize(dv, SP.fs.td - 0.7) + 5;
      });
      placeCells(LX, LW, r.cells);
    } else {
      if (r.check){
        const ck = on(r.check);
        _spCheck(c, LX + 4, ly + 2.2, ck);
        _spText(c, r.label, LX + 11, ly + SP.row.td - 2.6,
                { size: SP.fs.td, maxW: cols(LW).lbl - 14, bold: ck, color: ck ? SP.c.blueD : SP.c.ink });
      } else {
        _spText(c, r.label, LX + 5, ly + SP.row.td - 2.6, { size: SP.fs.td, maxW: cols(LW).lbl - 8 });
      }
      placeCells(LX, LW, r.cells);
    }
    _spLine(c, LX, ly + h, LX + LW);
    ly += h;
  });

  // internet / adicionales / total / cnr — from the harvested tables
  H.tables.forEach((tb, ti) => {
    ly += 3;
    const isTotal = tb.head.length === 0;
    if (!isTotal) drawTableHead(LX, LW, tb.head);
    tb.rows.forEach(r => {
      if (r.sub && !r.field){
        _spRect(c, LX, ly, LW, SP.row.sub, { fill: SP.c.subBg });
        _spText(c, r.sub.toUpperCase(), LX + 4, ly + SP.row.sub - 2.2, { bold:true, size: SP.fs.sub, color: SP.c.blueD });
        ly += SP.row.sub; return;
      }
      if (r.sub && r.field){          // "Total de mensualidad regular" / ahorro / CNR
        // The saving lines only exist when the quote actually beat list price —
        // an empty one would print "$" with nothing after it.
        if (!val(r.field) && (r.kind === 'save' || r.kind === 'pay')) return;
        const hh = r.kind === 'pay' ? 15 : 13;
        const skin = r.kind === 'save' ? { bg: SP.c.saveBg, fg: SP.c.saveFg }
                   : r.kind === 'pay'  ? { bg: SP.c.payBg,  fg: SP.c.blueD }
                   :                     { bg: SP.c.subBg,  fg: SP.c.blueD };
        _spRect(c, LX, ly, LW, hh, { fill: skin.bg });
        if (r.kind === 'pay') _spRect(c, LX, ly, 2.2, hh, { fill: SP.c.orange });
        _spText(c, r.sub.toUpperCase(), LX + (r.kind === 'pay' ? 5.5 : 4), ly + hh - 4.6,
                { bold:true, size: SP.fs.sub + 0.4, color: skin.fg, maxW: LW - 70 });
        // Standard Helvetica is WinAnsi — a typographic minus (U+2212) throws.
        const amt = r.kind === 'save'
          ? '- $ ' + val(r.field).replace(/^-/, '')
          : '$ ' + val(r.field);
        _spText(c, amt, LX + LW - 5, ly + hh - 4.2,
                { bold:true, size: r.kind === 'pay' ? SP.fs.tot + 1.4 : SP.fs.tot,
                  color: skin.fg, align:'right' });
        ly += hh; return;
      }
      const k = cols(LW);
      const ck = r.check ? on(r.check) : false;
      if (r.check){
        _spCheck(c, LX + 4, ly + 2.2, ck);
        _spText(c, r.label, LX + 11, ly + SP.row.td - 2.6,
                { size: SP.fs.td, maxW: k.lbl - 60, bold: ck, color: ck ? SP.c.blueD : SP.c.ink });
      } else {
        _spText(c, r.label, LX + 5, ly + SP.row.td - 2.6, { size: SP.fs.td, color: SP.c.muted, maxW: 52 });
      }
      // inline free-text (velocidad / downstream / descripción …)
      if (r.inline && r.inline.length){
        const nm = r.inline[0];
        const ix = LX + (r.check ? 11 + (ck ? bold : font).widthOfTextAtSize(r.label, SP.fs.td) + 6 : 60);
        const iv = val(nm);
        _spText(c, (r.caption && iv) ? r.caption + ' ' + iv : iv, ix, ly + SP.row.td - 2.6,
                { size: SP.fs.td, maxW: k.lbl - (ix - LX) - 4, bold: ck });
      }
      // money cells: [cant, prec, tot] or [prec, tot]
      placeCells(LX, LW, r.cells);
      _spLine(c, LX, ly + SP.row.td, LX + LW);
      ly += SP.row.td;
    });
  });

  // instrucciones especiales
  ly += 3;
  ly = _spBar(c, LX, ly, LW, H.barInstr || 'Instrucciones especiales y comentarios');
  // The box grows to the note instead of clipping it — a fixed 30pt silently cut
  // the last line off once the note ran past four rows.
  const noteTxt = val('instrucciones');
  const noteH = Math.max(30, Math.min(78, noteTxt
    ? _spWrapH(c, noteTxt, LW - 8, { size: SP.fs.td - 0.4, lh: 7 }) + 6 : 0));
  _spRect(c, LX, ly, LW, noteH, { border: SP.c.soft, bw: 0.35 });
  _spWrap(c, noteTxt, LX + 4, ly + 3, LW - 8, { size: SP.fs.td - 0.4, lh: 7 });
  ly += noteH;

  // ---- RIGHT: datos importantes ----
  let ry = yTop;
  ry = _spBar(c, RX, ry, RW, H.barTerms || 'Datos importantes sobre esta solicitud');
  ry += 2;
  H.terms.forEach(it => {
    if (it.h){
      ry += 1.5;
      _spText(c, it.h, RX + 2, ry + SP.fs.termsH, { bold:true, size: SP.fs.termsH, color: SP.c.blueD, maxW: RW - 4 });
      ry += SP.fs.termsH + 2.2; return;
    }
    if (it.radios){
      let x = RX + 3;
      it.radios.forEach(r2 => {
        const sel = rad(r2.name, r2.value);
        _spRadio(c, x + 2.3, ry + 3.2, sel, 2.2);
        _spText(c, r2.label, x + 6.6, ry + 5.4,
                { size: SP.fs.terms, bold: sel, color: sel ? SP.c.blueD : SP.c.ink });
        x += 6.6 + (sel ? bold : font).widthOfTextAtSize(r2.label, SP.fs.terms) + 6;
      });
      (it.free || []).forEach(n => {
        const w = 30;
        if (marked(n)) _spRect(c, x, ry, w, 7.4, { fill: SP.c.mark, opacity: 0.8 });
        _spLine(c, x, ry + 7, x + w, { color: SP.c.muted });
        _spText(c, val(n), x + 2, ry + 5.4, { size: SP.fs.terms, maxW: w - 4 });
        x += w + 5;
      });
      ry += 9.5; return;
    }
    if (it.p){
      let x = RX + 2, indent = 0, sel = false;
      if (it.radio){
        sel = rad(it.radio.name, it.radio.value);
        _spRadio(c, x + 2.3, ry + 3.4, sel, 2.2);
        indent = 7;
      }
      // The selected billing / authorisation clause is the one the customer is
      // agreeing to — it should not read like the paragraph beside it.
      ry = _spWrap(c, it.p, x + indent, ry, RW - 4 - indent,
                   { size: SP.fs.terms, lh: SP.fs.terms * 1.25, justify:false,
                     bold: sel, color: sel ? SP.c.blueD : SP.c.ink });
      if (it.init){
        const w = 34;
        if (marked(it.init)) _spRect(c, x + indent, ry, w, 7.4, { fill: SP.c.mark, opacity: 0.8 });
        _spLine(c, x + indent, ry + 6.6, x + indent + w, { color: SP.c.muted });
        _spText(c, 'Iniciales', x + indent + w + 4, ry + 5.2, { size: SP.fs.terms - 0.3, color: SP.c.muted });
        ry += 8.5;
      }
      ry += 1.8; return;
    }
    if (it.sign){
      ry += 2;
      const hw = RW / 2;
      it.sign.forEach((s, i) => {
        const wide = i === it.sign.length - 1 && it.sign.length % 2 === 1;
        const w = wide ? RW : hw;
        const x = wide ? RX : RX + (i % 2) * hw;
        _spCell(c, x, ry, w, R, s.label, val(s.name), { mark: marked(s.name) });
        if (wide || i % 2 === 1) ry += R;
      });
    }
  });

  y = Math.max(ly, ry) + 4;

  // ── uso interno — representante ──
  y = _spBar(c, X0, y, CW, H.barRep || 'Uso interno — Representante de ventas');
  const t3 = CW / 3;
  ['rep_nombre','rep_num','rep_tel'].forEach((n, i) =>
    _spCell(c, X0 + t3*i, y, i === 2 ? CW - t3*2 : t3, R, H.labels[n], val(n)));
  y += R;
  ['rep_firma','rep_territorio','rep_fecha'].forEach((n, i) =>
    _spCell(c, X0 + t3*i, y, i === 2 ? CW - t3*2 : t3, R, H.labels[n], val(n)));
  y += R + 4;

  _spWrap(c, H.footNote, X0 + 40, y, CW - 80,
          { size: SP.fs.foot, color: SP.c.muted, lh: SP.fs.foot * 1.3 });

  // ── page 2 — legal disclosure ──
  const p2 = pdf.addPage([SP.W, SP.H]);
  const c2 = { page: p2, font, bold };
  let y2 = SP.MT + 6;
  H.legal.forEach(it => {
    if (it.lang) return;                       // screen-only marker
    if (it.rule){
      _spLine(c2, X0, y2 + 4, X1, { color: SP.c.ink, w: 0.6 }); y2 += 12; return;
    }
    if (it.h){
      y2 += 3;
      if (y2 + 34 > SP.H - SP.MB){ c2.page = pdf.addPage([SP.W, SP.H]); y2 = SP.MT + 6; }
      _spText(c2, it.h.toUpperCase(), X0, y2 + SP.fs.legalH,
              { bold:true, size: SP.fs.legalH, color: SP.c.ink, maxW: CW });
      y2 += SP.fs.legalH + 2.4; return;
    }
    const need = _spWrapH(c2, it.p, CW, { size: SP.fs.legal, lh: SP.fs.legal * 1.3 });
    if (y2 + need > SP.H - SP.MB){          // spill onto another sheet rather than clip
      c2.page = pdf.addPage([SP.W, SP.H]);
      y2 = SP.MT + 6;
    }
    y2 = _spWrap(c2, it.p, X0, y2, CW,
                 { size: SP.fs.legal, lh: SP.fs.legal * 1.3, justify: true });
    y2 += 3;
  });

  pdf.setTitle('Solicitud de Servicio — ' + (d.company || 'Liberty Business'));
  pdf.setSubject('Liberty Business · Fijo SOHO/SMB');
  pdf.setAuthor('Liberty Communications of Puerto Rico');
  pdf.setCreator('Liberty Business — B2B Fijo Sales Tool');
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());
  return pdf.save();
}

async function solicitudDownloadPDF(){
  const bytes = await solicitudRenderPDF();
  const name  = solicitudFilename() + '.pdf';
  const blob  = new Blob([bytes], { type: 'application/pdf' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return name;
}
