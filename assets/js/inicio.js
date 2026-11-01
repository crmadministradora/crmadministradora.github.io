/* 01/11 (S1, Claude): a logo da CRM leva pro Início e, sem login, chama pra entrar com o Discord. */
(function () {
  'use strict';
  function logado() { try { return !!localStorage.getItem('crm_sessao'); } catch (_) { return false; } }
  var aviso = document.getElementById('aviso-flutuante'), timer = null;
  function chamarLogin() {
    if (logado()) return;
    var texto = document.createElement('span'), botao = document.createElement('button');
    texto.textContent = 'Entra com o Discord pra ver teus coins e tua carta. ';
    botao.type = 'button'; botao.className = 'botao botao-pequeno'; botao.textContent = 'Entrar com Discord';
    botao.addEventListener('click', function () { aviso.hidden = true; document.getElementById('btn-login').click(); });
    aviso.replaceChildren(texto, botao); aviso.hidden = false;
    clearTimeout(timer); timer = setTimeout(function () { aviso.hidden = true; }, 8000);
  }
  document.querySelectorAll('.lateral-logo, .topo-marca').forEach(function (a) { a.addEventListener('click', chamarLogin); });
})();
