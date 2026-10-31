/* P33: public feed and authenticated interactions, using the existing session. */
(function () {
  'use strict';
  var base='https://crm-vps3.tailb1e0b3.ts.net';
  function token(){try{return localStorage.getItem('crm_sessao');}catch(_){return null;}}
  async function request(path,body,auth){
    var headers={Accept:'application/json'},session=auth&&token();
    if(session)headers.Authorization='Bearer '+session;
    if(body!==undefined)headers['Content-Type']='application/json';
    var response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(12000)});
    var data=await response.json();
    if(!response.ok){var error=new Error(data.mensagem||'Não foi possível concluir.');error.status=response.status;throw error;}
    return data;
  }
  function path(id){return '/api/midia/'+encodeURIComponent(id);}
  function counts(data){return {likes:data.curtidas,liked:data.eu_curti,comments_count:data.total};}
  function mediaUrl(value){return typeof value==='string'&&/^\/api\/midia\/arquivo\/[\w.-]+$/.test(value)?base+value:value;}
  window.CRM_SITE_API={base:base,get:function(path,auth){return request(path,undefined,auth);},post:function(path,body){return request(path,body||{},true);}};
  if(window.CRM_RADIO_COUNTS)window.CRM_RADIO_COUNTS.connect({load:function(){return request('/api/musicas');}});
  var agoraBusy=false;
  async function agora(){
    if(document.hidden||agoraBusy)return;agoraBusy=true;
    var site=document.getElementById('site-agora'),radio=document.getElementById('radio-agora');
    try{var data=await request('/api/agora');if(![data.no_site,data.ouvindo].every(function(n){return Number.isSafeInteger(n)&&n>=0;}))throw Error('Presença inválida');site.textContent='🟢 '+data.no_site+' online agora';site.title='Abas ativas nos últimos 2 minutos';radio.textContent='🎧 '+data.ouvindo+' ouvindo agora';site.hidden=radio.hidden=false;}
    catch(_){site.hidden=radio.hidden=true;}finally{agoraBusy=false;}
  }
  agora();setInterval(agora,30000);document.addEventListener('visibilitychange',agora);
  window.CRM_FEED={load:async function(){var data=await request('/api/midia?n=10');if(!Array.isArray(data.posts))throw Error('Mural inválido');return Object.assign({},data,{posts:data.posts.slice(0,10).map(function(p){return Object.assign({},p,{anexos:(p.anexos||[]).map(function(a){return Object.assign({},a,{url:mediaUrl(a.url),poster:mediaUrl(a.poster)});})});})});}};
  window.CRM_SOCIAL.connect({
    load:async function(id,cursor){var data=await request(path(id)+'/comentarios?n=20'+(cursor?'&antes='+encodeURIComponent(cursor):''),undefined,true),items=Array.isArray(data.comentarios)?data.comentarios:[];return Object.assign(counts(data),{comments:items.map(function(c){return {id:c.id,author:(c.usuario||{}).nome,text:c.texto,can_delete:c.meu};}),next_cursor:data.mais&&items.length?items[items.length-1].id:null});},
    like:async function(id,want){return counts(await request(path(id)+'/curtir',{curtir:want},true));},
    comment:function(id,text){return request(path(id)+'/comentar',{texto:text},true);},
    remove:function(id,cid){return request(path(id)+'/comentarios/'+encodeURIComponent(cid)+'/apagar',{},true);}
  });
  window.CRM_ACTIVITY.connect(async function(batch){var data=await request('/api/eventos',batch,true);if(!Number.isInteger(data.aceitos)||!Number.isInteger(data.repetidos)||!Number.isInteger(data.recusados))throw Error('Resposta de eventos inválida');});
})();
