// V6 assistant (docs/22). Local mode answers only from information Comunitel publishes; it never invents
// prices, stock, weights, deadlines or channels. An LLM endpoint can take over only when the server says so
// (/api/config → agentMode:"llm"); otherwise nothing leaves the browser. Messages live in memory only.
const OFFICIAL = 'https://comunitel.com.ar';
const KB = [
  { id: 'saludo', keys: ['hola', 'buen dia', 'buenos dias', 'buenas', 'buenas tardes', 'buenas noches', 'que tal', 'hey'],
    text: ['¡Hola! Te ayudo con productos, obras llave en mano, servicio técnico, minería o cómo contactarnos. ¿Qué necesitás?'] },
  { id: 'empresa', keys: ['quienes son', 'que hacen', 'que es comunitel', 'empresa', 'experiencia', 'trayectoria', 'nosotros', 'a que se dedican'],
    text: ['Comunitel es una empresa de telecomunicaciones con más de 25 años de experiencia.', 'Hacemos ingeniería y obras llave en mano de redes subterráneas, ópticas y de seguridad, distribuimos productos de cuatro líneas y somos servicio técnico oficial Grandway.'],
    actions: [{ label: 'Quiénes somos', section: '#nosotros' }, { label: 'Las tres redes', section: '#redes' }] },
  { id: 'opticas', keys: ['fibra', 'optica', 'opticas', 'ftth', 'gpon', 'pon', 'pol', 'passive optical', 'wifi', 'cableado estructurado', 'punto a punto', 'enlace', 'splitter', 'drop'],
    text: ['En redes ópticas hacemos obras llave en mano: redes FTTH, enlaces punto a punto, redes POL, WiFi, cableado estructurado y mantenimiento.', 'En el catálogo hay soluciones WiFi, equipos GPON, equipos activos, accesorios de fibra, materiales de plantel, red estructurada e instrumental.'],
    actions: [{ label: 'Productos ópticos', section: '#productos', line: 'opticas' }, { label: 'Obras', section: '#ingenieria' }] },
  { id: 'subterraneas', keys: ['subterranea', 'subterraneas', 'subterraneo', 'ducto', 'ductos', 'microducto', 'microductos', 'zanja', 'zanjadora', 'obra civil', 'canalizacion', 'soterrado', 'enterrado', 'tritubo'],
    text: ['En redes subterráneas hacemos obra civil, alquiler de zanjadora con operario, instalación de ductos y microductos y redes de fibra subterránea.', 'Las soluciones Hidrostank están homologadas en Telecom, Telefónica, Claro, Trenes Argentinos, Metrotel y Ufinet.'],
    actions: [{ label: 'Productos subterráneos', section: '#productos', line: 'subterraneas' }, { label: 'Obras', section: '#ingenieria' }] },
  { id: 'arquetas', keys: ['arqueta', 'arquetas', 'camara de inspeccion', 'hidrostank', 'modular', 'modulares', 'caja de registro', 'registro', 'tapa'],
    text: ['Las arquetas modulares Hidrostank son de polipropileno reforzado, desmontables y autoportantes: no necesitan hormigonado externo ni maquinaria pesada.', 'El díptico de minería publica interiores desde 35×35 hasta 146×146 cm, alturas de 40 a 120 cm y tapas de fundición dúctil, plástico u hormigón. La referencia exacta, las cargas y el método se definen con la ficha técnica.'],
    actions: [{ label: 'Arquetas en el catálogo', href: OFFICIAL + '/product-category/redes-subterraneas/arquetas-modulares-polimericas/' }, { label: 'En foco: la arqueta', section: '#sistema' }] },
  { id: 'seguridad', keys: ['seguridad', 'camara', 'camaras', 'cctv', 'video', 'videovigilancia', 'monitoreo', 'cerco', 'cercos', 'perimetral', 'alarma', 'alarmas', 'acceso', 'accesos', 'control de acceso', 'biometrico', 'huella', 'facial', 'hikvision', 'ezviz', 'sera4'],
    text: ['En redes de seguridad hacemos obras llave en mano: video seguridad, centros de monitoreo, cercos eléctricos, sistemas de acceso, fibra sensitiva y barreras infrarrojas.', 'El control de accesos admite documentos, huella, reconocimiento facial, QR, iris, patentes, TAG o tarjetas, y se integra con alarmas y botones de pánico.'],
    actions: [{ label: 'Productos de seguridad', section: '#productos', line: 'seguridad' }, { label: 'Obras', section: '#ingenieria' }] },
  { id: 'electricas', keys: ['electrica', 'electricas', 'energia', 'tension', 'sobretension', 'proteccion de cables', 'parque solar', 'parques solares', 'solar', 'empalme', 'empalmes', 'cinta', 'cintas', 'sinetamer', 'media tension'],
    text: ['La línea de redes eléctricas incluye instrumental, protectores de tensión, protección de cables enterrados, herrajes especiales para parques solares, empalmes y cintas y accesorios para redes de energía.'],
    actions: [{ label: 'Productos eléctricos', section: '#productos', line: 'electricas' }] },
  { id: 'servicio', keys: ['servicio tecnico', 'reparacion', 'reparar', 'arreglo', 'calibracion', 'calibrar', 'grandway', 'fusionadora', 'empalmadora', 'otdr', 'powermeter', 'power meter', 'garantia', 'repuesto', 'repuestos'],
    text: ['Somos servicio técnico oficial Grandway: reparamos y calibramos fusionadoras, OTDR, powermeters y otros equipos Grandway, dentro o fuera de garantía, con repuestos oficiales y técnicos certificados.', 'También hay stock de instrumentos y herramientas Grandway.'],
    actions: [{ label: 'Pedir servicio técnico', handoff: 'Servicio técnico' }, { label: 'Ver la sección', section: '#servicio-tecnico' }] },
  { id: 'mineria', keys: ['mineria', 'minero', 'minera', 'mina', 'litio', 'salar', 'oil', 'gas', 'petroleo', 'ambiente agresivo', 'ambientes agresivos', 'lightera', 'opgw', 'opdc'],
    text: ['Para minería somos integrador tecnológico: conectividad Lightera para ambientes agresivos, arquetas modulares Hidrostank y soluciones eléctricas 3M.', 'Un caso publicado: el Proyecto Mariana, en el Salar de Llullaillaco (Salta), usa arquetas Hidrostank.'],
    actions: [{ label: 'Ver Minería', section: '#mineria' }, { label: 'Hablar con el equipo', handoff: 'Minería' }] },
  { id: 'ubicacion', keys: ['donde', 'ubicacion', 'ubicados', 'direccion', 'como llego', 'como llegar', 'mapa', 'del viso', 'oficina', 'oficinas', 'sucursal', 'cordoba', 'pilar'],
    text: ['Estamos en Av. Ing. Eduardo Madero 2250, Del Viso (B1669CLQ), provincia de Buenos Aires. En Córdoba atendemos al +54 (9351) 366-5266.'],
    actions: [{ label: 'Ver el mapa', section: '#ubicacion' }, { label: 'Cómo llegar', href: 'https://www.google.com/maps/dir/?api=1&destination=Comunitel%20S.A.%2C%20Av.%20Ing.%20Eduardo%20Madero%202250%2C%20Del%20Viso' }] },
  { id: 'horario', keys: ['horario', 'horarios', 'hora', 'abren', 'atienden', 'abierto', 'cierran', 'sabado', 'domingo', 'feriado'],
    text: ['Atendemos de lunes a viernes de 8 a 17 h. Sábados y domingos, cerrado.'] },
  { id: 'contacto', keys: ['telefono', 'llamar', 'llamo', 'mail', 'email', 'correo', 'contacto', 'contactar', 'hablar con', 'asesor', 'vendedor', 'comercial', 'humano', 'persona'],
    text: ['Podés llamar al +54 (02320) 400989 o escribir a comunitel@comunitelsa.com.ar. Si querés, paso tu consulta al formulario para que el equipo te responda.'],
    actions: [{ label: 'Pasar al formulario', handoff: '' }, { label: 'Llamar', href: 'tel:+542320400989' }] },
  { id: 'precio', keys: ['precio', 'precios', 'cotizacion', 'cotizar', 'presupuesto', 'costo', 'cuanto sale', 'cuanto cuesta', 'valor', 'comprar', 'compra', 'stock', 'disponibilidad'],
    text: ['Los precios y la disponibilidad dependen de la referencia, las cantidades y el proyecto; por eso en el catálogo figuran como «Consultar».', 'Dejanos los datos y el equipo comercial te prepara la cotización.'],
    actions: [{ label: 'Pedir cotización', handoff: '' }, { label: 'Catálogo oficial', href: OFFICIAL + '/distribucion/' }] },
  { id: 'whatsapp', keys: ['whatsapp', 'wsp', 'wpp', 'whats'],
    text: ['El canal de WhatsApp corporativo todavía está pendiente de confirmación. Mientras tanto podés llamar, escribir por mail o dejar tu consulta en el formulario.'],
    actions: [{ label: 'Pasar al formulario', handoff: '' }] },
  { id: 'novedades', keys: ['novedad', 'novedades', 'noticia', 'noticias', 'agis', 'gis', 'gemelo digital', 'sion', 'stratos', 'inteligencia territorial', 'agente de ia'],
    text: ['Algunas novedades recientes: el relevamiento de inteligencia territorial para la expansión de SION, el agente de IA de aGIS Telco y el premio a Stratos GS por la innovación de aGIS Telco.'],
    actions: [{ label: 'Ver novedades', section: '#novedades' }] },
  { id: 'newsletter', keys: ['newsletter', 'suscribir', 'suscribirme', 'suscripcion', 'boletin', 'mailing'],
    text: ['«Red en foco» es el newsletter de Comunitel: obras, tecnología y novedades de redes. Podés suscribirte en la sección Newsletter.'],
    actions: [{ label: 'Ir al newsletter', section: '#newsletter' }] },
  { id: 'marcas', keys: ['cliente', 'clientes', 'partner', 'partners', 'marca', 'marcas', 'representan', 'distribuyen', 'corning'],
    text: ['Trabajamos con marcas como Corning, Lightera, Grandway, Cablena, IWISS y Zyxel en redes ópticas; Hidrostank, 3M y Layegas en subterráneas; Hikvision, EZVIZ y Sera4 en seguridad; y SineTamer en eléctricas.'],
    actions: [{ label: 'Clientes y partners', section: '#clientes' }] },
  { id: 'cobertura', keys: ['envio', 'envios', 'envian', 'interior', 'provincia', 'todo el pais', 'cobertura', 'llegan a', 'trabajan en'],
    text: ['No tengo confirmado el alcance de envíos u obras para tu zona. El equipo comercial te lo confirma según el proyecto.'],
    actions: [{ label: 'Consultar al equipo', handoff: '' }] },
  { id: 'empleo', keys: ['trabajo', 'empleo', 'cv', 'curriculum', 'trabajar con ustedes', 'busqueda laboral', 'postular'],
    text: ['No tengo información sobre búsquedas laborales. Podés escribir a comunitel@comunitelsa.com.ar.'] },
  { id: 'gracias', keys: ['gracias', 'muchas gracias', 'chau', 'adios', 'genial', 'perfecto', 'buenisimo'],
    text: ['¡De nada! Si necesitás algo más, estoy acá.'] },
];
const CHIPS = [['Redes ópticas', 'Redes ópticas'], ['Arquetas', 'Arquetas Hidrostank'], ['Seguridad', 'Redes de seguridad'], ['Servicio técnico', 'Servicio técnico Grandway'], ['Minería', 'Minería'], ['Dónde están', '¿Dónde están?'], ['Horarios', 'Horarios'], ['Cotizar', 'Quiero cotizar']];
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
const PREP = KB.map(e => ({ ...e, nkeys: e.keys.map(norm) }));
export function answer(question) {
  const q = ' ' + norm(question) + ' ';
  const scored = PREP.map(e => ({ e, score: e.nkeys.reduce((s, k) => s + (q.includes(' ' + k + ' ') || (k.length > 5 && q.includes(k)) ? 1 + k.split(' ').length : 0), 0) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  const best = scored[0].e.id === 'saludo' && scored.length > 1 ? scored[1] : scored[0];
  return { entry: best.e, alternatives: scored.filter(x => x !== best && x.e.id !== 'saludo').slice(0, 2).map(x => x.e) };
}
const LABEL = { opticas: 'Redes ópticas', subterraneas: 'Redes subterráneas', arquetas: 'Arquetas Hidrostank', seguridad: 'Redes de seguridad', electricas: 'Redes eléctricas', servicio: 'Servicio técnico', mineria: 'Minería', ubicacion: 'Ubicación', horario: 'Horarios', contacto: 'Contacto', precio: 'Cotizaciones', novedades: 'Novedades', newsletter: 'Newsletter', marcas: 'Marcas', empresa: 'Comunitel' };

let state = null;
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') node.className = v; else if (k.startsWith('on')) node.addEventListener(k.slice(2), v); else node.setAttribute(k, v); }
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}
function build({ root, launcher, config, track, reduced }) {
  const log = el('div', { class: 'agent-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  const input = el('input', { id: 'agent-input', autocomplete: 'off', maxlength: '300', placeholder: 'Escribí tu consulta…' });
  const form = el('form', { class: 'agent-form' }, el('label', { class: 'sr-only', for: 'agent-input' }, 'Escribí tu consulta'), input, el('button', { class: 'agent-send', type: 'submit', 'aria-label': 'Enviar consulta' }, 'Enviar'));
  const close = el('button', { class: 'agent-close', type: 'button', 'aria-label': 'Cerrar asistente' }, '×');
  const chips = el('div', { class: 'agent-chips', role: 'group', 'aria-label': 'Preguntas frecuentes' }, CHIPS.map(([label, q]) => el('button', { type: 'button', onclick: () => ask(q) }, label)));
  const llm = config && config.agentMode === 'llm';
  const panel = el('div', { class: 'agent-panel', id: 'agent-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'agent-title' },
    el('div', { class: 'agent-head' }, el('span', { class: 'agent-avatar', 'aria-hidden': 'true' }, 'C'), el('div', {}, el('strong', { id: 'agent-title' }, 'Asistente Comunitel'), el('small', {}, llm ? 'Asistente con IA · respuestas revisables por el equipo' : 'Modo local · responde con información publicada')), close),
    log, chips, form,
    el('p', { class: 'agent-foot' }, llm ? 'Tus mensajes se procesan para responderte. No compartas datos sensibles.' : 'Asistente automático en modo local: no guarda ni envía tus mensajes. Para una cotización te conectamos con el equipo.'));
  const history = [];
  const say = (who, parts, actions = []) => {
    const bubble = el('div', { class: 'agent-msg ' + who });
    for (const p of [].concat(parts)) bubble.append(el('p', {}, p));
    if (actions.length) bubble.append(el('div', { class: 'agent-actions' }, actions.map(a => a.href
      ? el('a', { href: a.href, target: a.href.startsWith('tel:') ? '_self' : '_blank', rel: 'noopener' }, a.label)
      : el('button', { type: 'button', onclick: () => act(a) }, a.label))));
    log.append(bubble); log.scrollTop = log.scrollHeight;
    history.push({ role: who === 'user' ? 'user' : 'assistant', content: [].concat(parts).join(' ') });
  };
  const typing = () => { const t = el('div', { class: 'agent-msg bot agent-typing', 'aria-label': 'Escribiendo' }, el('i'), el('i'), el('i')); log.append(t); log.scrollTop = log.scrollHeight; return t; };
  function act(a) {
    if (a.topic) { const entry = KB.find(e => e.id === a.topic); say('user', LABEL[a.topic]); say('bot', entry.text, entry.actions || []); return; }
    if (a.handoff !== undefined) return handoff(a.handoff);
    if (a.line) document.querySelector(`.line-tab[data-line="${a.line}"]`)?.click();
    hide(false);
    document.querySelector(a.section)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  function handoff(segment) {
    const asked = history.filter(m => m.role === 'user').map(m => m.content).slice(-3);
    const textarea = document.querySelector('#lead-form textarea[name="project"]');
    if (textarea && !textarea.value.trim() && asked.length) textarea.value = 'Consulta iniciada en el asistente: ' + asked.join(' / ');
    const select = document.querySelector('#project-segment');
    if (select && segment) select.value = segment;
    track('agent_handoff');
    hide(false);
    document.querySelector('#contacto')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => document.querySelector('#lead-form input[name="name"]')?.focus({ preventScroll: true }), reduced ? 0 : 600);
  }
  async function ask(text) {
    const q = String(text || '').trim().slice(0, 300);
    if (!q) return;
    say('user', q);
    const t = typing();
    if (llm) {
      try {
        const r = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-10) }), signal: AbortSignal.timeout(20000) });
        const res = await r.json();
        if (r.ok && typeof res.reply === 'string' && res.reply) { t.remove(); say('bot', res.reply, [{ label: 'Hablar con el equipo', handoff: '' }]); return; }
      } catch {}
    }
    await new Promise(r => setTimeout(r, reduced ? 120 : 520));
    t.remove();
    const found = answer(q);
    if (!found) {
      say('bot', ['No tengo ese dato confirmado. Puedo ayudarte con productos, obras, servicio técnico, minería, ubicación u horarios, o pasar tu consulta al equipo.'], [{ label: 'Pasar al equipo', handoff: '' }]);
      return;
    }
    const related = found.alternatives.filter(alt => LABEL[alt.id]).map(alt => ({ label: 'También: ' + LABEL[alt.id], topic: alt.id }));
    say('bot', found.entry.text, [...(found.entry.actions || []), ...related]);
  }
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
  close.addEventListener('click', () => hide(true));
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); hide(true); } });
  function show() { root.classList.add('is-open'); launcher.setAttribute('aria-expanded', 'true'); panel.hidden = false; input.focus({ preventScroll: true }); }
  function hide(focus) { root.classList.remove('is-open'); launcher.setAttribute('aria-expanded', 'false'); panel.hidden = true; if (focus) launcher.focus(); }
  panel.hidden = true;
  document.body.append(panel);
  say('bot',['Hola, soy el asistente de Comunitel. Puedo ayudarte con productos, obras llave en mano, servicio técnico, minería o cómo contactarnos. ¿Qué necesitás?']);
  return { show, hide, ask, isOpen: () => !panel.hidden };
}
export function openAgent(options) {
  state = state || build(options);
  if (state.isOpen()) { state.hide(true); return; }
  state.show();
  if (options.question) state.ask(options.question);
}
