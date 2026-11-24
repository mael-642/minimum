const K='minimum-v1',PH="J'accepte mon manque de discipline et je valide mes minimums aujourd'hui";
const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)};
const today=()=>ymd(new Date()),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S=load(),tab='today',key='';
function load(){try{const s=JSON.parse(localStorage.getItem(K));if(s&&Array.isArray(s.tasks))return s}catch(e){}
return{tasks:[],logs:{},results:{},deadline:'21:30',next:null,start:today(),last:addD(today(),-1),acked:''}}
const save=()=>localStorage.setItem(K,JSON.stringify(S));
function dl(){if(S.next&&S.next.from<=today()){S.deadline=S.next.val;S.next=null;save()}return S.deadline}
const dlDate=d=>new Date(d+'T'+S.deadline+':00');
const ver=(t,d)=>[...t.v].reverse().find(x=>x.from<=d);
function due(v,d){if(!v||v.del)return false;const w=new Date(d+'T12:00').getDay(),f=v.f;
return f.t=='daily'||(f.t=='week'&&w>0&&w<6)||(f.t=='end'&&(w==0||w==6))||(f.t=='days'&&(f.d||[]).includes(w))||(f.t=='once'&&f.date==d)}
const tasksFor=d=>S.tasks.map(t=>({t,v:ver(t,d)})).filter(x=>due(x.v,d));
function settle(){dl();const n=new Date(),T=ymd(n),end=n>=dlDate(T)?T:addD(T,-1);
for(let d=addD(S.last,1);d<=end;d=addD(d,1)){const ts=tasksFor(d),lg=S.logs[d]||{};
S.results[d]=!ts.length?'none':ts.some(x=>!lg[x.t.id])?'fail':ts.some(x=>lg[x.t.id]=='f')?'flemme':'ok';S.last=d}save()}
function streak(){const T=today();if(S.results[T]=='fail')return 0;let c=0;
for(let d=addD(T,-1);d>=S.start;d=addD(d,-1)){const r=S.results[d];if(!r||r=='fail')break;if(r!='none')c++}
const ts=tasksFor(T),lg=S.logs[T]||{};if(ts.length&&ts.every(x=>lg[x.t.id]))c++;return c}
const fails=()=>Object.values(S.results).filter(r=>r=='fail').length;
const lockDate=()=>Object.keys(S.results).filter(d=>S.results[d]=='fail'&&d<today()&&d>S.acked).sort().pop();
const isOver=()=>new Date()>=dlDate(today());
const fLabel=f=>({daily:'Tous les jours',week:'Lun–Ven',end:'Week-end',once:'Le '+new Date((f.date||today())+'T12:00').toLocaleDateString('fr-FR')}[f.t]||(f.d||[]).map(i=>'DLMMJVS'[i]).join(' '));
function R(){settle();key=today()+S.last+isOver();
document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==tab));
const L=$('#lock'),ld=lockDate();L.hidden=!ld;
if(ld){if(!L.innerHTML)L.innerHTML=`<h1>🛑 Tu as raté ton minimum</h1><p>Il y a un échec enregistré. Pour débloquer l'appli, recopie la phrase à la main (le collage est désactivé) :</p><p><b>${esc(PH)}</b></p><textarea id="lt" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea><button class="big main" id="lb" data-a="unlock" disabled>Je m'engage</button>`}else L.innerHTML='';
$('#app').innerHTML=tab=='today'?vToday():tab=='plan'?vPlan():vHist();tick()}
function vToday(){const T=today(),ts=tasksFor(T),lg=S.logs[T]||{},over=isOver();
return`<div class="date">${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
<div class="stats"><div><b>🔥 ${streak()}</b><small>streak</small></div><div><b>${fails()}</b><small>échecs</small></div><div><b id="cd">–</b><small>avant ${S.deadline}</small></div></div>`+
(ts.length?ts.map(({t,v})=>{const s=lg[t.id];
if(s)return`<div class="card ${s=='n'?'done':'doneF'}"><h3>✓ ${esc(v.name)}</h3><p>${s=='n'?'Validé : '+esc(v.normal):'Mode Flemme : '+esc(v.reduced)}</p></div>`;
return`<div class="card"><h3>${esc(v.name)}</h3><p>Normal : ${esc(v.normal)} · Flemme : ${esc(v.reduced)}</p>
<button class="big good" data-a="v" data-v="n" data-id="${t.id}" ${over?'disabled':''}>Valider</button>
<button class="big lazy" data-a="v" data-v="f" data-id="${t.id}" ${over?'disabled':''}>Valider en Mode Flemme</button></div>`}).join(''):`<p class="empty">Aucun objectif aujourd'hui.<br>Ajoutes-en dans « Programmer ».</p>`)}
function vPlan(){const T=today(),N=addD(T,1);
const list=S.tasks.map(t=>({t,v:t.v[t.v.length-1]})).filter(({t,v})=>!v.del||v.from>T);
return`<h1>Mes objectifs</h1>`+(list.length?list.map(({t,v})=>{const lk=v.f.t=='once'&&v.f.date<=T;
return`<div class="card"><h3>${esc(v.name)}</h3><p>${esc(v.normal)} → ${esc(v.reduced)}<br>${fLabel(v.f)}${v.from>T&&v.f.t!='once'?' · dès demain':''}${v.del?' · supprimée dès demain':''}</p>
${lk||v.del?'<small>🔒 Verrouillée pour aujourd\'hui</small>':`<div class="row"><button class="ghost" data-a="edit" data-id="${t.id}">Modifier</button><button class="danger" data-a="del" data-id="${t.id}">Supprimer</button></div>`}</div>`}).join(''):'<p class="empty">Aucune tâche pour l\'instant.</p>')+
`<button class="big main" data-a="edit" data-id="">+ Ajouter une tâche</button>
<div class="sec">Heure limite (appliquée dès demain)</div><input type="time" id="dlin" value="${S.next?S.next.val:S.deadline}">
<div class="sec">Sauvegarde</div><div class="row"><button class="ghost" data-a="exp">Exporter</button><button class="ghost" data-a="imp">Importer</button></div>
<p style="color:var(--mut);font-size:13px">Les modifications et suppressions de tâches récurrentes s'appliquent à partir de demain.</p>`}
function vHist(){const T=today(),days=[];for(let i=29;i>=0;i--)days.push(addD(T,-i));
const lg=S.logs[T]||{},ts=tasksFor(T);
return`<h1>30 derniers jours</h1><div class="grid">`+days.map(d=>{let r=S.results[d];
if(!r&&d==T)r=ts.length?(ts.every(x=>lg[x.t.id])?(ts.some(x=>lg[x.t.id]=='f')?'flemme':'ok'):'now'):'none';
return`<div class="g-${r||'none'}">${+d.slice(8)}</div>`}).join('')+`</div>
<div class="leg"><span style="color:var(--ok)">■ 100 % normal</span><span style="color:var(--fl)">■ Mode Flemme</span><span style="color:var(--ko)">■ Raté</span><span>■ Aucun objectif</span></div>`}
function edit(id){const t=S.tasks.find(x=>x.id==id),v=t?t.v[t.v.length-1]:{name:'',normal:'',reduced:'',f:{t:'daily',d:[],date:today()}},D='DLMMJVS';
$('#dlg').innerHTML=`<h2>${t?'Modifier':'Nouvelle tâche'}</h2><input id="en" placeholder="Nom (ex : Lire)" value="${esc(v.name)}"><input id="eo" placeholder="Objectif normal (ex : 30 min)" value="${esc(v.normal)}"><input id="er" placeholder="Mode Flemme (ex : 5 min)" value="${esc(v.reduced)}">
<select id="ef">${[['daily','Tous les jours'],['week','Semaine (lun–ven)'],['end','Week-end'],['days','Jours au choix'],['once','Ponctuelle (date précise)']].map(([k,l])=>`<option value="${k}" ${v.f.t==k?'selected':''}>${l}</option>`).join('')}</select>
<div class="days" id="ed">${[1,2,3,4,5,6,0].map(i=>`<label><input type="checkbox" value="${i}" ${(v.f.d||[]).includes(i)?'checked':''}><span>${D[i]}</span></label>`).join('')}</div>
<input type="date" id="edt" value="${v.f.date||today()}" min="${today()}">
<div class="row"><button class="ghost" data-a="close">Annuler</button><button class="main" data-a="save" data-id="${id}">Enregistrer</button></div>`;
const sy=()=>{$('#ed').style.display=$('#ef').value=='days'?'flex':'none';$('#edt').style.display=$('#ef').value=='once'?'block':'none'};
$('#ef').onchange=sy;sy();$('#dlg').showModal()}
function saveTask(id){const T=today(),N=addD(T,1),name=$('#en').value.trim(),ft=$('#ef').value;
const f={t:ft,d:[...document.querySelectorAll('#ed input:checked')].map(i=>+i.value),date:$('#edt').value};
if(!name)return alert('Donne un nom à la tâche.');if(ft=='days'&&!f.d.length)return alert('Choisis au moins un jour.');
if(ft=='once'&&(!f.date||f.date<T))return alert('Choisis une date à partir d\'aujourd\'hui.');
if(ft=='once'&&f.date==T&&S.results[T])return alert('L\'heure limite est passée : trop tard pour aujourd\'hui.');
const nv={name,normal:$('#eo').value.trim()||'Normal',reduced:$('#er').value.trim()||'Minimum',f,from:ft=='once'?'0000-00-00':N};
let t=S.tasks.find(x=>x.id==id);
if(!t)S.tasks.push({id:Date.now().toString(36),v:[nv]});
else if(ft=='once'||t.v[0].f.t=='once')t.v=[{...nv,from:'0000-00-00'}];
else{t.v=t.v.filter(x=>x.from!==N);t.v.push(nv)}
save();$('#dlg').close();R()}
function delTask(id){const t=S.tasks.find(x=>x.id==id),T=today(),v=t.v[t.v.length-1];
if(!confirm('Supprimer « '+v.name+' » ? '+(v.f.t=='once'?'':'Effet dès demain.')))return;
if(v.f.t=='once'||(t.v.length==1&&t.v[0].from>T))S.tasks=S.tasks.filter(x=>x!==t);
else{const N=addD(T,1);t.v=t.v.filter(x=>x.from!==N);t.v.push({...v,del:true,from:N})}save();R()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
if(a=='tab'){tab=b.dataset.t;R()}
else if(a=='v'){if(isOver())return;const T=today();(S.logs[T]=S.logs[T]||{})[id]=b.dataset.v;save();R()}
else if(a=='edit')edit(id);else if(a=='close')$('#dlg').close();else if(a=='save')saveTask(id);else if(a=='del')delTask(id);
else if(a=='unlock'){S.acked=lockDate();save();R()}
else if(a=='exp'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));l.download='minimum-'+today()+'.json';l.click()}
else if(a=='imp')$('#imp').click()});
document.addEventListener('input',e=>{if(e.target.id=='lt')$('#lb').disabled=e.target.value.trim().replace(/[’‘]/g,"'")!==PH});
document.addEventListener('paste',e=>{if(e.target.id=='lt')e.preventDefault()});
document.addEventListener('change',e=>{if(e.target.id=='dlin'&&e.target.value){S.next={from:addD(today(),1),val:e.target.value};save();alert('Nouvelle heure limite appliquée dès demain.')}});
$('#imp').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!Array.isArray(s.tasks))throw 0;
if(confirm('Remplacer toutes tes données actuelles ?')){S=s;S.logs=S.logs||{};S.results=S.results||{};S.acked=S.acked||'';save();R()}}catch(x){alert('Fichier invalide.')}};r.readAsText(f);e.target.value=''};
function tick(){const el=$('#cd');if(!el)return;const ms=dlDate(today())-new Date();
el.textContent=ms<=0?'Terminé':`${pad(Math.floor(ms/36e5))}:${pad(Math.floor(ms/6e4)%60)}:${pad(Math.floor(ms/1e3)%60)}`}
setInterval(()=>{settle();if(key!==today()+S.last+isOver()||(lockDate()&&$('#lock').hidden))R();else tick()},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)R()});
R();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
