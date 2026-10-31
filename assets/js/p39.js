(function(){
 'use strict';
 var d=window.CRM_DADOS||{}, links=d.links||{}, list=document.getElementById('ofertas-lista');
 // Preserve the existing real partner data, links, coupon and commission notices.
 ['kinguin','hospedagem'].forEach(function(id){var section=document.getElementById(id);if(section){section.hidden=false;list.append(section);}});
 // A real source must be supplied by Claude; no guessed API route.
 var offersSource=null,offersBusy=false;
 function https(value){try{var u=new URL(value);return u.protocol==='https:'?u.href:null;}catch(_){return null;}}
 async function refreshOffers(){
   if(!offersSource||offersBusy)return;offersBusy=true;
   try{var data=await offersSource.load();if(!data||!Array.isArray(data.ofertas))throw Error('Fonte inválida');
     var fragment=document.createDocumentFragment();
     data.ofertas.forEach(function(o){
       if(o.ativo===false)return;
       if(o.valido_ate){var end=Date.parse(o.valido_ate);if(!Number.isFinite(end))throw Error('Validade inválida');if(end<=Date.now())return;}
       if(!o.nome||!https(o.url)||typeof o.aviso!=='string')throw Error('Oferta incompleta');
       var box=document.createElement('section');var h=document.createElement('h3');h.textContent=o.nome;
       var p=document.createElement('p');p.textContent=o.descricao||'';
       var a=document.createElement('a');a.textContent='Ver oferta ↗';a.className='botao';a.href=https(o.url);a.target='_blank';a.rel='sponsored noopener';
       var terms=document.createElement('p');terms.textContent=(o.cupom?'Cupom '+o.cupom+'. ':'')+(o.condicoes||'');
       var notice=document.createElement('p');notice.className='aviso';notice.textContent=o.aviso;box.append(h,p,a,terms,notice);fragment.append(box);
     });
     if(!fragment.childNodes.length){var empty=document.createElement('p');empty.textContent='Novas ofertas serão publicadas aqui.';fragment.append(empty);}
     list.replaceChildren(fragment);
   }catch(_){/* Keep the last verified export on transient failure. */}finally{offersBusy=false;}
 }
 window.CRM_OFFERS={connect:function(source){if(!source||typeof source.load!=='function')throw Error('Fonte de ofertas ausente');offersSource=source;refreshOffers();},refresh:refreshOffers};
 setInterval(function(){if(!document.hidden)refreshOffers();},60000);
 var reg=(d.copa||{}).inscricoes||{};
 if(reg.aberta)document.getElementById('copa-inscrever').textContent='Inscrever meu time no Discord ↗';
 if((d.copa||{}).ao_vivo){document.getElementById('copa-historico').open=true;document.querySelector('#copa-historico>summary').textContent='Edição em andamento e resultados';}
 // The monthly product already has a real payment export, although missing in produtos.
 var monthly=(d.loja_pix||[]).find(function(p){return p.produto==='campanha'&&/mensal/i.test(p.plano);});
 if(monthly&&!Array.from(document.querySelectorAll('#planos h3')).some(function(e){return /mensal/i.test(e.textContent);})){
   var article=document.createElement('article');article.className='plano';
   var title=document.createElement('h3');title.textContent='Campanha de Divulgação · Mensal';
   var price=document.createElement('div');price.className='plano-preco';price.textContent=monthly.preco;
   var note=document.createElement('p');note.textContent='Primeiro mês. Depois, R$ 249,00 por mês. Divulgação da tua org durante o mês inteiro.';
   var a=document.createElement('a');a.className='botao';a.textContent='Contratar no Discord ↗';a.href=links.site_crm;
   article.append(title,price,note,a);document.getElementById('planos').append(article);
 }
 var section=document.createElement('section');section.className='sites-planos';section.setAttribute('aria-label','Sites para organizações');
 [['Site online','R$ 29,90','Valor único. Aparência personalizada com as informações da tua organização.'],['Site + domínio .com.br','R$ 99,00','Valor único. Site online, domínio .com.br e administração por 1 ano.']].forEach(function(item){var box=document.createElement('article'),h=document.createElement('h3'),price=document.createElement('strong'),p=document.createElement('p'),a=document.createElement('a');h.textContent=item[0];price.textContent=item[1];p.textContent=item[2];a.textContent='Combinar meu site com a CRM ↗';a.className='botao';a.href=links.site_crm;box.append(h,price,p,a);section.append(box);});
 var models=document.createElement('p');models.textContent='Conheça os modelos: ';
 [['Arena','arena'],['Comunidade','comunidade'],['Estúdio','estudio']].forEach(function(pair){var a=document.createElement('a');a.href='modelos/'+pair[1]+'/';a.textContent=pair[0]+' ↗';a.target='_blank';a.rel='noopener';a.style.marginRight='20px';models.append(a);});
 document.getElementById('loja').append(section,models);
})();

