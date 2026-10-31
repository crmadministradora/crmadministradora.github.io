(function(){
 'use strict';
 var source={load:async function(){var r=await fetch('dados/dados.js',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();var text=await r.text();var match=text.match(/^\s*window\.CRM_DADOS\s*=\s*([\s\S]*?)\s*;?\s*$/);if(!match)throw Error();return JSON.parse(match[1]).numeros;}},busy=false;
 function render(n){if(!n||!n.frases||typeof n.medido_em!=='string')throw Error('Números sem data');var list=document.createDocumentFragment();['servidores','pessoas','partidas','prints','cartas'].forEach(function(key){if(n.frases[key]){if(typeof n.frases[key]!=='string')throw Error();var li=document.createElement('li');li.textContent=n.frases[key];list.append(li);}});if(!list.childNodes.length)throw Error();document.getElementById('numeros').replaceChildren(list);document.getElementById('medido-em').textContent='Números medidos em '+n.medido_em+'.';}
 async function refresh(){if(busy)return;busy=true;try{render(await source.load());}catch(_){/* Keep the dated last received values. */}finally{busy=false;}}
 window.CRM_NUMBERS={connect:function(value){if(!value||typeof value.load!=='function')throw Error('Fonte inválida');source=value;refresh();},refresh:refresh};
 refresh();setInterval(function(){if(!document.hidden)refresh();},60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});
})();
