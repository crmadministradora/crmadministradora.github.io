(function () {
  'use strict';
  var lista = document.getElementById('rede-lista'), estado = document.getElementById('rede-estado');
  if (!lista) return;
  var casas = [], revisao = 0, carregando = false, pendentes = new Set();
  function el(tag, classe, texto) { var e = document.createElement(tag); if (classe) e.className = classe; if (texto != null) e.textContent = texto; return e; }
  function sessao() { try { return localStorage.getItem('crm_sessao') || ''; } catch (_) { return ''; } }
  function entrar() { document.getElementById('btn-login').click(); }
  function url(valor) { try { var u = new URL(valor); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } }
  function numero(n) { return Number.isFinite(Number(n)) ? Number(n).toLocaleString('pt-BR', {maximumFractionDigits: 1}) : '—'; }
  function tempo(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ' h ' : '') + (m ? m + ' min ' : '') + s % 60 + ' s'; }
  function contadores() {
    lista.querySelectorAll('button[data-tipo]').forEach(function (b) {
      var falta = Number(b.dataset.ate || 0) - Date.now();
      b.disabled = pendentes.has(b.dataset.casa) || (!!sessao() && falta > 0);
      b.textContent = b.dataset.rotulo + (sessao() && falta > 0 ? ' · ' + tempo(falta) : '');
    });
  }
  function desenhar() {
    lista.replaceChildren();
    casas.forEach(function (c) {
      var item = el('li', 'rede-casa'), cab = el('div', 'rede-identidade');
      cab.append(el('span', 'rede-posicao', '#' + numero(c.posicao)));
      if (url(c.icone)) { var img = el('img'); img.src = url(c.icone); img.alt = ''; img.width = img.height = 52; img.loading = 'lazy'; img.onerror = function () { img.hidden = true; }; cab.append(img); }
      cab.append(el('h3', null, c.nome)); item.append(cab);
      var dados = el('dl', 'rede-numeros');
      [['Membros', c.membros], ['Votos · 30 dias', c.votos], ['Curtidas', c.likes], ['Bumps · 7 dias', c.bumps], ['Pontos', c.pontos]].forEach(function (par) { var d = el('div'); d.append(el('dt', null, par[0]), el('dd', null, numero(par[1]))); dados.append(d); });
      item.append(dados, el('p', 'rede-tempo', numero(c.minutos_no_carrossel) + ' min no carrossel'));
      var acoes = el('div', 'rede-acoes');
      [['voto', 'Votar'], ['like', 'Curtir'], ['bump', 'Bump']].forEach(function (par) {
        var b = el('button', 'botao botao-pequeno'); b.type = 'button'; b.dataset.casa = String(c.id); b.dataset.tipo = par[0]; b.dataset.rotulo = par[1];
        b.dataset.ate = c._prazos[par[0]] || 0; b.setAttribute('aria-label', par[1] + ' · ' + c.nome);
        b.addEventListener('click', function () { agir(c, par[0]); }); acoes.append(b);
      });
      if (url(c.convite)) { var a = el('a', 'rede-convite', 'Entrar no Discord ↗'); a.href = url(c.convite); a.target = '_blank'; a.rel = 'noopener'; acoes.append(a); }
      item.append(acoes); lista.append(item);
    });
    contadores();
  }
  async function carregar() {
    if (location.hash !== '#servidores') return;
    var rodada = ++revisao, token = sessao(); carregando = true;
    estado.textContent = 'Consultando o placar…';
    try {
      var data = await window.CRM_SITE_API.get('/api/rede/placar', true);
      if (rodada !== revisao || token !== sessao()) return;
      if (!Array.isArray(data.casas)) throw Error('Resposta inválida');
      casas = data.casas.map(function (c) { return Object.assign({}, c, {_prazos: {voto: Date.now() + Math.max(0, Number((c.eu || {}).voto_em_s) || 0) * 1000, like: Date.now() + Math.max(0, Number((c.eu || {}).like_em_s) || 0) * 1000, bump: Date.now() + Math.max(0, Number((c.eu || {}).bump_em_s) || 0) * 1000}}); });
      desenhar(); estado.textContent = casas.length ? 'Placar compartilhado com o Discord.' : 'Nenhum servidor disponível no placar agora.';
    } catch (e) {
      if (rodada !== revisao) return;
      casas = []; lista.replaceChildren();
      estado.textContent = e.status === 404 ? 'Em breve · o placar de servidores está chegando.' : e.status === 401 ? 'Entre novamente com o Discord para consultar o placar.' : 'Não foi possível carregar o placar. Tente atualizar.';
    } finally { if (rodada === revisao) carregando = false; }
  }
  async function agir(casa, tipo) {
    if (!sessao()) { entrar(); return; }
    var id = String(casa.id), token = sessao(); if (pendentes.has(id)) return;
    pendentes.add(id); contadores();
    try {
      var data = await window.CRM_SITE_API.post('/api/rede/agir', {casa: id, tipo: tipo});
      if (token !== sessao()) return;
      if (data.ok) { await carregar(); if (token === sessao()) estado.textContent = data.texto || 'Pronto! Placar atualizado.'; }
      else {
        estado.textContent = data.texto || data.espera || 'Não foi possível concluir agora.';
        var espera = Number(data.espera_s || (tipo === 'like' && data.like_em_s));
        if (espera > 0) { casa._prazos[tipo] = Date.now() + espera * 1000; desenhar(); }
      }
    } catch (e) {
      if (token !== sessao()) return;
      estado.textContent = e.status === 401 ? 'Sua sessão expirou. Entre novamente com o Discord.' : 'Não foi possível concluir. Tente novamente.';
      if (e.status === 401) entrar();
    } finally { pendentes.delete(id); contadores(); }
  }
  document.getElementById('rede-atualizar').addEventListener('click', function () { if (!carregando) carregar(); });
  window.addEventListener('hashchange', carregar);
  function mudouSessao() { ++revisao; carregando = false; casas = []; lista.replaceChildren(); carregar(); }
  window.addEventListener('crm:auth-change', mudouSessao);
  window.addEventListener('storage', function (e) { if (e.key === 'crm_sessao') mudouSessao(); });
  setInterval(function () { if (location.hash === '#servidores' && !document.hidden) contadores(); }, 1000);
  carregar();
})();
