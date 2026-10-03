const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const shortViewport=matchMedia('(max-height:600px) and (min-width:761px), (max-height:740px) and (max-width:760px)');
let paused=reduced.matches,config={preview:true,leadsEnabled:false,whatsapp:''};
const safeEvents=new Set(['nav_contact','hero_quote','product_details','catalog_arquetas','catalog_ductos','catalog_dynatel','catalog_proteccion','catalog_obra','catalog_mallas','segment_select','model_open','lead_error','lead_delivered']);
function track(action){if(safeEvents.has(action))window.dispatchEvent(new CustomEvent('comunitel:analytics',{detail:{event:'comunitel_interaction',action}}));}
document.addEventListener('click',e=>{const link=e.target.closest('[data-event]');if(link)track(link.dataset.event);});
const menu=$('.menu-toggle'),navigation=$('#navigation');
function closeMenu(focus=false){menu.setAttribute('aria-expanded','false');navigation.classList.remove('open');if(focus)menu.focus();}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true')closeMenu(true);});
document.querySelectorAll('[data-segment]').forEach(a=>a.addEventListener('click',()=>{$('#project-segment').value=a.dataset.segment;track('segment_select');}));
document.body.classList.add('has-js');
document.body.classList.toggle('manual-story',shortViewport.matches||reduced.matches);
const film=$('#story-film'),poster=$('#film-poster'),motionButton=$('#motion-toggle'),trackSection=$('.story-track'),stage=$('.story-stage');
const copies=[...document.querySelectorAll('.story-copy')],stops=[...document.querySelectorAll('[data-stop]')];
const scrubber=$('#story-scrubber');
// Time-proportional chapters, not equal thirds: longer rigid-panel assembly has room to read.
const chapterStarts=[0,2.5/23.58,14/23.58,18/23.58,19.5/23.58],chapterStops=[1.2/23.58,9.5/23.58,16.6/23.58,18.4/23.58,22.8/23.58];
let target=0,smooth=0,wanted=0,raf=0,scrollRAF=0,loaded=false,failed=false,posterName='',inStory=true;
const clamp=n=>Math.max(0,Math.min(1,n));
function staticPoster(p){
 const name=p>=chapterStarts[4]?'transport':p>=chapterStarts[3]?'package':p>=chapterStarts[2]?'package':p>=chapterStarts[1]?'exploded':'connected';
 if(name===posterName)return;posterName=name;const source=poster.parentElement.querySelector('source');
 source.srcset='assets/studio-'+name+'-small.jpg';poster.src='assets/studio-'+name+'.jpg';
}
function copyState(){
 const act=chapterStarts.findLastIndex(start=>target>=start);
 for(const [i,copy] of copies.entries()){copy.classList.toggle('is-active',i===act);copy.hidden=i!==act;}
 for(const [i,button] of stops.entries())button.setAttribute('aria-pressed',String(i===act));
 document.documentElement.style.setProperty('--progress',target.toFixed(5));
 scrubber.value=String(Math.round(target*100));
 scrubber.setAttribute('aria-valuetext',Math.round(target*100)+'% del recorrido');
 staticPoster(target);
}
function loadFilm(){if(loaded||failed||paused||reduced.matches)return;loaded=true;film.src=(innerWidth<768||navigator.connection?.saveData)?film.dataset.smallSrc:film.dataset.src;film.preload='auto';film.load();}
function seek(){
 if(paused||reduced.matches||document.hidden||!inStory||film.readyState<2||film.seeking||failed)return;
 const t=Math.max(0,Math.min(wanted,film.duration-.06));
 if(Math.abs(film.currentTime-t)>.035)film.currentTime=t;else film.classList.add('is-visible');
}
function tick(){raf=0;if(paused||reduced.matches||document.hidden||!inStory)return;
 smooth+=(target-smooth)*.14;wanted=smooth*Math.max(0,(film.duration||23.58)-.06);seek();
 if(Math.abs(target-smooth)>.0003)raf=requestAnimationFrame(tick);
}
function render(){if(!raf&&!paused&&!reduced.matches&&!document.hidden&&inStory)raf=requestAnimationFrame(tick);}
function progressFromScroll(){
 const box=trackSection.getBoundingClientRect();inStory=box.bottom>80&&box.top<innerHeight;
 if(!reduced.matches&&!shortViewport.matches)target=clamp((scrollY-trackSection.offsetTop)/Math.max(1,trackSection.offsetHeight-stage.offsetHeight));
 copyState();
 if(inStory&&scrollY>trackSection.offsetTop+2&&!paused&&!reduced.matches)loadFilm();
 if(inStory)render();else{cancelAnimationFrame(raf);raf=0;film.pause();}
}
function onScroll(){if(!scrollRAF)scrollRAF=requestAnimationFrame(()=>{scrollRAF=0;progressFromScroll();});}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
film.addEventListener('loadeddata',()=>{smooth=target;wanted=target*(film.duration-.06);seek();render();});
film.addEventListener('seeked',()=>{if(!paused&&!reduced.matches&&inStory){film.classList.add('is-visible');seek();}});
film.addEventListener('error',()=>{failed=true;film.classList.remove('is-visible');$('.film-caption').textContent='Vista estática conceptual · vídeo no disponible.';});
film.pause();
for(const button of stops)button.addEventListener('click',()=>{
 target=chapterStops[Number(button.dataset.stop)];smooth=target;copyState();
 if(!reduced.matches){if(!shortViewport.matches){const distance=trackSection.offsetHeight-stage.offsetHeight;window.scrollTo({top:trackSection.offsetTop+target*distance,behavior:'instant'});}inStory=true;loadFilm();wanted=target*((film.duration||23.58)-.06);render();}
});
scrubber.addEventListener('input',()=>{target=Number(scrubber.value)/100;copyState();if(!reduced.matches){inStory=true;loadFilm();render();}});
function motionState(){
 cancelAnimationFrame(raf);raf=0;film.pause();
 motionButton.disabled=reduced.matches;
 document.body.classList.toggle('manual-story',shortViewport.matches||reduced.matches);
 motionButton.setAttribute('aria-pressed',String(paused||reduced.matches));
 motionButton.textContent=reduced.matches?'Movimiento reducido':paused?'Activar movimiento ▶':'Pausar movimiento Ⅱ';
 if(reduced.matches){film.classList.remove('is-visible');film.removeAttribute('src');film.load();loaded=false;target=0;smooth=0;document.documentElement.style.setProperty('--descent','0');}
 copyState();if(!paused&&!reduced.matches){loadFilm();progressFromScroll();}
}
motionButton.addEventListener('click',()=>{paused=!paused;motionState();});
reduced.addEventListener('change',()=>{paused=reduced.matches;motionState();});
shortViewport.addEventListener('change',()=>{document.body.classList.toggle('manual-story',shortViewport.matches||reduced.matches);target=0;smooth=0;progressFromScroll();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;film.pause();}else progressFromScroll();});
// Initial poster and copy are immediate; video has no source until scroll or an explicit control.
copyState();motionButton.disabled=reduced.matches;if(reduced.matches)motionButton.textContent='Movimiento reducido';
const details=[
{number:'01 / CONFIGURACIÓN',title:'El acceso se configura.',text:'Referencia, dimensiones, entradas y tapa se definen según el proyecto y la documentación del producto.'},
{number:'02 / CONEXIÓN',title:'Una pieza dentro de la red.',text:'La canalización se evalúa junto al equipo responsable de la obra. Las entradas y los accesorios se consultan por referencia.'},
{number:'03 / DOCUMENTACIÓN',title:'La ficha es el punto de partida.',text:'Método, cargas, manipulación y condiciones de instalación requieren la documentación específica y validación técnica.'}
];
const gallery=$('#gallery-track'),galleryButtons=[...document.querySelectorAll('[data-gallery]')];
function moveGallery(direction){gallery.scrollBy({left:direction*(gallery.querySelector('figure').getBoundingClientRect().width+24),behavior:reduced.matches?'instant':'smooth'});}
for(const button of galleryButtons)button.addEventListener('click',()=>moveGallery(Number(button.dataset.gallery)));
gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveGallery(e.key==='ArrowRight'?1:-1);}});
const replay=$('#replay-dialog'),replayFilm=$('#replay-film'),replayOpen=$('#replay-open');
replayOpen.addEventListener('click',()=>{film.pause();replayFilm.src=(innerWidth<768||navigator.connection?.saveData)?film.dataset.smallSrc:film.dataset.src;replay.showModal();replayFilm.currentTime=0;replayFilm.play().catch(()=>{});$('#replay-close').focus();});
$('#replay-close').addEventListener('click',()=>replay.close());
replay.addEventListener('close',()=>{replayFilm.pause();replayFilm.removeAttribute('src');replayFilm.load();replayOpen.focus();});
replay.addEventListener('click',e=>{if(e.target===replay){const box=replay.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)replay.close();}});
for(const button of document.querySelectorAll('[data-detail]'))button.addEventListener('click',()=>{const detail=details[Number(button.dataset.detail)];for(const other of document.querySelectorAll('[data-detail]'))other.setAttribute('aria-pressed',String(other===button));$('#detail-number').textContent=detail.number;$('#detail-title').textContent=detail.title;$('#detail-text').textContent=detail.text;});
const products={
  chamber:{kind:'ACCESO / HIDROSTANK',title:'El acceso se configura.',description:'Paneles desmontables para configurar un punto de inspección. Elegí la referencia según las condiciones de tu obra.',image:'chamber-product.jpg',alt:'Arqueta modular Hidrostank con paneles negros y ductos rojos, foto suministrada',url:'https://comunitel.com.ar/product-category/redes-subterraneas/arquetas-modulares-polimericas/',event:'catalog_arquetas',note:'Foto suministrada · 3D conceptual Meshy 7.1 de alta calidad, 48,5 MB; carga opcional; no sirve para medir.'},
  duct:{kind:'CANALIZACIÓN / RED',title:'El recorrido también importa.',description:'Caños, ductos y microductos para conducir la red. Diámetro, material y configuración se eligen según el tendido.',image:'chamber-field.jpg',alt:'Canalización y arqueta integradas en una instalación, imagen suministrada; no es una ficha dimensional',url:'https://comunitel.com.ar/product-category/redes-subterraneas/ductos-y-microductos/',event:'catalog_ductos',note:'Imagen de aplicación suministrada; consultá la referencia específica.'},
  locate:{kind:'DETECCIÓN / 3M DYNATEL',title:'Encontrá el punto de partida.',description:'Equipos de localización de activos, fallas y señalización. El método y el equipo se definen según la aplicación.',image:'dynatel.jpg',alt:'Kit de equipo de localización 3M Dynatel, foto suministrada',url:'https://comunitel.com.ar/product-category/redes-subterraneas/localizacion-de-activos-fallas-y-senalizacion/',event:'catalog_dynatel',note:'Foto suministrada; el kit y los accesorios se consultan por referencia.'},
  protect:{kind:'PROTECCIÓN / LAYEGAS',title:'Protegé lo que conecta.',description:'Placas y protección polimérica para canalizaciones enterradas. Consultá la aplicación y las condiciones de uso.',image:'protection-roll.png',alt:'Protección polimérica amarilla en rollo, foto suministrada; no es una malla',url:'https://comunitel.com.ar/product-category/redes-electricas/proteccion-de-cables-enterrados-redes-electricas/',event:'catalog_proteccion',note:'Foto suministrada de protección en rollo. Sin stock ni precio supuesto.'},
  mesh:{kind:'SEÑALIZACIÓN / TENDIDOS',title:'Señalizar también es proteger.',description:'Mallas de advertencia para tendidos. Consultá referencia, presentación y aplicación con el equipo de Comunitel.',image:null,alt:'',url:'#contacto',event:'catalog_mallas',note:'Referencia y fotografía específica pendientes. No mostramos una placa o un rollo de protección como si fuera una malla.'}
};
let model=null,modelClose=null,loadingModel=false,modelGeneration=0;
function closeModel(focus=false){
  modelGeneration++;model?.remove();modelClose?.remove();model=null;modelClose=null;loadingModel=false;
  $('#model-fallback').hidden=false;$('#load-model').disabled=false;$('#load-model').hidden=!document.querySelector('.solution-tab[data-product="chamber"]').classList.contains('active');$('#load-model').innerHTML='Explorar en 3D <span aria-hidden="true">↗</span>';
  if(focus)$('#load-model').focus();
}
const note=document.createElement('div');note.className='product-image-note';note.hidden=true;note.innerHTML='<span>SEÑALIZAR.<br>ANTES DE EXCAVAR.</span><small>La referencia de malla se define con tu proyecto.</small>';$('#model-stage').append(note);
for(const tab of document.querySelectorAll('.solution-tab'))tab.addEventListener('click',()=>{
  closeModel();const p=products[tab.dataset.product];
  document.querySelectorAll('.solution-tab').forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-pressed',String(t===tab));});
  $('#product-kind').textContent=p.kind;$('#product-title').textContent=p.title;$('#product-description').textContent=p.description;
  const img=$('#model-fallback');img.hidden=!p.image;note.hidden=!!p.image;if(p.image){img.src='assets/'+p.image;img.alt=p.alt;}
  $('#load-model').hidden=tab.dataset.product!=='chamber';$('#model-status').textContent=p.note;
  const link=$('#product-link');link.href=p.url;link.dataset.event=p.event;
  link.innerHTML=(p.image?'Ver catálogo oficial':'Consultar la referencia')+' <span aria-hidden="true">↗</span>';
  if(p.url.startsWith('#')){link.removeAttribute('target');link.removeAttribute('rel');}else{link.target='_blank';link.rel='noopener';}
  track(p.event);
});
$('#load-model').addEventListener('click',async()=>{
  if(loadingModel)return;loadingModel=true;const generation=++modelGeneration,button=$('#load-model');button.disabled=true;button.textContent='Cargando modelo…';$('#model-status').textContent='Preparando el 3D. Foto real disponible durante la carga.';
  try{
    await import('./vendor/model-viewer.min.js');await customElements.whenDefined('model-viewer');if(generation!==modelGeneration)return;
    model=document.createElement('model-viewer');model.src='assets/chamber-meshy.glb?v=5';model.alt='Reconstrucción conceptual Meshy 7.1 de alta densidad y texturas PBR; no modelo dimensional';
    for(const [key,value] of Object.entries({'camera-controls':'','disable-zoom':'','touch-action':'pan-y','camera-target':'auto auto auto','shadow-intensity':'.7','interaction-prompt':'none','exposure':'1.1','tabindex':'0'}))model.setAttribute(key,value);
    modelClose=document.createElement('button');modelClose.id='model-close';modelClose.type='button';modelClose.textContent='Cerrar 3D';modelClose.addEventListener('click',()=>{closeModel(true);$('#model-status').textContent=products.chamber.note;});
    model.addEventListener('load',()=>{if(generation!==modelGeneration)return;$('#model-fallback').hidden=true;button.hidden=true;$('#model-status').textContent='Arrastrá para girar. Modelo conceptual; no verifica medidas ni cargas.';model.focus();track('model_open');},{once:true});
    model.addEventListener('error',()=>{if(generation!==modelGeneration)return;closeModel(true);button.hidden=false;$('#model-status').textContent='No se pudo cargar el 3D. La foto real sigue disponible.';},{once:true});
    $('#model-stage').append(model,modelClose);
  }catch{if(generation!==modelGeneration)return;closeModel();button.hidden=false;button.textContent='Reintentar 3D';$('#model-status').textContent='No se pudo cargar el 3D. La foto real sigue disponible.';}
});
let submissionKey=crypto.randomUUID(),lastPayload='';
$('#lead-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const status=$('#form-status');
  if(!config.leadsEnabled){status.textContent='La consulta no fue enviada: falta validar el destino del formulario. Podés contactar a Comunitel por teléfono o correo.';track('lead_error');return;}
  const values=Object.fromEntries(new FormData(form));values.consent=form.elements.consent.checked;const encoded=JSON.stringify(values);
  if(encoded!==lastPayload){submissionKey=crypto.randomUUID();lastPayload=encoded;}
  const button=$('#submit-lead');button.disabled=true;status.textContent='Verificando la entrega de tu consulta…';
  try{const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':submissionKey},body:encoded,signal:AbortSignal.timeout(20000)});const body=await response.json();if(!response.ok||body.delivered!==true||!body.receipt)throw Error('not_delivered');status.textContent='Consulta entregada. El equipo de Comunitel podrá responderte por los datos que indicaste.';track('lead_delivered');form.reset();submissionKey=crypto.randomUUID();lastPayload='';}
  catch{status.textContent='No pudimos confirmar la entrega. Reintentá o contactanos por teléfono.';track('lead_error');}finally{button.disabled=false;}
});
fetch('/api/config').then(r=>{if(!r.ok)throw Error('config');return r.json();}).then(c=>{config=c;if(c.leadsEnabled){$('#delivery-notice').textContent='Usaremos tus datos únicamente para gestionar esta consulta.';$('#submit-lead').disabled=false;}if(/^\d{10,15}$/.test(c.whatsapp||'')){const wa=$('#whatsapp');wa.disabled=false;wa.textContent='Conversar por WhatsApp ↗';wa.addEventListener('click',()=>window.open('https://wa.me/'+c.whatsapp,'_blank','noopener'));}}).catch(()=>{});
