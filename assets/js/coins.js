/* CRM coins: dados públicos e conta privada pelo contrato do Claude. */
(function () {
  'use strict';
  var config = window.CRM_CONFIG, links = (window.CRM_DADOS || {}).links || {};
  var offline = 'A conta está fora do ar agora. O resto do site funciona normal.';
  var dialog = document.getElementById('minha-conta'), content = document.getElementById('conta-conteudo');
  var status = document.getElementById('conta-status'), login = document.getElementById('btn-login');
  var label = document.getElementById('login-rotulo'), logout = document.getElementById('conta-sair');
  var ready = false, ranks = null, activeRank = 'coins', revision = 0, currentUser = null, accountLoading = false;
  var profile = document.getElementById('perfil-crm'), profileIdentity = document.getElementById('perfil-identidade');
  var profileBalance = document.getElementById('perfil-saldo'), profileState = document.getElementById('perfil-estado');
  var reconnect = document.getElementById('perfil-reconectar');
  new ResizeObserver(function () {
    document.documentElement.style.setProperty('--altura-perfil-topo', document.getElementById('topo').getBoundingClientRect().height + 'px');
  }).observe(document.getElementById('topo'));
  function node(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  }
  function read(key, tab) { try { return (tab ? sessionStorage : localStorage).getItem(key); } catch (_) { return null; } }
  function save(key, value, tab) {
    try { var s = tab ? sessionStorage : localStorage; if (value == null) s.removeItem(key); else s.setItem(key, value); return true; } catch (_) { return false; }
  }
  var session = read('crm_sessao');
  // Descarta o perfil da implementação anterior, que não era uma sessão da API.
  save('crm_usuario', null, true);
  function reset() {
    revision++; session = null; currentUser = null; save('crm_sessao', null); save('crm_usuario', null);
    profile.hidden = true; document.body.classList.remove('com-perfil'); profileIdentity.replaceChildren(); profileBalance.textContent = ''; profileState.textContent = '';
    content.replaceChildren(); logout.hidden = true; updateLogin();
  }
  function updateLogin(user) {
    if (user) currentUser = user;
    user = currentUser;
    label.textContent = session ? 'Minha conta' : (ready ? 'Entrar com Discord' : 'Discord · indisponível');
    var old = login.querySelector('img'); if (old) old.remove();
    login.querySelector('svg').toggleAttribute('hidden', !!(session && user));
    if (session && user) login.insertBefore(avatar(user), label);
    logout.hidden = !session;
  }
  function showProfile(data) {
    profile.hidden = !session; document.body.classList.toggle('com-perfil', !!session);
    if (!session) return;
    profileIdentity.replaceChildren();
    if (!data) {
      profileIdentity.append(node('div', 'PERFIL CRM', 'perfil-kicker'), node('strong', 'Tua sessão está salva'));
      profileBalance.textContent = 'Consultando…'; profileState.textContent = 'Reconectando tua conta'; return;
    }
    var identity = node('div', null, 'perfil-nome');
    identity.append(node('small', 'PERFIL CRM'), node('strong', data.usuario.nome));
    profileIdentity.append(avatar(data.usuario), identity);
    profileBalance.textContent = data.equipe ? 'Equipe CRM' : data.coins.saldo_txt + ' coins';
    profileState.textContent = data.equipe ? 'ADM · fora do ranking' : (data.coins.posicao == null ? 'Teu progresso na comunidade' : 'Posição ' + data.coins.posicao + ' no ranking');
    reconnect.hidden = true;
  }
  function https(value, allowed) {
    try { var u = new URL(value); return u.protocol === 'https:' && allowed.includes(u.hostname) ? u.href : null; } catch (_) { return null; }
  }
  function avatar(user) {
    var img = node('img', null, 'coins-avatar');
    img.src = https(user.avatar, ['cdn.discordapp.com', 'media.discordapp.net']) || 'assets/img/favicon.png';
    img.alt = ''; img.width = 44; img.height = 44; img.referrerPolicy = 'no-referrer';
    img.onerror = function () { img.onerror = null; img.src = 'assets/img/favicon.png'; };
    return img;
  }
  async function api(path, options) {
    options = options || {};
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 20000);
    try {
      var headers = { Accept: 'application/json' };
      if (options.auth && session) headers.Authorization = 'Bearer ' + session;
      if (options.body) headers['Content-Type'] = 'application/json';
      var r = await fetch(config.api + path, { method: options.method || 'GET', headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined, signal: controller.signal,
        cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (r.status === 401) reset();
      var data = await r.json();
      if (!r.ok) throw new Error(data.mensagem || offline);
      return data;
    } catch (e) { throw new Error(e.name === 'AbortError' || e instanceof TypeError ? offline : e.message); }
    finally { clearTimeout(timer); }
  }
  function discordButton(text) {
    var a = node('a', text, 'botao'); a.href = links.site_crm || links.crm_discord || '#contato';
    a.target = '_blank'; a.rel = 'noopener'; return a;
  }
  function metric(value, text) {
    var box = node('div', null, 'conta-metrica'); box.append(node('strong', value), node('span', text)); return box;
  }
  function renderAccount(data) {
    content.replaceChildren();
    var user = data.usuario || {}, coins = data.coins || {}, invite = coins.convite || {}, today = coins.hoje || {};
    updateLogin(user);
    showProfile(data);
    var identity = node('div', null, 'conta-identidade'); identity.append(avatar(user), node('h3', user.nome));
    content.append(identity);
    if (data.equipe) {
      content.append(node('p', 'Você é da equipe da CRM: ADM não ganha coin nem entra no ranking.', 'conta-aviso'));
      return;
    }
    if (!data.coins_ligado) content.append(node('p', 'Os CRM coins estão pausados agora.', 'conta-aviso'));
    var balance = node('div', null, 'conta-saldo'); balance.append(node('small', 'TEU SALDO'), node('strong', coins.saldo_txt + ' CRM coins'),
      node('span', coins.posicao == null ? 'Ainda sem posição no ranking' : 'Posição no ranking: ' + coins.posicao));
    content.append(balance);
    var inviteBox = node('section', null, 'conta-convite'); inviteBox.append(node('h3', 'Tua galera começa pelo teu convite'),
      node('p', 'Você trouxe ' + String(invite.amigos == null ? '' : invite.amigos) + (invite.amigos === 1 ? ' amigo' : ' amigos')));
    var inviteLink = https(invite.link, ['discord.gg', 'discord.com']);
    if (inviteLink) {
      var field = node('input'); field.type = 'text'; field.readOnly = true; field.value = inviteLink; field.setAttribute('aria-label', 'Teu convite do Discord');
      var copy = node('button', 'Copiar convite', 'botao'); copy.type = 'button';
      var copyStatus = node('p'); copyStatus.setAttribute('role', 'status');
      copy.addEventListener('click', async function () {
        try { await navigator.clipboard.writeText(inviteLink); copyStatus.textContent = 'Convite copiado. Chama tua galera!'; }
        catch (_) { field.focus(); field.select(); copyStatus.textContent = 'Seleciona o link e copia para compartilhar.'; }
      });
      inviteBox.append(field, copy, copyStatus);
    } else inviteBox.append(node('p', 'Pega teu link no Discord: 💰・coins → 🎟️ Meu convite'));
    content.append(inviteBox);
    var progress = node('section', null, 'conta-progresso'); progress.append(node('h3', 'Tua próxima troca'));
    if (coins.menor_troca > 0) {
      var bar = node('progress'); bar.max = coins.menor_troca; bar.value = Math.max(0, Math.min(coins.saldo, coins.menor_troca));
      bar.setAttribute('aria-label', 'Progresso até a primeira troca'); progress.append(bar);
    }
    if (coins.ja_da_pra_trocar && data.coins_ligado) progress.append(discordButton('Trocar na 🛒・loja-crm'));
    else progress.append(node('p', 'Faltam ' + coins.faltam_txt + ' coins para a primeira troca.'));
    content.append(progress, node('h3', 'O que rendeu hoje'));
    var metrics = node('div', null, 'conta-metricas');
    metrics.append(metric(today.acoes, 'ações'), metric(today.call_min, 'min de call'), metric(today.radio_min, 'min de rádio'), metric(today.coins_txt, 'CRM coins hoje'));
    content.append(metrics, node('h3', 'Teu extrato'));
    var list = node('ul', null, 'coins-lista');
    (coins.extrato || []).slice(0, 10).forEach(function (item) {
      var li = node('li'); li.append(node('small', item.dia), node('span', item.oque), node('strong', item.coins_txt + ' coins')); list.append(li);
    });
    if (!list.children.length) list.append(node('li', 'Teu extrato ainda está vazio.'));
    content.append(list);
  }
  async function loadAccount() {
    if (accountLoading) return;
    accountLoading = true;
    content.replaceChildren(); status.textContent = 'Consultando tua conta…';
    if (!session) { status.textContent = ready ? 'Entra com o Discord pra ver os teus CRM coins.' : offline; accountLoading = false; return; }
    var current = revision;
    try { var data = await api('/api/eu', { auth: true }); if (current === revision && session) { renderAccount(data); status.textContent = ''; } }
    catch (e) {
      if (!session || current === revision) status.textContent = e.message;
      if (session && current === revision) {
        profileState.textContent = 'Sem conexão agora · sessão preservada';
        if (!currentUser) profileBalance.textContent = 'Saldo indisponível';
        reconnect.hidden = false;
      }
    } finally { accountLoading = false; }
  }
  async function openAccount() {
    if (!dialog.open) dialog.showModal();
    await loadAccount();
  }
  function startLogin() {
    if (session) { openAccount(); return; }
    if (!ready) { openAccount(); return; }
    var bytes = new Uint8Array(24); crypto.getRandomValues(bytes);
    var state = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    save('crm_estado', state, true);
    save('crm_volta', location.pathname + location.search + location.hash, true);
    location.assign('https://discord.com/oauth2/authorize?' + new URLSearchParams({ client_id: config.login.clientId,
      response_type: 'token', scope: 'identify', redirect_uri: 'https://crmadministradora.com.br/', state: state }));
  }
  login.addEventListener('click', startLogin);
  document.getElementById('coins-entrar').addEventListener('click', startLogin);
  document.getElementById('perfil-abrir').addEventListener('click', openAccount);
  reconnect.addEventListener('click', loadAccount);
  dialog.querySelector('.conta-fechar').addEventListener('click', function () { dialog.close(); });
  document.getElementById('conta-atualizar').addEventListener('click', async function () {
    if (session) { await loadAccount(); return; }
    try { await loadPublic(); if (ready) startLogin(); else status.textContent = offline; }
    catch (e) { status.textContent = e.message; }
  });
  logout.addEventListener('click', async function () {
    logout.disabled = true;
    try { await api('/api/sair', { method: 'POST', auth: true }); reset(); status.textContent = 'Você saiu. Tua sessão foi apagada.'; }
    catch (e) { reset(); status.textContent = e.message + ' A sessão foi apagada deste navegador. Não foi possível confirmar a saída no servidor.'; }
    finally { logout.disabled = false; }
  });
  window.addEventListener('storage', function (event) {
    if (event.key !== 'crm_sessao') return;
    if (!event.newValue) { reset(); return; }
    revision++; session = event.newValue; currentUser = null; content.replaceChildren(); updateLogin(); showProfile(); loadAccount();
  });
  async function callback() {
    var params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('access_token') && !params.has('error')) return;
    // Retira o token da barra antes de fazer qualquer pedido de rede.
    history.replaceState(null, '', location.pathname + location.search);
    var state = read('crm_estado', true), back = read('crm_volta', true);
    save('crm_estado', null, true); save('crm_volta', null, true);
    if (!state || params.get('state') !== state) { status.textContent = 'O login não confere. Tenta de novo.'; dialog.showModal(); return; }
    if (params.has('error')) { status.textContent = 'O login foi cancelado. Você pode tentar de novo.'; dialog.showModal(); return; }
    var token = params.get('access_token'); params.delete('access_token');
    try {
      var result = await api('/api/entrar', { method: 'POST', body: { token: token } });
      if (!result.sessao) throw new Error('Não consegui confirmar tua sessão. Tenta de novo.');
      session = result.sessao; revision++;
      var persisted = save('crm_sessao', session); updateLogin(result.usuario); showProfile();
      if (back && back.startsWith('/') && !back.startsWith('//')) {
        var target = new URL(back, location.origin);
        if (target.origin === location.origin) { history.replaceState(null, '', target.pathname + target.search + target.hash); if (target.hash) document.getElementById(target.hash.slice(1))?.scrollIntoView(); }
      }
      await openAccount();
      if (!persisted) status.textContent = 'Você entrou nesta aba, mas o navegador não permitiu salvar a sessão. Ao fechar, será preciso entrar de novo.';
    } catch (e) { status.textContent = e.message; if (!dialog.open) dialog.showModal(); }
    finally { token = null; }
  }
  function renderTable(data) {
    var gain = document.getElementById('coins-ganhar'), swaps = document.getElementById('coins-trocas'), rules = document.getElementById('coins-regras');
    gain.replaceChildren(); swaps.replaceChildren(); rules.replaceChildren();
    (data.ganhar || []).forEach(function (item) {
      var li = node('li'); li.append(node('span', item.emoji + ' ' + item.oque), node('strong', item.valor));
      if (item.detalhe) li.append(node('small', item.detalhe)); gain.append(li);
    });
    (data.trocas || []).forEach(function (item) {
      var li = node('li'); li.append(node('span', item.emoji + ' ' + item.nome), node('strong', item.reais + ' · ' + item.coins + ' CRM coins')); swaps.append(li);
      document.querySelectorAll('#planos .plano').forEach(function (card) {
        if (card.dataset.produto !== item.produto || String(card.dataset.plano) !== String(item.plano)) return;
        var value = card.querySelector('.plano-coins');
        if (!value) { value = node('p', null, 'plano-coins'); card.querySelector('.plano-preco').after(value); }
        value.textContent = 'ou ' + item.coins + ' CRM coins';
      });
    });
    (data.regras || []).forEach(function (text) { rules.append(node('li', text)); });
    var limits = data.tetos || {};
    document.getElementById('coins-tetos').textContent = limits.acoes != null && limits.call_h != null && limits.radio_h != null ?
      'Por dia: até ' + limits.acoes + ' ações, ' + limits.call_h + ' h de call e ' + limits.radio_h + ' h de rádio.' : '';
  }
  function renderRanking() {
    var panel = document.getElementById('coins-ranking-lista'); panel.replaceChildren();
    panel.setAttribute('aria-labelledby', 'aba-' + activeRank);
    if (!ranks) { panel.append(node('p', 'O ranking está indisponível agora. Tenta de novo mais tarde.')); return; }
    var list = node('ol', null, 'coins-ranking-itens');
    (ranks[activeRank] || []).slice(0, 10).forEach(function (item) {
      var li = node('li'); li.append(node('span', item.posicao, 'coins-posicao'), avatar(item), node('span', item.nome), node('strong', item.valor_txt)); list.append(li);
    });
    panel.append(list.children.length ? list : node('p', 'Ainda não há participantes neste ranking. Traz tua galera!'));
  }
  var tabs = Array.from(document.querySelectorAll('[data-ranking]'));
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activeRank = tab.dataset.ranking; tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; }); renderRanking(); });
    tab.addEventListener('keydown', function (event) {
      var next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next != null) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
    });
  });
  updateLogin();
  showProfile();
  var hasCallback = /(?:^#|&)(?:access_token|error)=/.test(location.hash);
  callback().then(function () { if (!hasCallback && session) loadAccount(); });
  var publicLoading = null;
  function loadPublic() {
    if (publicLoading) return publicLoading;
    var refresh = document.getElementById('coins-recarregar'); refresh.disabled = true;
    publicLoading = Promise.allSettled([
      api('/api/saude').then(function (data) { ready = config.login.ligado && data.ok === true; updateLogin(); }).catch(function () { ready = false; updateLogin(); }),
      api('/api/coins/tabela').then(function (data) { renderTable(data); document.getElementById('coins-status').textContent = ''; })
        .catch(function (e) { document.getElementById('coins-status').textContent = e.message; }),
      api('/api/coins/ranking').then(function (data) {
        ranks = data; renderRanking();
        var date = new Date(data.atualizado); if (!isNaN(date)) document.getElementById('coins-atualizado').textContent = 'Atualizado em ' + date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' · Brasília';
      }).catch(function () { ranks = null; renderRanking(); })
    ]).finally(function () { publicLoading = null; refresh.disabled = false; });
    return publicLoading;
  }
  document.getElementById('coins-recarregar').addEventListener('click', function () { loadPublic(); if (session) loadAccount(); });
  window.addEventListener('online', function () { loadPublic(); if (session) loadAccount(); });
  loadPublic();
})();
