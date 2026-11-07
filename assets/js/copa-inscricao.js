/* 07/11/2026 (Claude): a inscrição na Copa pelo site, ordem do Brunno: "quero inscriçao pelo site (...) a copa eh mega importante".
   API: GET /api/copa (aberto; com login, traz a inscrição da pessoa) e POST /api/copa/inscrever {time, logo}. O dado é o mesmo do botão do Discord. */
(function () {
  'use strict';
  var fatos = document.getElementById('copa-fatos'), acao = document.getElementById('copa-acao');
  var lista = document.getElementById('copa-inscritos'), titulo = document.getElementById('copa-inscritos-titulo');
  if (!fatos || !acao || !lista) return;
  var LADO_DA_LOGO = 512, ocupado = false;

  function el(tag, classe, texto) { var e = document.createElement(tag); if (classe) e.className = classe; if (texto != null) e.textContent = texto; return e; }
  function api() { return window.CRM_SITE_API; }
  function logado() { try { return !!localStorage.getItem('crm_sessao'); } catch (_) { return false; } }
  function naAba() { return document.body.dataset.area === 'copa'; }
  function dadosDoSite() { return (window.CRM_DADOS || {}).copa || {}; }
  function linkDaCopa() { var l = ((window.CRM_DADOS || {}).links || {}).copa_discord; return (l && l.url) || l || ''; }

  function fato(rotulo, valor) {
    if (!valor) return;
    var d = el('div'); d.append(el('dt', null, rotulo), el('dd', null, valor)); fatos.append(d);
  }

  function lerLogo(arquivo) {
    return new Promise(function (ok, erro) {
      if (!/^image\//.test(arquivo.type)) { erro(new Error('Esse arquivo não é uma imagem. Manda um PNG ou JPG.')); return; }
      var img = new Image(), url = URL.createObjectURL(arquivo);
      img.onload = function () {
        var escala = Math.min(1, LADO_DA_LOGO / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * escala)); c.height = Math.max(1, Math.round(img.naturalHeight * escala));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); ok(c.toDataURL('image/png'));
      };
      img.onerror = function () { URL.revokeObjectURL(url); erro(new Error('Essa imagem não abriu. Manda um PNG ou JPG.')); };
      img.src = url;
    });
  }

  function formulario(c) {
    var f = el('form', 'copa-form'); var logo = null;
    var rNome = el('label', 'copa-campo', 'Nome do time');
    var nome = el('input'); nome.type = 'text'; nome.required = true; nome.maxLength = 40; nome.autocomplete = 'off'; nome.id = 'copa-time'; rNome.append(nome);
    var rLogo = el('label', 'copa-campo', 'Logo do time (pode mandar depois)');
    var arq = el('input'); arq.type = 'file'; arq.accept = 'image/png,image/jpeg,image/webp'; arq.id = 'copa-logo'; rLogo.append(arq);
    var previa = el('img', 'copa-previa'); previa.alt = 'Prévia da logo'; previa.hidden = true;
    var aviso = el('p', 'copa-aviso'); aviso.setAttribute('role', 'status');
    var botao = el('button', 'botao', 'Inscrever meu time'); botao.type = 'submit';
    var nota = el('p', 'copa-nota', 'Depois da inscrição vem o Pix' + (c.valor ? ' de ' + c.valor : '') + '. Pagou, a vaga é tua e o time entra na lista.');
    arq.addEventListener('change', async function () {
      aviso.textContent = ''; logo = null; previa.hidden = true;
      if (!arq.files[0]) return;
      try { logo = await lerLogo(arq.files[0]); previa.src = logo; previa.hidden = false; } catch (e) { aviso.textContent = e.message; arq.value = ''; }
    });
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      if (ocupado) return;
      ocupado = true; botao.disabled = true; aviso.textContent = 'Inscrevendo...';
      try { desenhar(await api().post('/api/copa/inscrever', { time: nome.value, logo: logo })); }
      catch (e) { aviso.textContent = e.message || 'Não consegui inscrever agora. Tenta de novo.'; botao.disabled = false; }
      finally { ocupado = false; }
    });
    f.append(rNome, rLogo, previa, botao, aviso, nota);
    return f;
  }

  function whats(m, primeiroGrande) {
    var links = el('div', 'copa-whats');
    (m.responsaveis || []).forEach(function (r, i) {
      var a = el('a', i || !primeiroGrande ? 'botao botao-pequeno botao-roxo' : 'botao', 'WhatsApp: ' + r.nome); a.href = r.link; a.target = '_blank'; a.rel = 'noopener';
      links.append(a);
    });
    return links;
  }

  // 💳 07/11 (Brunno): "soh cai ai qnd paga (...) pagando ai vai pra lista". O Pix da inscrição: o automático (Mercado Pago) se confirma sozinho.
  function pedirPix(c) {
    var f = el('form', 'copa-form copa-pix-pedir'); var email = null;
    f.append(el('p', null, 'Paga ' + (c.valor || 'a inscrição') + ' no Pix pra garantir a vaga. Pagou, o time entra na lista.'));
    if (c.pix_automatico) {
      var r = el('label', 'copa-campo', 'Teu e-mail (o recibo do Pix vai pra ele)');
      email = el('input'); email.type = 'email'; email.required = true; email.maxLength = 120; email.autocomplete = 'email'; email.id = 'copa-email'; r.append(email);
      f.append(r);
    }
    var botao = el('button', 'botao', 'Gerar o Pix'); botao.type = 'submit';
    var aviso = el('p', 'copa-aviso'); aviso.setAttribute('role', 'status');
    f.append(botao, aviso);
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      if (ocupado) return;
      ocupado = true; botao.disabled = true; aviso.textContent = 'Gerando o Pix...';
      try { desenhar(await api().post('/api/copa/pix', { email: email ? email.value : null })); }
      catch (e) { aviso.textContent = e.message || 'Não consegui gerar o Pix agora. Tenta de novo.'; botao.disabled = false; }
      finally { ocupado = false; }
    });
    return f;
  }

  function mostrarPix(m, p) {
    var b = el('div', 'copa-pix');
    b.append(el('p', 'copa-pix-valor', 'Pix de ' + p.valor));
    if (p.qr_png_b64) { var q = el('img', 'copa-pix-qr'); q.src = 'data:image/png;base64,' + p.qr_png_b64; q.alt = 'QR code do Pix'; q.width = 220; q.height = 220; b.append(q); }
    b.append(el('p', 'copa-nota', 'Abre o app do banco e lê o QR, ou usa o Pix copia e cola:'));
    var codigo = el('textarea', 'copa-pix-codigo'); codigo.readOnly = true; codigo.rows = 3; codigo.value = p.copia_e_cola || ''; b.append(codigo);
    var copiar = el('button', 'botao botao-pequeno', 'Copiar o código'); copiar.type = 'button';
    copiar.addEventListener('click', async function () {
      try { await navigator.clipboard.writeText(codigo.value); copiar.textContent = 'Copiado!'; }
      catch (_) { codigo.select(); copiar.textContent = 'Selecionado: copia com Ctrl+C'; }
    });
    b.append(copiar);
    if (p.automatico) {
      var hora = '';
      try { hora = new Date(p.expira_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (_) {}
      b.append(el('p', 'copa-pix-espera', 'Assim que o Pix cair, a vaga é confirmada sozinha aqui e o time entra na lista.' + (hora ? ' Este Pix vale até as ' + hora + '.' : '')));
    } else {
      b.append(el('p', 'copa-nota', 'Pagou? Manda o comprovante no WhatsApp: a equipe confirma a vaga e o time entra na lista.'));
      b.append(whats(m, true));
    }
    return b;
  }

  function feita(m, c) {
    var b = el('div', 'copa-feita');
    b.append(el('h3', null, (m.confirmado ? 'Vaga confirmada: ' : 'Inscrição recebida: ') + m.time), el('p', null, 'Inscrição nº ' + m.n + '.'));
    if (m.confirmado) {
      b.append(el('p', null, 'Pagamento confirmado. Teu time já está na lista abaixo.'));
      if (!m.logo) b.append(el('p', null, 'A logo não veio: manda no WhatsApp da equipe.'));
      b.append(whats(m, false));
      return b;
    }
    if (!m.logo) b.append(el('p', null, 'A logo não veio: manda no WhatsApp da equipe.'));
    if (m.pix && !m.pix.expirou) b.append(mostrarPix(m, m.pix));
    else {
      if (m.pix && m.pix.expirou) b.append(el('p', 'copa-aviso', 'O Pix anterior venceu sem pagamento. Gera outro:'));
      if (c.aberta && c.restam) b.append(pedirPix(c));
      else b.append(el('p', 'copa-nota', c.aberta ? 'As vagas acabaram. Fala com a equipe no WhatsApp.' : 'As inscrições fecharam. Fala com a equipe no WhatsApp.'));
    }
    var duvida = el('details', 'copa-duvida'); duvida.append(el('summary', null, 'Dúvida? Fala com a equipe'), whats(m, false));
    b.append(duvida);
    return b;
  }

  // 💳 enquanto o Pix automático espera, a aba pergunta de 10 em 10 s (só com a aba na frente)
  var espera = null;
  function esperarPagamento(c) {
    clearTimeout(espera); espera = null;
    var m = c.minha;
    if (m && !m.confirmado && m.pix && m.pix.automatico && !m.pix.expirou) {
      espera = setTimeout(function () { if (!document.hidden) carregar(); else esperarPagamento(c); }, 10000);
    }
  }

  function convite() {
    var b = el('div', 'copa-convite');
    var botao = el('button', 'botao', 'Entrar com Discord'); botao.type = 'button';
    botao.addEventListener('click', function () { var login = document.getElementById('btn-login'); if (login) login.click(); });
    b.append(el('p', null, 'Entra com o teu Discord pra inscrever o time. É com ele que a equipe fala contigo.'), botao);
    return b;
  }

  function desenhar(c) {
    var edicao = (dadosDoSite().proxima_edicao || {})[c.jogo];
    fatos.replaceChildren();
    fato('Jogo', c.jogo_nome + (edicao ? ' · ' + edicao + 'ª edição' : ''));
    fato('Início', c.inicio);
    fato('Inscrições até', c.prazo);
    fato('Inscrição', c.valor ? c.valor + ' por time' : '');
    fato('Vagas', c.restam + ' de ' + c.vagas);
    fato('Premiação', c.premio);
    acao.replaceChildren();
    esperarPagamento(c);
    if (c.minha) acao.append(feita(c.minha, c));
    else if (!c.aberta) acao.append(el('p', 'copa-nota', 'As inscrições não estão abertas agora.'));
    else if (!c.restam) acao.append(el('p', 'copa-nota', 'As vagas acabaram. Fala com a equipe no Discord da Copa.'));
    else if (!logado()) acao.append(convite());
    else acao.append(formulario(c));
    titulo.textContent = 'Times confirmados (' + c.inscritos.length + ')';
    lista.replaceChildren();
    if (!c.inscritos.length) { lista.append(el('li', 'copa-vazio', 'Nenhum time confirmado ainda. O teu pode ser o primeiro.')); return; }
    c.inscritos.forEach(function (i) {
      var li = el('li', 'copa-time');
      if (i.logo) { var im = el('img'); im.src = api().base + i.logo; im.alt = ''; im.loading = 'lazy'; im.width = 56; im.height = 56; li.append(im); }
      else li.append(el('span', 'copa-sem-logo', String(i.time).slice(0, 1).toUpperCase()));
      li.append(el('b', null, i.time));
      if (i.confirmado) li.append(el('small', null, 'Vaga confirmada'));
      lista.append(li);
    });
  }

  function fora() {
    fatos.replaceChildren(); lista.replaceChildren(); titulo.textContent = '';
    acao.replaceChildren(el('p', 'copa-nota', 'A inscrição pelo site não respondeu agora.'));
    var url = linkDaCopa();
    if (url) { var a = el('a', 'botao', 'Inscrever pelo Discord da Copa ↗'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; acao.append(a); }
  }

  async function carregar() {
    if (ocupado || !naAba() || !api()) return;
    try { desenhar(await api().get('/api/copa', logado())); } catch (_) { fora(); }
  }

  window.CRM_COPA = { desenhar: desenhar, carregar: carregar };
  window.addEventListener('hashchange', function () { setTimeout(carregar, 0); });
  window.addEventListener('storage', function (e) { if (e.key === 'crm_sessao') carregar(); });
  setTimeout(carregar, 0);
})();
