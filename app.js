const DBKEY="menu-settimanale-v1";
const state=JSON.parse(localStorage.getItem(DBKEY)||'{"recipes":[],"tags":[],"meals":[]}');
const $=s=>document.querySelector(s), save=()=>localStorage.setItem(DBKEY,JSON.stringify(state));
const uid=()=>crypto.randomUUID(), days=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
const toast=t=>{let e=$("#toast");e.textContent=t;e.style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#172033;color:white;padding:11px 16px;border-radius:10px;z-index:30";setTimeout(()=>e.removeAttribute("style"),2200)};
function monday(d=new Date()){let x=new Date(d);let n=x.getDay()||7;x.setDate(x.getDate()-n+1);return x}
function iso(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function getWeekStart(){return $("#weekStart").value}
function mealKey(date,type){return date+"|"+type}
function recipe(id){return state.recipes.find(x=>x.id===id)}
function countMonth(rid,month){return state.meals.filter(x=>x.recipeId===rid&&x.date.startsWith(month)).length}
function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modalClose").onclick=closeModal;
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};

document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button,.page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#page-"+b.dataset.page).classList.add("active");if(b.dataset.page==="stats")renderStats()});

function renderMenu(){
 let start=new Date(getWeekStart()+"T12:00:00"), html='<div class="week">';
 for(let i=0;i<7;i++){let d=new Date(start);d.setDate(start.getDate()+i);let date=iso(d);
  html+=`<div class="day"><div class="dayname">${days[i]}<br><span class="small">${date.slice(8)}/${date.slice(5,7)}</span></div>`;
  for(let type of ["Lunch","Dinner"]){let current=state.meals.find(x=>x.date===date&&x.type===type)?.recipeId||"";
   let opts=state.recipes.filter(r=>r.preference==="Both"||r.preference===type).sort((a,b)=>a.name.localeCompare(b.name)).map(r=>`<option value="${r.id}" ${r.id===current?"selected":""}>${r.name}</option>`).join("");
   html+=`<div class="meal"><label>${type==="Lunch"?"🌞 Pranzo":"🌙 Cena"}</label><select onchange="setMeal('${date}','${type}',this.value)"><option value="">— Nessuna ricetta —</option>${opts}</select></div>`;
  } html+="</div>";
 } $("#weekGrid").innerHTML=html+"</div>";
}
window.setMeal=(date,type,rid)=>{state.meals=state.meals.filter(x=>!(x.date===date&&x.type===type));if(rid)state.meals.push({id:uid(),date,type,recipeId:rid});save();renderStats();};

function renderRecipes(){
 let q=$("#recipeSearch").value.toLowerCase();
 let rs=state.recipes.filter(r=>r.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
 $("#recipeList").innerHTML=rs.length?rs.map(r=>`<div class="card"><h3>${r.name}</h3><div class="tags">${r.tagIds.map(id=>state.tags.find(t=>t.id===id)).filter(Boolean).map(t=>`<span class="tag">${t.name}</span>`).join("")||'<span class="small">Nessun tag</span>'}</div><div class="meta">📅 ${r.frequency} volte/mese · ${r.preference==="Lunch"?"🌞 Pranzo":r.preference==="Dinner"?"🌙 Cena":"🌞🌙 Pranzo e cena"}</div><div class="actions"><button onclick="editRecipe('${r.id}')">✏️ Modifica</button><button class="danger" onclick="deleteRecipe('${r.id}')">🗑️ Elimina</button></div></div>`).join(""):'<div class="empty">Nessuna ricetta. Inizia aggiungendone una.</div>';
}
function recipeForm(r={name:"",frequency:4,preference:"Both",tagIds:[]},id=""){
 openModal(`<h2>${id?"Modifica":"Nuova"} ricetta</h2><form id="recipeForm"><div class="form-row"><label>Nome</label><input name="name" required value="${r.name.replace(/"/g,"&quot;")}"></div><div class="form-row"><label>Frequenza desiderata al mese</label><input name="frequency" type="number" min="0" max="100" required value="${r.frequency}"></div><div class="form-row"><label>Quando preferisci mangiarla?</label><select name="preference"><option value="Lunch" ${r.preference==="Lunch"?"selected":""}>Solo pranzo</option><option value="Dinner" ${r.preference==="Dinner"?"selected":""}>Solo cena</option><option value="Both" ${r.preference==="Both"?"selected":""}>Pranzo e cena</option></select></div><div class="form-row"><label>Tag</label><div class="checklist">${state.tags.map(t=>`<label><input type="checkbox" value="${t.id}" ${r.tagIds.includes(t.id)?"checked":""}> ${t.name}</label>`).join("")||'<span class="small">Crea prima alcuni tag.</span>'}</div></div><button class="primary">💾 Salva</button></form>`);
 $("#recipeForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target), obj={id:id||uid(),name:f.get("name").trim(),frequency:+f.get("frequency"),preference:f.get("preference"),tagIds:[...e.target.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value)};if(id)Object.assign(recipe(id),obj);else state.recipes.push(obj);save();closeModal();renderRecipes();renderMenu();toast("Ricetta salvata")};
}
window.editRecipe=id=>recipeForm(recipe(id),id);
window.deleteRecipe=id=>{if(confirm("Eliminare questa ricetta? Verrà rimossa anche dai menu.")){state.recipes=state.recipes.filter(x=>x.id!==id);state.meals=state.meals.filter(x=>x.recipeId!==id);save();renderRecipes();renderMenu();renderStats()}};
$("#newRecipeBtn").onclick=()=>recipeForm();$("#recipeSearch").oninput=renderRecipes;

function renderTags(){
 $("#tagList").innerHTML=state.tags.length?state.tags.sort((a,b)=>a.name.localeCompare(b.name)).map(t=>{let n=state.recipes.filter(r=>r.tagIds.includes(t.id)).length;return `<div class="card"><h3>${t.name}</h3><div class="meta">${n} ${n===1?"ricetta associata":"ricette associate"}</div><div class="actions"><button onclick="editTag('${t.id}')">✏️ Modifica</button>${n===0?`<button class="danger" onclick="deleteTag('${t.id}')">🗑️ Elimina</button>`:"<span class='small'>Non eliminabile finché è utilizzato</span>"}</div></div>`}).join(""):'<div class="empty">Nessun tag creato.</div>';
}
function tagForm(t={name:""},id=""){openModal(`<h2>${id?"Modifica":"Nuovo"} tag</h2><form id="tagForm"><div class="form-row"><label>Nome</label><input name="name" required value="${t.name}"></div><button class="primary">💾 Salva</button></form>`);$("#tagForm").onsubmit=e=>{e.preventDefault();let name=new FormData(e.target).get("name").trim();if(state.tags.some(x=>x.name.toLowerCase()===name.toLowerCase()&&x.id!==id)){toast("Esiste già un tag con questo nome");return}if(id)t.name=name;else state.tags.push({id:uid(),name});save();closeModal();renderTags();renderRecipes()}};
window.editTag=id=>tagForm(state.tags.find(t=>t.id===id),id);window.deleteTag=id=>{state.tags=state.tags.filter(t=>t.id!==id);save();renderTags()};$("#newTagBtn").onclick=()=>tagForm();

function propose(){
 if(!state.recipes.length){toast("Aggiungi prima almeno una ricetta");return}
 let start=new Date(getWeekStart()+"T12:00:00"), proposed=[];
 // Work on current persisted meals; fill only empty slots.
 for(let i=0;i<7;i++){let d=new Date(start);d.setDate(start.getDate()+i);let date=iso(d),month=date.slice(0,7);
  for(let type of ["Lunch","Dinner"]){if(state.meals.some(x=>x.date===date&&x.type===type))continue;
   let candidates=state.recipes.filter(r=>r.preference==="Both"||r.preference===type);
   if(!candidates.length)continue;
   let scored=candidates.map(r=>{
    let used=countMonth(r.id,month)+proposed.filter(x=>x.recipeId===r.id&&x.date.startsWith(month)).length;
    let target=Math.max(r.frequency,0.1);
    let deficit=Math.max(0,target-used);
    let recent=[...state.meals,...proposed].filter(x=>x.recipeId===r.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
    let recentPenalty=recent?Math.max(0,5-Math.floor((new Date(date)-new Date(recent.date))/86400000))*target:0;
    let score=1+(deficit/target)*12+Math.random()*3-recentPenalty;
    return {r,score}
   }).sort((a,b)=>b.score-a.score);
   // Weighted selection among best candidates, preserving variety.
   let pool=scored.slice(0,Math.min(5,scored.length)), total=pool.reduce((s,x)=>s+Math.max(.1,x.score),0), rnd=Math.random()*total, acc=0, chosen=pool[0].r;
   for(let x of pool){acc+=Math.max(.1,x.score);if(rnd<=acc){chosen=x.r;break}}
   proposed.push({id:uid(),date,type,recipeId:chosen.id});
  }
 }
 state.meals.push(...proposed);save();renderMenu();renderStats();toast(`Proposti ${proposed.length} pasti`)
}
$("#proposeBtn").onclick=propose;
$("#clearWeekBtn").onclick=()=>{if(confirm("Svuotare tutti i pasti della settimana?")){let s=getWeekStart(),e=new Date(s+"T12:00:00");e.setDate(e.getDate()+6);let end=iso(e);state.meals=state.meals.filter(x=>x.date<s||x.date>end);save();renderMenu();renderStats()}};
function renderStats(){
 let month=$("#statsMonth").value, rs=[...state.recipes].sort((a,b)=>a.name.localeCompare(b.name));
 $("#statsList").innerHTML=rs.length?rs.map(r=>{let n=countMonth(r.id,month), pct=Math.min(100,r.frequency?Math.round(n/r.frequency*100):0);return `<div class="card"><h3>${r.name}</h3><div class="meta">Obiettivo: <b>${r.frequency}</b> · Pianificata: <b>${n}</b> · Differenza: <b>${n-r.frequency>0?"+":""}${n-r.frequency}</b></div><div class="statbar"><div style="width:${pct}%"></div></div><div class="small">${pct}% dell'obiettivo mensile</div></div>`}).join(""):'<div class="empty">Nessuna ricetta.</div>';
}
$("#weekStart").value=iso(monday());$("#statsMonth").value=iso(new Date()).slice(0,7);$("#weekStart").onchange=renderMenu;$("#statsMonth").onchange=renderStats;
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
renderMenu();renderRecipes();renderTags();renderStats();
