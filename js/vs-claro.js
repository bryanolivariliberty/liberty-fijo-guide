// ═══════════════════════════════════════════════════════════════════════════
// VS CLARO (UAT) — Liberty Business vs Claro Empresas, SOHO fixed packages.
// Same idea as the Mobile tool's "vs T-Mobile" tab: an honest price table
// (data: VS_CLARO in js/data.js, from the Competitive Landscape slide, Oct 2026)
// plus where Liberty wins and what NOT to claim.
// ═══════════════════════════════════════════════════════════════════════════
function renderVsClaro(){
  const el = $('#pane-vsclaro'); if(!el) return;
  const es = lang==='es', mo = es?'/mes':'/mo';
  const cell = (v, note) => v==null ? '<span class="vs-na">—</span>' : `${fmt(v)}${note?` <small>(${note})</small>`:''}`;
  const verdict = r => {
    if(r.lib==null && r.claro==null) return `<span class="vs-chip na">${es?'Ninguno lo ofrece':'Neither offers it'}</span>`;
    if(r.lib==null) return `<span class="vs-chip na">${es?'Solo Claro':'Claro only'}</span>`;
    if(r.claro==null) return `<span class="vs-chip win">${es?'Solo Liberty':'Liberty only'}</span>`;
    const d = r.lib - r.claro;
    return d <= 0 ? `<span class="vs-chip win">${es?'Liberty':'Liberty'} ${fmt(-d)} ${es?'menos':'less'}</span>`
                  : `<span class="vs-chip lose">Claro ${fmt(d)} ${es?'menos':'less'}</span>`;
  };
  const wins = es ? [
    ['📡','Cobertura en más del 90% de la isla','En dos opciones de conectividad: HFC y FTTx. Pregunte la dirección y confirme servicio antes de cotizar.'],
    ['🏆','Ofertas líderes en 500 MB y 1 GB','En 3P (Internet + Video EDP + Telefonía) Liberty está por debajo de Claro en 500–600 MB y en 1 GB.'],
    ['🔗','FMC: más ahorro al combinar','Con un móvil B2B activo, el 2P baja a $60.99 (500 MB) y $62.99 (1 GB), y FMC Double Bandwidth duplica la velocidad.'],
    ['🛡️','Respaldo cuando más importa','Liberty Business Ongoing añade conectividad redundante donde el cliente tiene una conexión eléctrica alterna. Safety Connection incluye respaldo LTE con FortiExtender.']
  ] : [
    ['📡','Coverage over 90% of the island','On two connectivity options: HFC and FTTx. Ask for the address and confirm service before you quote.'],
    ['🏆','Leading offers at 500 MB and 1 GB','On 3P (Internet + EDP Video + Phone) Liberty is below Claro at 500–600 MB and at 1 GB.'],
    ['🔗','FMC: more savings when you combine','With an active B2B mobile line, 2P drops to $60.99 (500 MB) and $62.99 (1 GB), and FMC Double Bandwidth doubles the speed.'],
    ['🛡️','Backup when it matters most','Liberty Business Ongoing adds redundant connectivity where the customer has an alternate power connection. Safety Connection includes LTE backup with FortiExtender.']
  ];
  el.innerHTML = `
    <div class="page-head"><div class="page-head-left">
      <div class="page-head-eyebrow">vs Claro</div>
      <h1>${es?'Liberty Business vs Claro Empresas':'Liberty Business vs Claro Empresas'}</h1>
      <p>${es?'Liberty lidera en 500 MB y 1 GB, con la cobertura fija más amplia de la isla. Paquetes SOHO fijos por velocidad, precio mensual. Referencia: octubre 2026.'
             :'Liberty Business leads at 500 MB and 1 GB, on the island\u2019s widest fixed footprint. SOHO fixed packages by speed tier, monthly price. Reference: October 2026.'}</p>
    </div></div>

    <div class="vs-table-wrap"><table class="vs-table">
      <thead><tr>
        <th>${es?'Paquete / velocidad':'Package / speed'}</th>
        <th class="lib">Liberty Business</th>
        <th>Claro Empresas</th>
        <th>${es?'Diferencia':'Difference'}</th>
      </tr></thead>
      <tbody>${VS_CLARO.map(r=>`<tr>
        <td class="pkg">${es?r.es:r.en}</td>
        <td class="lib num">${cell(r.lib, r.libNote)}</td>
        <td class="num">${cell(r.claro, r.claroNote)}</td>
        <td>${verdict(r)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="vs-foot">${es?'Precios mensuales antes de impuestos. Liberty: ofertas SOHO (Nuestros Planes). Claro: panorama competitivo interno, octubre 2026 — confirme con la factura u oferta del cliente.'
                             :'Monthly prices before taxes. Liberty: SOHO offers (Our Plans). Claro: internal competitive landscape, October 2026 — confirm against the customer\u2019s bill or offer.'}</div>

    <h2 class="vs-h">${es?'Dónde gana Liberty':'Where Liberty wins'}</h2>
    <div class="vs-wins">${wins.map(w=>`<div class="vs-win"><i>${w[0]}</i><b>${w[1]}</b><p>${w[2]}</p></div>`).join('')}</div>

    <div class="vs-caution"><b>${es?'Precaución honesta':'Honest caution'}:</b> ${es
      ? 'En 2P (Internet + Telefonía) Claro está más bajo: $50.00 vs $67.99 en 500–600 MB y $55.00 vs $84.99 en 1 GB — incluso con FMC (60.99 / 62.99). No diga "más barato" en 2P. Hable de cobertura, 3P, FMC y respaldo, y deje que la comparación con la factura decida. Claro también tiene fibra hasta 1,000 megas en más de 730,000 hogares y comercios: no diga "más rápido" ni "Claro no tiene fibra".'
      : 'On 2P (Internet + Phone) Claro is lower: $50.00 vs $67.99 at 500–600 MB and $55.00 vs $84.99 at 1 GB — even with FMC (60.99 / 62.99). Don\u2019t say "cheaper" on 2P. Lead with coverage, 3P, FMC and backup, and let the bill comparison decide. Claro also has fiber up to 1,000 Mbps in 730,000+ homes and businesses: don\u2019t say "faster" or "Claro has no fiber".'}
      <div class="vs-src">${es?'Fuente sobre Claro':'Source on Claro'}: <a href="https://www.metro.pr/noticias/2026/05/26/claro-y-camara-de-comercio-del-sur-impulsaran-la-transformacion-digital-de-las-pymes/" target="_blank" rel="noopener">Metro Puerto Rico, 26 may 2026</a></div>
    </div>

    <div class="vs-actions">
      <button class="vs-btn" onclick="SELL.obj='offer';SELL.objHeard.offer=true;setTab('flow');flowGo(3)">${es?'Manejar la objeción "Claro me ofreció…" en el Flujo de Venta':'Handle "Claro offered me…" in the Sales Flow'} ${icon('arrow')}</button>
      <button class="vs-btn ghost" onclick="setTab('planes')">${es?'Ver las ofertas en Nuestros Planes':'See the offers in Our Plans'} ${icon('arrow')}</button>
    </div>`;
}
