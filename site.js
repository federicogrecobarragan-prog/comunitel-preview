// V6 (docs/22): product lines, news filter, newsletter, on-demand map and the assistant launcher.
// The hero and Studio B interactions stay in main.js; this module only touches sections below the fold.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const safeEvents = new Set(['line_tab', 'news_filter', 'news_open', 'newsletter_submit', 'newsletter_error', 'map_load', 'agent_open', 'agent_handoff']);
export function track(action) { if (safeEvents.has(action)) window.dispatchEvent(new CustomEvent('comunitel:analytics', { detail: { event: 'comunitel_interaction', action } })); }
const config = fetch('/api/config').then(r => r.ok ? r.json() : {}).catch(() => ({}));

// Product lines: ARIA tabs. Without JS every panel stays visible.
const tabs = $$('.line-tab');
function selectLine(line, focus = false) {
  const tab = tabs.find(t => t.dataset.line === line) || tabs[0];
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  }
  if (focus) tab.focus();
}
if (tabs.length) {
  selectLine('opticas');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { selectLine(t.dataset.line); track('line_tab'); });
    t.addEventListener('keydown', e => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      selectLine(tabs[(next + tabs.length) % tabs.length].dataset.line, true);
    });
  });
  $$('a[data-line]').forEach(a => a.addEventListener('click', () => selectLine(a.dataset.line)));
}

// News: filter by topic; the featured story counts like any other card.
const filters = $$('.news-filters button'), stories = $$('#novedades [data-topic]:is(article, li)'), empty = $('.news-empty');
function filterNews(topic) {
  let shown = 0;
  for (const b of filters) b.setAttribute('aria-pressed', String(b.dataset.topic === topic));
  for (const s of stories) { const on = topic === 'todas' || s.dataset.topic === topic; s.hidden = !on; shown += on; }
  if (empty) empty.hidden = shown > 0;
}
filters.forEach(b => b.addEventListener('click', () => { filterNews(b.dataset.topic); track('news_filter'); }));
$('[data-topic-reset]')?.addEventListener('click', () => filterNews('todas'));
stories.forEach(s => s.querySelector('a')?.addEventListener('click', () => track('news_open')));

// Newsletter: same fail-closed contract as the lead form. Nothing is announced as sent without a receipt.
const nl = $('#newsletter-form');
if (nl) {
  const status = $('#newsletter-status'), button = $('#newsletter-submit');
  config.then(c => { if (c.newsletterEnabled) $('#newsletter-notice').textContent = 'Te enviaremos solo el newsletter. Podés darte de baja en cualquier momento.'; });
  nl.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(nl), email = String(data.get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = 'Revisá el email: parece incompleto.'; nl.email.focus(); return; }
    if (!nl.consent.checked) { status.textContent = 'Para suscribirte necesitamos tu aceptación.'; nl.consent.focus(); return; }
    const body = { email, name: String(data.get('name') || '').trim(), interests: data.getAll('interests'), consent: true, website: String(data.get('website') || '') };
    track('newsletter_submit');
    // Like the lead form: without a configured provider nothing is sent (also on static hosting, where /api does not exist).
    if (!(await config).newsletterEnabled) { status.textContent = 'Vista previa: la suscripción no se envió porque todavía no hay proveedor de correo configurado.'; return; }
    button.disabled = true; status.textContent = 'Enviando…';
    try {
      const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      const res = await r.json().catch(() => ({}));
      if (r.ok && res.subscribed === true) { status.textContent = 'Listo: quedaste suscripto a Red en foco.'; nl.reset(); }
      else if (res.error === 'provider_not_configured') status.textContent = 'Vista previa: la suscripción no se envió porque todavía no hay proveedor de correo configurado.';
      else { status.textContent = 'No pudimos registrar la suscripción. Probá de nuevo más tarde.'; track('newsletter_error'); }
    } catch { status.textContent = 'No pudimos registrar la suscripción. Probá de nuevo más tarde.'; track('newsletter_error'); }
    finally { button.disabled = false; }
  });
}

// Map: our own SVG first; Google Maps only after an explicit click (the page makes no third-party request before it).
const canvas = $('#map-canvas');
if (canvas) {
  new IntersectionObserver(([entry]) => canvas.classList.toggle('in-view', entry.isIntersecting)).observe(canvas);
  $('#map-load').addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.title = 'Mapa interactivo de Google Maps con la ubicación de Comunitel';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.src = 'https://maps.google.com/maps?t=m&output=embed&iwloc=near&z=15&q=Comunitel+S.A.%2C+Av.+Ing.+Eduardo+Madero+2250%2C+B1669CLQ+Del+Viso%2C+Provincia+de+Buenos+Aires';
    canvas.replaceChildren(frame);
    track('map_load');
  });
}

// Assistant: the launcher appears once the page is idle; the conversation code loads on first use.
const agent = $('#agent'), launcher = $('#agent-launcher'), teaser = $('#agent-teaser');
if (agent && launcher) {
  let module = null, opened = false;
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} } };
  // The teaser speaks once per session, only where the launcher is usable (on phones the hero hides it), and leaves on its own.
  const phone = matchMedia('(max-width:760px)');
  let teaserTimer = 0, teaserDone = !!store.get('agent-teaser');
  const maybeTeaser = () => {
    if (teaserDone || opened || teaserTimer || (phone.matches && agent.classList.contains('is-raised'))) return;
    teaserTimer = setTimeout(() => {
      if (opened || (phone.matches && agent.classList.contains('is-raised'))) { teaserTimer = 0; return; }
      teaser.hidden = false; teaserDone = true; store.set('agent-teaser', '1');
      setTimeout(() => { teaser.hidden = true; }, 12000);
    }, 4000);
  };
  const show = () => {
    agent.hidden = false;
    // While the film stage is on screen the launcher clears its controls (desktop) or steps aside (phones).
    const stage = $('.story-stage');
    if (stage) new IntersectionObserver(([entry]) => { agent.classList.toggle('is-raised', entry.isIntersecting); maybeTeaser(); }, { threshold: 0 }).observe(stage);
    maybeTeaser();
  };
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
  if (document.readyState === 'complete') idle(show, { timeout: 2500 }); else addEventListener('load', () => idle(show, { timeout: 2500 }), { once: true });
  $('#agent-teaser-close').addEventListener('click', () => { teaser.hidden = true; });
  const open = async (question) => {
    opened = true; teaser.hidden = true;
    try { module = module || await import('./agent.js?v=60'); }
    catch { launcher.querySelector('.agent-label strong').textContent = 'Asistente no disponible'; return; }
    module.openAgent({ root: agent, launcher, config: await config, question, track, reduced: reduced.matches });
    track('agent_open');
  };
  launcher.addEventListener('click', () => open());
  teaser.querySelector('span').addEventListener('click', () => open());
}
