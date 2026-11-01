/* 01/11 (Claude): liga o ♡ dos cards do Início e do carrossel na API (os "posts de tópico" t-<nome> do site_feed).
   Curtir vale até deslogado (1 por IP); comentar pede login. Antes deste arquivo o CRM_TOPICS nunca era ligado. */
(function () {
  'use strict';
  var api = window.CRM_SITE_API, topicos = window.CRM_TOPICS;
  if (!api || !topicos) return;
  var curti = {};
  function caminho(t) { return '/api/midia/t-' + encodeURIComponent(t); }
  function logado() { try { return !!localStorage.getItem('crm_sessao'); } catch (_) { return false; } }
  async function carregar(t) {
    var d = await api.get(caminho(t) + '/comentarios?n=50', true);
    curti[t] = d.eu_curti === true;
    return { likes: d.curtidas, liked: curti[t], comments_count: d.total,
             comments: (d.comentarios || []).map(function (c) { return { id: c.id, author: (c.usuario || {}).nome, text: c.texto }; }) };
  }
  topicos.connect({
    load: carregar,
    like: async function (t) { await api.post(caminho(t) + '/curtir', { curtir: !curti[t] }); return carregar(t); },
    comment: function (t, p) { return api.post(caminho(t) + '/comentar', { texto: p.text }); },
    identity: function () { return { loggedIn: logado() }; }
  });
})();
