// ═══════════════════════════════════════════════════════════════════════════
// SALES FLOW + HOW TO USE workflow
// Ported from the Business Mix Sales Tool (standalone HTML, build 202609181000).
// Content (discovery questions, values, AIM objections, pitch builder, close
// checklist) is carried over as-is. What changed for Fijo:
//   • The mobile Cart is replaced by the Fijo quote (state.prop / propGetTotal)
//   • Navigation targets point at Fijo tabs; mobile-only tabs are not linked
//   • Competitor price book, Libby (AI drawer) and device offers are not ported
// Everything renders inside a `.sf` wrapper so css/salesflow.css stays scoped.
// ═══════════════════════════════════════════════════════════════════════════

const SF_APB_DISCOUNT = 7;
const SF_CRED = {ultra:'$13.89', enhanced:'$8.33', essential:'$4.86'};

function sfEsc(str){ return String(str==null?'':str).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function sfEs(){ return lang==='es'; }

// ── Navigation: mobile-tool tab ids → Fijo equivalents ─────────────────────
// null = no Fijo equivalent, so the button is not shown.
const SF_NAV = {
  plans:'planes', cart:'proposal', proposal:'proposal', planes:'planes',
  addons:'addons', promos:'promos', vsclaro:'vsclaro',
  savings:'flow:2', discovery:'flow:1', objections:'flow:3',
  pricing:null, devices:null, vstmo:null, pricebook:null
};
function sfCanNav(tab){ return SF_NAV[tab] != null; }
function sellNav(tab){
  const dest = SF_NAV[tab]; if(!dest) return;
  if(dest.indexOf('flow:')===0){ setTab('flow'); flowGo(+dest.split(':')[1]); return; }
  if(dest==='proposal'){ sfCarryCustomer(); sfLandStep(); }
  setTab(dest);
  window.scrollTo({top:0});
}
// Brief ↔ Proposal customer. The brief writes through while the rep types; when
// the brief is empty it picks up whatever was typed in the Proposal.
function sfCarryCustomer(){
  if(typeof propInit==='function') propInit();
  if(!state.prop || !state.prop.customer) return;
  const c = state.prop.customer;
  if(SELL.cust.trim()) c.name = SELL.cust.trim(); else if(c.name) SELL.cust = c.name;
  if(SELL.company.trim()) c.company = SELL.company.trim(); else if(c.company) SELL.company = c.company;
}
// Open the Proposal on the first step that still needs input, so the rep lands
// where the Sales Flow left off (Extras once plan + price are set).
function sfLandStep(){
  const p = state.prop; if(!p) return;
  if(!p.tech) p.step = 0;
  else if(!p.speed) p.step = 1;
  else if(!p.bundle || sfNeedsVoice(p)) p.step = 2;
  else if(!p.priceType) p.step = 3;
  else if((p.step||0) < 4) p.step = 4;
}
function sfNeedsVoice(p){ return !!(p.bundle && (p.bundle==='p2' || p.bundle.indexOf('p3')===0) && !(p.voice && p.voice.included) && !(p.speed && (p.speed._voz1p||p.speed._vid2p||p.speed._biab))); }

// ── Fijo quote bridge (replaces the mobile cart) ───────────────────────────
function fijoQuote(){
  const p = state.prop;
  const empty = {ready:false, monthly:0, oneTime:0, name:'', items:[]};
  if(!p || !p.speed || !p.bundle || !p.priceType || sfNeedsVoice(p)) return empty;
  let monthly = 0, items = [], oneTime = 0;
  try{ monthly = propGetTotal(); }catch(e){ return empty; }
  try{ items = propGetItems(); }catch(e){}
  try{ oneTime = (propGetOneTimeFees()||[]).reduce((a,f)=>a+(+f.price||0),0); }catch(e){}
  try{ const cf = propContractFee(p); if(cf) oneTime += +cf || 0; }catch(e){}
  return {ready:true, monthly, oneTime, name: items[0] ? items[0].name : '', items};
}

// ══════════════════════════════════════════════════════════════════════════
// CONTENT — carried over verbatim from the Business Mix tool
// ══════════════════════════════════════════════════════════════════════════
const DISC = [
 { id:'fmc', en:'Liberty Mobile customer: add internet (FMC)', es:'Cliente con Móvil Liberty: añadir internet (FMC)',
   when:{en:'Already has Liberty B2B mobile lines; internet, voice or video is with another provider or missing.', es:'Ya tiene líneas móviles B2B de Liberty; internet, voz o video están con otro proveedor o no los tiene.'},
   listen:{en:'Their active B2B mobile line makes FMC available: double the internet speed. Lead with speed and one provider for everything.', es:'Su línea móvil B2B activa hace disponible FMC: el doble de velocidad de internet. Hable de velocidad y de un solo proveedor para todo.'},
   next:{en:'Mark "Liberty services today: Mobile" in the brief, then quote with the FMC technology in Build the offer.', es:'Marque "Servicios Liberty hoy: Móvil" en el resumen y cotice con la tecnología FMC en Armar la oferta.'},
   go:'savings'},
 { id:'existing', en:'Existing Liberty Business customer', es:'Cliente existente de Liberty Business',
   when:{en:'Already has Liberty Business service: adding services, upgrading speed or renewing.', es:'Ya tiene servicio de Liberty Business: añade servicios, sube de velocidad o renueva.'},
   listen:{en:'Start from their current services and when the contract ends. Renewals and service updates use 2026 Rate Increase pricing; without a renewed contract the price moves to List. If they have B2B mobile, check FMC Double Bandwidth.',
           es:'Empiece por sus servicios actuales y cuándo termina el contrato. Las renovaciones y actualizaciones usan precios del Rate Increase 2026; sin contrato renovado el precio pasa a Lista. Si tiene móvil B2B, revise FMC Double Bandwidth.'},
   next:{en:'Confirm their current services, quote the upgrade or renewal, and show the new monthly total vs. today.', es:'Confirme sus servicios actuales, cotice la mejora o renovación y muestre el nuevo total mensual vs. hoy.'},
   go:'plans'},
 { id:'new', en:'New business / startup', es:'Negocio nuevo / startup',
   when:{en:'Owner is opening or just opened; no business lines yet.', es:'El dueño abre o acaba de abrir; aún no tiene líneas de negocio.'},
   listen:{en:'Tight budget + own phones → SIMple Plan (new activations, own devices). Local-focused team → Mix Essential. Needs internet/voice at the site → add a Fixed quote (FMC).',
           es:'Presupuesto ajustado + equipos propios → Plan SIMple (activaciones nuevas). Equipo local → Mix Essential. Necesita internet/voz en el local → añada cotización Fija (FMC).'},
   next:{en:'Build a 1–3 line mobile quote, then ask about Internet/Voice at the location.', es:'Arme una cotización móvil de 1–3 líneas y luego pregunte por Internet/Voz en el local.'},
   go:'plans'},
 { id:'switch', en:'Switching from T-Mobile / Claro', es:'Cambio desde T-Mobile / Claro',
   when:{en:'Customer already has mobile service elsewhere.', es:'El cliente ya tiene servicio móvil con otro proveedor.'},
   listen:{en:`Heavy hotspot or travel → Mix Ultra (T-Mobile comparison favors Liberty on hotspot size, roaming and passport terms). Port-in of eligible non-BYOD lines earns credits (${SF_CRED.ultra} Ultra / ${SF_CRED.enhanced} Enhanced / ${SF_CRED.essential} Essential per line).`,
           es:`Mucho hotspot o viajes → Mix Ultra (la comparación con T-Mobile favorece a Liberty en hotspot, roaming y términos de pasaporte). El port-in de líneas elegibles (no BYOD) genera créditos (${SF_CRED.ultra} Ultra / ${SF_CRED.enhanced} Enhanced / ${SF_CRED.essential} Essential por línea).`},
   next:{en:'Get the latest bill, enter it in the Savings Calculator, and quote the same lines.', es:'Pida la factura más reciente, ingrésela en la Calculadora de Ahorros y cotice las mismas líneas.'},
   go:'savings'},
 { id:'team', en:'Growing team (3–10 lines)', es:'Equipo en crecimiento (3–10 líneas)',
   when:{en:'Several employees, adding people soon.', es:'Varios empleados, con planes de agregar más.'},
   listen:{en:'Growing teams with regional travel → Mix Enhanced. Remember: total mobile lines across ALL plans in the quote set the per-line price, so adding a line can lower every line\'s price.',
           es:'Equipos en crecimiento con viajes regionales → Mix Enhanced. Recuerde: el total de líneas móviles en TODOS los planes de la cotización define el precio por línea; agregar una línea puede bajar el precio de todas.'},
   next:{en:'Quote the full team, then show the next-tier line count in Pricing by Lines.', es:'Cotice todo el equipo y muestre el siguiente escalón en Precios por Líneas.'},
   go:'pricing'},
 { id:'office', en:'Office / storefront: Internet + Voice + Video', es:'Oficina / local: Internet + Voz + Video',
   when:{en:'Business site that depends on a fixed connection.', es:'Local de negocio que depende de una conexión fija.'},
   listen:{en:'Downtime pain + several services → bundle Fixed (Internet, Voice, Video) with Mobile (FMC) and show the combined monthly and annual savings.',
           es:'Dolor por caídas + varios servicios → combine Fijo (Internet, Voz, Video) con Móvil (FMC) y muestre el ahorro mensual y anual combinado.'},
   next:{en:'Capture the current bill by service in the Savings Calculator; quote Fixed and Mobile together.', es:'Registre la factura actual por servicio en la Calculadora de Ahorros; cotice Fijo y Móvil juntos.'},
   go:'savings'},
 { id:'field', en:'Field team: hotspot and data lines', es:'Equipo de campo: hotspot y líneas de datos',
   when:{en:'Crews, vehicles, tablets and laptops on the road.', es:'Cuadrillas, vehículos, tabletas y laptops en la calle.'},
   listen:{en:'Heavy hotspot → Mix Ultra (300GB vs 500GB in the T-Mobile comparison). Dedicated devices → On The Go, Data Advantage or the Unlimited Tablet plan. Quote the data-line surcharge up front.',
           es:'Mucho hotspot → Mix Ultra (300GB vs 500GB en la comparación con T-Mobile). Equipos dedicados → On The Go, Data Advantage o el plan de Tableta Ilimitada. Cotice el cargo por línea de datos desde el inicio.'},
   next:{en:'Quote phones and data lines in one cart so the surcharges are visible.', es:'Cotice teléfonos y líneas de datos en un solo carrito para que se vean los cargos.'},
   go:'devices'},
 { id:'travel', en:'Frequent traveler / owner abroad', es:'Viajero frecuente / dueño en el exterior',
   when:{en:'Owner or staff travel outside Puerto Rico.', es:'El dueño o el personal viaja fuera de Puerto Rico.'},
   listen:{en:'Mix Ultra: Roam Like Home covers USA/MEX/CAN plus 28 countries unlimited, and International Passport is capped at $100. T-Mobile\'s passport is $12/day with no cap.',
           es:'Mix Ultra: Roam Like Home cubre EE.UU./MEX/CAN más 28 países ilimitado, y el Pasaporte Internacional tiene tope de $100. El pasaporte de T-Mobile es $12/día sin tope.'},
   next:{en:'Quote Mix Ultra for the traveling lines; keep the rest on the plan that fits.', es:'Cotice Mix Ultra para las líneas que viajan; deje el resto en el plan adecuado.'},
   go:'vstmo'},
 { id:'solo', en:'Solo / home-based business', es:'Autónomo / negocio desde el hogar',
   when:{en:'One to three people working from home.', es:'Una a tres personas trabajando desde el hogar.'},
   listen:{en:'SIMple Plan suits tight budgets on own devices ($40 for 1 line, $30 each for 2, $25 each for 3, $20 each for 4+; new activations only). Bundle internet + mobile for convenience.',
           es:'El Plan SIMple sirve para presupuestos ajustados con equipo propio ($40 por 1 línea, $30 c/u por 2, $25 c/u por 3, $20 c/u por 4+; solo activaciones nuevas). Combine internet + móvil por conveniencia.'},
   next:{en:'Quote SIMple vs a Mix tier and let the customer choose.', es:'Cotice SIMple vs un plan Mix y deje que el cliente elija.'},
   go:'plans'},
 { id:'device', en:'Device refresh', es:'Renovación de equipos',
   when:{en:'Phones are old or breaking; upgrade is the trigger.', es:'Los teléfonos están viejos o dañados; el motivo es el equipo.'},
   listen:{en:'Check Devices + Offers for current offers and trade-in tables per plan; offers with a passed expiration date disappear automatically.',
           es:'Revise Equipos + Ofertas para las ofertas vigentes y las tablas de trade-in por plan; las ofertas vencidas desaparecen automáticamente.'},
   next:{en:'Add the device and offer to the cart and show the monthly total.', es:'Agregue el equipo y la oferta al carrito y muestre el total mensual.'},
   go:'devices'},
];

const VALUE_QS = {
 en:[
  'What matters most to you in a business phone and internet provider?',
  'Tell me about a time your communications let you down. What did it cost the business?',
  'If you could change one thing about your current setup, what would it be?',
  'What would a great provider do for you that nobody has done yet?'],
 es:[
  '¿Qué es lo más importante para usted en un proveedor de telefonía e internet para su negocio?',
  'Cuénteme de una vez que sus comunicaciones le fallaron. ¿Qué le costó al negocio?',
  'Si pudiera cambiar una sola cosa de lo que tiene hoy, ¿qué sería?',
  '¿Qué haría un gran proveedor por usted que nadie ha hecho todavía?']
};
const DISC_QS = {
 existing:{en:[
  'What has been working well with your Liberty service, and what would you change?',
  'How has the business changed since you signed up: more people, locations or services?',
  'Which services are due for an upgrade or renewal, and when does your contract end?',
  'What is the one thing that, if it improved, would make the biggest difference day to day?',
  'How do you review your monthly communications costs today?',
  'If we adjust your account today, what would you need to see to move forward?'],
  es:[
  '¿Qué le ha funcionado bien de su servicio con Liberty y qué cambiaría?',
  '¿Cómo ha cambiado el negocio desde que se suscribió: más personas, locales o servicios?',
  '¿Qué servicios están listos para mejorar o renovar, y cuándo termina su contrato?',
  '¿Qué es lo que, si mejorara, haría la mayor diferencia en el día a día?',
  '¿Cómo revisa hoy sus costos mensuales de comunicaciones?',
  'Si ajustamos su cuenta hoy, ¿qué necesitaría ver para seguir adelante?']},
 new:{en:[
  'Tell me about the business and what a typical day looks like for the people who will be on the phone.',
  'How will customers reach you, and what do you want that experience to feel like for them?',
  'What does being reachable and professional from day one mean for your growth?',
  'How are you thinking about communications costs while you get established?',
  'What would you need to see in the first 90 days to feel you made the right choice?',
  'Walk me through your timeline: what has to be working, and by when?'],
  es:[
  'Cuénteme del negocio y cómo es un día típico para las personas que van a usar el teléfono.',
  '¿Cómo van a comunicarse los clientes con usted y cómo quiere que sea esa experiencia para ellos?',
  '¿Qué significa para su crecimiento estar localizable y verse profesional desde el primer día?',
  '¿Cómo está pensando en los costos de comunicación mientras se establece?',
  '¿Qué necesitaría ver en los primeros 90 días para sentir que tomó la decisión correcta?',
  'Explíqueme su calendario: ¿qué tiene que estar funcionando y para cuándo?']},
 switch:{en:[
  'What led you to look at other options now?',
  'What is working well with your current provider, and what frustrates you?',
  'Walk me through what you pay each month and what is included in that.',
  'Where does your team depend most on the network, and what happens when it lets them down?',
  'How do you use data, hotspot or travel today, and what does that cost you?',
  'What would make switching feel easy and worth it for you?'],
  es:[
  '¿Qué le llevó a mirar otras opciones ahora?',
  '¿Qué funciona bien con su proveedor actual y qué le frustra?',
  'Explíqueme lo que paga cada mes y qué incluye.',
  '¿Dónde depende más su equipo de la red y qué pasa cuando les falla?',
  '¿Cómo usan datos, hotspot o viajes hoy y cuánto les cuesta?',
  '¿Qué haría que cambiar se sintiera fácil y valiera la pena para usted?']},
 team:{en:[
  'How is the team changing over the next year, and how does communications need to keep up?',
  'Tell me how different people on the team use their phones. Who needs the most from them?',
  'What does managing the lines and the bill look like today, and what would you simplify?',
  'How do you decide when to replace or upgrade phones for the team?',
  'What would your ideal setup look like if cost and convenience were both solved?'],
  es:[
  '¿Cómo va a cambiar el equipo en el próximo año y qué necesitan sus comunicaciones para acompañarlo?',
  'Cuénteme cómo usa el teléfono cada persona del equipo. ¿Quién necesita más de él?',
  '¿Cómo es hoy manejar las líneas y la factura y qué simplificaría?',
  '¿Cómo decide cuándo reemplazar o actualizar los teléfonos del equipo?',
  '¿Cómo sería su configuración ideal si el costo y la comodidad estuvieran resueltos?']},
 office:{en:[
  'Walk me through how the business depends on its internet and phones during a normal day.',
  'What happens to customers and revenue when the connection goes down?',
  'How do your customers and staff use the Wi-Fi, TV or the main phone line?',
  'What would one provider for internet, voice and mobile make easier for you?',
  'How do you feel about what you pay across all your services today?',
  'What do you want from support when something breaks?'],
  es:[
  'Explíqueme cómo depende el negocio de su internet y sus teléfonos en un día normal.',
  '¿Qué pasa con los clientes y los ingresos cuando se cae la conexión?',
  '¿Cómo usan sus clientes y empleados el Wi-Fi, la televisión o la línea principal?',
  '¿Qué le facilitaría tener un solo proveedor para internet, voz y móvil?',
  '¿Cómo se siente con lo que paga hoy por todos sus servicios?',
  '¿Qué espera del soporte cuando algo falla?']},
 field:{en:[
  'Tell me what your crews do on their devices throughout the day.',
  'Where do you lose time or money because of connectivity in the field?',
  'How do people get laptops and tablets connected today, and how well does it work?',
  'What would reliable connectivity let your team do that they cannot do now?',
  'How do you keep track of vehicles, equipment or jobs?'],
  es:[
  'Cuénteme qué hacen sus cuadrillas en sus equipos durante el día.',
  '¿Dónde pierden tiempo o dinero por problemas de conectividad en el campo?',
  '¿Cómo conectan hoy las laptops y tabletas y qué tan bien funciona?',
  '¿Qué podría hacer su equipo con conectividad confiable que hoy no puede?',
  '¿Cómo da seguimiento a vehículos, equipos o trabajos?']},
 travel:{en:[
  'Tell me about your travel: where, how often, and what you need to get done while away.',
  'What has your experience been staying connected abroad, and what did it cost?',
  'How important is it that you and your team are reachable anywhere?',
  'What would worry-free connectivity on a trip be worth to you?'],
  es:[
  'Cuénteme de sus viajes: adónde, con qué frecuencia y qué necesita resolver mientras está fuera.',
  '¿Cómo ha sido su experiencia para mantenerse conectado en el exterior y cuánto le costó?',
  '¿Qué tan importante es que usted y su equipo estén localizables en cualquier lugar?',
  '¿Cuánto valdría para usted tener conectividad sin preocupaciones en un viaje?']},
 solo:{en:[
  'Describe your workday: where you work and which calls and tools you rely on.',
  'How do your home internet and phone support the business today?',
  'How do you keep business and personal communication separate, and how well does that work?',
  'What would make you look more professional to your customers?',
  'What would you do with the time or money if communications were simpler?'],
  es:[
  'Descríbame su día de trabajo: dónde trabaja y qué llamadas y herramientas usa.',
  '¿Cómo apoyan hoy su internet y su teléfono del hogar al negocio?',
  '¿Cómo separa la comunicación personal de la del negocio y qué tan bien funciona?',
  '¿Qué le ayudaría a verse más profesional ante sus clientes?',
  '¿Qué haría con el tiempo o el dinero si las comunicaciones fueran más simples?']},
 device:{en:[
  'Tell me about the devices your team uses and how they are holding up.',
  'How does a slow or broken phone affect the team\'s day?',
  'How do you handle upgrades today, and what would make that easier?',
  'What would you do with the value of your old phones if you could put it toward new ones?'],
  es:[
  'Cuénteme de los equipos que usa su equipo y cómo están funcionando.',
  '¿Cómo afecta el día del equipo un teléfono lento o dañado?',
  '¿Cómo manejan hoy las actualizaciones y qué las haría más fáciles?',
  '¿Qué haría con el valor de sus teléfonos viejos si pudiera usarlo para los nuevos?']}
};
DISC_QS.fmc = {en:[
  'How is the internet at your location working for the team today?',
  'Who provides your internet, phone and TV today, and what do you pay each month?',
  'What would double the internet speed change for the business?',
  'What would one provider for mobile and internet make easier for you?'],
 es:[
  '¿Cómo le funciona hoy el internet del local a su equipo?',
  '¿Quién le da hoy internet, teléfono y TV, y cuánto paga al mes?',
  '¿Qué cambiaría para el negocio tener el doble de velocidad de internet?',
  '¿Qué le facilitaría tener un solo proveedor para móvil e internet?']};
DISC.forEach(d=>{ d.qs = DISC_QS[d.id]; });

const VALUES = [
 {id:'cost',  en:'Cost control', es:'Control de costos',
  en2:'Lead with the monthly total, not the line price: $7/line AutoPay + Paperless discount, port-in credits on eligible lines, and the Savings Calculator with their real bill.',
  es2:'Hable del total mensual, no del precio por línea: $7/línea con AutoPago + Factura Electrónica, créditos port-in en líneas elegibles y la Calculadora de Ahorros con su factura real.'},
 {id:'reliab',en:'Reliability / coverage', es:'Confiabilidad / cobertura',
  en2:'Ask for their five key locations and verify coverage before they commit; suggest starting with a few lines to test. Never claim coverage you have not verified.',
  es2:'Pida sus cinco ubicaciones clave y verifique la cobertura antes de que se comprometan; sugiera empezar con unas pocas líneas para probar. Nunca afirme cobertura que no haya verificado.'},
 {id:'support',en:'Support and a person who owns it', es:'Soporte y alguien responsable',
  en2:'Ask who they call today when something breaks, then commit only to what you will personally own: follow-up dates, a clear next step, and a named contact on your side.',
  es2:'Pregunte a quién llaman hoy cuando algo falla y comprométase solo con lo que usted atenderá personalmente: fechas de seguimiento, un próximo paso claro y un contacto con nombre de su lado.'},
 {id:'simple',en:'Simplicity / one provider', es:'Simplicidad / un solo proveedor',
  en2:'Position fixed + mobile together (FMC): one relationship and one view of the account. Quote Mobile in the Cart and Internet/Voice/Video in the Savings Calculator.',
  es2:'Posicione fijo + móvil juntos (FMC): una relación y una vista de la cuenta. Cotice Móvil en el Carrito e Internet/Voz/Video en la Calculadora de Ahorros.'},
 {id:'growth',en:'Room to grow', es:'Espacio para crecer',
  en2:'Total mobile lines across ALL plans set the per-line price, so adding lines can lower every line\'s price. Show the next tier in Pricing by Lines.',
  es2:'El total de líneas móviles en TODOS los planes define el precio por línea, así que agregar líneas puede bajar el precio de todas. Muestre el siguiente escalón en Precios por Líneas.'},
 {id:'travel',en:'Staying connected on the move', es:'Conectividad en movimiento',
  en2:'Mix Ultra: hotspot 500GB, Roam Like Home in USA/MEX/CAN + 28 countries, International Passport capped at $100 (see vs T-Mobile).',
  es2:'Mix Ultra: hotspot de 500GB, Roam Like Home en EE.UU./MEX/CAN + 28 países, Pasaporte Internacional con tope de $100 (vea vs T-Mobile).'},
 {id:'devices',en:'Good, current devices', es:'Buenos equipos actuales',
  en2:'Open Devices + Offers: current offers and trade-in credits by plan. Show the monthly total with the offer applied.',
  es2:'Abra Equipos + Ofertas: ofertas vigentes y créditos de trade-in por plan. Muestre el total mensual con la oferta aplicada.'},
];

const FOLLOWUPS = {
 en:[
  'Tell me more about that.',
  'Why is that important to you?',
  'What does that cost you today, in time or money?',
  'What have you tried so far, and what happened?',
  'If that were solved, what would change for the business?',
  'Who else is involved in this decision, and what matters to them?'],
 es:[
  'Cuénteme más sobre eso.',
  '¿Por qué es importante para usted?',
  '¿Qué le cuesta eso hoy, en tiempo o en dinero?',
  '¿Qué ha intentado hasta ahora y qué pasó?',
  'Si eso se resolviera, ¿qué cambiaría para el negocio?',
  '¿Quién más participa en esta decisión y qué le importa a esa persona?']
};
const VALUE_FQ = {
 cost:{en:['What would you do with the money you save each month?','How much of your current bill do you feel is not giving you value?','Are there fees or charges on your bill that surprise you?'],
       es:['¿Qué haría con el dinero que ahorre cada mes?','¿Qué parte de su factura actual siente que no le da valor?','¿Hay cargos en su factura que le sorprendan?']},
 reliab:{en:['Where specifically does the signal or service fail you?','When it fails, what is the impact on customers or revenue?','What would "reliable" look like to you in numbers, such as fewer dropped calls or less downtime?'],
         es:['¿Dónde específicamente le falla la señal o el servicio?','Cuando falla, ¿cuál es el impacto en clientes o ingresos?','¿Cómo se vería "confiable" para usted en números, como menos llamadas caídas o menos tiempo sin servicio?']},
 support:{en:['Tell me about the last time you needed help. How did it go?','How long did it take to get it resolved, and how did that affect your day?','What would excellent support look like for you?'],
          es:['Cuénteme de la última vez que necesitó ayuda. ¿Cómo le fue?','¿Cuánto tardó en resolverse y cómo afectó su día?','¿Cómo sería un soporte excelente para usted?']},
 simple:{en:['How many different providers and bills do you manage today?','How much time do you or your team spend on it each month?','What would it mean to have it all in one place?'],
         es:['¿Cuántos proveedores y facturas diferentes maneja hoy?','¿Cuánto tiempo dedican usted o su equipo a eso cada mes?','¿Qué significaría tenerlo todo en un solo lugar?']},
 growth:{en:['How many people do you expect to add in the next 12 months?','What would make adding a line or location easier for you?','How do you plan for communications costs as you grow?'],
         es:['¿Cuántas personas espera agregar en los próximos 12 meses?','¿Qué le haría más fácil agregar una línea o una sucursal?','¿Cómo planifica los costos de comunicación a medida que crece?']},
 travel:{en:['What happens when you or your team lose connection while traveling?','What do you pay today when you are away?','Which trips matter most for the business?'],
         es:['¿Qué pasa cuando usted o su equipo pierden la conexión de viaje?','¿Cuánto paga hoy cuando está fuera?','¿Cuáles viajes son más importantes para el negocio?']},
 devices:{en:['How do older or slower devices affect the team day to day?','What features do you wish your devices had?','How would new devices change how the team works?'],
          es:['¿Cómo afectan los equipos viejos o lentos el día a día del equipo?','¿Qué funciones le gustaría que tuvieran sus equipos?','¿Cómo cambiarían los equipos nuevos la forma de trabajar del equipo?']}
};

const OBJ = [
 { id:'price', en:'"It\'s too expensive" / price-conscious', es:'"Es muy caro" / sensible al precio',
   A:{en:'I hear you. When you run a business, every dollar counts, and you should not pay for something you do not use.',
      es:'Lo entiendo. Cuando maneja un negocio cada dólar cuenta y no debería pagar por algo que no usa.'},
   I:{en:`Let me show you the total, not just the line price. You get $${SF_APB_DISCOUNT} off per line with AutoPay and Paperless Bill, and eligible port-in lines earn up to ${SF_CRED.ultra}/line on Ultra, ${SF_CRED.enhanced} on Enhanced, ${SF_CRED.essential} on Essential. If budget is the priority, the SIMple Plan runs $20 per line at 4 or more lines on your own devices. Tell me what you pay now and I will compare it line by line.`,
      es:`Permítame mostrarle el total, no solo el precio por línea. Tiene $${SF_APB_DISCOUNT} menos por línea con AutoPago y Factura Electrónica, y las líneas elegibles con port-in ganan hasta ${SF_CRED.ultra}/línea en Ultra, ${SF_CRED.enhanced} en Enhanced y ${SF_CRED.essential} en Essential. Si el presupuesto es la prioridad, el Plan SIMple cuesta $20 por línea con 4 o más líneas en equipos propios. Dígame cuánto paga ahora y lo comparo línea por línea.`},
   M:{en:'Let us put your current bill in the calculator right now. If the monthly and annual numbers work, I can start the port-in today. Which lines should we begin with?',
      es:'Pongamos su factura actual en la calculadora ahora mismo. Si los números mensuales y anuales le convienen, comienzo el port-in hoy. ¿Con qué líneas empezamos?'},
   note:{en:'Honest caution: in the vs T-Mobile tab, from 3 lines up Liberty\'s per-line list price is equal to or higher than T-Mobile\'s on every tier shown. Do not claim "cheaper" at 3+ lines. Lead with credits, included value and the exact total, and let the calculator decide. BYOD lines are not eligible for port-in credits.',
         es:'Precaución: en la pestaña vs T-Mobile, desde 3 líneas el precio de lista por línea de Liberty es igual o mayor que el de T-Mobile en todos los niveles. No diga "más barato" con 3+ líneas. Hable de créditos, valor incluido y el total exacto, y deje que decida la calculadora. Las líneas BYOD no son elegibles para créditos port-in.'},
   go:'savings'},
 { id:'happy', en:'"I\'m happy with my current provider"', es:'"Estoy contento con mi proveedor actual"',
   A:{en:'That is great to hear, and it tells me you care about reliable service for your business. I am not asking you to be unhappy.',
      es:'Me alegra escucharlo y me dice que le importa un servicio confiable para su negocio. No le pido que esté descontento.'},
   I:{en:'What I can do is show you what you might be missing at no risk. Compared with T-Mobile, Liberty includes a larger hotspot allowance (500GB vs 300GB), Roam Like Home in 28 more countries, a capped International Passport, and port-in credits. If your current plan already covers everything you need, you will know in ten minutes.',
      es:'Lo que puedo hacer es mostrarle sin riesgo lo que quizás se está perdiendo. Comparado con T-Mobile, Liberty incluye más hotspot (500GB vs 300GB), Roam Like Home en 28 países más, un Pasaporte Internacional con tope y créditos por port-in. Si su plan actual ya cubre todo lo que necesita, lo sabrá en diez minutos.'},
   M:{en:'If I run a side-by-side with your latest bill and it does not beat what you have, you keep your provider. Can you send me the bill or read me the total so we can run it now?',
      es:'Si hago una comparación con su factura más reciente y no supera lo que tiene, usted se queda con su proveedor. ¿Me envía la factura o me dice el total para correrla ahora?'},
   note:{en:'Ask what they like before comparing. Never disparage the current provider; let the side-by-side do the work.', es:'Pregunte qué les gusta antes de comparar. Nunca hable mal del proveedor actual; deje que la comparación hable.'},
   go:'vstmo'},
 { id:'device', en:'"I still owe on my phones"', es:'"Todavía debo mis teléfonos"',
   A:{en:'That is a fair concern. Nobody wants to pay twice for the same phone.',
      es:'Es una preocupación válida. Nadie quiere pagar dos veces por el mismo teléfono.'},
   I:{en:'Let us get the exact balance per phone, then check current Liberty device offers and trade-in credits against it. I cannot promise a payoff, so I will show you real numbers, line by line, before you decide anything.',
      es:'Obtengamos el balance exacto de cada teléfono y comparemos con las ofertas de equipos y créditos de trade-in vigentes de Liberty. No puedo prometer un pago del balance, así que le muestro números reales, línea por línea, antes de que decida.'},
   M:{en:'Which phone has the highest balance? Let us start there and see what the offers and trade-in do to your monthly total.',
      es:'¿Cuál teléfono tiene el balance más alto? Empecemos por ese y veamos qué hacen las ofertas y el trade-in con su total mensual.'},
   note:{en:'Offers and trade-in values live in Devices + Offers. Verify the balance with the current provider; do not promise buyouts.', es:'Las ofertas y los trade-in están en Equipos + Ofertas. Verifique el balance con el proveedor actual; no prometa pagos de balance.'},
   go:'devices'},
 { id:'coverage', en:'"I\'m worried about coverage"', es:'"Me preocupa la cobertura"',
   A:{en:'Coverage is the first thing that matters. A cheaper bill is worthless if your team cannot get a signal.',
      es:'La cobertura es lo primero. Una factura más barata no sirve si su equipo no tiene señal.'},
   I:{en:'Tell me the five places where you and your team must have service: the office, key customer sites, the routes you drive, where you travel. I will verify coverage at those locations before you commit.',
      es:'Dígame los cinco lugares donde usted y su equipo necesitan servicio: la oficina, clientes clave, sus rutas, los lugares a donde viaja. Verifico la cobertura en esos sitios antes de que se comprometa.'},
   M:{en:'Give me those addresses now and I will check them while we talk. If they all check out, shall we start with a couple of lines to test?',
      es:'Deme esas direcciones ahora y las verifico mientras hablamos. Si todas salen bien, ¿empezamos con un par de líneas para probar?'},
   note:{en:'No coverage data is loaded in this tool. Do not claim coverage you have not verified with the official coverage resources.', es:'Esta herramienta no tiene datos de cobertura. No afirme cobertura que no haya verificado con los recursos oficiales.'},
   go:'discovery'},
 { id:'hassle', en:'"Switching is a hassle"', es:'"Cambiar es una molestia"',
   A:{en:'Absolutely understandable. You cannot afford downtime or lost numbers while running a business.',
      es:'Es totalmente comprensible. No puede permitirse caídas ni perder números mientras maneja un negocio.'},
   I:{en:'We port your existing numbers, so your customers keep calling the same lines. I will walk you through the order and the steps, and we can move lines in stages instead of all at once.',
      es:'Portamos sus números actuales, así sus clientes siguen llamando a las mismas líneas. Le explico el orden y los pasos, y podemos mover las líneas por etapas en vez de todas a la vez.'},
   M:{en:'Which three lines matter most? We start there, and I stay on until they are active.',
      es:'¿Cuáles tres líneas son las más importantes? Empezamos ahí y me quedo hasta que estén activas.'},
   note:{en:'Port-in credits apply to eligible non-BYOD lines only. Confirm the port-in process and timing with your internal checklist before promising dates.', es:'Los créditos port-in aplican solo a líneas elegibles no BYOD. Confirme el proceso y los tiempos de port-in con su lista interna antes de prometer fechas.'},
   go:'cart'},
 { id:'think', en:'"I need to think about it"', es:'"Necesito pensarlo"',
   A:{en:'Of course. This is an important decision for your business and you should not rush it.',
      es:'Claro. Es una decisión importante para su negocio y no debe apresurarla.'},
   I:{en:'To help you decide, what is the main thing you want to think over: price, coverage, timing or something else? I will put the quote in writing so you can review it with your partner.',
      es:'Para ayudarle a decidir, ¿qué es lo principal que quiere pensar: precio, cobertura, tiempo u otra cosa? Le dejo la cotización por escrito para que la revise con su socio.'},
   M:{en:'Let us set a specific time to talk again: would Thursday at 10 work? I will have the updated numbers ready.',
      es:'Fijemos una hora concreta para hablar de nuevo: ¿le parece el jueves a las 10? Tendré los números actualizados.'},
   note:{en:'Always leave with a dated next step. Use Generate Proposal in the Cart to give them the numbers in writing.', es:'Siempre salga con un siguiente paso con fecha. Use Generar Propuesta en el Carrito para darles los números por escrito.'},
   go:'cart'},
 { id:'offer', en:'"T-Mobile / Claro offered me a deal"', es:'"T-Mobile / Claro me hizo una oferta"',
   A:{en:'Good that you are comparing. A strong offer deserves a real look.',
      es:'Qué bueno que compara. Una buena oferta merece una revisión seria.'},
   I:{en:'Let us look at that offer in full: the price per line after taxes and fees, how long the promotion lasts, what happens to the price afterwards, and what is included for hotspot, roaming and business priority. Then we put Liberty beside it, including credits for eligible port-in lines.',
      es:'Revisemos esa oferta completa: el precio por línea con impuestos y cargos, cuánto dura la promoción, qué pasa con el precio después y qué incluye de hotspot, roaming y prioridad de negocio. Luego ponemos a Liberty al lado, incluyendo los créditos por líneas elegibles con port-in.'},
   M:{en:'Can you share the offer terms? I will run both side by side right now, and you pick the better deal.',
      es:'¿Me comparte los términos de la oferta? Corro ambas lado a lado ahora mismo y usted escoge la mejor.'},
   note:{en:'Verified comparison data is loaded for T-Mobile only. For Claro, ask for the bill and offer terms; do not quote Claro specifics you have not verified.', es:'Solo hay datos verificados de T-Mobile. Para Claro, pida la factura y los términos de la oferta; no cite datos de Claro que no haya verificado.'},
   go:'savings'},
 { id:'decider', en:'"I need to ask my partner / accountant"', es:'"Tengo que consultarlo con mi socio / contador"',
   A:{en:'That makes sense. Big decisions are better when everyone is aligned.',
      es:'Tiene sentido. Las decisiones grandes son mejores cuando todos están de acuerdo.'},
   I:{en:'I can send a clear one-page summary with the monthly and annual numbers, and I am glad to join a short call so they can ask me directly. What will they want to see most?',
      es:'Puedo enviarle un resumen claro de una página con los números mensuales y anuales, y con gusto me uno a una llamada corta para que me pregunten directamente. ¿Qué querrán ver principalmente?'},
   M:{en:'When can the three of us talk for 15 minutes? I will book it now and have the quote ready.',
      es:'¿Cuándo podemos hablar los tres durante 15 minutos? Lo agendo ahora y tendré la cotización lista.'},
   note:{en:'Use the Savings Calculator summary: it is built to be pasted into an email.', es:'Use el resumen de la Calculadora de Ahorros: está hecho para pegarse en un correo.'},
   go:'savings'},
];

const VALUE_SAY = {
 cost:{en:'you will see the exact total, line by line, with no surprises',es:'usted verá el total exacto, línea por línea, sin sorpresas'},
 reliab:{en:'before you commit I will verify coverage at your key locations, and we can start with a few lines to test',es:'antes de que se comprometa verifico la cobertura en sus ubicaciones clave y podemos empezar con unas pocas líneas para probar'},
 support:{en:'I will personally own the follow-up and give you a clear next step with a date',es:'yo me encargo personalmente del seguimiento y le doy un próximo paso claro con fecha'},
 simple:{en:'it is one provider and one relationship instead of several',es:'es un solo proveedor y una sola relación en vez de varias'},
 growth:{en:'as you add lines, the per-line price can come down',es:'a medida que agrega líneas, el precio por línea puede bajar'},
 travel:{en:'Mix Ultra includes Roam Like Home in the US, Mexico, Canada and 28 more countries, with a capped international passport',es:'Mix Ultra incluye Roam Like Home en EE.UU., México, Canadá y 28 países más, con un pasaporte internacional con tope'},
 devices:{en:'we can look at current device offers and the trade-in value of your old phones',es:'podemos revisar las ofertas de equipos vigentes y el valor de trade-in de sus teléfonos viejos'}
};
const VALUE_LABEL = {
 cost:{en:'keeping your costs under control',es:'mantener sus costos bajo control'},
 reliab:{en:'reliability',es:'la confiabilidad'},
 support:{en:'having someone who owns the follow-up',es:'tener a alguien responsable del seguimiento'},
 simple:{en:'keeping it simple with one provider',es:'mantenerlo simple con un solo proveedor'},
 growth:{en:'room to grow',es:'espacio para crecer'},
 travel:{en:'staying connected when you travel',es:'mantenerse conectado cuando viaja'},
 devices:{en:'good, current devices',es:'buenos equipos actuales'}
};

const FLOW_STEPS = [
  {n:1, en:'Discover', es:'Descubrir', subEn:'What matters to them', subEs:'Lo que les importa',
   tipEn:'Listen first. Ask open questions, capture their words in the brief, and tap the values you hear.',
   tipEs:'Escuche primero. Haga preguntas abiertas, anote sus palabras en el resumen y marque los valores que escuche.'},
  {n:2, en:'Build the offer', es:'Armar la oferta', subEn:'FMC or standalone, built on cost', subEs:'FMC o independiente, basada en costo',
   tipEn:'Anchor on cost, pick FMC or a standalone offer, then play it back starting with "Based on what you shared".',
   tipEs:'Ancle en el costo, escoja FMC u oferta independiente y repítala empezando con "Basado en lo que usted me compartió".'},
  {n:3, en:'Handle objections', es:'Manejar objeciones', subEn:'Acknowledge, Inform, Move on', subEs:'Reconozca, Informe, Avance',
   tipEn:'Tap what you just heard. Say the A, then the I, then move on to the close.',
   tipEs:'Toque lo que acaba de escuchar. Diga la A, luego la I y avance al cierre.'},
  {n:4, en:'Close', es:'Cerrar', subEn:'Move ahead with the savings', subEs:'Avance con el ahorro',
   tipEn:'Assume the sale. Confirm the details, set the date, and send the proposal.',
   tipEs:'Asuma la venta. Confirme los detalles, fije la fecha y envíe la propuesta.'}
];

// ══════════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════════
const SELL = { disc:'new', obj:'price', asked:{}, vals:{}, objHeard:{}, discOpen:true, pitchType:'auto',
  need:'', step:1, cust:'', company:'', addr:'', notes:'', fmcCredit:'', closeChk:{}, nextStep:'', briefOpen:false, libSvc:'', partner:null };

// Cost table: customer's current bill vs Liberty, by service (rep-entered).
const SAV_ROWS = [
  {k:'mobile',   en:'Mobile',   es:'Móvil'},
  {k:'internet', en:'Internet', es:'Internet'},
  {k:'phone',    en:'Phone',    es:'Teléfono'},
  {k:'video',    en:'Video',    es:'Video'},
  {k:'other',    en:'Other / fees', es:'Otros / cargos'},
];
// fromQuote = the Liberty fixed price follows the Proposal live (default). Typing
// over the Internet price switches it off until the rep re-syncs.
const sav = { cur:{}, lib:{}, fromQuote:true };
// UAT: the Cart is split by service — Internet = the plan (bundle), Phone = extra voice
// lines + voice add-ons, Video = STBs/outlets/video add-ons, Other = equipment and
// the remaining add-ons (whatever is left of the Cart's monthly total).
function sfSplitQuote(q){
  let internet = 0, phone = 0, video = 0;
  (q.items||[]).forEach((it,i)=>{
    const pr = +it.price || 0;
    if(i===0){ internet += pr; return; }
    const txt = (it.name||'')+' '+(it.desc||'');
    if(/\bstb\b|outlet|fox|ultimate|video|deportes/i.test(txt)) video += pr;
    else if(/voip|voice|\bvoz\b|l[ií]nea|\bline\b|hunting|voicemail|buz[oó]n/i.test(txt)) phone += pr;
  });
  let other = q.monthly - internet - phone - video;
  if(Math.abs(other) < 0.005) other = 0;
  return {internet, phone, video, other};
}
function sfSyncQuote(){
  if(!sav.fromQuote) return;
  const q = fijoQuote();
  if(q.ready){
    const b = sfSplitQuote(q), f = v => v ? v.toFixed(2) : '';
    sav.lib.internet = b.internet.toFixed(2); sav.lib.phone = f(b.phone); sav.lib.video = f(b.video); sav.lib.other = f(b.other);
  } else { sav.lib.internet = ''; sav.lib.phone = ''; sav.lib.video = ''; sav.lib.other = ''; }
}
function savNum(v){ const n = parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:0; }
function savMoney(n){ const a=Math.abs(n); return (n<0?'-':'')+'$'+a.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function savTotals(){
  let cur=0, lib=0;
  const rows = SAV_ROWS.map(r=>{ const c = savNum(sav.cur[r.k]), l = savNum(sav.lib[r.k]); cur+=c; lib+=l; return {k:r.k, c, l, d:c-l}; });
  const monthly = cur-lib;
  return { rows, cur, lib, monthly, annual:monthly*12, threeYr:monthly*36, pct: cur>0 ? (monthly/cur)*100 : 0 };
}
function savInput(group,k){
  const incl = group==='lib' && sav.fromQuote && fijoQuote().ready && (k==='phone'||k==='video');
  return `<input type="text" inputmode="decimal" placeholder="${incl?(sfEs()?'Incl.':'Incl.'):'0.00'}" value="${sfEsc(sav[group][k]||'')}" oninput="savSet('${group}','${k}',this.value)" aria-label="${group} ${k}" class="sf-money">`;
}
function savSet(group,k,v){
  sav[group][k]=v;
  if(group==='lib' && k!=='mobile') sav.fromQuote = false;
  flowUpdateOffer();
}

// ══════════════════════════════════════════════════════════════════════════
// DISCOVERY (embedded in step 1)
// ══════════════════════════════════════════════════════════════════════════
function discCounts(){
  const L = sfEs()?'es':'en', sc = DISC.find(d=>d.id===SELL.disc)||DISC[0];
  const vq = VALUE_QS[L], sq = sc.qs[L];
  return { done: vq.filter((_,i)=>SELL.asked['v'+i]).length + sq.filter((_,i)=>SELL.asked[sc.id+i]).length, total: vq.length+sq.length, sc };
}
function discBadgeText(){ const c=discCounts(); return c.done+'/'+c.total+' '+(sfEs()?'preguntas hechas':'questions asked'); }
function discRefresh(){
  const b = document.getElementById('flowDiscBody'); if(b) b.innerHTML = discoveryHtml();
  const g = document.getElementById('flowDiscBadge'); if(g) g.textContent = discBadgeText();
  drLive();
}
function discoveryHtml(){
  const es = sfEs(), L = es?'es':'en';
  const sc = DISC.find(d=>d.id===SELL.disc) || DISC[0];
  const chips = DISC.map(d=>`<button class="chip ${d.id===sc.id?'active':''}" onclick="SELL.disc='${d.id}';discRefresh()">${es?d.es:d.en}</button>`).join('');
  const goLbl = {plans:es?'Ver Planes':'See Plans', savings:es?'Ir a la oferta (costo)':'Go to the offer (cost)', cart:es?'Ir a Cotización':'Go to Quote'};
  const qrow = (key,q)=>`<label class="q-row"><input type="checkbox" ${SELL.asked[key]?'checked':''} onchange="SELL.asked['${key}']=this.checked;discRefresh()"><span>${sfEsc(q)}</span></label>`;
  const vq = VALUE_QS[L], sq = sc.qs[L];
  const vDone = vq.filter((_,i)=>SELL.asked['v'+i]).length, sDone = sq.filter((_,i)=>SELL.asked[sc.id+i]).length;
  const picked = VALUES.filter(v=>SELL.vals[v.id]);
  const valChips = VALUES.map(v=>`<button class="chip ${SELL.vals[v.id]?'active':''}" onclick="SELL.vals['${v.id}']=!SELL.vals['${v.id}'];discRefresh()">${es?v.es:v.en}</button>`).join('');
  const posHtml = picked.length ? picked.map(v=>`
      <div class="pos-item"><div class="pos-h">${es?v.es:v.en}</div>
        <div class="pos-t">${sfEsc(es?v.es2:v.en2)}</div>
        <div class="lbl-sm" style="margin:8px 0 4px">${es?'Preguntas de seguimiento':'Follow-up questions'}</div>
        <ul class="plain">${VALUE_FQ[v.id][L].map(q=>`<li>${sfEsc(q)}</li>`).join('')}</ul></div>`).join('')
    : `<div style="font-size:12.8px;color:var(--muted)">${es?'Toque lo que escuche arriba para ver cómo posicionar y qué preguntar después.':'Tap what you hear above to see how to position it and what to ask next.'}</div>`;
  const goBtn = sfCanNav(sc.go) ? `<button class="btn sm" onclick="sellNav('${sc.go}')">${goLbl[sc.go]||goLbl.plans}</button>` : '';
  return `
    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-top:0">${es?'Descubrimiento integrado (SOHO)':'Integrated Discovery (SOHO)'}</h3>
      <p style="margin:0 0 12px;font-size:12.8px;color:var(--muted)">${es?'Empiece por lo que el cliente valora, luego escoja el escenario. Escuche más de lo que habla: haga la pregunta, calle y profundice con un seguimiento.':'Start with what the customer values, then pick the scenario. Listen more than you talk: ask, stay quiet, then go deeper with a follow-up.'}</p>
      <div class="chips">${chips}</div>
    </div>
    <div class="card" style="margin-bottom:14px;border-left:4px solid var(--amber)">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
        <h3 style="margin:0">${es?'1. Lo que más valora':'1. What they value most'}</h3>
        <span class="badge amber">${vDone}/${vq.length} ${es?'preguntas':'asked'}</span>
      </div>
      ${vq.map((q,i)=>qrow('v'+i,q)).join('')}
    </div>
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
        <h3 style="margin:0">2. ${es?sc.es:sc.en}</h3>
        <span class="badge blue">${sDone}/${sq.length} ${es?'preguntas':'asked'}</span>
      </div>
      <div style="font-size:12.5px;color:var(--muted);margin:4px 0 6px">${sc.when[L]}</div>
      ${sq.map((q,i)=>qrow(sc.id+i,q)).join('')}
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-top:0">${es?'3. ¿Qué valora? Toque lo que escuche':'3. What did you hear? Tap the values'}</h3>
      <div class="chips" style="margin-bottom:12px">${valChips}</div>
      ${posHtml}
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-top:0">${es?'Preguntas de seguimiento universales':'Universal follow-up probes'}</h3>
      <p style="margin:0 0 6px;font-size:12.5px;color:var(--muted)">${es?'Úselas después de cualquier respuesta para profundizar.':'Use after any answer to go one level deeper.'}</p>
      <ul class="plain">${FOLLOWUPS[L].map(q=>`<li>${sfEsc(q)}</li>`).join('')}</ul>
    </div>
    <div class="grid cols-2" style="margin-bottom:14px">
      <div class="card" style="border-left:4px solid var(--good)"><div class="lbl-sm">${es?'Escuche / recomiende':'Listen for → recommend'}</div><div style="font-size:13px;line-height:1.55">${sfEsc(sc.listen[L])}</div></div>
      <div class="card" style="border-left:4px solid var(--accent)"><div class="lbl-sm">${es?'Próximo paso':'Next step'}</div><div style="font-size:13px;line-height:1.55">${sfEsc(sc.next[L])}</div>
        <div class="btn-row" style="margin-top:10px">${goBtn}<button class="btn sm ghost" onclick="flowGo(3)">${es?'Manejo de objeciones':'Handle objections'}</button></div></div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════════
// OFFER MATH + PITCH
// ══════════════════════════════════════════════════════════════════════════
function flowSet(k,v){
  SELL[k]=v;
  if(k==='cust' || k==='company'){ propInit(); state.prop.customer[k==='cust'?'name':'company'] = String(v).trim(); }
  if(k==='fmcCredit'||k==='need'||k==='cust'||k==='company'||k==='addr') flowUpdateOffer();
}
function flowOfferCalc(){
  const t = savTotals();
  const g = (grp,k)=>savNum(sav[grp][k]);
  const curFixed = g('cur','internet')+g('cur','phone')+g('cur','video'), libFixed = g('lib','internet')+g('lib','phone')+g('lib','video');
  const credit = 0;   // no FMC credit: the FMC benefit is on the fixed service (Double Bandwidth / FMC prices)
  const fmcLib = t.lib;
  return { t, credit, fmcLib,
    mobile:{lib:g('lib','mobile'), cur:g('cur','mobile')},
    fixed:{lib:libFixed, cur:curFixed},
    fmc:{lib:fmcLib, cur:t.cur},
    hasMobile: g('lib','mobile')>0, hasFixed: libFixed>0 };
}
function flowUpdateOffer(){
  sfSyncQuote();
  drLive();
  const el = document.getElementById('flowOfferNums'); if(!el) return;
  const es = sfEs(), o = flowOfferCalc();
  const card = (title,lib,cur,rec,note)=>{
    const m = cur-lib, has = lib>0;
    const tone = !has?'var(--muted)':(m<0?'var(--bad)':'var(--good)');
    return `<div class="card" style="flex:1;min-width:210px;${rec?'border:2px solid var(--accent)':''}">
      ${rec?`<span class="badge blue" style="margin-bottom:6px">${es?'Recomendada':'Recommended'}</span>`:''}
      <div style="font-weight:800;font-size:14px">${title}</div>
      <div class="sf-mono" style="font-weight:800;font-size:22px;margin:6px 0 2px">${has?savMoney(lib):'—'}<span style="font-size:11px;font-weight:600;color:var(--muted)"> /${es?'mes':'mo'}</span></div>
      <div style="font-size:12.5px;color:${tone};font-weight:700">${has&&cur>0?`${m>=0?(es?'Ahorra ':'Saves '):(es?'Cuesta ':'Costs ')}${savMoney(Math.abs(m))}/${es?'mes':'mo'} · ${savMoney(Math.abs(m)*12)}/${es?'año':'yr'}${m<0?(es?' más':' more'):''}`:(es?'Ingrese la factura actual para comparar':'Enter the current bill to compare')}</div>
      <div style="font-size:11.5px;color:var(--muted);margin-top:4px">${note}</div></div>`;
  };
  const fmcNote = es?'El beneficio FMC está en el servicio fijo (Double Bandwidth / precios FMC); los precios móviles no cambian.':'The FMC benefit is on the fixed service (Double Bandwidth / FMC prices); mobile prices don\'t change.';
  el.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap">
    ${card(es?'Solo fijo (Internet/Voz/Video)':'Fixed only (Internet/Voice/Video)', o.fixed.lib, o.fixed.cur, o.hasFixed&&!o.hasMobile, es?'Oferta independiente':'Standalone offer')}
    ${card(es?'Solo móvil':'Mobile only', o.mobile.lib, o.mobile.cur, false, es?'Oferta independiente':'Standalone offer')}
    ${card(es?'Paquete FMC: móvil + fijo':'FMC bundle: mobile + fixed', o.fmc.lib, o.fmc.cur, o.hasMobile&&o.hasFixed, fmcNote)}
  </div>`;
  flowPitchRender();
  flowCostUpdate();
}
function flowJoin(arr,es){ if(arr.length<2) return arr.join(''); return arr.slice(0,-1).join(', ')+(es?' y ':' and ')+arr[arr.length-1]; }
function flowPitchAvail(){ const o=flowOfferCalc(); return {fmc:o.hasMobile&&o.hasFixed, mobile:o.hasMobile, fixed:o.hasFixed}; }
function flowPitchType(){
  const av = flowPitchAvail();
  if(SELL.pitchType && SELL.pitchType!=='auto' && av[SELL.pitchType]) return SELL.pitchType;
  return av.fmc?'fmc':(av.fixed?'fixed':(av.mobile?'mobile':null));
}
function flowPitchParts(type){
  const es = sfEs(), o = flowOfferCalc(), q = fijoQuote();
  const who = (SELL.cust||'').trim(), need = (SELL.need||'').trim();
  const pickedVals = VALUES.filter(v=>SELL.vals[v.id]);
  const valNames = pickedVals.map(v=>VALUE_LABEL[v.id][es?'es':'en']);
  const qName = (q.ready && sav.fromQuote && q.name) ? q.name : '';
  const mobPhrase = es ? `servicio móvil por ${savMoney(o.mobile.lib)} al mes` : `mobile service at ${savMoney(o.mobile.lib)} a month`;
  const fixPhrase = qName ? (es?`${qName} por ${savMoney(o.fixed.lib)} al mes`:`${qName} for ${savMoney(o.fixed.lib)} a month`)
                          : (es?`internet, voz y video por ${savMoney(o.fixed.lib)} al mes`:`internet, voice and video for ${savMoney(o.fixed.lib)} a month`);
  const fixShort = qName ? fixPhrase : (es ? `servicio fijo de Liberty por ${savMoney(o.fixed.lib)} al mes` : `Liberty fixed service for ${savMoney(o.fixed.lib)} a month`);
  let heard = es ? `Basado en lo que usted me compartió${who?`, ${who}`:''}, ` : `Based on what you shared with me${who?`, ${who}`:''}, `;
  heard += need ? (es?`me dijo: "${need}". `:`you told me, "${need}". `) : (es?'quiero asegurarme de resolver lo que más le importa a su negocio. ':'I want to make sure we solve what matters most to your business. ');
  if(valNames.length) heard += es ? `Y lo que más le importa es ${flowJoin(valNames,true)}. Eso fue lo que tuve presente al armar esta propuesta.` : `And what matters most to you is ${flowJoin(valNames,false)}. That is what I kept in mind when I built this.`;
  let rec;
  if(type==='fmc') rec = es?`Por eso le recomiendo juntar su servicio móvil con su internet, voz y video en Liberty: ${mobPhrase}, junto con ${fixPhrase}. Todo con un solo proveedor.`:`So here is what I recommend: bring your mobile together with your internet, voice and video at Liberty: ${mobPhrase}, plus ${fixPhrase}. All with one provider.`;
  else if(type==='mobile') rec = es?`Por eso le recomiendo para su servicio móvil: ${mobPhrase}.`:`So here is what I recommend for your mobile service: ${mobPhrase}.`;
  else rec = es?`Por eso le recomiendo para su internet, voz y video: ${fixShort}.`:`So here is what I recommend for your internet, voice and video: ${fixShort}.`;
  const why = pickedVals.slice(0,3).map(v=>(es?`Como ${VALUE_LABEL[v.id].es} es importante para usted, `:`Because ${VALUE_LABEL[v.id].en} matters to you, `)+VALUE_SAY[v.id][es?'es':'en']+'.').join(' ');
  const side = type==='fmc'?o.fmc:(type==='mobile'?o.mobile:o.fixed);
  const total = side.lib;
  let nums = es?`El total es ${savMoney(total)} al mes. `:`The total is ${savMoney(total)} a month. `;
  if(side.cur>0){ const m = side.cur-total;
    nums += m>=0 ? (es?`Eso es ${savMoney(m)} menos al mes y ${savMoney(m*12)} menos al año que lo que paga hoy.`:`That is ${savMoney(m)} less a month and ${savMoney(m*12)} less a year than you pay today.`)
                 : (es?`Eso es ${savMoney(-m)} más al mes que hoy, y quiero ser claro con lo que usted recibe a cambio: lo incluido y cómo responde a lo que le importa.`:`That is ${savMoney(-m)} a month more than today, and I want to be clear about what you get for it: what is included and how it answers what matters to you.`); }
  const item = type==='fmc' ? (es?'el paquete completo':'the whole package') : (type==='mobile' ? (es?'sus líneas móviles':'your mobile lines') : (es?'su internet, voz y video':'your internet, voice and video'));
  const start = es ? `Voy a iniciar la orden para ${item} ahora, así que solo necesito el nombre de la persona autorizada en la cuenta para comenzar.` : `I will start the order for ${item} now, so I just need the name of the authorized person on the account to get going.`;
  const mm = side.cur>0 ? side.cur-total : null;
  let close;
  if(mm!==null && mm>0) close = es ? `Avancemos con el ahorro: ${savMoney(mm)} menos al mes, ${savMoney(mm*12)} al año que vuelven a su negocio. ${start}` : `Let's move ahead with the savings: ${savMoney(mm)} less every month, ${savMoney(mm*12)} a year back in your business. ${start}`;
  else if(mm!==null && mm<0) close = es ? `Avancemos para proteger lo que más le importa${valNames.length?`: ${flowJoin(valNames,true)}`:''}. ${start}` : `Let's move ahead so we protect what matters most to you${valNames.length?`: ${flowJoin(valNames,false)}`:''}. ${start}`;
  else close = es ? `Avancemos con esto a ${savMoney(total)} al mes. ${start}` : `Let's move ahead with this at ${savMoney(total)} a month. ${start}`;
  const L = es?['Lo que escuché','Recomendación','Por qué le conviene','Los números','Avancemos']:['What I heard','Recommendation','Why it fits you','The numbers',"Let's move ahead"];
  const fmcLine = sfFmcPitch(type);
  return [ {label:L[0],text:heard}, {label:L[1],text:rec}, ...(why?[{label:L[2],text:why}]:[]), ...(fmcLine?[{label:'FMC',text:fmcLine}]:[]), {label:L[3],text:nums.trim()}, {label:L[4],text:close} ];
}
function flowPitchText(){ const ty = flowPitchType(); if(!ty) return ''; return flowPitchParts(ty).map(p=>p.text).join('\n\n'); }
function flowPitchRender(){
  const el = document.getElementById('flowPitch'); if(!el) return;
  const es = sfEs(), av = flowPitchAvail(), ty = flowPitchType();
  const lbl = {fmc:es?'Paquete FMC':'FMC bundle', fixed:es?'Solo fijo':'Fixed only', mobile:es?'Solo móvil':'Mobile only'};
  const chips = ['fixed','fmc','mobile'].map(k=>`<button class="chip ${ty===k?'active':''}" ${av[k]?'':'disabled style="opacity:.45;cursor:not-allowed"'} onclick="SELL.pitchType='${k}';flowPitchRender()">${lbl[k]}</button>`).join('');
  if(!ty){ el.innerHTML = `<div class="chips" style="margin-bottom:10px">${chips}</div><div class="rep-note" style="margin:0">${es?'Agregue los precios de Liberty arriba (o use "Usar total de la Cotización Fijo") para escuchar cómo suena la oferta.':'Add the Liberty prices above (or use "Use Fijo quote total") to hear how the offer sounds.'}</div>`; return; }
  const parts = flowPitchParts(ty);
  el.innerHTML = `<div class="chips" style="margin-bottom:12px">${chips}</div>`
    + parts.map((p,i)=>`<div class="aim ${i===0?'a':(i===parts.length-1?'m':'i')}" style="margin-bottom:8px"><div class="aim-b"><div class="aim-w">${i+1}. ${sfEsc(p.label)}</div><div class="aim-t">${sfEsc(p.text)}</div></div></div>`).join('');
}
function flowCostUpdate(){
  const es = sfEs(), t = savTotals();
  t.rows.forEach(r=>{ const el=document.getElementById('flowRow_'+r.k); if(!el) return; const has=savNum(sav.lib[r.k])>0 || (savNum(sav.cur[r.k])>0 && t.lib>0);  /* no 'savings' before any Liberty price exists */ el.textContent = has?savMoney(r.d):'—'; el.className='num '+(has?(r.d>0?'pos':(r.d<0?'neg':'')):''); });
  const el = document.getElementById('flowCost'); if(!el) return;
  const credit = 0, net = t.monthly;
  if(t.cur<=0){ el.innerHTML=`<div class="rep-note">${es?'Ingrese la factura actual del cliente para construir la oferta alrededor del costo.':'Enter the customer\'s current bill to build the offer around cost.'}</div>`; return; }
  if(t.lib<=0){ el.innerHTML=''; return; }
  const worse = net<0, tone = worse?'var(--bad)':(net===0?'var(--muted)':'var(--good)');
  const tile=(l,v)=>`<div class="card" style="flex:1;min-width:140px;border-color:${tone}"><div class="lbl-sm" style="margin-bottom:2px">${l}</div><div class="sf-mono" style="font-weight:800;font-size:20px;color:${tone}">${v}</div></div>`;
  const pct = t.cur>0 ? (net/t.cur*100) : 0;
  const talk = worse
    ? (es?`Liberty cuesta ${savMoney(-net)} más al mes. No descuente de inmediato: pregunte qué valora, muestre lo incluido y pida una prueba.`:`Liberty costs ${savMoney(-net)} a month more. Do not discount first: ask what they value, show what is included and propose a trial.`)
    : net===0 ? (es?'Sin diferencia de costo: venda por valor y simplicidad.':'No cost difference: sell on value and simplicity.')
    : (es?`El cliente ahorra ${pct.toFixed(1)}%. Pregunte: ¿qué haría su negocio con ${savMoney(net*12)} al año?`:`The customer saves ${pct.toFixed(1)}%. Ask: what would the business do with ${savMoney(net*12)} a year?`);
  el.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">${tile(es?'Ahorro mensual':'Monthly savings',savMoney(net))}${tile(es?'Ahorro anual':'Annual savings',savMoney(net*12))}${tile(es?'Ahorro 3 años':'3-year savings',savMoney(net*36))}</div>
    <div class="rep-note" style="margin-top:0"><b>${es?'Enfoque de costo':'Cost angle'}:</b> ${sfEsc(talk)}${credit>0?` ${es?'(incluye el crédito FMC ingresado)':'(includes the FMC credit entered)'}`:''}</div>`;
}
// Re-attach the Liberty fixed price to the Proposal after the rep typed over it.
// The bundle is one price, so it sits on the Internet row and Voice/Video are
// included — the same convention js/contract.js uses on the SOHO contract.
function flowUseQuote(){ sav.fromQuote = true; flowStageRefresh(); }

// ══════════════════════════════════════════════════════════════════════════
// QUOTE BUILDER — the Proposal's steps 1–4 inside the Sales Flow. It writes
// state.prop with the same rules propBindStep*() use (downstream resets,
// voice lines, LTO variants), so both tabs always show one and the same quote.
// ══════════════════════════════════════════════════════════════════════════
function sfQData(tech){ return tech==='COAX' ? COAX_OFFER : tech==='FMC' ? FMC_PLANS : FTTX_OFFER; }
function sfQTech(id){
  propInit(); const p = state.prop;
  if(p.tech !== id){ p.tech = id; p.speed = null; p.bundle = null; p.priceType = null; p.voice.included = 0; }
  p.step = 1; flowStageRefresh();
}
function sfQSpeed(i){
  const p = state.prop; p.speed = sfQData(p.tech)[i];
  p.bundle = null; p.priceType = null; p.voice.included = 0; p.step = 2; flowStageRefresh();
}
function sfQBundle(id){
  const p = state.prop;
  if(p.bundle !== id){ p.bundle = id; p.priceType = null; p.voice.included = 0; }
  p.step = sfNeedsVoice(p) ? 2 : 3; flowStageRefresh();
}
function sfQVoice(n){ state.prop.voice.included = n; state.prop.step = 3; flowStageRefresh(); }
function sfQPrice(id){ state.prop.priceType = id; state.prop.step = Math.max(4, state.prop.step||0); flowStageRefresh(); }
function sfQReset(){ propInit(); const p = state.prop; p.tech=null; p.speed=null; p.bundle=null; p.priceType=null; p.voice.included=0; p.step=0; sav.fromQuote=true; flowStageRefresh(); }

function sfQuoteBuilderHtml(){
  propInit();
  const es = sfEs(), p = state.prop, q = fijoQuote();
  const mo = es?'mes':'mo';
  const opt = (on, onclick, title, sub, price, dis) => `<button class="qb-opt ${on?'on':''}" onclick="${onclick}" ${dis?'disabled':''}><b>${title}</b>${sub?`<small>${sub}</small>`:''}${price?`<div class="qb-p">${price}</div>`:''}</button>`;
  const head = (n, label, done) => `<div class="qb-h"><span class="qb-n">${done?'✓':n}</span>${label}</div>`;

  // Plans-tab shortcuts (Voz 1P / Video 2P) are fixed bundles the stepper doesn't rebuild
  if(p.speed && (p.speed._voz1p || p.speed._vid2p || p.speed._biab)){
    return `<div class="rep-note" style="margin:0 0 10px">${es?'Esta cotización empezó en <b>Nuestros Planes</b>. Para cambiar el plan, edítelo en Cotización o empiece de nuevo aquí.':'This quote was started in <b>Our Plans</b>. To change the plan, edit it in the Cart or start over here.'}</div>
      ${sfQuoteTotalHtml(q)}
      <div class="btn-row" style="margin-top:10px"><button class="btn sm ghost" onclick="sfQReset()">${es?'Empezar de nuevo':'Start over'}</button></div>`;
  }

  const techs = [
    {id:'COAX', sub:es?'Cable coaxial':'Coax cable'},
    {id:'FTTx', sub:es?'Fibra, simétrico':'Fiber, symmetric'},
    {id:'FMC',  sub:es?'Doble velocidad con móvil B2B':'Double speed with B2B mobile'}];
  let h = `<div class="qb-step ${p.tech?'done':''}">${head(1, es?'Tecnología':'Technology', !!p.tech)}<div class="qb-opts">${techs.map(t=>opt(p.tech===t.id, `sfQTech('${t.id}')`, t.id, t.sub)).join('')}</div></div>`;

  if(p.tech){
    const data = sfQData(p.tech);
    h += `<div class="qb-step ${p.speed?'done':''}">${head(2, es?'Velocidad':'Speed', !!p.speed)}
      ${p.tech==='FMC'?`<div style="font-size:11.5px;color:var(--muted);margin:-2px 0 8px">${es?'Requiere móvil B2B activo. Confirme elegibilidad en MyKnowledge (Salesforce).':'Requires an active B2B mobile line. Confirm eligibility in MyKnowledge (Salesforce).'}</div>`:''}
      <div class="qb-opts">${data.map((d,i)=>{
        const sel = p.speed && p.speed.speed===d.speed && p.speed.tech===d.tech;
        const from = Math.min(...Object.values(d.list).filter(v=>v!=null));
        const sub = p.tech==='FMC' ? `${es?'Base':'Base'} ${d.speed} · ${d.sourceTech}` : (d.tech==='D3.1'?'DOCSIS 3.1':d.tech==='FTTx15'?'FTTx 1.5G':d.tech);
        return opt(sel, `sfQSpeed(${i})`, d.displaySpeed||d.speed, sub, `${es?'Desde':'From'} ${fmt(from)}/${mo}`);
      }).join('')}</div></div>`;
  }
  if(p.speed){
    const bundles = [
      {id:'p1',name:'1P',sub:es?'Solo Internet':'Internet only'},
      {id:'p2',name:'2P',sub:es?'Internet + Voz':'Internet + Voice'},
      {id:'p3b',name:'3P Broadcast',sub:es?'+ Video Broadcast':'+ Broadcast Video'},
      {id:'p3e',name:'3P Español',sub:'+ Español De Primera'},
      {id:'p3u',name:'3P Ultimate',sub:es?'+ Video Ultimate':'+ Ultimate Video'}];
    h += `<div class="qb-step ${p.bundle&&!sfNeedsVoice(p)?'done':''}">${head(3, 'Bundle', p.bundle&&!sfNeedsVoice(p))}<div class="qb-opts">${bundles.map(b=>{
        const l = p.speed.list?.[b.id], pr = p.speed.promo?.[b.id];
        return opt(p.bundle===b.id, `sfQBundle('${b.id}')`, b.name, b.sub, l!=null?`${fmt(l)}${pr!=null?` → ${fmt(pr)}`:''}`:(es?'No disponible':'Not available'), l==null);
      }).join('')}</div>`;
    if(p.bundle && (p.bundle==='p2' || p.bundle.indexOf('p3')===0)){
      const max = p.speed.voip || 1;
      h += `<div style="font-size:12px;color:var(--muted);margin:10px 0 6px">${es?`Líneas de voz incluidas (hasta ${max}, sin cargo adicional):`:`Voice lines included (up to ${max}, no extra charge):`}</div>
        <div class="qb-opts">${Array.from({length:max},(_,i)=>i+1).map(n=>opt(p.voice.included===n, `sfQVoice(${n})`, String(n), es?(n===1?'línea':'líneas'):(n===1?'line':'lines'))).join('')}</div>`;
    }
    h += `</div>`;
  }
  if(p.bundle && !sfNeedsVoice(p)){
    const sp = p.speed, b = p.bundle;
    const ltoRows = (sp.tech==='FTTx'||sp.tech==='FTTx15') ? FTTX_LTO : COAX_LTO;
    const ltoRow = ltoRows.find(r=>r.speed===sp.speed);
    const ltoVal = id => ltoRow ? (b==='p2' ? ltoRow[LTO_COLS[id].p2] : b.indexOf('p3')===0 ? ltoRow[LTO_COLS[id].p3] : null) : null;
    const opts = [
      {id:'list', name:es?'Precio Lista':'List Price', val:sp.list?.[b]},
      {id:'promo', name:'Promo', val:sp.promo?.[b]},
      ...['lto-list','lto-lead','lto-fmc'].map(id=>({id, name:propPriceTypeShort(id, es), val:ltoVal(id)}))];
    h += `<div class="qb-step ${p.priceType?'done':''}">${head(4, es?'Tipo de precio':'Price type', !!p.priceType)}<div class="qb-opts">${opts.map(o=>
        opt(p.priceType===o.id, `sfQPrice('${o.id}')`, o.name, o.id.indexOf('lto')===0?(es?'Requiere contrato':'Contract required'):'', o.val!=null?`${fmt(o.val)}/${mo}`:(es?'N/D':'N/A'), o.val==null)).join('')}</div></div>`;
  }
  if(q.ready) h += sfQuoteTotalHtml(q);
  return h;
}
function sfQuoteTotalHtml(q){
  const es = sfEs();
  if(!q.ready) return '';
  return `<div class="qb-total"><div><div class="lbl-sm" style="color:#8fc6ff;margin:0 0 2px">${es?'Cotización (igual que en Cotización)':'Quote (same as in the Cart)'}</div>
      <div class="qb-items">${q.items.map(i=>sfEsc(i.name)).join('<br>')}${q.oneTime>0?`<br>${es?'Cargos únicos':'One-time'}: ${savMoney(q.oneTime)}`:''}</div></div>
    <div class="qb-amt">${savMoney(q.monthly)}<span style="font-size:11px;color:#a9c4ee"> /${es?'mes':'mo'}</span></div></div>`;
}

// Bar on top of the Proposal tab: same quote, one click back to the conversation
function sfRenderPropBar(){
  const el = document.getElementById('sf-propbar'); if(!el) return;
  const es = sfEs();
  const who = (SELL.cust||SELL.company||'').trim();
  el.innerHTML = `<div class="propbar"><span>${es?'Esta es la misma cotización del <b>Flujo de Venta</b>':'This is the same quote as in the <b>Sales Flow</b>'}${who?` · ${sfEsc(who)}`:''}.</span>
    <span class="btn-row"><button class="btn sm ghost" onclick="setTab('flow');flowGo(2)">← ${es?'Armar la oferta':'Build the offer'}</button><button class="btn sm ghost" onclick="setTab('flow');flowGo(4)">${es?'Cerrar':'Close'} →</button></span></div>`;
}

function flowCopy(btn,what){
  const text = what==='pitch' ? flowPitchText() : (window._flowText||'');
  const orig = btn.textContent;
  const done = ()=>{ btn.textContent = sfEs()?'¡Copiado!':'Copied!'; setTimeout(()=>{btn.textContent=orig;},1500); };
  try{ navigator.clipboard.writeText(text).then(done,()=>{}); }catch(e){}
}
function flowSummary(){
  const es = sfEs(), o = flowOfferCalc(), q = fijoQuote();
  const vals = VALUES.filter(v=>SELL.vals[v.id]).map(v=>es?v.es:v.en);
  const sc = DISC.find(d=>d.id===SELL.disc)||DISC[0];
  const heard = OBJ.filter(x=>SELL.objHeard[x.id]).map(x=>es?x.es:x.en);
  const L=[];
  L.push('LIBERTY BUSINESS — '+(es?'RESUMEN DEL TRATO':'DEAL SUMMARY'));
  L.push(new Date().toLocaleDateString(es?'es-PR':'en-US',{year:'numeric',month:'long',day:'numeric'}));
  L.push('='.repeat(44));
  if(SELL.cust.trim()) L.push((es?'Cliente: ':'Customer: ')+SELL.cust.trim());
  if(SELL.company.trim()) L.push((es?'Compañía: ':'Company: ')+SELL.company.trim());
  if(SELL.addr.trim()) L.push((es?'Dirección: ':'Address: ')+SELL.addr.trim());
  L.push((es?'Escenario: ':'Scenario: ')+(es?sc.es:sc.en));
  if(sfSvc()){ const sv = SF_SVC.find(x=>x.id===sfSvc()); L.push((es?'Servicios Liberty hoy: ':'Liberty services today: ')+(es?sv.es:sv.en)); }
  if(SELL.need.trim()) L.push((es?'Necesidad principal: ':'Main need: ')+SELL.need.trim());
  if(vals.length) L.push((es?'Valora: ':'Values: ')+vals.join(', '));
  if(SELL.notes.trim()) L.push((es?'Notas: ':'Notes: ')+SELL.notes.trim());
  L.push('');
  L.push(es?'OFERTA':'OFFER');
  if(q.ready && sav.fromQuote) L.push(`  ${es?'Fijo (Cotización)':'Fixed (Quote)'}: ${q.items.map(i=>i.name).join(', ')} — ${savMoney(q.monthly)}/${es?'mes':'mo'}`);
  else if(o.hasFixed) L.push(`  ${es?'Fijo (Internet/Voz/Video)':'Fixed (Internet/Voice/Video)'}: ${savMoney(o.fixed.lib)}/${es?'mes':'mo'}`);
  if(o.hasMobile) L.push(`  ${es?'Móvil':'Mobile'}: ${savMoney(o.mobile.lib)}/${es?'mes':'mo'}`);
  if(o.credit>0) L.push(`  ${es?'Crédito FMC':'FMC credit'}: -${savMoney(o.credit)}/${es?'mes':'mo'}`);
  L.push(`  ${es?'TOTAL LIBERTY':'LIBERTY TOTAL'}: ${savMoney(o.fmc.lib)}/${es?'mes':'mo'}`);
  if(o.fmc.cur>0){ const m=o.fmc.cur-o.fmc.lib; L.push(`  ${es?'Factura actual':'Current bill'}: ${savMoney(o.fmc.cur)}/${es?'mes':'mo'}`); L.push(`  ${m>=0?(es?'AHORRO':'SAVINGS'):(es?'DIFERENCIA (más)':'DIFFERENCE (more)')}: ${savMoney(Math.abs(m))}/${es?'mes':'mo'} · ${savMoney(Math.abs(m)*12)}/${es?'año':'yr'}`); }
  if(q.ready && q.oneTime>0) L.push(`  ${es?'Cargos únicos (cotización)':'One-time charges (quote)'}: ${savMoney(q.oneTime)}`);
  L.push('');
  L.push((es?'Objeciones escuchadas (AIM): ':'Objections heard (AIM): ')+(heard.length?heard.join(', '):(es?'Ninguna':'None')));
  const done = Object.keys(SELL.closeChk).filter(k=>SELL.closeChk[k]).length;
  L.push((es?'Lista de cierre: ':'Close checklist: ')+done+'/'+SF_CLOSE_CHK.en.length);
  if(SELL.nextStep.trim()) L.push((es?'Próximo paso: ':'Next step: ')+SELL.nextStep.trim());
  window._flowText = L.join('\n');
  document.getElementById('flowSummary').innerHTML = `<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="margin:0">${es?'Resumen':'Summary'}</h3><button class="copybtn" onclick="flowCopy(this,'summary')">${es?'Copiar':'Copy'}</button></div><div class="proposal-box" id="flowBox"></div></div>`;
  document.getElementById('flowBox').textContent = window._flowText;
}

const SF_CLOSERS = {en:[
  ['Assumptive','Based on everything you told me, this is the right fit. Let us get your first lines set up: which number should we port first?'],
  ['Choice','Would you rather start with all the lines today, or start with the three that matter most and add the rest next week?'],
  ['Summary','You told me what matters is [their values]. This gives you [offer] for [total] a month. Shall I submit the order now?'],
  ['Next step','If today is not the day, let us lock a time to finish this: would Thursday at 10 work? I will have everything ready.']],
 es:[
  ['Asumido','Con todo lo que me contó, este es el ajuste correcto. Dejemos listas sus primeras líneas: ¿cuál número portamos primero?'],
  ['Opción','¿Prefiere empezar con todas las líneas hoy o con las tres más importantes y agregar el resto la próxima semana?'],
  ['Resumen','Usted me dijo que lo importante es [sus valores]. Esto le da [oferta] por [total] al mes. ¿Envío la orden ahora?'],
  ['Próximo paso','Si hoy no es el día, fijemos una hora para terminar esto: ¿le sirve el jueves a las 10? Tendré todo listo.']]};
const SF_CLOSE_CHK = {en:[
  'Decision maker is on the call and agrees to proceed',
  'Lines and numbers to port confirmed, with account holder details',
  'Devices chosen or BYOD confirmed (BYOD lines get no port-in credit)',
  'AutoPay + Paperless Bill enrollment confirmed ($7/line off)',
  'Monthly total and one-time charges reviewed out loud',
  'Fixed services: address and installation appointment confirmed',
  'Written proposal sent and next-step date agreed'],
 es:[
  'El decisor está en la llamada y acepta continuar',
  'Líneas y números a portar confirmados, con datos del titular',
  'Equipos elegidos o BYOD confirmado (las líneas BYOD no reciben crédito port-in)',
  'Inscripción en AutoPago + Factura Electrónica confirmada ($7/línea menos)',
  'Total mensual y cargos únicos revisados en voz alta',
  'Servicios fijos: dirección y cita de instalación confirmadas',
  'Propuesta escrita enviada y fecha de seguimiento acordada']};

// ══════════════════════════════════════════════════════════════════════════
// STEP BODIES
// ══════════════════════════════════════════════════════════════════════════
function flowBody(n){
  const es = sfEs(), L = es?'es':'en';
  if(n===1){
    return `
      <details class="disc-pop" id="flowDisc" ${SELL.discOpen?'open':''} ontoggle="SELL.discOpen=this.open">
        <summary><span class="ds-main"><span class="ds-t">${es?'Preguntas abiertas de descubrimiento':'Open discovery questions'}</span><span class="ds-s">${es?'Qué valora, preguntas por escenario y seguimientos.':'What they value, scenario questions and follow-ups.'}</span></span><span class="badge blue" id="flowDiscBadge">${discBadgeText()}</span></summary>
        <div class="disc-body" id="flowDiscBody">${discoveryHtml()}</div>
      </details>
      <div class="rep-note" style="margin-top:0"><b>${es?'Mientras escucha':'While you listen'}:</b> ${es?'escriba la necesidad con sus palabras y marque los valores en el Resumen del cliente. Ahí quedan visibles en todos los pasos.':'type the need in their words and tap the values in the Customer Brief. It stays visible on every step.'}</div>`;
  }
  if(n===2){
    const _banner = sfPartnerBannerHtml();
    sfSyncQuote();   // before the inputs render, so the Liberty column shows the quote
    const q = fijoQuote();
    const rowsHtml = SAV_ROWS.map(r=>`<tr><td class="sv-k">${es?r.es:r.en}</td><td>${savInput('cur',r.k)}</td><td>${savInput('lib',r.k)}</td><td class="num sv-d" id="flowRow_${r.k}">—</td></tr>`).join('');
    const sync = q.ready ? (sav.fromQuote
        ? `<span class="sync-pill">● ${es?'Sincronizado con Cotización':'Synced with the Cart'}</span>`
        : `<span class="sync-pill off">${es?'Precio escrito a mano':'Price typed by hand'}</span> <button class="btn sm ghost" onclick="flowUseQuote()">${es?'Volver a sincronizar':'Re-sync'} (${savMoney(q.monthly)})</button>`) : '';
    return `${_banner}
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px">
          <h3 style="margin:0">${es?'1. Cotice el servicio fijo':'1. Quote the fixed service'}</h3>
          ${q.ready?`<button class="btn sm ghost" onclick="sellNav('cart')">${es?'Continuar en Cotización: extras, término, contrato':'Continue in Cart: extras, term, contract'} →</button>`:''}
        </div>
        <p style="margin:0 0 10px;font-size:12.8px;color:var(--muted)">${es?'Lo que escoja aquí es la misma cotización de la pestaña Cotización, y lo que se cotice en Nuestros Planes o Cotización aparece aquí.':'What you pick here is the same quote as the Cart tab, and anything quoted in Our Plans or the Cart shows up here.'}</p>
        ${sfQuoteBuilderHtml()}
      </div>
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
          <h3 style="margin:0">${es?'2. Compare con lo que paga hoy':'2. Compare with what they pay today'}</h3>
          <span>${sync}</span>
        </div>
        <p style="margin:0 0 10px;font-size:12.8px;color:var(--muted)">${es?'Escriba la factura actual del cliente por servicio. La columna Liberty se llena sola desde la Cotización: Internet = el plan, Teléfono = líneas y add-ons de voz, Video = STB y add-ons de video, Otros = equipos y demás add-ons. El móvil (FMC) llega del Mobile Sales Tool o lo escribe usted.':'Enter the customer\'s current bill by service. The Liberty column fills in from the Cart: Internet = the plan, Phone = voice lines and add-ons, Video = STBs and video add-ons, Other = equipment and other add-ons. Mobile (FMC) comes from the Mobile Sales Tool or is typed by you.'}</p>
        <div class="sav-wrap"><table class="sav-tbl"><thead><tr><th>${es?'Servicio':'Service'}</th><th>${es?'Actual / mes':'Current / mo'}</th><th>Liberty / ${es?'mes':'mo'}</th><th>${es?'Ahorro / mes':'Savings / mo'}</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
        <div id="flowCost" style="margin-top:12px"></div>
        ${sfFmcCardHtml()}
      </div>
      <div id="flowOfferNums" style="margin-bottom:14px"></div>
      <div class="card" style="margin-bottom:14px;border-left:4px solid var(--good)">
        <h3 style="margin:0 0 4px">${es?'Así suena la oferta':'How the offer sounds'}</h3>
        <p style="margin:0 0 10px;font-size:12.5px;color:var(--muted)">${es?'Empieza con "Basado en lo que usted me compartió": regresa lo que escuchó y lo que le importa, y luego conecta la oferta y los números. Escoja fijo, FMC o móvil.':'Starts with "Based on what you shared with me": plays back what you heard and what matters, then ties the offer and the numbers to it. Pick fixed, FMC or mobile.'}</p>
        <div id="flowPitch"></div>
        <div class="btn-row" style="margin-top:10px"><button class="btn sm ghost" onclick="flowCopy(this,'pitch')">${es?'Copiar':'Copy'}</button><button class="btn sm ghost" onclick="flowGo(1)">${es?'Editar lo que escuché':'Edit what I heard'}</button></div>
      </div>
      <div class="card" style="margin-bottom:14px"><div class="lbl-sm">${es?'Por qué FMC (hablando de valor)':'Why FMC (talk value)'}</div>
        <ul class="plain">
          <li>${es?'Un solo proveedor para móvil e internet/voz/video: una relación en vez de varias.':'One provider for mobile and internet/voice/video: one relationship instead of several.'}</li>
          <li>${es?'Un punto de seguimiento para soporte y facturación que usted atiende personalmente.':'One point of follow-up for support and billing that you personally own.'}</li>
          <li>${es?'Un solo lugar para crecer: agregar líneas puede bajar el precio por línea en todos los planes móviles.':'One place to grow: adding lines can lower the per-line price across all mobile plans.'}</li>
          <li>${es?'No hay oferta FMC del lado móvil: el beneficio es FMC Double Bandwidth en el internet, y los precios móviles no cambian.':'There is no FMC offer on the mobile side: the benefit is FMC Double Bandwidth on the internet, and mobile prices don\'t change.'}</li>
        </ul></div>`;
  }
  if(n===3){
    const o = OBJ.find(x=>x.id===SELL.obj)||OBJ[0];
    const chips = OBJ.map(x=>`<button class="chip ${x.id===o.id?'active':''}" onclick="flowObj('${x.id}')">${es?x.es:x.en}</button>`).join('');
    const aim = (l,w,txt,cls)=>`<div class="aim ${cls}"><div class="aim-l">${l}</div><div class="aim-b"><div class="aim-w">${w}</div><div class="aim-t">${sfEsc(txt)}</div></div></div>`;
    return `
      <div class="card" style="margin-bottom:14px">
        <p style="margin:0 0 10px;font-size:12.8px;color:var(--muted)">${es?'Si el cliente dice que sí a la oferta, pase directo al cierre. Si pone una objeción, toque cuál es:':'If the customer says yes to the offer, go straight to the close. If they raise an objection, tap which one:'}</p>
        <div class="chips">${chips}</div>
      </div>
      <div class="card" style="margin-bottom:14px">
        <h3 style="margin:0 0 12px">${es?o.es:o.en}</h3>
        <div class="aim-bold">
        ${aim('A', es?'Reconozca':'Acknowledge', o.A[L],'a')}
        ${aim('I', es?'Informe':'Inform', o.I[L],'i')}
        ${aim('M', es?'Avance al cierre':'Move on to the close', o.M[L],'m')}
        </div>
        <div class="rep-note"><b>${es?'Nota':'Rep note'}:</b> ${sfEsc(o.note[L])}</div>
      </div>`;
  }
  return `
      <div class="card" style="margin-bottom:14px">
        <div class="lbl-sm">${es?'Frases de cierre':'Closing statements'}</div>
        ${SF_CLOSERS[L].map(c=>`<div class="aim m" style="margin-bottom:8px"><div class="aim-b"><div class="aim-w">${c[0]}</div><div class="aim-t">${sfEsc(c[1])}</div></div></div>`).join('')}
      </div>
      <div class="card" style="margin-bottom:14px">
        <div class="lbl-sm">${es?'Lista de cierre':'Close checklist'}</div>
        ${SF_CLOSE_CHK[L].map((q,i)=>`<label class="q-row"><input type="checkbox" ${SELL.closeChk[i]?'checked':''} onchange="SELL.closeChk[${i}]=this.checked;drLive()"><span>${sfEsc(q)}</span></label>`).join('')}
        <label class="field" style="margin-top:10px">${es?'Próximo paso con fecha':'Next step with a date'}<input type="text" value="${sfEsc(SELL.nextStep)}" placeholder="${es?'Ej. jueves 10:00, firmar propuesta':'e.g. Thursday 10:00, sign proposal'}" oninput="flowSet('nextStep',this.value)"></label>
      </div>
      <div class="btn-row" style="margin-bottom:14px">
        <button class="btn" onclick="flowSummary()">${es?'Generar resumen del trato':'Generate deal summary'}</button>
        <button class="btn ghost" onclick="sellNav('cart')">${es?'Terminar en Cotización (PDF y contrato)':'Finish in Cart (PDF and contract)'}</button>
      </div>
      <div id="flowSummary"></div>`;
}

// ══════════════════════════════════════════════════════════════════════════
// DEAL ROOM LAYOUT
// ══════════════════════════════════════════════════════════════════════════
function flowDone(n){
  const o = flowOfferCalc();
  if(n===1) return !!(SELL.cust.trim()||SELL.company.trim()||SELL.addr.trim()||SELL.need.trim()||SELL.notes.trim()||VALUES.some(v=>SELL.vals[v.id]));
  if(n===2) return o.hasMobile || o.hasFixed;
  if(n===3) return OBJ.some(x=>SELL.objHeard[x.id]);
  return Object.keys(SELL.closeChk).filter(k=>SELL.closeChk[k]).length>=SF_CLOSE_CHK.en.length;
}
function flowGo(n){
  SELL.step = Math.max(1,Math.min(4,n));
  renderFlow();
  const st = document.getElementById('drStage');
  if(st){ const y = st.getBoundingClientRect().top + window.pageYOffset - sfStickyOffset() - 12; window.scrollTo({top:Math.max(0,y), behavior:'smooth'}); }
}
function sfStickyOffset(){
  return sfStickyH('.header') + sfStickyH('.tabs-wrap');
}
function flowStageRefresh(){ const b = document.getElementById('drBody'); if(b){ b.innerHTML = flowBody(SELL.step); flowUpdateOffer(); } }
function flowObj(id){ SELL.obj = id; SELL.objHeard[id] = true; flowStageRefresh(); }
function brToggleVal(id){ SELL.vals[id] = !SELL.vals[id]; discRefresh(); }
function brUnheard(id){ SELL.objHeard[id] = false; if(SELL.step===3) flowStageRefresh(); else drLive(); }
function briefToggle(){ SELL.briefOpen = !SELL.briefOpen; const b = document.getElementById('drBrief'); if(b) b.classList.toggle('open', SELL.briefOpen); }

function drNums(){
  const o = flowOfferCalc(), t = o.t, q = fijoQuote();
  const hasLib = t.lib>0, hasCur = t.cur>0;
  const net = (hasLib && hasCur) ? t.monthly + o.credit : null;
  return { o, t, q, hasLib, hasCur, lib:o.fmc.lib, net, annual: net==null?null:net*12 };
}
function drKpiHtml(){
  const es = sfEs(), n = drNums();
  const tile = (l,v,cls)=>`<div class="dr-kpi ${cls||''}"><div class="dr-kl">${l}</div><div class="dr-kv">${v}</div></div>`;
  const worse = n.net!=null && n.net<0;
  return tile(es?'Liberty / mes':'Liberty / mo', n.hasLib?savMoney(n.lib):'—')
    + tile(worse?(es?'Cuesta más / mes':'Costs more / mo'):(es?'Ahorro / mes':'Saves / mo'), n.net==null?'—':savMoney(Math.abs(n.net)), n.net==null?'':(worse?'neg':'pos'))
    + tile(worse?(es?'Cuesta más / año':'Costs more / yr'):(es?'Ahorro / año':'Saves / yr'), n.net==null?'—':savMoney(Math.abs(n.annual)), n.net==null?'':(worse?'neg':'pos'))
    + (n.q.ready
        ? `<button class="dr-kpi link" onclick="sellNav('cart')" title="${es?'Abrir Cotización':'Open Cart'}"><div class="dr-kl">${es?'Cotización':'Cart'}</div><div class="dr-kv">${savMoney(n.q.monthly)}</div></button>`
        : `<button class="dr-kpi link" onclick="flowGo(2)" title="${es?'Arme la cotización':'Build the quote'}"><div class="dr-kl">${es?'Cotización':'Cart'}</div><div class="dr-kv add">${es?'Cotizar +':'Quote +'}</div></button>`);
}
function brValsHtml(){ const es = sfEs(); return VALUES.map(v=>`<button class="br-chip ${SELL.vals[v.id]?'on':''}" onclick="brToggleVal('${v.id}')">${es?v.es:v.en}</button>`).join(''); }
function brObjHtml(){
  const es = sfEs(), list = OBJ.filter(x=>SELL.objHeard[x.id]);
  return list.length ? list.map(x=>`<button class="br-chip obj" title="${es?'Quitar':'Remove'}" onclick="brUnheard('${x.id}')">${sfEsc(es?x.es:x.en)} ×</button>`).join('') : `<span class="br-none">${es?'Ninguna todavía':'None yet'}</span>`;
}
function brDealHtml(){
  const es = sfEs(), n = drNums();
  const row = (l,v,c)=>`<div class="br-row ${c||''}"><span>${l}</span><b>${v}</b></div>`;
  let h = row(es?'Factura actual':'Current bill', n.hasCur?savMoney(n.t.cur):'—');
  h += row(es?'Liberty / mes':'Liberty / mo', n.hasLib?savMoney(n.lib):'—');
  if(n.net!=null) h += row(n.net<0?(es?'Cuesta más / mes':'Costs more / mo'):(es?'Ahorro / mes':'Saves / mo'), savMoney(Math.abs(n.net)), n.net<0?'neg':'sav');
  if(n.q.ready && n.q.oneTime>0) h += row(es?'Cargos únicos (cotización)':'One-time (quote)', savMoney(n.q.oneTime));
  return h;
}
function brBarHtml(){
  const es = sfEs(), n = drNums(), need = SELL.need.trim(), cust = SELL.cust.trim();
  const txt = need ? '“'+(need.length>72?need.slice(0,72)+'…':need)+'”' : (cust || SELL.company.trim() || (es?'Resumen del cliente: toque para abrir':'Customer brief: tap to open'));
  const s = n.net!=null && n.net>0 ? `<span class="br-sav">${es?'Ahorra ':'Saves '}${savMoney(n.net)}${es?'/mes':'/mo'}</span>` : '';
  return `<span class="br-bar-t">${sfEsc(txt)}</span>${s}`;
}
let _drKpiLast = '';
function drLive(){
  const es = sfEs();
  const k = document.getElementById('drKpis');
  if(k){ const h = drKpiHtml(); if(h!==_drKpiLast){ _drKpiLast=h; k.innerHTML=h; k.classList.remove('bump'); void k.offsetWidth; k.classList.add('bump'); } }
  const t = document.getElementById('drTitle'); if(t) t.textContent = SELL.cust.trim() || SELL.company.trim() || (SELL.disc==='existing' ? (es?'Cliente existente':'Existing customer') : (es?'Nuevo cliente':'New customer'));
  const co = document.getElementById('drCo'); if(co){ const parts=[]; if(SELL.cust.trim() && SELL.company.trim()) parts.push(SELL.company.trim()); if(SELL.addr.trim()) parts.push(SELL.addr.trim()); co.textContent = parts.join('  ·  '); co.hidden = !parts.length; }
  const sc = DISC.find(d=>d.id===SELL.disc)||DISC[0];
  const sub = document.getElementById('drSub'); if(sub) sub.textContent = es?sc.es:sc.en;
  const set = (id,h)=>{ const e=document.getElementById(id); if(e) e.innerHTML=h; };
  set('brVals', brValsHtml()); set('brSvc', brSvcHtml()); set('brObj', brObjHtml()); set('brDeal', brDealHtml()); set('brBar', brBarHtml());
  const scEl = document.getElementById('brScenario'); if(scEl) scEl.textContent = es?sc.es:sc.en;
  document.querySelectorAll('.sf .dr-step').forEach(b=>{ const n = +b.dataset.n, d = flowDone(n); b.classList.toggle('done', d && n!==SELL.step); const dot = b.querySelector('.dr-dot'); if(dot) dot.textContent = (d && n!==SELL.step) ? '✓' : String(n); });
}
function briefHtml(){
  const es = sfEs();
  return `
    <button class="br-bar" onclick="briefToggle()" aria-label="${es?'Resumen del cliente':'Customer brief'}"><span id="brBar" class="br-bar-in">${brBarHtml()}</span><span class="br-chev">▾</span></button>
    <div class="br-body">
      <div class="br-head"><span>${es?'Resumen del cliente':'Customer brief'}</span><span class="br-live"><i></i>${es?'En vivo':'Live'}</span></div>
      <div class="br-pad">
        <label class="br-f">${es?'Nombre del cliente':'Customer name'}<input type="text" value="${sfEsc(SELL.cust)}" placeholder="${es?'Persona de contacto':'Contact person'}" oninput="flowSet('cust',this.value)"></label>
        <label class="br-f">${es?'Compañía':'Company'} <span class="br-opt">${es?'(opcional)':'(optional)'}</span><input type="text" value="${sfEsc(SELL.company)}" placeholder="${es?'Nombre de la compañía':'Company name'}" autocomplete="off" oninput="flowSet('company',this.value)"></label>
        <label class="br-f">${es?'Dirección':'Address'} <span class="br-opt">${es?'(opcional)':'(optional)'}</span><input type="text" value="${sfEsc(SELL.addr)}" placeholder="${es?'Calle, urbanización, municipio':'Street, area, municipality'}" autocomplete="off" oninput="flowSet('addr',this.value)"></label>
        <label class="br-f">${es?'Su necesidad, en sus palabras':'Their need, in their words'}<textarea rows="3" class="br-need" placeholder="${es?'Ej. el internet se cae en la clínica y pierdo citas':'e.g. the internet drops at the clinic and I lose appointments'}" oninput="flowSet('need',this.value)">${sfEsc(SELL.need)}</textarea></label>
        <div class="br-lbl">${es?'Lo que valora (toque para marcar)':'What they value (tap to mark)'}</div>
        <div class="br-chips" id="brVals">${brValsHtml()}</div>
        <label class="br-f" style="margin-top:12px">${es?'Notas':'Notes'}<textarea rows="3" placeholder="${es?'Dolor, servicios, proveedor actual, quién decide…':'Pain points, services, current provider, decision maker…'}" oninput="flowSet('notes',this.value)">${sfEsc(SELL.notes)}</textarea></label>
        <div class="br-lbl">${es?'Servicios Liberty hoy':'Liberty services today'}</div>
        <div class="br-chips" id="brSvc">${brSvcHtml()}</div>
        <div class="br-lbl">${es?'Objeciones escuchadas':'Objections heard'}</div>
        <div class="br-chips" id="brObj">${brObjHtml()}</div>
        <div class="br-lbl">${es?'Escenario':'Scenario'}</div>
        <div class="br-scn" id="brScenario"></div>
        <div class="br-deal" id="brDeal">${brDealHtml()}</div>
      </div>
    </div>`;
}
function flowFootHtml(n){
  const es = sfEs();
  const title = i=>es?FLOW_STEPS[i-1].es:FLOW_STEPS[i-1].en;
  const back = n>1 ? `<button class="btn ghost" onclick="flowGo(${n-1})">← ${title(n-1)}</button>` : '<span></span>';
  const skip = n===2 ? `<button class="btn ghost" onclick="flowGo(4)">${es?'Dijo que sí: ir al cierre':'They said yes: go to close'}</button>` : '';
  const next = n<4 ? `<button class="btn cta" onclick="flowGo(${n+1})">${title(n+1)} →</button>` : `<button class="btn cta" onclick="sellNav('cart')">${es?'Ir a Cotización':'Go to Cart'} →</button>`;
  return `${back}<span class="grp">${skip}${next}</span>`;
}
function renderFlow(){
  const es = sfEs();
  const panel = document.getElementById('sf-flow'); if(!panel) return;
  // The Proposal may have been edited since: its customer name/company win
  if(state.prop && state.prop.customer){ const c = state.prop.customer; if(c.name) SELL.cust = c.name; if(c.company) SELL.company = c.company; }
  const n = SELL.step || 1, st = FLOW_STEPS[n-1];
  const rail = FLOW_STEPS.map(s=>`<button class="dr-step ${s.n===n?'active':''}" data-n="${s.n}" onclick="flowGo(${s.n})"><span class="dr-dot">${s.n}</span><span class="dr-st"><b>${es?s.es:s.en}</b><i>${es?s.subEs:s.subEn}</i></span></button>`).join('');
  const tools = [['planes',t('tab.planes')],['vsclaro',t('tab.vsclaro')],['addons',t('tab.addons')],['promos',t('tab.promos')],['proposal',t('tab.proposal')]]
    .map(x=>`<button class="dr-tool" onclick="sellNav('${x[0]}')">${x[1]} <span>↗</span></button>`).join('');
  panel.innerHTML = `
  <div class="dr">
    <section class="dr-hero">
      <div class="dr-hero-top">
        <div class="dr-hero-l">
          <div class="dr-eyebrow">${es?'Flujo de Venta':'Sales Flow'}</div>
          <h2 class="dr-title" id="drTitle"></h2>
          <div class="dr-sub" id="drSub"></div>
          <div class="dr-co" id="drCo" hidden></div>
        </div>
        <div class="dr-kpis" id="drKpis"></div>
      </div>
    </section>
    <div class="dr-grid">
      <nav class="dr-rail" aria-label="${es?'Pasos':'Steps'}">${rail}<div class="dr-tools"><div class="dr-tools-h">${es?'Herramientas':'Tools'}</div>${tools}</div></nav>
      <aside class="dr-brief ${SELL.briefOpen?'open':''}" id="drBrief">${briefHtml()}</aside>
      <section class="dr-stage" id="drStage">
        <header class="dr-sh"><div class="dr-kick">${es?'Paso':'Step'} ${n} ${es?'de':'of'} 4</div><h2>${es?st.es:st.en}</h2><p>${es?st.tipEs:st.tipEn}</p></header>
        <div class="dr-body" id="drBody">${flowBody(n)}</div>
        <footer class="dr-foot">${flowFootHtml(n)}</footer>
      </section>
    </div>
  </div>`;
  _drKpiLast = '';
  sfSetStick();
  flowUpdateOffer();
}
function sfStickyH(sel){
  const el = document.querySelector(sel); if(!el) return 0;
  return getComputedStyle(el).position==='sticky' || getComputedStyle(el).position==='fixed' ? el.offsetHeight : 0;
}
function sfSetStick(){
  // Only elements that actually stick count (the branded header scrolls away)
  const mobile = window.matchMedia && window.matchMedia('(max-width:700px)').matches;
  const r = document.documentElement.style;
  r.setProperty('--sf-hdr-h', sfStickyH('.header')+'px');
  r.setProperty('--sf-nav-h', sfStickyH('.tabs-wrap')+'px');
  document.documentElement.classList.toggle('sf-mobile', !!mobile);
}
window.addEventListener('resize', sfSetStick);

// ══════════════════════════════════════════════════════════════════════════
// HOW TO USE — hero with Sales Flow shortcuts + recommended Fijo workflow
// ══════════════════════════════════════════════════════════════════════════
function sfRenderHowTo(){
  const el = document.getElementById('sf-howto'); if(!el) return;
  const es = sfEs();
  const box = (label,value,sub,step)=>`<button class="dr-kpi go" onclick="setTab('flow');flowGo(${step})"><div class="dr-kl">${label}</div><div class="dr-kv">${value}</div><div class="dr-ks">${sub}</div></button>`;
  const steps_es = [
    ['Descubre lo que le importa', 'En el Flujo de Venta, paso Descubrir: escoge el escenario, haz las preguntas abiertas y anota la necesidad con las palabras del cliente. Marca lo que valora; el Resumen del cliente te acompaña en todos los pasos.'],
    ['Cotiza el plan', 'En el paso Armar la oferta escoge tecnología, velocidad, bundle y tipo de precio. Si prefieres comparar primero, usa Nuestros Planes y toca "Cotizar este plan". Las dos rutas llenan la misma cotización.'],
    ['Compara con lo que paga hoy', 'Escribe la factura actual del cliente. El precio de Liberty sale de la cotización y el ahorro mensual, anual y de 3 años se calcula solo. Escucha cómo suena la oferta antes de presentarla.'],
    ['Maneja las objeciones', 'En Manejar objeciones toca lo que escuchaste y sigue el guion AIM: Reconoce, Informa y Avanza al cierre. Si la barrera es la penalidad del competidor, revisa Promociones.'],
    ['Completa la cotización', 'Toca "Continuar en Cotización": llegas al paso Extras con el plan ya escogido. Agrega voz, video y add-ons, escoge el término y confirma los datos del cliente.'],
    ['Cierra y entrega', 'Usa la lista de cierre y fija un próximo paso con fecha. Genera la propuesta en PDF y el contrato SOHO desde la Cotización.'],
  ];
  const steps_en = [
    ['Discover what matters', 'In the Sales Flow, Discover step: pick the scenario, ask the open questions and capture the need in the customer\'s words. Tap what they value; the Customer Brief stays with you on every step.'],
    ['Quote the plan', 'In the Build the offer step, pick technology, speed, bundle and price type. If you would rather compare first, use Our Plans and tap "Quote this plan". Both routes fill the same quote.'],
    ['Compare with today\'s bill', 'Enter the customer\'s current bill. The Liberty price comes from the quote, and monthly, annual and 3-year savings are calculated for you. Hear how the offer sounds before you present it.'],
    ['Handle objections', 'In Handle objections, tap what you heard and follow the AIM script: Acknowledge, Inform and Move on to the close. If the barrier is the competitor\'s penalty, check Promotions.'],
    ['Finish the quote', 'Tap "Continue in Cart": you land on the Extras step with the plan already picked. Add voice, video and add-ons, pick the term and confirm the customer\'s details.'],
    ['Close and deliver', 'Use the close checklist and set a dated next step. Generate the PDF proposal and the SOHO contract from the Cart.'],
  ];
  const steps = es ? steps_es : steps_en;
  el.innerHTML = `
    <section class="dr-hero slim">
      <div class="dr-hero-top">
        <div class="dr-hero-l">
          <div class="dr-eyebrow">${es?'Guía de inicio':'Getting started'}</div>
          <h2 class="dr-title">${es?'Guía Rápida — Fijo SOHO/SMB 2026':'Quick Guide — Fixed SOHO/SMB 2026'}</h2>
          <div class="dr-sub">${es?'La herramienta en el orden en que se usa en una llamada: de la primera pregunta al contrato firmado.':'The tool in the order you use it on a call: from the first question to the signed contract.'}</div>
          <div class="btn-row" style="margin-top:14px"><button class="btn cta sm" onclick="setTab('flow');flowGo(1)">${es?'Abrir Flujo de Venta':'Open Sales Flow'} →</button></div>
        </div>
        <div class="dr-kpis">
          ${box('1 · '+(es?'Descubrir':'Discover'), es?'Escuche':'Listen', es?'Preguntas abiertas':'Open questions', 1)}
          ${box('2 · '+(es?'Oferta':'Offer'), es?'Cotice':'Quote', es?'Plan y ahorro':'Plan and savings', 2)}
          ${box('3 · '+(es?'Objeciones':'Objections'), 'AIM', es?'Reconozca, Informe, Avance':'Acknowledge, Inform, Move on', 3)}
          ${box('4 · '+(es?'Cierre':'Close'), es?'Avance':'Move ahead', es?'Asuma la venta':'Assume the sale', 4)}
        </div>
      </div>
    </section>
    <div class="sf-howto-card">
      <div class="card">
        <h3 style="margin-top:0">${es?'Flujo de trabajo recomendado':'Recommended workflow'}</h3>
        ${steps.map((st,i)=>`
          <div class="howto-step">
            <div class="howto-num">${i+1}</div>
            <div><h4>${sfEsc(st[0])}</h4><p>${sfEsc(st[1])}</p></div>
          </div>`).join('')}
      </div>
      <h3 class="sf-areas-h">${es?'Qué hay en cada pestaña':'What each tab is for'}</h3>
    </div>`;
}

// Called from app.js renderAll() / setTab()
function sfRenderAll(){ sfRenderHowTo(); renderFlow(); sfRenderPropBar(); }

// ═══════════════════════════════════════════════════════════════════════════
// FMC CROSS-SELL (UAT) — "Liberty services today" + the FMC path between the
// B2B Fixed and B2B Mobile Sales Tools.
// Business rule: there is NO FMC offer on the mobile side. The FMC benefit is on
// the fixed service (Double Bandwidth / FMC prices); mobile prices don't change.
// Hand-off: this tool opens the other one in a new tab and they exchange the
// customer brief and the totals with window.postMessage, only with the other
// tool's official addresses. Nothing travels in the URL.
// ═══════════════════════════════════════════════════════════════════════════
const SF_TOOL = 'fixed';                         // 'fixed' | 'mobile'
const SF_PARTNER_URL = 'https://liberty-business-sales-guide.vercel.app/guide.html';
const SF_PARTNER_ORIGINS = ['https://liberty-business-sales-guide.vercel.app','https://liberty-business-sales-guide.vercel.app'];
const SF_SVC = [
  {id:'fixed',  en:'Fixed',  es:'Fijo'},
  {id:'mobile', en:'Mobile', es:'Móvil'},
  {id:'both',   en:'Both',   es:'Ambos'},
  {id:'none',   en:'None',   es:'Ninguno'}];
let sfFmcPending = false;              // this tab asked the other tool for a quote
let sfPartnerReply = null;             // {monthly, items, lines} received back

function sfSvc(){
  if(SELL.libSvc) return SELL.libSvc;
  if(SELL.disc==='fmc') return SF_TOOL==='fixed' ? 'mobile' : 'fixed';
  return '';
}
function sfHasOther(){ const v = sfSvc(); return SF_TOOL==='fixed' ? (v==='mobile'||v==='both') : (v==='fixed'||v==='both'); }
function brSvcHtml(){
  const es = sfEs(), cur = SELL.libSvc;
  return SF_SVC.map(o=>`<button class="br-chip ${cur===o.id?'on':''}" onclick="sfSetSvc('${o.id}')">${es?o.es:o.en}</button>`).join('');
}
function sfSetSvc(v){ SELL.libSvc = (SELL.libSvc===v) ? '' : v; drLive(); if(SELL.step===2) flowStageRefresh(); }

// ── FMC card in "Build the offer" ──────────────────────────────────────────
function sfFmcCardHtml(){
  const es = sfEs(), other = SF_TOOL==='fixed' ? (es?'Mobile Sales Tool':'Mobile Sales Tool') : 'Fixed Sales Tool';
  let title, body, actions = '';
  const got = sfPartnerReply ? `<div class="fmc-got">✓ ${SF_TOOL==='fixed'
      ? (es?`Total móvil recibido: <b>${savMoney(sfPartnerReply.monthly)}/mes</b>${sfPartnerReply.lines?` · ${sfPartnerReply.lines} línea(s)`:''} (en la fila Móvil)`:`Mobile total received: <b>${savMoney(sfPartnerReply.monthly)}/mo</b>${sfPartnerReply.lines?` · ${sfPartnerReply.lines} line(s)`:''} (on the Mobile row)`)
      : (es?`Total fijo recibido: <b>${savMoney(sfPartnerReply.monthly)}/mes</b> (en la fila Internet)`:`Fixed total received: <b>${savMoney(sfPartnerReply.monthly)}/mo</b> (on the Internet row)`)}</div>` : '';
  const openBtn = `<button class="btn sm" onclick="sfOpenPartner()">${SF_TOOL==='fixed'
      ? (es?'Cotizar líneas en el Mobile Sales Tool':'Quote lines in the Mobile Sales Tool')
      : (es?'Ver opciones FMC en el Fixed Sales Tool':'See FMC options in the Fixed Sales Tool')} ↗</button>`;
  if(SF_TOOL==='fixed'){
    const p = state.prop || {};
    // adding mobile = the request came from the Mobile tool, or a mobile total came back
    const adding = (SELL.partner && SELL.partner.from==='mobile') || savNum(sav.lib.mobile) > 0;
    if(sfHasOther() || adding){
      title = sfHasOther() ? (es?'Cliente con Móvil Liberty: cotice FMC':'Liberty Mobile customer: quote FMC')
                           : (es?'Añade Móvil Liberty: cotice FMC':'Adding Liberty Mobile: quote FMC');
      body = (sfHasOther()
               ? (es?'Con su línea móvil B2B activa, ':'With their active B2B mobile line, ')
               : (es?'Con las líneas móviles B2B que añade, ':'With the B2B mobile lines they are adding, '))
           + (es?'su internet califica para <b>FMC Double Bandwidth</b> (el doble de velocidad). Cotice con la tecnología FMC. Confirme la elegibilidad en MyKnowledge (Salesforce).'
                :'their internet qualifies for <b>FMC Double Bandwidth</b> (double the speed). Quote it with the FMC technology. Confirm eligibility in MyKnowledge (Salesforce).');
      actions = (p.tech==='FMC' ? `<span class="sync-pill">✓ ${es?'Cotizando FMC':'Quoting FMC'}</span>`
                                : `<button class="btn sm" onclick="sfQTech('FMC')">${es?'Usar FMC en la cotización':'Use FMC in the quote'}</button>`)
              + (!sfHasOther() && !SELL.partner ? ` <button class="btn sm ghost" onclick="sfOpenPartner()">${es?'Actualizar líneas en el Mobile Sales Tool':'Update lines in the Mobile Sales Tool'} ↗</button>` : '');
    } else {
      title = es?'Ofrezca móvil también (FMC)':'Offer mobile too (FMC)';
      body = es?'Si añade una línea móvil B2B, su internet califica para <b>FMC Double Bandwidth</b>. Cotice las líneas en el Mobile Sales Tool: el total del carrito regresa a la fila Móvil de aquí. Los precios móviles no cambian.'
               :'If they add a B2B mobile line, their internet qualifies for <b>FMC Double Bandwidth</b>. Quote the lines in the Mobile Sales Tool: the cart total comes back to the Mobile row here. Mobile prices don\'t change.';
      actions = openBtn;
    }
  } else {
    if(sfHasOther()){
      title = es?'Cliente con Fijo Liberty: FMC':'Liberty Fixed customer: FMC';
      body = es?'Al añadir estas líneas móviles B2B, su internet Liberty califica para <b>FMC Double Bandwidth</b> (el doble de velocidad). Los precios móviles no cambian: no hay oferta FMC en el lado móvil. Revise la velocidad FMC en el Fixed Sales Tool.'
               :'Adding these B2B mobile lines makes their Liberty internet eligible for <b>FMC Double Bandwidth</b> (double the speed). Mobile prices don\'t change: there is no FMC offer on the mobile side. Check the FMC speed in the Fixed Sales Tool.';
    } else {
      title = es?'Ofrezca internet también (FMC)':'Offer internet too (FMC)';
      body = es?'Cotice internet, voz y video en el Fixed Sales Tool: con estas líneas móviles su internet califica para <b>FMC Double Bandwidth</b>. El total fijo regresa a la fila Internet de aquí. Los precios móviles no cambian.'
               :'Quote internet, voice and video in the Fixed Sales Tool: with these mobile lines their internet qualifies for <b>FMC Double Bandwidth</b>. The fixed total comes back to the Internet row here. Mobile prices don\'t change.';
    }
    actions = openBtn;
  }
  return `<div class="card fmc-card" style="margin-top:12px">
    <div class="lbl-sm" style="color:#6c3bd9">FMC · ${es?'Fijo + Móvil':'Fixed + Mobile'}</div>
    <h3 style="margin:0 0 6px">${title}</h3>
    <p style="margin:0 0 10px;font-size:12.8px;color:var(--muted)">${body}</p>
    ${got}<div class="btn-row">${actions}</div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:8px">${es?`El ${other} abre en una pestaña nueva; esta cotización se queda aquí.`:`The ${other} opens in a new tab; this quote stays here.`}</div>
  </div>`;
}

// ── Banner when THIS tab was opened by the other tool ───────────────────────
function sfPartnerBannerHtml(){
  if(!SELL.partner) return '';
  const es = sfEs(), who = (SELL.company||SELL.cust||'').trim();
  const from = SELL.partner.from==='fixed' ? 'Fixed Sales Tool' : 'Mobile Sales Tool';
  const tot = SF_TOOL==='mobile' ? cartTotals().monthly : (fijoQuote().ready ? fijoQuote().monthly : 0);
  const what = SF_TOOL==='mobile' ? (es?'móvil':'mobile') : (es?'fijo':'fixed');
  return `<div class="fmc-banner">
    <div><b>${es?'Cotización FMC':'FMC quote'}${who?` · ${sfEsc(who)}`:''}</b><br>
      <span>${es?`Pedida desde el ${from}. Arme la cotización ${what} y envíe el total de regreso.`:`Requested from the ${from}. Build the ${what} quote, then send the total back.`}</span></div>
    <button class="btn sm cta" onclick="sfSendTotalBack()" ${tot>0?'':'disabled'}>${es?`Enviar total ${what}`:`Send ${what} total`}${tot>0?` (${savMoney(tot)})`:''} → ${from}</button>
  </div>`;
}

// ── Pitch line ──────────────────────────────────────────────────────────────
function sfFmcPitch(type){
  const es = sfEs();
  if(SF_TOOL==='fixed'){
    const p = state.prop || {}, mob = savNum(sav.lib.mobile) > 0;
    if(!(p.tech==='FMC' || sfHasOther() || mob)) return '';
    const spd = (p.tech==='FMC' && p.speed) ? (p.speed.displaySpeed||p.speed.speed) : '';
    return es ? `Y como ${sfHasOther()?'ya tiene':'añade'} móvil B2B de Liberty, su internet califica para FMC Double Bandwidth${spd?`: ${spd}`:''}, el doble de velocidad.`
              : `And because you ${sfHasOther()?'already have':'are adding'} Liberty B2B mobile, your internet qualifies for FMC Double Bandwidth${spd?`: ${spd}`:''}, double the speed.`;
  }
  const fix = savNum(sav.lib.internet) > 0;
  if(!(sfHasOther() || fix)) return '';
  return es ? 'Y con estas líneas móviles, su internet Liberty califica para FMC Double Bandwidth: el doble de velocidad, sin cambiar el precio de sus líneas.'
            : 'And with these mobile lines, your Liberty internet qualifies for FMC Double Bandwidth: double the speed, with no change to your mobile prices.';
}

// ── Messaging between the two tools ─────────────────────────────────────────
function sfBrief(){
  return {cust:SELL.cust, company:SELL.company, addr:SELL.addr, need:SELL.need, notes:SELL.notes,
          vals:Object.keys(SELL.vals).filter(k=>SELL.vals[k]), libSvc:SELL.libSvc,
          cur:Object.assign({}, sav.cur)};
}
function sfOpenPartner(){
  sfFmcPending = true;
  const w = window.open((window.lbSsoUrl ? lbSsoUrl(SF_PARTNER_URL, lang) : SF_PARTNER_URL), '_blank');   // keeps window.opener so the two tabs can talk
  if(!w) alert(sfEs()?'Permita ventanas emergentes para abrir la otra herramienta.':'Allow pop-ups to open the other tool.');
}
function sfSendTotalBack(){
  const P = SELL.partner; if(!P || !P.source) return;
  let msg;
  if(SF_TOOL==='mobile'){ const c = cartTotals(); msg = {monthly:c.monthly, lines:c.lines, items:c.names}; }
  else { const q = fijoQuote(); if(!q.ready) return; msg = {monthly:q.monthly, items:q.items.map(i=>i.name)}; }
  try{ P.source.postMessage(Object.assign({lb:'fmc-total', from:SF_TOOL}, msg), P.origin); }catch(e){}
  alert(sfEs()?'Total enviado. Regrese a la pestaña de la otra herramienta.':'Total sent. Go back to the other tool\'s tab.');
}
window.addEventListener('message', function(e){
  if(SF_PARTNER_ORIGINS.indexOf(e.origin) < 0) return;           // only the other Liberty tool
  const d = e.data || {}; if(typeof d !== 'object' || !d.lb) return;
  if(d.lb==='fmc-hello' && sfFmcPending && e.source){
    e.source.postMessage({lb:'fmc-brief', from:SF_TOOL, brief:sfBrief()}, e.origin);
  }
  else if(d.lb==='fmc-brief' && d.brief){
    const b = d.brief;
    ['cust','company','addr','need','notes'].forEach(k=>{ if(!String(SELL[k]||'').trim() && b[k]) SELL[k] = String(b[k]); });
    (b.vals||[]).forEach(v=>{ if(VALUES.some(x=>x.id===v)) SELL.vals[v] = true; });
    if(!SELL.libSvc && b.libSvc) SELL.libSvc = b.libSvc;
    Object.keys(b.cur||{}).forEach(k=>{ if(!sav.cur[k] && b.cur[k]) sav.cur[k] = b.cur[k]; });
    if(SF_TOOL==='fixed' && typeof propInit==='function'){ propInit(); if(SELL.cust) state.prop.customer.name = SELL.cust; if(SELL.company) state.prop.customer.company = SELL.company; }
    SELL.partner = {from:d.from, origin:e.origin, source:e.source};
    SELL.step = 2;
    if(SF_TOOL==='fixed') setTab('flow'); else showTab('flow', document.getElementById('tab-flow'));
    renderFlow();
  }
  else if(d.lb==='fmc-total'){
    sfPartnerReply = {monthly:+d.monthly||0, lines:d.lines||0, items:d.items||[]};
    if(SF_TOOL==='fixed') sav.lib.mobile = sfPartnerReply.monthly.toFixed(2);
    else { sav.lib.internet = sfPartnerReply.monthly.toFixed(2); sav.lib.phone=''; sav.lib.video=''; }
    SELL.step = 2;
    if(SF_TOOL==='fixed') setTab('flow'); else showTab('flow', document.getElementById('tab-flow'));
    renderFlow();
  }
});
// When the other tool opened this tab, say hello so it can send the customer brief
(function(){
  if(!window.opener) return;
  SF_PARTNER_ORIGINS.forEach(o=>{ try{ window.opener.postMessage({lb:'fmc-hello', tool:SF_TOOL}, o); }catch(e){} });
})();
