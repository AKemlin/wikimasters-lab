const $ = id => document.getElementById(id);
let data = { cards: [], packs: [], settings: { budget: 1000 } };
let filter = 'real';
let demoTimer = null;
let demoOpened = 0;
const RARITIES = ['C','PC','R','SR','UR','L'];
const COLORS = { C:'#79ca98', PC:'#6aaff0', R:'#bb89ea', SR:'#ed90c2', UR:'#f0ba6a', L:'#ebd869' };
const EXAMPLES = ['Ada Lovelace','Abeille','Marie Curie','Saturne (planète)','Titanic','Hibou','Nikola Tesla','Origami','Machu Picchu','Stonehenge','Frida Kahlo','Pompéi'];
const money = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
const date = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceCards = () => data.cards.filter(x => x.source === filter);
const sourcePacks = () => data.packs.filter(x => x.source === filter);
const sum = (list, field) => list.reduce((a,x) => a + (Number(x[field]) || 0), 0);
const STORAGE_KEY = 'wikimasters-lab:v1';
function readStore() {
  try { const x=JSON.parse(localStorage.getItem(STORAGE_KEY)); return {cards:Array.isArray(x.cards)?x.cards:[],packs:Array.isArray(x.packs)?x.packs:[],settings:x.settings||{budget:1000}}; }
  catch { return {cards:[],packs:[],settings:{budget:1000}}; }
}
function writeStore(x) { localStorage.setItem(STORAGE_KEY,JSON.stringify(x)); }
const id=()=>crypto.randomUUID();
const amount=x=>Math.max(0,Number(x)||0);
async function measureHype(title) {
  const params=new URLSearchParams({action:'query',prop:'pageviews',titles:title.trim(),pvipdays:'28',format:'json',origin:'*'});
  const res=await fetch(`https://fr.wikipedia.org/w/api.php?${params}`,{headers:{'Api-User-Agent':'WikiMastersLab/1.0 (school project; GitHub Pages)'}});
  if(!res.ok)throw new Error(res.status===404?'Article Wikipédia introuvable':`Wikimedia : HTTP ${res.status}`);
  const payload=await res.json();
  const page=Object.values(payload.query?.pages||{})[0];
  if(!page||page.missing||!page.pageviews)throw new Error('Article Wikipédia introuvable');
  const views=Object.entries(page.pageviews).sort(([a],[b])=>a.localeCompare(b)).map(([,value])=>Number(value)||0);
  if(views.length<14)throw new Error('Historique de vues insuffisant');
  const recent=views.slice(-7).reduce((a,b)=>a+b,0),previous=views.slice(-14,-7).reduce((a,b)=>a+b,0);
  return {recent,previous,change:previous?(recent-previous)/previous*100:null,checkedAt:new Date().toISOString(),source:'Wikimedia Pageviews, Wikipédia FR'};
}
async function api(path,options={}) {
  const method=options.method||'GET', input=options.body?JSON.parse(options.body):{};
  const store=readStore();
  if(path==='/api/data')return store;
  if(path==='/api/card'&&method==='POST'){
    if(!String(input.title||'').trim())throw new Error('Titre de carte requis');
    const item={id:id(),title:String(input.title).trim().slice(0,160),rarity:RARITIES.includes(input.rarity)?input.rarity:'C',source:input.source==='demo'?'demo':'real',acquiredAt:new Date().toISOString(),cost:amount(input.cost),sale:input.sale===''||input.sale==null?null:amount(input.sale),marketValue:input.marketValue===''||input.marketValue==null?null:amount(input.marketValue),packId:input.packId||null,hype:null};
    store.cards.unshift(item);writeStore(store);return item;
  }
  if(path==='/api/pack'&&method==='POST'){const item={id:id(),source:input.source==='demo'?'demo':'real',openedAt:new Date().toISOString(),cost:amount(input.cost)};store.packs.unshift(item);writeStore(store);return item;}
  if(path==='/api/settings'&&method==='POST'){store.settings.budget=amount(input.budget);writeStore(store);return store.settings;}
  const match=path.match(/^\/api\/card\/([a-f0-9-]+)/);
  if(match){const index=store.cards.findIndex(x=>x.id===match[1]);if(index<0)throw new Error('Carte introuvable');
    if(method==='DELETE'){store.cards.splice(index,1);writeStore(store);return {ok:true};}
    if(path.includes('action=hype')){store.cards[index].hype=await measureHype(store.cards[index].title);writeStore(store);return store.cards[index].hype;}
    if(method==='PATCH'){for(const field of ['sale','marketValue'])if(Object.hasOwn(input,field))store.cards[index][field]=input[field]===''||input[field]==null?null:amount(input[field]);writeStore(store);return store.cards[index];}
  }
  if(path==='/api/import'&&method==='POST'){
    if(!Array.isArray(input.cards)||!Array.isArray(input.packs))throw new Error('Sauvegarde invalide');
    const cards=new Set(store.cards.map(x=>x.id)),packs=new Set(store.packs.map(x=>x.id));
    for(const x of input.cards.slice(0,10000))if(x&&/^[a-f0-9-]{36}$/.test(x.id)&&!cards.has(x.id)&&String(x.title||'').trim()){
      store.cards.push({id:x.id,title:String(x.title).slice(0,160),rarity:RARITIES.includes(x.rarity)?x.rarity:'C',source:x.source==='demo'?'demo':'real',acquiredAt:!Number.isNaN(Date.parse(x.acquiredAt))?x.acquiredAt:new Date().toISOString(),cost:amount(x.cost),sale:x.sale==null?null:amount(x.sale),marketValue:x.marketValue==null?null:amount(x.marketValue),packId:typeof x.packId==='string'?x.packId:null,hype:x.hype&&Number.isFinite(Number(x.hype.change))?{recent:amount(x.hype.recent),previous:amount(x.hype.previous),change:Number(x.hype.change),checkedAt:String(x.hype.checkedAt||''),source:'Wikimedia Pageviews, Wikipédia FR'}:null});cards.add(x.id);
    }
    for(const x of input.packs.slice(0,10000))if(x&&/^[a-f0-9-]{36}$/.test(x.id)&&!packs.has(x.id)){store.packs.push({id:x.id,source:x.source==='demo'?'demo':'real',openedAt:!Number.isNaN(Date.parse(x.openedAt))?x.openedAt:new Date().toISOString(),cost:amount(x.cost)});packs.add(x.id);}
    writeStore(store);return {cards:store.cards.length,packs:store.packs.length};
  }
  throw new Error('Action non prise en charge');
}
function toast(message) { const el=$('toast'); el.textContent=message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3500); }
async function refresh() { data = await api('/api/data'); render(); }
function navigate(view) {
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('hidden', x.id !== 'view-'+view));
  document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active', x.dataset.view === view));
  $('crumb-title').textContent = ({overview:'VUE D’ENSEMBLE',collection:'COLLECTION',budget:'BUDGET & RÉSULTATS',demo:'SIMULATEUR'})[view];
  window.scrollTo({top:0,behavior:'smooth'});
}
function render() { renderOverview(); renderCollection(); renderBudget(); }
function renderOverview() {
  const cards = sourceCards(), packs = sourcePacks();
  const cardCost=sum(cards,'cost'), packCost=sum(packs,'cost'), sales=sum(cards,'sale');
  const net=sales-cardCost-packCost;
  const metrics=[
    ['Cartes suivies',money(cards.length),'cartes enregistrées','▤'],
    ['Paquets ouverts',money(packs.length),'enregistrés dans le journal','◫'],
    ['Dépenses totales',money(cardCost+packCost)+' ◎','achats + paquets','↗'],
    ['Solde réalisé',(net>=0?'+':'')+money(net)+' ◎','ventes − dépenses','◈']
  ];
  $('metrics').innerHTML=metrics.map((m,i)=>`<div class="metric"><span class="metric-icon">${m[3]}</span><div class="metric-label">${m[0]}</div><div class="metric-value">${m[1]}</div><div class="metric-sub ${i===3?(net>=0?'positive':'negative'):''}">${m[2]}</div></div>`).join('');
  const counts=Object.fromEntries(RARITIES.map(r=>[r,cards.filter(x=>x.rarity===r).length]));
  const max=Math.max(1,...Object.values(counts));
  $('rarity-chart').innerHTML=cards.length ? RARITIES.map(r=>`<div class="rarity-row"><strong>${r}</strong><div class="bar"><div style="width:${counts[r]/max*100}%;background:${COLORS[r]}"></div></div><span>${counts[r]}</span></div>`).join('') : '<div class="empty">Ajoute une carte pour voir la répartition.</div>';
  const hypes=cards.filter(x=>x.hype?.change!=null).sort((a,b)=>b.hype.change-a.hype.change).slice(0,4);
  $('hype-list').innerHTML=hypes.length ? hypes.map(x=>`<div class="hype-row"><div><strong>${esc(x.title)}</strong><small>${money(x.hype.recent)} vues · 7 derniers jours</small></div><span class="change ${x.hype.change<0?'down':''}">${x.hype.change>=0?'+':''}${x.hype.change.toFixed(1)} %</span></div>`).join('') : '<div class="empty">Mesure la hype d’une carte pour voir sa tendance ici.</div>';
}
function renderCollection() {
  const q=$('search').value.trim().toLocaleLowerCase('fr'); const rarity=$('rarity-filter').value;
  const cards=sourceCards().filter(x=>(!rarity||x.rarity===rarity)&&x.title.toLocaleLowerCase('fr').includes(q));
  $('collection-count').textContent=`${cards.length} carte${cards.length>1?'s':''} · ${filter==='real'?'mes données':'démo'}`;
  $('cards-body').innerHTML=cards.length ? cards.map(x=>{
    const hype=x.hype?.change;
    return `<tr><td class="card-cell"><strong>${esc(x.title)}</strong><small>${date(x.acquiredAt)} · ${x.source==='demo'?'Démo':'Mes données'}</small></td><td><span class="rarity-tag rarity-${x.rarity}">${x.rarity}</span></td><td>${money(x.cost)} ◎</td><td>${x.marketValue==null?'—':money(x.marketValue)+' ◎'}</td><td>${x.sale==null?'—':money(x.sale)+' ◎'}</td><td>${hype==null?`<button class="table-btn" data-hype="${x.id}">Mesurer</button>`:`<span class="${hype>=0?'hype-up':'hype-down'}">${hype>=0?'+':''}${hype.toFixed(1)} %</span> <button class="table-btn" data-hype="${x.id}" title="Actualiser">↻</button>`}</td><td><button class="table-btn" data-edit="${x.id}">Modifier</button><button class="table-btn delete-btn" data-delete="${x.id}" title="Supprimer">×</button></td></tr>`;
  }).join('') : `<tr><td colspan="7"><div class="empty">Aucune carte affichée. Ajoute ta première carte pour commencer.</div></td></tr>`;
}
function renderBudget() {
  const cards=sourceCards(), packs=sourcePacks(); const budget=Number(data.settings.budget)||0;
  const cardCost=sum(cards,'cost'), packCost=sum(packs,'cost'), sales=sum(cards,'sale'), spent=cardCost+packCost;
  $('budget-value').textContent=money(budget); $('budget-input').value=budget;
  $('budget-progress').style.width=`${budget?Math.min(100,spent/budget*100):0}%`;
  $('budget-caption').textContent=budget?`${money(spent)} dépensés sur ${money(budget)} · ${money(Math.max(0,budget-spent))} restants`:'Fixe un plafond pour suivre tes dépenses.';
  $('card-cost').textContent=money(cardCost); $('pack-cost').textContent=money(packCost); $('sales-total').textContent=money(sales);
  $('packs-body').innerHTML=packs.length ? packs.map(x=>`<tr><td>${date(x.openedAt)}</td><td>${x.source==='demo'?'Démo':'Mes données'}</td><td>${money(x.cost)} ◎</td><td>${data.cards.filter(c=>c.packId===x.id).length}</td></tr>`).join('') : '<tr><td colspan="4"><div class="empty">Aucun paquet enregistré.</div></td></tr>';
}
async function addDemoPack(max) {
  const pack=await api('/api/pack',{method:'POST',body:JSON.stringify({source:'demo',cost:0})});
  const title=EXAMPLES[Math.floor(Math.random()*EXAMPLES.length)];
  const roll=Math.random(); const rarity=roll<.39?'C':roll<.66?'PC':roll<.83?'R':roll<.94?'SR':roll<.985?'UR':'L';
  await api('/api/card',{method:'POST',body:JSON.stringify({title,rarity,source:'demo',cost:0,packId:pack.id})});
  demoOpened++; $('demo-count').textContent=`${demoOpened} / ${max}`; $('demo-progress').style.width=`${demoOpened/max*100}%`;
  $('demo-log').querySelector('.empty-log')?.remove();
  $('demo-log').insertAdjacentHTML('afterbegin',`<div class="log-item"><div><strong>${esc(title)}</strong> <span class="rarity-tag rarity-${rarity}">${rarity}</span><br><small>Paquet démo #${demoOpened}</small></div><small>${new Date().toLocaleTimeString('fr-FR')}</small></div>`);
  await refresh();
}
function stopDemo(message) { if(demoTimer){clearInterval(demoTimer);demoTimer=null;} $('demo-start').disabled=false; $('demo-stop').disabled=true; $('demo-max').disabled=false; $('demo-delay').disabled=false; if(message)toast(message); }
document.addEventListener('click', async e => {
  const nav=e.target.closest('[data-view]'); if(nav){navigate(nav.dataset.view);return;}
  const close=e.target.closest('[data-close]'); if(close){close.closest('dialog').close();return;}
  const hype=e.target.closest('[data-hype]'); if(hype){hype.disabled=true;hype.textContent='…';try{await api(`/api/card/${hype.dataset.hype}?action=hype`,{method:'POST'});await refresh();toast('Hype mise à jour');}catch(err){toast(err.message);hype.disabled=false;hype.textContent='Mesurer';}return;}
  const edit=e.target.closest('[data-edit]'); if(edit){const item=data.cards.find(x=>x.id===edit.dataset.edit);if(!item)return;$('edit-id').value=item.id;$('edit-title').textContent=item.title;$('edit-value').value=item.marketValue??'';$('edit-sale').value=item.sale??'';$('edit-dialog').showModal();return;}
  const del=e.target.closest('[data-delete]');if(del){if(!confirm('Supprimer cette carte du suivi ?'))return;try{await api(`/api/card/${del.dataset.delete}`,{method:'DELETE'});await refresh();toast('Carte supprimée');}catch(err){toast(err.message);}return;}
});
$('add-card-btn').onclick=()=>$('card-dialog').showModal();
$('add-pack-btn').onclick=()=>$('pack-dialog').showModal();
$('card-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await api('/api/card',{method:'POST',body:JSON.stringify(Object.fromEntries(f))});$('card-dialog').close();e.target.reset();await refresh();toast('Carte ajoutée');}catch(err){toast(err.message);}};
$('pack-form').onsubmit=async e=>{e.preventDefault();try{await api('/api/pack',{method:'POST',body:JSON.stringify({cost:$('pack-cost-input').value})});$('pack-dialog').close();await refresh();toast('Paquet ajouté');}catch(err){toast(err.message);}};
$('edit-form').onsubmit=async e=>{e.preventDefault();try{await api(`/api/card/${$('edit-id').value}`,{method:'PATCH',body:JSON.stringify({marketValue:$('edit-value').value,sale:$('edit-sale').value})});$('edit-dialog').close();await refresh();toast('Carte mise à jour');}catch(err){toast(err.message);}};
$('budget-form').onsubmit=async e=>{e.preventDefault();try{await api('/api/settings',{method:'POST',body:JSON.stringify({budget:$('budget-input').value})});await refresh();toast('Budget enregistré');}catch(err){toast(err.message);}};
$('search').oninput=renderCollection; $('rarity-filter').onchange=renderCollection;
document.querySelectorAll('.filter').forEach(btn=>btn.onclick=()=>{filter=btn.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===btn));render();});
$('demo-max').oninput=()=>{if(!demoTimer)$('demo-count').textContent=`0 / ${$('demo-max').value||0}`;};
$('demo-start').onclick=async()=>{if(demoTimer)return;const max=Math.min(20,Math.max(1,Number($('demo-max').value)||5));const delay=Number($('demo-delay').value)||1500;demoOpened=0;$('demo-count').textContent=`0 / ${max}`;$('demo-progress').style.width='0';$('demo-log').innerHTML='';$('demo-start').disabled=true;$('demo-stop').disabled=false;$('demo-max').disabled=true;$('demo-delay').disabled=true;const tick=async()=>{if(!demoTimer)return;try{await addDemoPack(max);if(demoOpened>=max)stopDemo('Simulation terminée');}catch(err){stopDemo(err.message);}};demoTimer=setInterval(tick,delay);await tick();};
$('demo-stop').onclick=()=>stopDemo('Simulation arrêtée');
$('import-btn').onclick=()=>$('import-file').click();
$('export-btn').onclick=()=>{const blob=new Blob([JSON.stringify(readStore(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='wiki-masters-lab-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());await api('/api/import',{method:'POST',body:JSON.stringify(parsed)});await refresh();toast('Sauvegarde importée');}catch(err){toast(err.message);}e.target.value='';};
$('today').textContent=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
refresh().catch(err=>toast(err.message));

