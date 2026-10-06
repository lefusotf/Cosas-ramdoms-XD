(function(){
'use strict';
var root=document.getElementById('root');
var S=null,pid=null,tab='lista',sel=null,modal=null,confirmDel=null,busy=false,offline=false,PW='',can=false,toastT=0,cmpf='all';
try{PW=localStorage.getItem('gd_pw')||'';tab=localStorage.getItem('gd_tab')||'lista';pid=localStorage.getItem('gd_pid')||null;sel=localStorage.getItem('gd_sel')||null;}catch(e){}
var hm=/^#(p\d+)$/.exec(location.hash||'');if(hm)pid=hm[1];

/* ---------- utilidades ---------- */
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function n(x){return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');}
function pts(rank){return Math.max(1,Math.round(200*Math.pow(.93,rank-1)));}
function parseAtt(s){var t=0,m,re=/(\d+(?:[.,]\d+)?)\s*([kKmM])?/g;s=String(s||'').split('(')[0];while((m=re.exec(s))){var v=parseFloat(m[1].replace(',','.'));if(m[2])v*=/m/i.test(m[2])?1e6:1e3;t+=v;}return Math.round(t);}
function slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'nivel';}
function initials(s){var w=String(s).trim().split(/\s+/);return(w.length>1?w[0][0]+w[1][0]:String(s).slice(0,2)).toUpperCase();}
function fdate(d){if(!d)return '—';var p=d.split('-');if(p.length!==3)return h(d);var M=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];return +p[2]+' '+M[+p[1]-1]+' '+p[0];}
function safeUrl(u){return /^https?:\/\//i.test(u||'')?u:'';}
function img(u){return /^(img\/[A-Za-z0-9._\/-]+|\/api\/img\/[a-f0-9]+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+)$/.test(u||'')?u:'';}
function clone(o){return JSON.parse(JSON.stringify(o));}
function P(){if(!S)return null;for(var i=0;i<S.players.length;i++)if(S.players[i].id===pid)return S.players[i];pid=S.players[0].id;return S.players[0];}
function lv(){return P().levels;}
function byId(id){var L=lv();for(var i=0;i<L.length;i++)if(L[i].id===id)return i;return -1;}
function store(k,v){try{localStorage.setItem(k,v);}catch(e){}}

/* ---------- vistas ---------- */
function totals(L){var t=0,p=0;L.forEach(function(x,i){t+=x.n||0;p+=pts(i+1);});return{t:t,p:p,avg:L.length?t/L.length:0};}
function thumb(L){var u=img(L.img);return u?'<img alt="" loading="lazy" src="'+u+'">':'<div class="noimg">'+h(initials(L.name))+'</div>';}
function rowHtml(L,i){
  var r=i+1;
  return '<article class="row r'+r+(L.id===sel?' on':'')+'" data-act="sel" data-id="'+h(L.id)+'" tabindex="0" role="button" aria-label="'+h(L.name)+', puesto '+r+'">'
   +'<div class="rk num">#'+r+'</div><div class="th">'+thumb(L)+'</div><div class="mid"><h3>'+h(L.name)+'</h3><p>'+(L.creator?'por '+h(L.creator):'&nbsp;')+(L.diff?(L.creator?' · ':'')+h(L.diff):'')+'</p></div>'
   +'<div class="rt"><b class="num">'+h(L.a||'—')+'</b><small>intentos</small></div></article><div class="dinline" data-for="'+h(L.id)+'"></div>';
}
function listView(){
  var L=lv();
  if(!L.length)return '<div class="empty">'+(can?'<b>'+h(P().name)+'</b> todavía no tiene niveles. Pulsa «+ Añadir nivel» para empezar.':'<b>'+h(P().name)+'</b> todavía no tiene niveles.')+'</div>';
  var top=L.slice(0,10),rest=L.slice(10),out='<h2 class="sec">Top <b>10</b> más difíciles</h2>'+top.map(function(x,i){return rowHtml(x,i);}).join('');
  if(rest.length)out+='<h2 class="sec">Más niveles <b>'+rest.length+'</b></h2>'+rest.map(function(x,i){return rowHtml(x,i+10);}).join('');
  return '<div class="layout"><section aria-label="Lista de niveles">'+out+'</section><aside class="detail" id="detail"></aside></div>';
}
function detailHtml(L){
  var i=byId(L.id),r=i+1,vid=safeUrl(L.video),u=img(L.img),N=lv().length;
  return '<div class="dcard"><div class="dimgw">'+(u?'<img class="dimg" alt="Portada de '+h(L.name)+'" src="'+u+'">':'<div class="noimg" style="font-size:3rem">'+h(initials(L.name))+'</div>')+'<span class="tag num">#'+r+'</span></div>'
   +'<div class="dbody"><div>'+(r<=10?'<span class="pill g">Top 10</span>':'')+(L.diff?'<span class="pill">'+h(L.diff)+'</span>':'')+'</div><h2>'+h(L.name)+'</h2>'+(L.creator?'<p class="by">por '+h(L.creator)+'</p>':'')
   +'<dl class="ds"><div><dt>Posición</dt><dd class="num">#'+r+' de '+N+'</dd></div><div><dt>Puntos</dt><dd class="num">'+pts(r)+'</dd></div><div><dt>Intentos</dt><dd class="num">'+h(L.a||'—')+'</dd></div><div><dt>Fecha</dt><dd>'+fdate(L.date)+'</dd></div></dl>'
   +(L.notes?'<p class="note">'+h(L.notes)+'</p>':'')
   +'<div class="dact">'+(vid?'<a class="btn pri" href="'+h(vid)+'" target="_blank" rel="noopener">Ver video</a>':'')
   +(can?'<button class="btn sm" data-act="edit" data-id="'+h(L.id)+'">Editar</button><button class="btn sm" data-act="up" data-id="'+h(L.id)+'"'+(i===0?' disabled':'')+'>▲ Subir</button><button class="btn sm" data-act="down" data-id="'+h(L.id)+'"'+(i===N-1?' disabled':'')+'>▼ Bajar</button>'
     +(confirmDel===L.id?'<button class="btn sm red" data-act="del" data-id="'+h(L.id)+'">Confirmar borrado</button>':'<button class="btn sm" data-act="del" data-id="'+h(L.id)+'">Borrar</button>'):'')
   +'</div></div></div>';
}
function statsView(){
  var L=lv(),T=totals(L),mx=0,most=null;L.forEach(function(x){if((x.n||0)>mx){mx=x.n;most=x;}});
  var bars=L.map(function(x,i){return '<div class="br'+(i<3?' hi':'')+'"><span class="k">#'+(i+1)+'</span><span>'+h(x.name)+'</span><span class="track"><i style="width:'+(mx?Math.max(2,(x.n||0)/mx*100):0)+'%"></i></span><span class="v num">'+n(x.n||0)+'</span></div>';}).join('');
  var dated=L.filter(function(x){return x.date;}).sort(function(a,b){return a.date<b.date?1:-1;});
  var tl=dated.length?'<ul class="tl">'+dated.map(function(x){return '<li><time>'+fdate(x.date)+'</time><span><b>'+h(x.name)+'</b> · #'+(byId(x.id)+1)+'</span></li>';}).join('')+'</ul>':'<p style="color:var(--dim);margin:0">Pon la fecha en que te pasaste cada nivel y aparecerá aquí.</p>';
  var rows=S.players.map(function(p){var t=totals(p.levels);return '<tr><td><b>'+h(p.name)+'</b></td><td class="n">'+p.levels.length+'</td><td class="n">'+n(t.t)+'</td><td class="n">'+n(t.p)+'</td></tr>';}).join('');
  return '<div class="sgrid"><div class="card"><h2>Intentos · '+h(P().name)+'</h2><div class="bars">'+(bars||'<p style="color:var(--dim)">Sin datos.</p>')+'</div></div>'
   +'<div style="display:grid;gap:20px;align-content:start"><div class="card"><h2>Jugadores</h2><table class="ptable"><thead><tr><th>Jugador</th><th>Niveles</th><th>Intentos</th><th>Puntos</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
   +'<div class="card"><h2>Resumen de '+h(P().name)+'</h2><dl class="ds"><div><dt>Niveles</dt><dd class="num">'+L.length+'</dd></div><div><dt>Intentos totales</dt><dd class="num">'+n(T.t)+'</dd></div><div><dt>Promedio</dt><dd class="num">'+n(T.avg)+'</dd></div><div><dt>Puntos</dt><dd class="num">'+n(T.p)+'</dd></div><div><dt>Más intentos</dt><dd>'+(most?h(most.name):'—')+'</dd></div><div><dt>Nivel #1</dt><dd>'+(L[0]?h(L[0].name):'—')+'</dd></div></dl></div>'
   +'<div class="card"><h2>Línea de tiempo</h2>'+tl+'</div></div></div>';
}
function compareData(){
  var map={},order=[];
  S.players.forEach(function(p){p.levels.forEach(function(L,i){var k=slug(L.name);if(!map[k]){map[k]={key:k,name:L.name,img:L.img,by:{}};order.push(k);}if(!map[k].img&&L.img)map[k].img=L.img;map[k].by[p.id]={rank:i+1,a:L.a,n:L.n};});});
  return order.map(function(k){return map[k];}).sort(function(a,b){var ca=Object.keys(a.by).length,cb=Object.keys(b.by).length;return cb-ca||a.name.localeCompare(b.name);});
}
function compareView(){
  var all=compareData(),np=S.players.length,both=all.filter(function(x){return Object.keys(x.by).length===np;}).length;
  var f=cmpf,list=all.filter(function(x){var c=Object.keys(x.by).length;if(f==='all')return true;if(f==='both')return c===np;return c===1&&x.by[f];});
  var btn=function(k,t){return '<button data-act="cf" data-f="'+k+'" aria-pressed="'+(f===k)+'">'+t+'</button>';};
  var filters='<div class="cfilters">'+btn('all','Todos')+(np>1?btn('both','Los '+np+' lo pasamos'):'')+S.players.map(function(p){return btn(p.id,'Solo '+h(p.name));}).join('')+'<span class="cnt">'+list.length+' de '+all.length+' · '+both+' en común</span></div>';
  var cards=list.map(function(x){
    var c=Object.keys(x.by).length,u=img(x.img);
    return '<article class="cc'+(c===np&&np>1?' both':'')+'"><div class="ci">'+(u?'<img alt="" loading="lazy" src="'+u+'">':'<div class="noimg">'+h(initials(x.name))+'</div>')+(c===np&&np>1?'<span class="badge">Los dos</span>':'')+'</div><h3>'+h(x.name)+'</h3><ul>'
     +S.players.map(function(p){var r=x.by[p.id];return r?'<li class="yes"><span>'+h(p.name)+'</span><b>#'+r.rank+' · '+h(r.a||'—')+'</b></li>':'<li class="no"><span>'+h(p.name)+'</span><b>sin pasar</b></li>';}).join('')+'</ul></article>';
  }).join('');
  return filters+(cards?'<div class="cgrid">'+cards+'</div>':'<div class="empty">No hay niveles con ese filtro.</div>');
}

function modalHtml(){
  if(!modal)return '';
  if(modal.type==='login')return '<div class="ov" data-act="ovclose"><form class="modal" id="lgform"><h2>Editar la lista</h2><p class="pwarn">Escribe la contraseña de edición. Solo la necesitan quienes pueden cambiar la lista.</p><label>Contraseña<input name="pw" type="password" autocomplete="current-password" required autofocus></label><div class="macts"><button type="button" class="btn" data-act="closem">Cancelar</button><button class="btn pri" type="submit">Entrar</button></div></form></div>';
  if(modal.type==='settings'){
    var D=modal.D;
    return '<div class="ov" data-act="ovclose"><form class="modal" id="sform"><h2>Ajustes de la página</h2><div class="fg">'
     +'<label class="full">Nombre de la lista<input name="title" value="'+h(D.site.title)+'" maxlength="60" required></label>'
     +'<label class="full">Frase<input name="tag" value="'+h(D.site.tag)+'" maxlength="160"></label>'
     +'<div class="full drop"><div class="th" id="aprev" style="aspect-ratio:1">'+(img(D.site.avatar)?'<img alt="" src="'+img(D.site.avatar)+'">':'<div class="noimg">'+h(initials(D.site.title))+'</div>')+'</div><div><p>Imagen de la página (logo o foto, mejor cuadrada).</p><input type="file" accept="image/*" id="afile" style="margin-top:8px"><button type="button" class="btn sm" data-act="rmavatar" style="margin-top:8px">Quitar imagen</button></div></div>'
     +'<div class="full sep">Jugadores</div>'
     +D.players.map(function(p){return '<label>Nombre de '+h(p.id==='p1'?'jugador 1':p.id==='p2'?'jugador 2':p.id)+'<input name="n_'+h(p.id)+'" value="'+h(p.name)+'" maxlength="40" required></label>';}).join('')
     +'</div><div class="macts" style="justify-content:space-between">'+(D.players.length<6?'<button type="button" class="btn sm" data-act="addp">+ Añadir jugador</button>':'<span></span>')+'<span style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn sm" data-act="backup">Copia de seguridad</button><button type="button" class="btn" data-act="closem">Cancelar</button><button class="btn pri" type="submit">Guardar</button></span></div></form></div>';
  }
  var L=modal.L,add=!modal.edit,pos=modal.pos,N=lv().length;
  var diffs=['','Demon fácil','Demon medio','Demon difícil','Demon insano','Demon extremo'].map(function(d){return '<option value="'+h(d)+'"'+(d===L.diff?' selected':'')+'>'+(d||'Sin indicar')+'</option>';}).join('');
  return '<div class="ov" data-act="ovclose"><form class="modal" id="lform"><h2>'+(add?'Añadir nivel a '+h(P().name):'Editar nivel')+'</h2><div class="fg">'
   +'<label class="full">Nombre del nivel<input name="name" value="'+h(L.name)+'" maxlength="80" required autocomplete="off"></label>'
   +'<label>Creador (opcional)<input name="creator" value="'+h(L.creator)+'" maxlength="60"></label>'
   +'<label>Posición en la lista<input name="pos" type="number" min="1" max="'+(N+(add?1:0))+'" value="'+pos+'" required><span class="hintx">Si hay otro en ese puesto, baja uno.</span></label>'
   +'<label>Intentos<input name="a" value="'+h(L.a)+'" placeholder="8k, 2.5k, 1500…" id="att" maxlength="60"><span class="hintx" id="attp"></span></label>'
   +'<label>Dificultad<select name="diff">'+diffs+'</select></label>'
   +'<label>Fecha en que te lo pasaste<input name="date" type="date" value="'+h(L.date)+'"></label>'
   +'<label>Link del video (opcional)<input name="video" type="url" value="'+h(L.video)+'" placeholder="https://" maxlength="300"></label>'
   +'<label class="full">Notas<textarea name="notes" maxlength="600">'+h(L.notes)+'</textarea></label>'
   +'<div class="full drop" id="drop"><div class="th" id="prev">'+thumb(L)+'</div><div><p>Arrastra una captura aquí, pégala con Ctrl+V o elígela.</p><input type="file" accept="image/*" id="file" style="margin-top:8px"></div></div></div>'
   +'<div class="macts"><button type="button" class="btn" data-act="closem">Cancelar</button><button class="btn pri" type="submit">'+(add?'Añadir a la lista':'Guardar cambios')+'</button></div></form></div>';
}
function headerHtml(){
  var u=img(S.site.avatar);
  return '<header class="top"><div class="wrap"><div class="brand">'+(u?'<img class="bi" alt="" src="'+u+'">':'<i></i>')+h(S.site.title.toUpperCase())+'</div>'
   +'<nav class="tabs" role="tablist"><button role="tab" data-act="tab" data-tab="lista" aria-selected="'+(tab==='lista')+'">Lista</button><button role="tab" data-act="tab" data-tab="comparar" aria-selected="'+(tab==='comparar')+'">Comparar</button><button role="tab" data-act="tab" data-tab="stats" aria-selected="'+(tab==='stats')+'">Estadísticas</button></nav>'
   +'<div class="acts">'+(can?'<span class="edtag">Modo editor</span><button class="btn sm" data-act="settings">Ajustes</button><button class="btn mg sm" data-act="add">+ Añadir nivel</button><button class="btn sm" data-act="logout">Salir</button>':'<button class="btn sm" data-act="login">Editar</button>')+'</div></div></header>'
   +(offline?'<div class="off">No se pudo conectar con la nube. Estás viendo los datos de arranque y no se puede guardar.</div>':'');
}
function heroHtml(){
  var u=img(S.site.avatar),T=totals(lv());
  return '<section class="hero"><div class="wrap">'+(u?'<div class="av pic"><img alt="" src="'+u+'"></div>':'<div class="av" aria-hidden="true">'+h(initials(S.site.title))+'</div>')
   +'<div><h1>'+h(S.site.title)+'</h1><p>'+h(S.site.tag)+'</p></div>'
   +'<div class="pl" role="group" aria-label="Jugador">'+S.players.map(function(p){return '<button data-act="pl" data-id="'+h(p.id)+'" aria-pressed="'+(p.id===pid)+'"><i>'+h(initials(p.name))+'</i>'+h(p.name)+' <small>'+p.levels.length+' niveles</small></button>';}).join('')+'</div>'
   +'<div class="chips"><div class="chip"><b class="num">'+lv().length+'</b><span>Niveles de '+h(P().name)+'</span></div><div class="chip"><b class="num">'+n(T.t)+'</b><span>Intentos totales</span></div><div class="chip"><b class="num">'+n(T.avg)+'</b><span>Promedio por nivel</span></div><div class="chip"><b class="num">'+n(T.p)+'</b><span>Puntos</span></div></div></div></section>';
}
function render(){
  if(!S){root.innerHTML='<div class="boot">CARGANDO LISTA…</div>';return;}
  document.title=S.site.title;
  var body=tab==='stats'?statsView():(tab==='comparar'?compareView():listView());
  root.innerHTML=headerHtml()+heroHtml()+'<main><div class="wrap">'+body+'</div></main><footer>Lista compartida. Geometry Dash es de RobTop Games. Sitio de fans sin afiliación oficial. Los puntos usan una fórmula propia.</footer>'+modalHtml()+'<div class="toast" id="toast" role="status"></div>';
  if(tab==='lista')showDetail();
  if(modal&&modal.type==='level')attPreview();
}
function showDetail(){
  var L=lv()[byId(sel)]||null;
  Array.prototype.forEach.call(root.querySelectorAll('.dinline'),function(d){d.innerHTML='';});
  var wide=window.matchMedia('(min-width:1021px)').matches,det=document.getElementById('detail');
  if(!L){if(det)det.innerHTML=lv().length?'<div class="empty">Elige un nivel para ver su detalle.</div>':'';return;}
  if(wide){if(det)det.innerHTML=detailHtml(L);}
  else{var s=root.querySelector('.dinline[data-for="'+L.id.replace(/"/g,'\\"')+'"]');if(s)s.innerHTML=detailHtml(L);if(det)det.innerHTML='';}
}
function setSel(id){
  sel=(sel===id&&!window.matchMedia('(min-width:1021px)').matches)?null:id;confirmDel=null;store('gd_sel',sel||'');
  Array.prototype.forEach.call(root.querySelectorAll('.row'),function(r){r.classList.toggle('on',r.dataset.id===sel);});
  showDetail();
}
function toast(msg,keep){var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(toastT);if(!keep)toastT=setTimeout(function(){t.classList.remove('on');},3400);}

/* ---------- nube ---------- */
function api(path,opt){opt=opt||{};opt.headers=opt.headers||{};if(PW)opt.headers['x-edit-password']=PW;return fetch('/api/'+path,opt);}
function loadState(){
  return fetch('/api/data',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.json();}).then(function(j){
    if(j.state){offline=false;return j.state;}
    return fetch('seed.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(s){offline=false;return s;});
  }).catch(function(){
    return fetch('seed.json').then(function(r){return r.json();}).then(function(s){offline=true;return s;});
  });
}
function uploadPending(next){
  var jobs=[];
  function up(holder,key){var v=holder[key];if(v&&/^data:image\//.test(v)){jobs.push(api('img',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data:v})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||'No se pudo subir la imagen');holder[key]=j.url;});}));}}
  up(next.site,'avatar');next.players.forEach(function(p){p.levels.forEach(function(L){up(L,'img');});});
  return Promise.all(jobs);
}
function save(next,msg,selId){
  if(busy)return;
  if(offline){toast('Sin conexión con la nube: no se puede guardar.');return;}
  busy=true;toast('Guardando…',true);
  uploadPending(next).then(function(){
    return api('data',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({baseRev:S.rev||0,state:next})});
  }).then(function(r){
    return r.json().then(function(j){
      if(r.status===401){PW='';can=false;store('gd_pw','');modal=null;render();toast('Contraseña incorrecta. Vuelve a entrar.');return;}
      if(r.status===409){if(j.state)S=j.state;modal=null;render();toast('Alguien guardó antes que tú. Se recargó la lista: repite el cambio.');return;}
      if(!r.ok){toast(j.error||'No se pudo guardar.');return;}
      next.rev=j.rev;S=next;modal=null;confirmDel=null;
      if(selId!==undefined){sel=selId||null;store('gd_sel',sel||'');}
      render();toast(msg||'Guardado');
    });
  }).catch(function(e){toast(e&&e.message&&!/Failed to fetch|NetworkError/.test(e.message)?e.message:'No hay conexión. Inténtalo otra vez.');}).then(function(){busy=false;});
}
function poll(){
  if(busy||modal||!S||offline)return;
  fetch('/api/data',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    if(j&&j.state&&(j.state.rev||0)>(S.rev||0)&&!busy&&!modal){S=j.state;render();}
  }).catch(function(){});
}

/* ---------- imágenes del navegador ---------- */
function resize(file,Wd,Ht,q){return new Promise(function(res,rej){var fr=new FileReader();fr.onerror=rej;fr.onload=function(){var im=new Image();im.onerror=rej;im.onload=function(){
  var c=document.createElement('canvas');c.width=Wd;c.height=Ht;var g=c.getContext('2d'),s=Math.max(Wd/im.width,Ht/im.height),w=im.width*s,hh=im.height*s;g.fillStyle='#0b0c20';g.fillRect(0,0,Wd,Ht);g.drawImage(im,(Wd-w)/2,(Ht-hh)/2,w,hh);res(c.toDataURL('image/jpeg',q));};im.src=fr.result;};fr.readAsDataURL(file);});}
function takeFile(f){if(!f||!/^image\//.test(f.type)){toast('Ese archivo no es una imagen.');return;}
  resize(f,960,540,.8).then(function(d){modal.L.img=d;var p=document.getElementById('prev');if(p)p.innerHTML='<img alt="" src="'+d+'">';}).catch(function(){toast('No se pudo leer la imagen.');});}
function takeAvatar(f){if(!f||!/^image\//.test(f.type)){toast('Ese archivo no es una imagen.');return;}
  resize(f,480,480,.88).then(function(d){modal.D.site.avatar=d;var p=document.getElementById('aprev');if(p)p.innerHTML='<img alt="" src="'+d+'">';}).catch(function(){toast('No se pudo leer la imagen.');});}
function attPreview(){var i=document.getElementById('att'),p=document.getElementById('attp');if(i&&p){var v=parseAtt(i.value);p.textContent=v?'= '+n(v)+' intentos':'';}}

/* ---------- eventos ---------- */
function setPlayer(id){pid=id;store('gd_pid',id);history.replaceState(null,'','#'+id);sel=null;confirmDel=null;var L=lv();sel=L.length?L[0].id:null;render();}
root.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;var a=el.dataset.act,id=el.dataset.id;
  if(a==='ovclose'){if(e.target===el){modal=null;render();}return;}
  if(a==='tab'){tab=el.dataset.tab;store('gd_tab',tab);render();return;}
  if(a==='pl'){setPlayer(id);return;}
  if(a==='cf'){cmpf=el.dataset.f;render();return;}
  if(a==='sel'){setSel(id);return;}
  if(a==='login'){modal={type:'login'};render();return;}
  if(a==='logout'){PW='';can=false;store('gd_pw','');render();toast('Saliste del modo editor.');return;}
  if(a==='add'){modal={type:'level',edit:null,pos:lv().length+1,L:{id:'',name:'',creator:'',a:'',n:0,diff:'',date:'',video:'',notes:'',img:''}};render();return;}
  if(a==='edit'){var i=byId(id);modal={type:'level',edit:id,pos:i+1,L:clone(lv()[i])};render();return;}
  if(a==='settings'){modal={type:'settings',D:{site:clone(S.site),players:S.players.map(function(p){return{id:p.id,name:p.name};})}};render();return;}
  if(a==='rmavatar'){modal.D.site.avatar='';var ap=document.getElementById('aprev');if(ap)ap.innerHTML='<div class="noimg">'+h(initials(modal.D.site.title))+'</div>';return;}
  if(a==='addp'){var f=new FormData(document.getElementById('sform'));modal.D.site.title=String(f.get('title')||modal.D.site.title);modal.D.site.tag=String(f.get('tag')||'');modal.D.players.forEach(function(p){p.name=String(f.get('n_'+p.id)||p.name);});
    var k=1;while(modal.D.players.some(function(p){return p.id==='p'+k;}))k++;modal.D.players.push({id:'p'+k,name:'Jugador '+k});render();return;}
  if(a==='backup'){try{var b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='demonlist-copia.json';document.body.appendChild(l);l.click();setTimeout(function(){URL.revokeObjectURL(l.href);l.remove();},500);}catch(x){toast('No se pudo descargar.');}return;}
  if(a==='closem'){modal=null;render();return;}
  if(a==='up'||a==='down'){var N=clone(S),pl=N.players.filter(function(p){return p.id===pid;})[0],j=pl.levels.map(function(x){return x.id;}).indexOf(id),d=a==='up'?-1:1,k2=j+d;if(k2<0||k2>=pl.levels.length)return;var t=pl.levels[j];pl.levels[j]=pl.levels[k2];pl.levels[k2]=t;save(N,'Orden actualizado',id);return;}
  if(a==='del'){if(confirmDel!==id){confirmDel=id;showDetail();return;}var N2=clone(S),p2=N2.players.filter(function(p){return p.id===pid;})[0];p2.levels=p2.levels.filter(function(x){return x.id!==id;});save(N2,'Nivel borrado','');}
});
root.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('row')){e.preventDefault();setSel(e.target.dataset.id);}});
root.addEventListener('input',function(e){if(e.target.id==='att')attPreview();});
root.addEventListener('change',function(e){if(e.target.id==='file')takeFile(e.target.files[0]);if(e.target.id==='afile')takeAvatar(e.target.files[0]);});
root.addEventListener('dragover',function(e){var d=e.target.closest('#drop');if(d){e.preventDefault();d.classList.add('over');}});
root.addEventListener('dragleave',function(e){var d=e.target.closest('#drop');if(d)d.classList.remove('over');});
root.addEventListener('drop',function(e){var d=e.target.closest('#drop');if(d){e.preventDefault();d.classList.remove('over');takeFile(e.dataTransfer.files[0]);}});
document.addEventListener('paste',function(e){if(!modal||modal.type!=='level')return;var it=(e.clipboardData||{}).items||[];for(var i=0;i<it.length;i++){if(/^image\//.test(it[i].type)){takeFile(it[i].getAsFile());e.preventDefault();return;}}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal){modal=null;render();}});
root.addEventListener('submit',function(e){
  e.preventDefault();var f=e.target,fd=new FormData(f);
  if(f.id==='lgform'){
    var pw=String(fd.get('pw'));toast('Comprobando…',true);
    fetch('/api/check',{method:'POST',headers:{'x-edit-password':pw}}).then(function(r){return r.json().then(function(j){
      if(r.ok){PW=pw;store('gd_pw',pw);can=true;modal=null;render();toast('Modo editor activado');}
      else toast(j.error||'No se pudo comprobar.');});}).catch(function(){toast('No hay conexión con la nube.');});
    return;
  }
  if(f.id==='sform'){
    var N=clone(S);N.site.title=String(fd.get('title')).trim()||S.site.title;N.site.tag=String(fd.get('tag')).trim();N.site.avatar=modal.D.site.avatar||'';
    modal.D.players.forEach(function(p){var ex=N.players.filter(function(q){return q.id===p.id;})[0],nm=String(fd.get('n_'+p.id)||'').trim()||p.name;if(ex)ex.name=nm;else N.players.push({id:p.id,name:nm,levels:[]});});
    save(N,'Ajustes guardados');return;
  }
  var L=modal.L,name=String(fd.get('name')).trim();if(!name){toast('Pon el nombre del nivel.');return;}
  var o={id:modal.edit||(slug(name)+'-'+Math.random().toString(36).slice(2,5)),name:name,creator:String(fd.get('creator')).trim(),a:String(fd.get('a')).trim(),diff:String(fd.get('diff')),date:String(fd.get('date')),video:String(fd.get('video')).trim(),notes:String(fd.get('notes')).trim(),img:L.img||''};
  o.n=parseAtt(o.a);if(o.video&&!safeUrl(o.video)){toast('El link debe empezar por http:// o https://');return;}
  var N3=clone(S),pl=N3.players.filter(function(p){return p.id===pid;})[0],arr=pl.levels.filter(function(x){return x.id!==modal.edit;}),pos=Math.max(1,Math.min(arr.length+1,parseInt(fd.get('pos'),10)||arr.length+1));
  arr.splice(pos-1,0,o);pl.levels=arr;save(N3,modal.edit?'Cambios guardados':'Nivel añadido',o.id);
});
window.addEventListener('resize',function(){if(tab==='lista'&&S)showDetail();});
document.addEventListener('visibilitychange',function(){if(!document.hidden)poll();});
setInterval(poll,45000);

/* ---------- arranque ---------- */
loadState().then(function(s){
  S=s;P();if(!sel||byId(sel)<0){var L=lv();sel=L.length?L[0].id:null;}
  if(PW&&!offline){fetch('/api/check',{method:'POST',headers:{'x-edit-password':PW}}).then(function(r){can=r.ok;if(!r.ok){PW='';store('gd_pw','');}render();}).catch(function(){render();});}
  render();
});
})();
