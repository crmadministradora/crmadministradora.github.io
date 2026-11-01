/* 01/11 (Claude): a SETINHA de comentar o site -- só pra equipe do Visor (o Brunno, o Maike e o Bi).
   Ele: "eles clicam onde quiser, gera uma caixa de coment e salva sobre o item certo e agt pega esses feed back pra
   muda aki". Ligada, todo clique na página vira comentário preso àquele item (o seletor, o texto, a aba e o ponto);
   os abertos aparecem como marcadores numerados e na lista. Quem guarda e confere a equipe é a API (/api/feedback). */
(function () {
  'use strict';
  var api = window.CRM_SITE_API;
  if (!api) return;
  var ligado = false, itens = [], verFeitos = false, alvoAtual = null;

  function el(tag, cls, texto) { var n = document.createElement(tag); if (cls) n.className = cls; if (texto != null) n.textContent = texto; return n; }
  function podeVer() { try { return !!(window.CRM_ACCOUNT_STATE && window.CRM_ACCOUNT_STATE.canViewVisor()); } catch (_) { return false; } }
  function nossa(n) { return !!(n && n.closest && n.closest('.fb-ui')); }

  // o botão na conta (ao lado do 📊 Visor)
  var botao = el('button', 'botao botao-pequeno fb-ui', '➤ Comentar o site');
  botao.type = 'button'; botao.hidden = true; botao.id = 'fb-ligar';
  var acoes = document.querySelector('#perfil-crm .perfil-acoes');
  if (acoes) acoes.append(botao);
  function mostrarBotao() { botao.hidden = !podeVer(); if (botao.hidden && ligado) desligar(); }
  window.addEventListener('crm:account', mostrarBotao); window.addEventListener('crm:auth-change', mostrarBotao); mostrarBotao();

  // a barra do modo, o realce, a caixa, a lista e os marcadores
  var barra = el('div', 'fb-ui fb-barra'); barra.hidden = true;
  var bLista = el('button', null, '📋 Lista'), bSair = el('button', null, '✕ Sair');
  bLista.type = bSair.type = 'button';
  barra.append(el('span', null, '➤ Modo comentário: toca em qualquer item da página'), bLista, bSair);
  var realce = el('div', 'fb-realce'); realce.hidden = true;
  var caixa = el('form', 'fb-ui fb-caixa'); caixa.hidden = true;
  var cSobre = el('p', 'fb-sobre'), cTexto = el('textarea'), cSalvar = el('button', 'botao botao-pequeno', 'Salvar'),
      cCancelar = el('button', 'fb-cancelar', 'Cancelar'), cStatus = el('p', 'fb-status');
  cTexto.rows = 4; cTexto.maxLength = 1000; cTexto.placeholder = 'O que mudar aqui?'; cSalvar.type = 'submit'; cCancelar.type = 'button';
  cStatus.setAttribute('role', 'status');
  var cBotoes = el('div', 'fb-botoes'); cBotoes.append(cCancelar, cSalvar);
  caixa.append(cSobre, cTexto, cBotoes, cStatus);
  var lista = el('section', 'fb-ui fb-lista'); lista.hidden = true;
  var lTopo = el('header'), lTitulo = el('strong'), lFeitos = el('label'), lCheck = el('input'), lFechar = el('button', null, '×'), lCorpo = el('div', 'fb-itens');
  lCheck.type = 'checkbox'; lFeitos.append(lCheck, document.createTextNode(' mostrar os feitos')); lFechar.type = 'button';
  lFechar.setAttribute('aria-label', 'Fechar a lista');
  lTopo.append(lTitulo, lFeitos, lFechar); lista.append(lTopo, lCorpo);
  var pinos = el('div', 'fb-pinos');
  document.body.append(barra, realce, caixa, lista, pinos);

  function seletor(n) {
    var partes = [];
    while (n && n.nodeType === 1 && n !== document.body) {
      if (n.id) { partes.unshift('#' + CSS.escape(n.id)); return partes.join(' > '); }
      var tag = n.tagName.toLowerCase(), pai = n.parentElement;
      if (pai) {
        var iguais = Array.prototype.filter.call(pai.children, function (x) { return x.tagName === n.tagName; });
        if (iguais.length > 1) tag += ':nth-of-type(' + (iguais.indexOf(n) + 1) + ')';
      }
      partes.unshift(tag); n = pai;
    }
    return 'body > ' + partes.join(' > ');
  }
  function descrever(n) {
    var t = n.getAttribute('aria-label') || n.getAttribute('alt') || n.getAttribute('title') || (n.textContent || '').replace(/\s+/g, ' ').trim();
    return (t || '<' + n.tagName.toLowerCase() + '>').slice(0, 120);
  }
  function achar(it) { try { return document.querySelector(it.seletor); } catch (_) { return null; } }
  function quando(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }

  async function carregar() {
    try { itens = (await api.get('/api/feedback', true)).itens || []; } catch (e) { itens = []; cStatus.textContent = e.message || ''; }
    desenharLista(); desenharPinos();
  }
  function abertos() { return itens.filter(function (x) { return !x.feito; }); }

  function desenharPinos() {
    pinos.replaceChildren();
    if (!ligado) return;
    abertos().forEach(function (it, i) {
      var alvo = achar(it); if (!alvo || !alvo.getClientRects().length) return;
      var r = alvo.getBoundingClientRect(), p = el('button', 'fb-ui fb-pino', String(i + 1));
      p.type = 'button'; p.title = it.nome + ': ' + it.texto;
      p.style.left = (r.left + scrollX + r.width * it.x / 100) + 'px';
      p.style.top = (r.top + scrollY + r.height * it.y / 100) + 'px';
      p.addEventListener('click', function () { lista.hidden = false; desenharLista(it.id); });
      pinos.append(p);
    });
  }

  function desenharLista(destaque) {
    var ab = abertos();
    if (!barra.hidden) lista.style.top = (barra.getBoundingClientRect().bottom + 8) + 'px';   // a barra quebra no celular
    lTitulo.textContent = 'Comentários do site · ' + ab.length + ' aberto(s)';
    bLista.textContent = '📋 Lista (' + ab.length + ')';
    lCorpo.replaceChildren();
    var mostrar = verFeitos ? itens : ab;
    if (!mostrar.length) lCorpo.append(el('p', 'fb-vazio', 'Nenhum comentário aberto. Liga a setinha e toca num item.'));
    mostrar.forEach(function (it) {
      var art = el('article', it.feito ? 'fb-item fb-feito' : 'fb-item'), num = ab.indexOf(it) + 1;
      if (it.id === destaque) art.classList.add('fb-destaque');
      art.append(el('small', null, (num ? '#' + num + ' · ' : '✔ ') + it.nome + ' · ' + quando(it.em) + (it.area ? ' · ' + it.area : '')),
                 el('p', null, it.texto), el('small', 'fb-sobre', 'Sobre: ' + (it.elemento || it.seletor)));
      var acoes = el('div', 'fb-botoes'), ir = el('button', null, 'Ir'), feito = el('button', null, it.feito ? '↺ Reabrir' : '✔ Feito'), apagar = el('button', null, '🗑️');
      ir.type = feito.type = apagar.type = 'button'; apagar.setAttribute('aria-label', 'Apagar o comentário');
      ir.addEventListener('click', function () { irPara(it); });
      feito.addEventListener('click', function () { acao(it, it.feito ? 'reabrir' : 'feito'); });
      apagar.addEventListener('click', function () { if (confirm('Apagar este comentário?')) acao(it, 'apagar'); });
      acoes.append(ir, feito, apagar); art.append(acoes); lCorpo.append(art);
      if (it.id === destaque) setTimeout(function () { art.scrollIntoView({ block: 'nearest' }); }, 0);
    });
  }
  async function acao(it, qual) {
    try { await api.post('/api/feedback/' + it.id + '/' + qual, {}); } catch (e) { alert(e.message || 'Não deu agora.'); }
    carregar();
  }
  function irPara(it) {
    if (it.endereco && location.hash !== it.endereco) location.hash = it.endereco;
    setTimeout(function () {
      var alvo = achar(it); if (!alvo) { alert('Esse item não está mais na página (o site mudou).'); return; }
      alvo.scrollIntoView({ block: 'center' }); alvo.classList.add('fb-piscar');
      setTimeout(function () { alvo.classList.remove('fb-piscar'); desenharPinos(); }, 1600);
    }, 350);
  }

  function abrirCaixa(alvo, x, y) {
    alvoAtual = { n: alvo, cx: x, cy: y };
    cSobre.textContent = 'Sobre: ' + descrever(alvo);
    cTexto.value = ''; cStatus.textContent = ''; caixa.hidden = false;
    var w = Math.min(320, innerWidth - 24);
    caixa.style.width = w + 'px';
    caixa.style.left = Math.max(12, Math.min(x + 12, innerWidth - w - 12)) + 'px';
    caixa.style.top = Math.max(12, Math.min(y + 12, innerHeight - 230)) + 'px';
    cTexto.focus();
  }
  caixa.addEventListener('submit', async function (e) {
    e.preventDefault();
    var texto = cTexto.value.trim(); if (!texto || !alvoAtual) return;
    var r = alvoAtual.n.getBoundingClientRect();
    cSalvar.disabled = true; cStatus.textContent = 'Salvando…';
    try {
      await api.post('/api/feedback', { texto: texto, seletor: seletor(alvoAtual.n), elemento: descrever(alvoAtual.n),
        area: document.body.dataset.area || '', endereco: location.hash || '#inicio', largura: innerWidth,
        x: r.width ? (alvoAtual.cx - r.left) / r.width * 100 : 50, y: r.height ? (alvoAtual.cy - r.top) / r.height * 100 : 50 });
      caixa.hidden = true; alvoAtual = null; carregar();
    } catch (err) { cStatus.textContent = err.message || 'Não salvou. Tenta de novo.'; }
    finally { cSalvar.disabled = false; }
  });
  cCancelar.addEventListener('click', function () { caixa.hidden = true; alvoAtual = null; });

  // o modo: o realce segue o mouse; o clique (na captura) vira comentário em vez de abrir o link/botão
  document.addEventListener('mousemove', function (e) {
    if (!ligado || nossa(e.target) || !caixa.hidden) { realce.hidden = true; return; }
    var r = e.target.getBoundingClientRect();
    realce.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
    realce.hidden = false;
  }, true);
  document.addEventListener('click', function (e) {
    if (!ligado || nossa(e.target)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    realce.hidden = true; abrirCaixa(e.target, e.clientX, e.clientY);
  }, true);

  function ligar() { ligado = true; document.body.classList.add('fb-modo'); barra.hidden = false; botao.textContent = '➤ Comentando…'; carregar(); }
  function desligar() { ligado = false; document.body.classList.remove('fb-modo'); barra.hidden = caixa.hidden = lista.hidden = realce.hidden = true; pinos.replaceChildren(); botao.textContent = '➤ Comentar o site'; }
  botao.addEventListener('click', function () { if (ligado) desligar(); else ligar(); });
  bSair.addEventListener('click', desligar);
  bLista.addEventListener('click', function () { lista.hidden = !lista.hidden; desenharLista(); });
  lFechar.addEventListener('click', function () { lista.hidden = true; });
  lCheck.addEventListener('change', function () { verFeitos = lCheck.checked; desenharLista(); });
  window.addEventListener('resize', desenharPinos); window.addEventListener('hashchange', function () { setTimeout(desenharPinos, 300); });
  setInterval(function () { if (ligado) desenharPinos(); }, 2000);
})();
