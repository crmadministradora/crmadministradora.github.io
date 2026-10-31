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
  function logado() { try { return !!localStorage.getItem('crm_sessao'); } catch (_) { return false; } }
  function api() { return window.CRM_SITE_API; }
  function img(caminho) { return caminho && api() ? api().base + caminho : ''; }
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
  function marcarJogo() {
    document.querySelectorAll('[data-dc-jogo]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.dcJogo === estado.jogo)); });
  }

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
    if (c.imagem) { var im = el('img'); im.src = img(c.imagem); im.alt = 'Carta de ' + c.nick; im.width = 640; im.height = 900; fig.append(im); fig.addEventListener('click', function () { ampliar(c.nick, img(c.imagem)); }); }
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
    if (!logado()) return chamarLogin(minha, 'Entra com o Discord pra ver a tua carta do Dream Cards aqui.');
    if (!forcar && estado.eu && Date.now() - estado.euEm < 50 * 60 * 1000) return desenharMinha();
    minha.replaceChildren(el('p', 'data-referencia', 'Carregando a tua carta…'));
    try { estado.eu = await api().get('/api/dreamcards/eu', true); estado.euEm = Date.now(); desenharMinha(); }
    catch (e) { erro(minha, e, function () { carregarMinha(true); }); }
  }

  /* ---------- o álbum ---------- */
  async function carregarAlbum() {
    paginas.replaceChildren();
    if (!logado()) { status.textContent = ''; return chamarLogin(grade, 'Entra com o Discord pra folhear o álbum do Dream Cards.'); }
    var n = ++estado.pedido;
    status.textContent = 'Carregando o álbum…';
    var q = '/api/dreamcards/album?jogo=' + estado.jogo + '&pagina=' + estado.pagina + '&por=24&ordem=' + estado.ordem + (estado.q ? '&q=' + encodeURIComponent(estado.q) : '');
    try {
      var r = await api().get(q, true);
      if (n !== estado.pedido) return;
      grade.replaceChildren();
      status.textContent = r.total ? r.total + ' carta' + (r.total > 1 ? 's' : '') + ' · ' + JOGOS[r.jogo] + (r.edicao ? ' · temporada ' + r.edicao : '') + ' · atualizado ' + quando(r.atualizado) : (estado.q ? 'Nenhum nick com "' + estado.q + '".' : 'O álbum ainda está vazio.');
      r.cartas.forEach(function (c) {
        var b = el('button', 'dc-album-carta'); b.type = 'button';
        if (c.previa) { var im = el('img'); im.src = img(c.previa); im.alt = ''; im.loading = 'lazy'; im.width = 320; im.height = 450; b.append(im); }
        else b.append(el('div', 'carta-pendente', 'Carta em atualização'));
        var meta = el('span', 'dc-album-meta');
        meta.append(el('strong', '', c.nick), el('small', '', 'Geral ' + (c.geral != null ? c.geral : '—') + (c.posicao ? ' · #' + c.posicao : '') + ' · ' + c.partidas + ' partidas'));
        b.append(meta);
        b.setAttribute('aria-label', 'Carta de ' + c.nick + ', Geral ' + (c.geral != null ? c.geral : 'sem número'));
        if (c.imagem) b.addEventListener('click', function () { ampliar(c.nick, img(c.imagem)); }); else b.disabled = true;
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
      if (n !== estado.pedido) return;
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
  window.addEventListener('crm:auth-change', function () { estado.eu = null; carregarTudo(true); });
  marcarJogo();
  carregarTudo(false);
})();
