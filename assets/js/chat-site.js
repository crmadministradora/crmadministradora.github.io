/* 31/10/2026 (Claude): o CHAT da comunidade, aba própria estilo Discord. API: GET /api/chat (aberto, últimas 12 h),
   POST /api/chat {texto, foto} e /api/chat/<id>/apagar (com o login do Discord). Guarda 2 dias no servidor. */
(function () {
  'use strict';
  var lista = document.getElementById('chat-lista'), form = document.getElementById('chat-envio');
  if (!lista || !form) return;
  var texto = document.getElementById('chat-texto'), arquivo = document.getElementById('chat-foto');
  var previa = document.getElementById('chat-previa'), aviso = document.getElementById('chat-aviso');
  var mandar = document.getElementById('chat-mandar');
  var ultimo = null, ids = new Set(), foto = null, timer = null, ocupado = false, meuId = null;

  function el(tag, classe, t) { var e = document.createElement(tag); if (classe) e.className = classe; if (t != null) e.textContent = t; return e; }
  function api() { return window.CRM_SITE_API; }
  function logado() { try { return !!localStorage.getItem('crm_sessao'); } catch (_) { return false; } }
  function naAba() { return document.body.dataset.area === 'chat'; }
  function hora(s) { var d = new Date(s * 1000), hoje = new Date(); var h = d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}); return d.toDateString() === hoje.toDateString() ? 'hoje às ' + h : d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' ' + h; }

  function linha(m) {
    var row = el('article', 'chat-msg'); row.dataset.id = m.id;
    var av = el('img', 'chat-avatar'); av.alt = ''; av.width = 40; av.height = 40; av.loading = 'lazy';
    av.src = m.autor.avatar || 'assets/img/crm-logo-27-10.png';
    var corpo = el('div', 'chat-corpo'), topo = el('div', 'chat-quem');
    topo.append(el('strong', m.autor.equipe ? 'chat-nome chat-equipe' : 'chat-nome', m.autor.nome));
    if (m.autor.equipe) topo.append(el('span', 'chat-selo', 'EQUIPE CRM'));
    topo.append(el('time', 'chat-hora', hora(m.quando)));
    if (meuId && (m.autor.id === meuId || souEquipe())) {
      var x = el('button', 'chat-apagar', 'Apagar'); x.type = 'button';
      x.addEventListener('click', async function () {
        if (!confirm('Apagar esta mensagem?')) return;
        try { await api().post('/api/chat/' + m.id + '/apagar'); row.remove(); ids.delete(m.id); }
        catch (e) { aviso.textContent = e.message; }
      });
      topo.append(x);
    }
    corpo.append(topo);
    if (m.texto) corpo.append(el('p', 'chat-texto', m.texto));
    if (m.foto) {
      var a = el('a', 'chat-foto'); a.href = api().base + m.foto; a.target = '_blank'; a.rel = 'noopener';
      var im = el('img'); im.src = api().base + m.foto; im.alt = 'Foto enviada por ' + m.autor.nome; im.loading = 'lazy';
      a.append(im); corpo.append(a);
    }
    row.append(av, corpo);
    return row;
  }
  function souEquipe() { try { return !!(window.CRM_ACCOUNT_STATE && window.CRM_ACCOUNT_STATE.canViewVisor()); } catch (_) { return false; } }

  async function carregar() {
    if (ocupado || !api()) return; ocupado = true;
    try {
      var r = await api().get('/api/chat' + (ultimo ? '?desde=' + encodeURIComponent(ultimo) : ''), logado());
      var noFim = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
      if (!ultimo && !r.mensagens.length) lista.replaceChildren(el('p', 'chat-vazio', 'Ninguém falou nas últimas 12 horas. Puxa o papo!'));
      r.mensagens.forEach(function (m) {
        if (ids.has(m.id)) return;
        var vazio = lista.querySelector('.chat-vazio'); if (vazio) vazio.remove();
        ids.add(m.id); lista.append(linha(m)); ultimo = m.id;
      });
      if (noFim || r.mensagens.length && !lista.dataset.rolou) { lista.scrollTop = lista.scrollHeight; lista.dataset.rolou = '1'; }
      if (aviso.dataset.erroRede) { aviso.textContent = ''; delete aviso.dataset.erroRede; }
    } catch (e) {
      aviso.textContent = 'O chat não respondeu agora. Tentando de novo…'; aviso.dataset.erroRede = '1';
    } finally { ocupado = false; }
  }
  async function quemSouEu() {
    meuId = null;
    if (!logado()) return;
    try { var r = await api().get('/api/eu', true); meuId = r.usuario && r.usuario.id; } catch (_) {}
  }
  function pintarEnvio() {
    var on = logado();
    form.classList.toggle('chat-sem-login', !on);
    texto.disabled = arquivo.disabled = !on;
    texto.placeholder = on ? 'Conversar em # geral' : 'Entra com o Discord pra conversar';
    mandar.textContent = on ? 'Enviar' : 'Entrar com Discord';
  }
  function ligar() {
    clearInterval(timer);
    if (!naAba()) return;
    carregar(); timer = setInterval(function () { if (!document.hidden && naAba()) carregar(); }, 4000);
  }

  arquivo.addEventListener('change', function () {
    var f = arquivo.files && arquivo.files[0]; foto = null; previa.hidden = true; previa.replaceChildren();
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { aviso.textContent = 'Foto grande demais: até 4 MB.'; arquivo.value = ''; return; }
    var leitor = new FileReader();
    leitor.onload = function () {
      foto = leitor.result;
      var im = el('img'); im.src = foto; im.alt = 'Foto escolhida';
      var tira = el('button', 'chat-tirar', '×'); tira.type = 'button'; tira.setAttribute('aria-label', 'Tirar a foto');
      tira.addEventListener('click', function () { foto = null; arquivo.value = ''; previa.hidden = true; previa.replaceChildren(); });
      previa.append(im, tira); previa.hidden = false;
    };
    leitor.readAsDataURL(f);
  });
  texto.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!logado()) { document.getElementById('btn-login').click(); return; }
    var t = texto.value.trim(); if (!t && !foto) return;
    mandar.disabled = true; aviso.textContent = foto ? 'Mandando a foto…' : '';
    try {
      var r = await api().post('/api/chat', {texto: t, foto: foto});
      texto.value = ''; foto = null; arquivo.value = ''; previa.hidden = true; previa.replaceChildren(); aviso.textContent = '';
      if (!ids.has(r.mensagem.id)) { var vazio = lista.querySelector('.chat-vazio'); if (vazio) vazio.remove(); ids.add(r.mensagem.id); lista.append(linha(r.mensagem)); ultimo = r.mensagem.id; }
      lista.scrollTop = lista.scrollHeight;
    } catch (err) {
      aviso.textContent = err.message || 'Não consegui mandar agora.';
      if (err.status === 401) { try { localStorage.removeItem('crm_sessao'); } catch (_) {} pintarEnvio(); }
    } finally { mandar.disabled = false; texto.focus(); }
  });

  // o botão CHAT do topo abre ESTA aba (antes abria a janela do P39, que não tinha servidor por trás)
  var botao = document.getElementById('abrir-chat');
  if (botao) botao.onclick = function () { location.hash = 'chat'; };

  window.addEventListener('hashchange', function () { setTimeout(ligar, 0); });
  window.addEventListener('crm:auth-change', function () { pintarEnvio(); quemSouEu().then(function () { ids.clear(); ultimo = null; lista.replaceChildren(); delete lista.dataset.rolou; ligar(); }); });
  pintarEnvio(); quemSouEu().then(ligar);
})();
