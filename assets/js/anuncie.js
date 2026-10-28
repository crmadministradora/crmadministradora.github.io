(function(){
'use strict';
var d=window.CRM_DADOS||{},n=d.numeros||{},l=d.links||{};
['servidores','pessoas','membros'].forEach(function(k){if(n.frases&&n.frases[k]){var li=document.createElement('li');li.textContent=n.frases[k];document.getElementById('anuncie-numeros').appendChild(li);}});
if(n.medido_em)document.getElementById('anuncie-data').textContent='Rede medida em '+n.medido_em+'. Pessoas únicas e membros somados são medidas diferentes.';
if(n.frases&&n.frases.midia){document.getElementById('anuncie-midia').textContent=n.frases.midia+(n.midia_medido_em?' · medido em '+n.midia_medido_em:'')+'.';}
if(l.email)document.getElementById('anuncie-contato').href='mailto:'+l.email+'?subject='+encodeURIComponent('Quero anunciar na CRM');
// Perfis informados explicitamente pelo Claude no P31; solicitar inclusão no próximo links.json.
[['Instagram',l.crm_instagram],['TikTok',l.crm_tiktok],['Bluesky',l.crm_bluesky||'https://bsky.app/profile/crmadministradora.bsky.social'],['X',l.crm_x||'https://x.com/crmgameproject']].forEach(function(item){if(!item[1])return;var a=document.createElement('a');a.textContent=item[0];a.href=item[1];a.target='_blank';a.rel='noopener';document.getElementById('redes-rodape').appendChild(a);});
})();
