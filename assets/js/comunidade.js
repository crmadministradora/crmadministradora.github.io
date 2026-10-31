/* Views of the public export. No player images, private data or payment confirmation. */
(function () {
  'use strict';
  var D = window.CRM_DADOS || {}, L = D.links || {};
  function node(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  }
  function url(value) {
    try { var u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch (_) { return null; }
  }
  function game(key) { return {hok:'Honor of Kings',mlbb:'Mobile Legends'}[key] || 'Jogo a confirmar'; }
  function date(epoch) {
    return new Date(epoch * 1000).toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}) + ' (Brasília)';
  }
  var dc = D.dreamcards || {}, cards = Array.isArray(dc.cartas) ? dc.cartas : [];
  document.getElementById('podio-data').textContent = 'Honor of Kings · Temporada ' + (dc.temporada || 'a confirmar') + (Number.isFinite(dc.atualizado_epoch) ? ' · Atualizado em ' + date(dc.atualizado_epoch) : '');
  var podium = document.getElementById('podio-lista');
  var premio=Object.prototype.hasOwnProperty.call(dc,'premio_por_jogo') ? dc.premio : 'O prêmio da próxima temporada é anunciado no Discord do Dream Cards.';
  if(premio) podium.after(node('p',premio+' Confira as regras no Discord.','aviso'));
  cards.slice().sort(function(a,b){return a.posicao-b.posicao;}).slice(0,6).forEach(function(c){
    var article = node('article',null,'jogador'+(Number(c.posicao)===1?' jogador-primeiro':''));
    var meta=node('div',null,'jogador-info');
    meta.append(node('span',String(c.posicao).padStart(2,'0'),'posicao'),node('h3',c.nick),node('small','Destaque da temporada'));
    if(dc.imagens_no_site===true && /^assets\/cartas\/0[1-6]\.webp$/.test(c.imagem||'')) {
      var img=node('img');img.src=c.imagem;img.alt='Carta de '+c.nick+', posição '+c.posicao;img.width=400;img.height=600;img.loading='lazy';img.decoding='async';article.append(img);
    }
    article.append(meta);
    podium.append(article);
  });
  if (!cards.length) podium.append(node('p','O próximo pódio está sendo preparado. Acompanhe no Discord.'));

  var copa = D.copa || {}, registration = copa.inscricoes || {};
  var state = document.getElementById('estado-copa');
  state.append(node('strong',registration.aberta ? 'Inscrições abertas' : 'Inscrições ainda não abertas'));
  if (registration.jogo) state.append(node('p',game(registration.jogo)));
  var countdown = node('p');
  var rawDeadline=registration.data_limite, deadline=NaN;
  if(typeof rawDeadline==='string') {
    if(/(?:Z|[+-]\d{2}:\d{2})$/.test(rawDeadline)) deadline=Date.parse(rawDeadline);
    else if(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(rawDeadline)) deadline=Date.parse(rawDeadline.replace(' ','T')+'-03:00');
    else {
      var local=rawDeadline.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
      if(local) deadline=Date.parse(local[3]+'-'+local[2]+'-'+local[1]+'T'+local[4]+':'+local[5]+':'+(local[6]||'00')+'-03:00');
    }
  }
  if (registration.aberta && Number.isFinite(deadline)) {
    state.append(countdown);
    var tick = function(){
      var delta=deadline-Date.now();
      if(delta<=0){state.firstChild.textContent='Prazo encerrado';countdown.textContent='Confira no Discord se há uma nova etapa de inscrições.';return;}
      var hours=Math.floor(delta/3600000),minutes=Math.floor(delta/60000)%60;
      countdown.textContent='Faltam '+Math.floor(hours/24)+' dias, '+hours%24+' h e '+minutes+' min. Até '+date(deadline/1000)+'.';
    };
    tick(); setInterval(tick,30000);
  } else if (registration.aberta) state.append(node('p','Veja o prazo e as condições no Discord da Copa.'));
  else state.append(node('p','A data e a abertura das inscrições serão confirmadas pela equipe. Acompanhe por aqui e no Discord.'));
  if(copa.proxima_edicao) state.append(node('p',Object.keys(copa.proxima_edicao).map(function(key){return game(key)+' · próxima edição '+copa.proxima_edicao[key];}).join(' / ')));

  var editions = (copa.edicoes || []).slice();
  // A live export can use the same public edition shape; never infer live status from historical matches.
  if (copa.ao_vivo && Array.isArray(copa.ao_vivo.chave && copa.ao_vivo.chave.fases)) editions.unshift(copa.ao_vivo);
  else if(copa.ao_vivo && Array.isArray(copa.ao_vivo.fases)) {
    var liveGame=registration.jogo||copa.jogo_da_proxima;
    editions.unshift({edicao:copa.proxima_edicao&&copa.proxima_edicao[liveGame],jogo:liveGame,chave:copa.ao_vivo});
  }
  var select=document.getElementById('edicao'), bracket=document.getElementById('chave');
  editions.forEach(function(e,i){var o=node('option',(e===copa.ao_vivo?'Em andamento · ':'Histórico · ')+'Edição '+e.edicao+' · '+game(e.jogo));o.value=i;select.append(o);});
  if(editions.length) select.value=String(copa.ao_vivo ? 0 : editions.length-1);
  var phaseNames={oitavas:'Oitavas de final',quartas:'Quartas de final',semi:'Semifinais',final:'Final'};
  function render(){
    bracket.replaceChildren();
    var phaseNav=document.getElementById('fases-nav');phaseNav.replaceChildren();
    var summary=document.getElementById('edicao-resumo');summary.replaceChildren();
    var edition=editions[Number(select.value)];
    if(!edition){bracket.append(node('p','As edições e os resultados chegam por aqui assim que estiverem disponíveis.'));return;}
    var teamList=document.getElementById('copa-times');teamList.replaceChildren();(edition.times||[]).forEach(function(t){teamList.append(node('li',typeof t==='string'?t:t.nome||'Time a confirmar'));});if(!(edition.times||[]).length)teamList.append(node('li','Lista de times ainda não recebida.'));
    var results=node('div',null,'edicao-resumo');
    [['Campeão',edition.campeao],['Vice-campeão',edition.vice]].forEach(function(pair){var box=node('div');box.append(node('small',pair[0]),node('strong',pair[1]||'A definir'));results.append(box);});
    summary.append(results);
    if(edition.inicio || edition.fim) summary.append(node('p',[edition.inicio,edition.fim].filter(Boolean).join(' → '),'data-referencia'));
    var phases=(edition.chave && edition.chave.fases)||[];
    if(!phases.length) bracket.append(node('p','A chave desta edição ainda não está disponível.'));
    phases.forEach(function(f){
      var column=node('div',null,'fase');column.append(node('h3',phaseNames[f.fase]||f.fase));
      var jump=node('button',phaseNames[f.fase]||f.fase);jump.type='button';
      jump.addEventListener('click',function(){bracket.scrollTo({left:column.offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
      phaseNav.append(jump);
      (f.jogos||[]).forEach(function(m){
        var match=node('article',null,'partida');
        [[m.time1,m.placar1],[m.time2,m.placar2]].forEach(function(t){var row=node('div',null,'time'+(m.vencedor===t[0]?' vencedor':''));row.append(node('span',t[0]||'A definir'),node('b',t[1]==null?'—':t[1]));match.append(row);});
        if(m.vencedor) match.append(node('small','Vencedor: '+m.vencedor));
        if(m.data_hora) match.append(node('small',m.data_hora));
        [['time1_canal','Call: '+m.time1],['time2_canal','Call: '+m.time2],['transmissao_url','Acompanhar transmissão']].forEach(function(pair){var href=url(m[pair[0]]);if(href){var a=node('a',pair[1]);a.href=href;a.target='_blank';a.rel='noopener';match.append(a);}});
        column.append(match);
      });bracket.append(column);
    });
  }
  select.addEventListener('change',render);render();
  document.getElementById('copa-data').textContent=D.gerado_em?'Dados de '+D.gerado_em+'. Atualizações e inscrições são confirmadas no Discord.':'';

  var comprovante=document.getElementById('comprovante-passos');
  if(comprovante) comprovante.textContent=(L.comprovante_passo || 'No Discord da CRM, no canal 🎩・la-nostra-casa, escolha Abrir Ticket no menu e mande o comprovante ali.').replace(/\*\*/g,'')+' Você também pode enviar por e-mail. A equipe confirma e te chama.';
  var dialog=document.getElementById('pagamento'), code=document.getElementById('pix-codigo'), image=document.getElementById('pix-qr'), imageUrl=null;
  function openPayment(product,plan){
    var item=(D.loja_pix||[]).find(function(p){return p.produto===product.id && p.plano===plan.nome && p.preco===plan.preco;});
    if(!item || !item.copia_e_cola) return;
    document.getElementById('pagamento-plano').textContent=product.nome+' · '+plan.nome;
    document.getElementById('pagamento-valor').textContent=item.preco;
    code.value=item.copia_e_cola;document.getElementById('pix-status').textContent='';
    if(imageUrl) URL.revokeObjectURL(imageUrl);
    // Parse SVG and allow only the QR geometry, rendered in an isolated image context.
    var parsed=new DOMParser().parseFromString(item.qr_svg||'','image/svg+xml');
    var svg=parsed.documentElement;
    var valid=svg.localName==='svg' && !parsed.querySelector('parsererror') && Array.from(svg.querySelectorAll('*')).every(function(n){return ['path','rect','g'].includes(n.localName);}) && Array.from(svg.querySelectorAll('*')).concat([svg]).every(function(n){return Array.from(n.attributes).every(function(a){return ['xmlns','width','height','viewBox','class','d','transform','stroke','fill','stroke-width'].includes(a.name);});});
    image.hidden=!valid;
    if(valid){imageUrl=URL.createObjectURL(new Blob([item.qr_svg],{type:'image/svg+xml'}));image.src=imageUrl;}else image.removeAttribute('src');
    var email=document.getElementById('comprovante-email');email.hidden=!L.email;
    if(L.email) email.href='mailto:'+L.email+'?subject='+encodeURIComponent('Comprovante CRM · '+product.nome+' · '+plan.nome);
    dialog.showModal();
  }
  var plans=[];(D.produtos||[]).forEach(function(p){(p.planos||[]).forEach(function(pl){plans.push([p,pl]);});});
  document.querySelectorAll('#planos .plano').forEach(function(article,i){
    var pair=plans[i];if(!pair || pair[0].id==='bot')return;
    var match=(D.loja_pix||[]).some(function(p){return p.produto===pair[0].id&&p.plano===pair[1].nome&&p.preco===pair[1].preco&&p.copia_e_cola;});
    if(!match)return;
    var old=article.querySelector('.botao'),button=node('button','Ver plano e pagar com PIX','botao');button.type='button';button.addEventListener('click',function(){openPayment(pair[0],pair[1]);});old.replaceWith(button);
    article.querySelector('.plano-pagamento').textContent='PIX · conferência pela equipe';
  });
  dialog.querySelector('.fechar-dialogo').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.getElementById('copiar-pix').addEventListener('click',async function(){
    var status=document.getElementById('pix-status');
    try{await navigator.clipboard.writeText(code.value);status.textContent='PIX copiado. Agora, confira o plano e o valor no seu banco.';}catch(_){code.focus();code.select();status.textContent='Selecione o código e copie manualmente.';}
  });
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)document.querySelectorAll('.menu a[href^="#"]').forEach(function(a){var active=a.hash==='#'+e.target.id;a.classList.toggle('ativo',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{rootMargin:'-15% 0px -60% 0px'});
    document.querySelectorAll('main section[id]').forEach(function(s){observer.observe(s);});
  }
})();
