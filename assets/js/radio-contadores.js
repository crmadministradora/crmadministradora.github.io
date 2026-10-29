/* P36 public aggregates: hide missing service, show zero only after valid response. */
(function(){
 'use strict';
 var adapter=null,busy=false,format=new Intl.NumberFormat('pt-BR');
 function hide(){document.querySelectorAll('.radio-track-counts').forEach(function(e){e.hidden=true;});document.getElementById('radio-contadores-status').hidden=true;}
 async function refresh(){
  if(!adapter||busy)return;busy=true;
  try{
   var data=await adapter.load();
   if(!data||!data.faixas||typeof data.faixas!=='object'||Array.isArray(data.faixas))throw Error('Contagem inválida');
   var rows=Array.from(document.querySelectorAll('.radio-track[data-faixa]'));
   rows.forEach(function(row){var item=data.faixas[row.dataset.faixa];if(item&&![item.ouviram,item.baixaram].every(function(n){return Number.isSafeInteger(n)&&n>=0;}))throw Error('Contagem inválida');});
   rows.forEach(function(row){var item=data.faixas[row.dataset.faixa]||{ouviram:0,baixaram:0};row.querySelector('[data-radio-ouvintes]').textContent='▶ '+format.format(item.ouviram)+' ouviram';row.querySelector('[data-radio-downloads]').textContent='⬇ '+format.format(item.baixaram)+' baixaram';row.querySelector('.radio-track-counts').hidden=false;});
   var status=document.getElementById('radio-contadores-status');status.textContent=typeof data.criterio==='string'?data.criterio:'Uma vez por conta logada; sem login, por aba. Downloads contam cliques em Baixar.';status.hidden=false;
  }catch(_){hide();}finally{busy=false;}
 }
 window.CRM_RADIO_COUNTS={connect:function(value){if(!value||typeof value.load!=='function')throw Error('Contador sem fonte');adapter=value;refresh();},refresh:refresh};
 window.addEventListener('hashchange',function(){if(location.hash==='#radio'||location.hash==='#radio-biblioteca')refresh();});
 document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});
 setInterval(function(){if(!document.hidden&&document.body.dataset.area==='radio')refresh();},30000);
})();
