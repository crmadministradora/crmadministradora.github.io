/* 31/10/2026 (Claude): a aba do Dream Cards -- "Minha carta" (/meucard) e o "Álbum" (/albumhok) dentro do site.
   API: GET /api/dreamcards/eu e /api/dreamcards/album (as duas pedem login); a imagem vem por URL assinada (1 h). */
(function () {
  'use strict';
  var JOGOS = {hok: 'Honor of Kings', mlbb: 'Mobile Legends'};
  var ATRIB = [['versatilidade', 'Versatilidade'], ['inteligencia', 'Inteligência'], ['micro', 'Micro'], ['macro', 'Macro']];
  var estado = {jogo: 'hok', ordem: 'album', q: '', pagina: 1, eu: null, euEm: 0, pedido: 0};
  var minha = document.getElementById('dc-minha-corpo'), grade = document.getElementById('dc-album-grade');
  var status = document.getElementById('dc-album-status'), paginas = document.getElementById('dc-album-paginas');
  if (!minha || !grade) return;

  function el(tag, classe, texto) { var e = document.createElement(tag); if (classe) e.className = classe; if (texto != null) e.textContent = texto; return e; }
  function sessao() { try { return localStorage.getItem('crm_sessao'); } catch (_) { return null; } }
  function logado() { return !!sessao(); }
  function api() { return window.CRM_SITE_API; }
  function img(caminho) {
    if (!caminho || !api()) return '';
    try { var u = new URL(caminho, api().base); return u.protocol === 'https:' || (u.protocol === 'http:' && u.origin === location.origin) ? u.href : ''; } catch (_) { return ''; }
  }
  function linkDiscord() { return ((window.CRM_DADOS || {}).links || {}).site_dreamcards || '#dream-cards'; }
  function naAba() { return document.body.dataset.area === 'dream'; }

  function chamarLogin(caixa, texto) {
    caixa.replaceChildren();
    var box = el('div', 'dc-vazio');
    box.append(el('p', '', texto));
    var b = el('button', 'botao', 'Entrar com Discord'); b.type = 'button';
    b.addEventListener('click', function () { document.getElementById('btn-login').click(); });
    box.append(b);
    caixa.append(box);
  }
  function erro(caixa, e, tentar) {
    if (e && e.status === 401) return chamarLogin(caixa, 'Tua sessão venceu. Entra com o Discord de novo pra ver as cartas.');
    caixa.replaceChildren();
    var box = el('div', 'dc-vazio'); box.append(el('p', '', (e && e.message) || 'Não consegui carregar agora.'));
    var b = el('button', 'botao', 'Tentar de novo'); b.type = 'button'; b.addEventListener('click', tentar); box.append(b);
    caixa.append(box);
  }
  function ampliar(nick, src) {
    var d = document.getElementById('carta-ampliada'); if (!d || !src) return;
    document.getElementById('carta-ampliada-titulo').textContent = nick;
    var large = document.getElementById('carta-ampliada-img'); large.src = src; large.alt = 'Carta de ' + nick;
    d.showModal();
  }
  /* 31/10 ~15:50 -- a 1ª ida da imagem às vezes morre no túnel da API (no PC dele a carta ficou quebrada e só veio no
     clique: o pedido nem chegou na API). A imagem tenta de novo sozinha 2 vezes; se não vier, diz "toque pra carregar". */
  function imagem(src, alt, w, h, preguicosa) {
    var im = el('img'), tentativas = 0;
    im.alt = alt; im.width = w; im.height = h; if (preguicosa) im.loading = 'lazy';
    im.addEventListener('error', function () {
      if (tentativas < 2) { tentativas++; setTimeout(function () { im.src = src + '&r=' + tentativas + Date.now(); }, 700 * tentativas); return; }
      var aviso = el('div', 'carta-pendente', 'Toque pra carregar a carta');
      im.replaceWith(aviso);
    });
    im.src = src;
    return im;
  }
  function marcarJogo() {
    document.querySelectorAll('[data-dc-jogo]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.dcJogo === estado.jogo)); });
  }


  /* P136: só a resposta autenticada de detalhes autoriza exibir a ficha; sem cache. */
  var ficha = document.getElementById('dc-detalhes'), fichaCorpo = document.getElementById('dc-detalhes-corpo');
  var fichaTitulo = document.getElementById('dc-detalhes-titulo');
  var fichaCarta = document.getElementById('dc-detalhes-carta'), pedidoFicha = 0, pedidoMinha = 0;
  function limparFicha() {
    pedidoFicha++;
    fichaCarta.hidden = true;
    fichaCarta.removeAttribute('src');
    fichaCorpo.replaceChildren();
    fichaCorpo.removeAttribute('aria-busy');
  }
  function fecharFicha() { if (ficha.open) ficha.close(); limparFicha(); }
  function textoDiscord(texto) {
    var bloco = el('div', 'dc-ficha-texto');
    String(texto || '').split(/\r?\n/).forEach(function (linha) {
      var pequena = linha.indexOf('-# ') === 0;
      if (pequena) linha = linha.slice(3);
      var p = el('p', pequena ? 'dc-ficha-miudo' : '');
      var re = /\*\*([^*\n]+)\*\*/g, m, inicio = 0;
      // Text nodes first: HTML, links and scripts from Discord never become DOM elements.
      while ((m = re.exec(linha))) {
        p.append(document.createTextNode(linha.slice(inicio, m.index)), el('strong', '', m[1]));
        inicio = re.lastIndex;
      }
      p.append(document.createTextNode(linha.slice(inicio)));
      if (!linha) p.append(el('br'));
      bloco.append(p);
    });
    return bloco;
  }
  function selos(c) {
    var badges = el('span', 'dc-album-selos');
    if (c.publica === true) { var aberto = el('span', 'dc-selo-publico', '🔓'); aberto.title = 'Detalhes liberados'; aberto.setAttribute('aria-label', aberto.title); badges.append(aberto); }
    if (Array.isArray(c.imortal) && c.imortal.length) { var imortal = el('span', 'dc-selo-imortal', '🗿'); imortal.title = 'Imortal · temporada(s) ' + c.imortal.join(', '); imortal.setAttribute('aria-label', imortal.title); badges.append(imortal); }
    return badges;
  }
  function convitePrivacidade(mensagem) {
    var box = el('div', 'dc-vazio');
    box.append(el('p', 'dc-vazio-titulo', '🔒 Esse jogador ainda não liberou os detalhes.'));
    box.append(el('p', '', mensagem || 'No /meucard do Discord, abra 🔐 Privacidade e publique a ficha para liberar os seus detalhes.'));
    var a = el('a', 'botao botao-roxo', 'Liberar os meus no Discord'); a.href = linkDiscord(); a.target = '_blank'; a.rel = 'noopener';
    box.append(a); fichaCorpo.replaceChildren(box);
  }
  async function abrirFicha(c, jogo, cartaSrc) {
    if (!c || c.cid == null) return;
    var n = ++pedidoFicha, token = sessao();
    fichaTitulo.textContent = c.nick || 'Jogador';
    fichaCarta.hidden = !cartaSrc;
    if (cartaSrc) {
      fichaCarta.alt = 'Carta de ' + fichaTitulo.textContent;
      fichaCarta.src = cartaSrc;
    } else {
      fichaCarta.removeAttribute('src');
    }
    fichaCorpo.replaceChildren(el('p', 'dc-detalhes-estado', 'Carregando os detalhes…'));
    fichaCorpo.setAttribute('aria-busy', 'true');
    if (!ficha.open) ficha.showModal();
    ficha.scrollTop = 0;
    if (!token) { fichaCorpo.removeAttribute('aria-busy'); chamarLogin(fichaCorpo, 'Entra com o Discord para ver os detalhes do jogador.'); return; }
    try {
      var r = await api().get('/api/dreamcards/detalhes?jogo=' + encodeURIComponent(jogo) + '&cid=' + encodeURIComponent(c.cid), true);
      if (n !== pedidoFicha || !ficha.open || token !== sessao()) return;
      fichaTitulo.textContent = r.nick || c.nick || 'Jogador';
      var layout = el('div', 'dc-ficha-layout'), visual = el('div', 'dc-ficha-visual'), info = el('div', 'dc-ficha-info');
      var src = img(r.imagem);
      if (src) {
        var foto = el('img', 'dc-ficha-imagem'); foto.alt = 'Frente e verso da carta de ' + fichaTitulo.textContent; foto.src = src;
        foto.addEventListener('error', function () {
          var aviso = el('div', 'dc-vazio'); aviso.append(el('p', '', 'Não consegui carregar a imagem da carta.'));
          var b = el('button', 'botao', 'Tentar carregar'); b.type = 'button'; b.addEventListener('click', function () { abrirFicha(c, jogo, cartaSrc); }); aviso.append(b); visual.replaceChildren(aviso);
        });
        visual.append(foto);
      } else visual.append(el('p', '', 'A imagem da carta ainda está chegando.'));
      info.append(el('p', 'dc-detalhes-jogo', JOGOS[jogo] || 'Dream Cards'));
      if (Array.isArray(r.imortal) && r.imortal.length) info.append(el('p', 'dc-imortal-medalha', '🗿 Imortal · temporada(s) ' + r.imortal.join(', ')));
      info.append(textoDiscord(r.texto));
      layout.append(visual, info); fichaCorpo.replaceChildren(layout);
    } catch (e) {
      if (n !== pedidoFicha || !ficha.open || token !== sessao()) return;
      if (e.status === 403) convitePrivacidade(e.message);
      else if (e.status === 503) {
        var box = el('div', 'dc-vazio'); box.append(el('p', 'dc-vazio-titulo', 'Os detalhes estão chegando.'), el('p', '', e.message || 'A ficha foi liberada há pouco. Os detalhes chegam em até 10 minutos.'));
        var b = el('button', 'botao', 'Tentar de novo'); b.type = 'button'; b.addEventListener('click', function () { abrirFicha(c, jogo, cartaSrc); }); box.append(b); fichaCorpo.replaceChildren(box);
      } else if (e.status === 404) fichaCorpo.replaceChildren(el('div', 'dc-vazio', e.message || 'Não encontrei essa carta. Atualize o álbum e tente de novo.'));
      else erro(fichaCorpo, e, function () { abrirFicha(c, jogo, cartaSrc); });
    } finally {
      if (n === pedidoFicha) fichaCorpo.removeAttribute('aria-busy');
    }
  }
  document.getElementById('dc-detalhes-fechar').addEventListener('click', fecharFicha);
  ficha.addEventListener('close', function () { if (!ficha.open) limparFicha(); });
  ficha.addEventListener('click', function (e) { var r = ficha.getBoundingClientRect(); if (e.target === ficha && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) fecharFicha(); });
  // O pódio estático só ganha Detalhes quando o export trouxer CID: nunca adivinhar pelo nick.
  var podio = (window.CRM_DADOS || {}).dreamcards || {};
  (Array.isArray(podio.cartas) ? podio.cartas : []).slice().sort(function (a, b) { return a.posicao - b.posicao; }).slice(0, 6).forEach(function (c, i) {
    if (c.cid == null) return;
    var artigo = document.querySelectorAll('#podio-lista .jogador')[i]; if (!artigo) return;
    var b = artigo.querySelector('.ampliar-carta'); if (!b) return;
    var titulo = artigo.querySelector('h3'); if (!titulo || titulo.textContent !== c.nick) return;
    b.setAttribute('aria-label', 'Ver detalhes de ' + c.nick);
    var dica = b.querySelector('span'); if (dica) dica.textContent = 'Ver detalhes ↗';
    b.append(selos(c));
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var foto = b.querySelector('img');
      abrirFicha(c, c.jogo || podio.jogo || 'hok', foto && foto.src);
    }, true);
  });

  /* ---------- minha carta ---------- */
  function desenharMinha() {
    var j = estado.eu && estado.eu.jogos && estado.eu.jogos[estado.jogo];
    minha.replaceChildren();
    if (!j || !j.disponivel) { minha.append(el('div', 'dc-vazio', 'O álbum de ' + JOGOS[estado.jogo] + ' ainda está chegando do Dream Cards. Volta em alguns minutos.')); return; }
    if (!j.tem_carta) {
      var box = el('div', 'dc-vazio');
      box.append(el('p', 'dc-vazio-titulo', 'Você ainda não tem carta em ' + JOGOS[estado.jogo] + '.'));
      box.append(el('p', '', j.como_criar || ''));
      var a = el('a', 'botao botao-roxo', 'Abrir o Discord do Dream Cards ↗'); a.href = linkDiscord(); a.target = '_blank'; a.rel = 'noopener';
      box.append(a); minha.append(box); return;
    }
    var c = j.carta, wrap = el('div', 'dc-minha-carta');
    var fig = el('button', 'dc-minha-img'); fig.type = 'button'; fig.setAttribute('aria-label', 'Ampliar a carta de ' + c.nick);
    if (c.imagem) { fig.append(imagem(img(c.imagem), 'Carta de ' + c.nick, 640, 900, false)); fig.addEventListener('click', function () { ampliar(c.nick, img(c.imagem)); }); }
    else { fig.append(el('div', 'carta-pendente', 'Carta em atualização')); fig.disabled = true; }
    var info = el('div', 'dc-minha-info');
    info.append(el('h3', '', c.nick));
    var chips = el('div', 'dc-chips');
    chips.append(el('span', 'dc-chip dc-chip-geral', 'Geral ' + (c.geral != null ? c.geral : '—')));
    if (c.posicao) chips.append(el('span', 'dc-chip', '#' + c.posicao + ' no ranking'));
    chips.append(el('span', 'dc-chip', c.partidas + ' partidas'));
    if (c.partidas) chips.append(el('span', 'dc-chip', Math.round(100 * c.vitorias / c.partidas) + '% de vitória'));
    if (c.verificado) chips.append(el('span', 'dc-chip dc-chip-ok', 'Verificado'));
    info.append(chips);
    ATRIB.forEach(function (a) {
      var v = c[a[0]], linha = el('div', 'dc-barra');
      linha.append(el('span', '', a[1]));
      var trilho = el('div', 'dc-barra-trilho'), cheio = el('div', 'dc-barra-cheia');
      cheio.style.width = (v == null ? 0 : Math.max(0, Math.min(100, v))) + '%'; trilho.append(cheio);
      linha.append(trilho, el('b', '', v == null ? '—' : String(v)));
      info.append(linha);
    });
    info.append(el('p', 'data-referencia', 'Confiança da carta: ' + Math.round(100 * (c.confianca || 0)) + '% · atualizado ' + quando(j.atualizado) + (j.edicao ? ' · temporada ' + j.edicao : '')));
    var acoes = el('div', 'dc-acoes');
    var al = el('a', 'botao', 'Ver no álbum'); al.href = '#dc-album';
    var dc = el('a', 'botao botao-roxo', 'Mandar print no Discord ↗'); dc.href = linkDiscord(); dc.target = '_blank'; dc.rel = 'noopener';
    acoes.append(al, dc); info.append(acoes);
    wrap.append(fig, info); minha.append(wrap);
  }
  function quando(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
  }
  async function carregarMinha(forcar) {
    var n = ++pedidoMinha, token = sessao();
    if (!token) return chamarLogin(minha, 'Entra com o Discord pra ver a tua carta do Dream Cards aqui.');
    if (!forcar && estado.eu && Date.now() - estado.euEm < 50 * 60 * 1000) return desenharMinha();
    minha.replaceChildren(el('p', 'data-referencia', 'Carregando a tua carta…'));
    try { var r = await api().get('/api/dreamcards/eu', true); if (n !== pedidoMinha || token !== sessao()) return; estado.eu = r; estado.euEm = Date.now(); desenharMinha(); }
    catch (e) { if (n === pedidoMinha && token === sessao()) erro(minha, e, function () { carregarMinha(true); }); }
  }

  /* ---------- o álbum ---------- */
  async function carregarAlbum() {
    var n = ++estado.pedido, token = sessao(), jogo = estado.jogo;
    paginas.replaceChildren();
    if (!logado()) { status.textContent = ''; return chamarLogin(grade, 'Entra com o Discord pra folhear o álbum do Dream Cards.'); }
    grade.replaceChildren();
    status.textContent = 'Carregando o álbum…';
    var q = '/api/dreamcards/album?jogo=' + estado.jogo + '&pagina=' + estado.pagina + '&por=24&ordem=' + estado.ordem + (estado.q ? '&q=' + encodeURIComponent(estado.q) : '');
    try {
      var r = await api().get(q, true);
      if (n !== estado.pedido || token !== sessao()) return;
      grade.replaceChildren();
      status.textContent = r.total ? r.total + ' carta' + (r.total > 1 ? 's' : '') + ' · ' + JOGOS[r.jogo] + (r.edicao ? ' · temporada ' + r.edicao : '') + ' · atualizado ' + quando(r.atualizado) : (estado.q ? 'Nenhum nick com "' + estado.q + '".' : (estado.ordem === 'imortais' ? 'Ninguém ainda virou Imortal nesta temporada' : 'O álbum ainda está vazio.'));
      r.cartas.forEach(function (c) {
        var b = el('button', 'dc-album-carta'); b.type = 'button';
        if (c.previa) b.append(imagem(img(c.previa), '', 320, 450, true));
        else b.append(el('div', 'carta-pendente', 'Carta em atualização'));
        var meta = el('span', 'dc-album-meta');
        meta.append(el('strong', '', c.nick), el('small', '', 'Geral ' + (c.geral != null ? c.geral : '—') + (c.posicao ? ' · #' + c.posicao : '') + ' · ' + c.partidas + ' partidas'));
        meta.append(selos(c), el('span', 'dc-album-dica', c.publica === true ? 'Ver detalhes ↗' : 'Ver privacidade 🔒'));
        b.append(meta);
        b.setAttribute('aria-label', 'Ver detalhes de ' + c.nick + (c.publica === true ? ', ficha liberada' : ', conferir privacidade') + (Array.isArray(c.imortal) && c.imortal.length ? ', Imortal' : ''));
        var cartaSrc = img(c.imagem) || img(c.previa);
        if (c.cid != null) b.addEventListener('click', function () { abrirFicha(c, jogo, cartaSrc); });
        else if (cartaSrc) b.addEventListener('click', function () { ampliar(c.nick, cartaSrc); });
        else b.disabled = true;
        grade.append(b);
      });
      if (r.paginas > 1) {
        var ant = el('button', 'botao botao-pequeno', '← Anterior'); ant.type = 'button'; ant.disabled = r.pagina <= 1;
        var prox = el('button', 'botao botao-pequeno', 'Próxima →'); prox.type = 'button'; prox.disabled = r.pagina >= r.paginas;
        ant.addEventListener('click', function () { estado.pagina = r.pagina - 1; carregarAlbum(); document.getElementById('dc-album').scrollIntoView({block: 'start'}); });
        prox.addEventListener('click', function () { estado.pagina = r.pagina + 1; carregarAlbum(); document.getElementById('dc-album').scrollIntoView({block: 'start'}); });
        paginas.append(ant, el('span', '', 'Página ' + r.pagina + ' de ' + r.paginas), prox);
      }
    } catch (e) {
      if (n !== estado.pedido || token !== sessao()) return;
      status.textContent = '';
      erro(grade, e, carregarAlbum);
    }
  }

  function carregarTudo(forcar) { if (!naAba()) return; carregarMinha(forcar); carregarAlbum(); }

  document.querySelectorAll('[data-dc-jogo]').forEach(function (b) {
    b.addEventListener('click', function () { estado.jogo = b.dataset.dcJogo; estado.pagina = 1; marcarJogo(); if (estado.eu) desenharMinha(); else carregarMinha(); carregarAlbum(); });
  });
  document.getElementById('dc-album-ordem').addEventListener('change', function (e) { estado.ordem = e.target.value; estado.pagina = 1; carregarAlbum(); });
  var espera = null;
  document.getElementById('dc-album-busca').addEventListener('input', function (e) {
    clearTimeout(espera);
    espera = setTimeout(function () { estado.q = e.target.value.trim(); estado.pagina = 1; carregarAlbum(); }, 350);
  });
  window.addEventListener('hashchange', function () { setTimeout(function () { carregarTudo(false); }, 0); });
  function mudouSessao() { estado.pedido++; pedidoMinha++; estado.eu = null; fecharFicha(); grade.replaceChildren(); minha.replaceChildren(); carregarTudo(true); }
  window.addEventListener('crm:auth-change', mudouSessao);
  window.addEventListener('storage', function (e) { if (e.key === 'crm_sessao') mudouSessao(); });
  marcarJogo();
  carregarTudo(false);
})();
