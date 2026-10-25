/* O site da CRM -- montagem do Claude (25/10/2026) sobre o visual do GPT.
   Os DADOS (preços, links, números, Kinguin) vêm de dados/dados.js, gerado do código do projeto pelo
   `ferramentas\midiacrm\dados_do_site.py`: nada de preço, número ou link escrito à mão aqui. */
(function () {
  "use strict";

  var D = window.CRM_DADOS || {};
  var L = D.links || {};

  // 🔌 OS GANCHOS -- o Claude liga quando a parte do servidor existir (PLANO-SITE-CRM.md, F2 e F3)
  var CONFIG = {
    radio: { agoraUrl: "" },                                     // F2: GET -> {titulo, url, inicio, agora}
    login: { ligado: false, clientId: "1439403291036487712" }   // F3: o app do Bot CRM 2.0
  };

  function $(s, el) { return (el || document).querySelector(s); }
  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "texto") n.textContent = attrs[k];
      else if (k === "classe") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { if (f) n.appendChild(f); });
    return n;
  }
  function guardar(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* aba privada */ } }
  function ler(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  var avisoTimer = null;
  function aviso(texto) {
    var a = $("#aviso-flutuante");
    a.textContent = texto;
    a.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { a.hidden = true; }, 3800);
  }

  /* ---------- os links (data-link="chave" -> o link de dados.js) ---------- */
  document.querySelectorAll("[data-link]").forEach(function (a) {
    var url = L[a.getAttribute("data-link")];
    if (url) a.href = url; else a.removeAttribute("href");
  });

  /* ---------- os números ---------- */
  (function () {
    var f = (D.numeros && D.numeros.frases) || {};
    var ul = $("#numeros");
    ["servidores", "pessoas", "partidas", "prints", "cartas"].forEach(function (k) {
      if (f[k]) ul.appendChild(el("li", { texto: f[k] }));
    });
    var dataServicos = (D.gerado_em || "").split(" ")[0];
    document.querySelectorAll("[data-data-servicos]").forEach(function (p) {
      if (dataServicos) p.textContent = "Informações dos serviços em " + dataServicos + ".";
    });
    if (D.numeros && D.numeros.medido_em) $("#medido-em").textContent = "Números medidos em " + D.numeros.medido_em.split(" ")[0] + ".";
  })();

  /* ---------- a loja (cards de preço) ---------- */
  var TEXTOS_LOJA = {   // a copy do GPT (entregas\P1\textos.md)
    "Copa Discord": { resumo: "Até 16 times: inscrição automática, sorteio, chaves e resultados.", cta: "Comprar no Discord" },
    "Copa + WhatsApp": { resumo: "Tudo da Copa Discord, mais a comunidade de WhatsApp do campeonato.", cta: "Comprar no Discord" },
    "Configuração de Discord": { resumo: "Cargos, canais, permissões e o Bot CRM 2.0 instalado.", cta: "Comprar no Discord" },
    "Bot CRM 2.0": { resumo: "O bot da CRM no teu servidor, feito e mantido pela CRM.", cta: "Adicionar o bot" }
  };
  (function () {
    var caixa = $("#planos");
    (D.produtos || []).forEach(function (p) {
      (p.planos || []).forEach(function (pl) {
        var titulo = (p.planos.length > 1) ? pl.nome : p.nome;
        var t = TEXTOS_LOJA[titulo] || { resumo: p.resumo, cta: p.botao };
        var itens = p.id === "bot"
          ? (p.destaques || []).map(function (d) { return d.nome; })
          : (pl.inclui || []).slice(0, 5);
        var gratis = /gr[aá]tis/i.test(pl.preco || "");
        var ul = el("ul", { classe: p.id === "bot" ? "pilares" : "" }, itens.map(function (i) { return el("li", { texto: i }); }));
        var preco = el("div", { classe: "plano-preco", texto: pl.preco || "" }, [pl.por ? el("small", { texto: pl.por }) : null]);
        var botao = el("a", { classe: "botao", href: (p.id === "bot" ? L.bot_convite : L.site_crm) || "#contato", target: "_blank", rel: "noopener", texto: t.cta });
        caixa.appendChild(el("article", { classe: "plano" + (titulo === "Copa Discord" ? " popular" : "") }, [
          el("div", { classe: "plano-icone", "aria-hidden": "true", texto: pl.emoji || p.emoji || "" }),
          el("h3", { texto: titulo }),
          el("p", { classe: "plano-resumo", texto: t.resumo }),
          preco, ul, botao,
          el("p", { classe: "plano-pagamento", texto: gratis ? "Grátis · feito e mantido pela CRM" : "Pagamento por PIX, no Discord da CRM" })
        ]));
      });
    });
  })();

  /* ---------- a Kinguin ---------- */
  (function () {
    var k = D.kinguin || {};
    var ul = $("#kinguin-produtos");
    (k.produtos || []).forEach(function (p) {
      ul.appendChild(el("li", {}, [el("a", { href: p.link, target: "_blank", rel: "sponsored noopener", texto: p.nome })]));
    });
    if (k.loja) $("#kinguin-loja").href = k.loja;
    $("#kinguin-aviso").textContent = k.aviso || "";
  })();

  /* ---------- os contatos ---------- */
  (function () {
    var itens = [
      ["💬", "Discord da CRM", L.site_crm || L.crm_discord],
      ["📱", "WhatsApp (Clã CRM)", L.crm_whatsapp_cla],
      ["📢", "Canal do WhatsApp", L.crm_whatsapp_canal],
      ["📸", "Instagram", L.crm_instagram],
      ["🎵", "TikTok", L.crm_tiktok],
      ["✉️", "E-mail", L.email ? "mailto:" + L.email : null]
    ];
    var ul = $("#contatos");
    itens.forEach(function (i) {
      if (!i[2]) return;
      var a = el("a", { href: i[2], target: i[2].indexOf("mailto:") === 0 ? "_self" : "_blank", rel: "noopener" },
        [el("span", { "aria-hidden": "true", texto: i[0] }), el("span", { texto: i[1] })]);
      ul.appendChild(el("li", {}, [a]));
    });
  })();

  /* ---------- o carrossel ---------- */
  var precoDe = function (id) {
    var p = (D.produtos || []).filter(function (x) { return x.id === id; })[0];
    return p && p.planos && p.planos[0] ? p.planos[0].preco : "";
  };
  var CARDS = [
    { titulo: "Dream Cards", linha: "Manda o print da tua partida de HoK ou MLBB e vira carta, com os teus números de verdade.", img: "assets/img/dream-cards.webp", alvo: "#dream-cards", etiqueta: "HoK · MLBB" },
    { titulo: "Bot CRM 2.0", linha: "Menos trabalho repetitivo. Mais tempo pra tua comunidade.", img: "assets/img/bot-crm.webp", contido: true, fundo: "ouro", alvo: "#loja", etiqueta: precoDe("bot") },
    { titulo: "Sistema de Copa", img: "assets/img/sistema-de-copa.webp", alvo: "#loja", semLegenda: true },
    { titulo: "Configuração de Discord", img: "assets/img/configuracao-discord.webp", alvo: "#loja", semLegenda: true },
    { titulo: "Rádio CRM", linha: "A mesma música, no mesmo segundo, em toda a rede.", img: "assets/img/radio-crm.webp", contido: true, fundo: "ouro", alvo: "#radio", etiqueta: "Ao vivo" },
    { titulo: "Kinguin", linha: "Keys, gift cards, recargas e software. Link de parceiro: a CRM ganha uma comissão, sem custo a mais pra você.", kinguin: true, alvo: "#kinguin", etiqueta: "Parceiro" },
    { titulo: "Sua marca aqui", linha: "Sua marca pode fazer parte dessa comunidade. Fale com a CRM sobre patrocínio.", img: "assets/img/divulgacao-direita.webp", alvo: "#contato", etiqueta: "Patrocínio" },
    { titulo: "Copa do Infinito", linha: "Tua equipe, o próximo desafio. A Copa do Infinito é um projeto CRM.", img: "assets/img/copa-do-infinito.webp", alvo: "#copa", etiqueta: "16 times" }
  ];
  var trilho = $("#carrossel-trilho"), pontos = $("#pontos"), atual = 0, timer = null;
  var cartoes = CARDS.map(function (c, i) {
    var filhos = [];
    if (c.kinguin) {
      filhos.push(el("div", { classe: "kinguin-placa" }, [el("img", { src: "assets/img/kinguin-logo.webp", alt: "", width: "900", height: "301" })]));
    } else {
      filhos.push(el("img", { src: c.img, alt: "", width: "900", height: "900", loading: i < 3 ? "eager" : "lazy" }));
    }
    if (c.etiqueta) filhos.push(el("span", { classe: "cartao-etiqueta", texto: c.etiqueta }));
    if (!c.semLegenda) filhos.push(el("div", { classe: "cartao-legenda" }, [el("b", { texto: c.titulo }), el("span", { texto: c.linha })]));
    var classe = "cartao" + (c.contido ? " contido" : "") + (c.fundo === "ouro" ? " cartao-fundo-ouro" : "") + (c.kinguin ? " cartao-kinguin" : "");
    var a = el("a", { classe: classe, href: c.alvo, "aria-label": c.titulo + (c.linha ? ": " + c.linha : "") }, filhos);
    a.addEventListener("click", function (e) {
      if (i !== atual) { e.preventDefault(); ir(i); }
    });
    trilho.appendChild(a);
    var p = el("button", { type: "button", role: "tab", "aria-label": c.titulo });
    p.addEventListener("click", function () { ir(i); });
    pontos.appendChild(p);
    return a;
  });
  function desenhar() {
    var n = cartoes.length;
    cartoes.forEach(function (c, i) {
      var d = ((i - atual) % n + n) % n;
      if (d > n / 2) d -= n;
      c.setAttribute("data-pos", Math.abs(d) <= 2 ? String(d) : "fora");
      c.tabIndex = d === 0 ? 0 : -1;
      c.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    Array.prototype.forEach.call(pontos.children, function (p, i) { p.setAttribute("aria-selected", i === atual ? "true" : "false"); });
  }
  function ir(i) { atual = (i + cartoes.length) % cartoes.length; desenhar(); reiniciar(); }
  var reduzido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function reiniciar() { clearInterval(timer); if (!reduzido) timer = setInterval(function () { ir(atual + 1); }, 5500); }
  $("#seta-esq").addEventListener("click", function () { ir(atual - 1); });
  $("#seta-dir").addEventListener("click", function () { ir(atual + 1); });
  var car = $("#carrossel");
  car.addEventListener("mouseenter", function () { clearInterval(timer); });
  car.addEventListener("mouseleave", reiniciar);
  car.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") ir(atual - 1);
    if (e.key === "ArrowRight") ir(atual + 1);
  });
  var x0 = null;
  trilho.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  trilho.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) ir(atual + (dx < 0 ? 1 : -1)); else reiniciar();
    x0 = null;
  });
  desenhar();
  reiniciar();

  /* ---------- a gaveta do celular ---------- */
  var lateral = $("#lateral"), veu = $("#veu"), gaveta = $("#btn-gaveta");
  function abrirGaveta(sim) {
    lateral.classList.toggle("aberta", sim);
    veu.hidden = !sim;
    gaveta.setAttribute("aria-expanded", sim ? "true" : "false");
  }
  gaveta.addEventListener("click", function () { abrirGaveta(!lateral.classList.contains("aberta")); });
  veu.addEventListener("click", function () { abrirGaveta(false); });
  lateral.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { abrirGaveta(false); }); });

  /* ---------- a Rádio CRM ---------- */
  var player = $("#radio-crm"), audio = $("#radio-audio"), pop = $("#radio-dica"), faixa = $("#radio-faixa");
  var tocando = false;
  function marcar(sim) { tocando = sim; player.classList.toggle("tocando", sim); $(".radio-icone", player).textContent = sim ? "❚❚" : "▶"; }
  function sintonizar() {
    // o contrato da F2: {titulo, url, inicio, agora} (segundos) -- toca a mesma música no mesmo segundo da rede
    var t0 = Date.now();
    fetch(CONFIG.radio.agoraUrl, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      audio.src = j.url;
      faixa.textContent = j.titulo || "Rádio CRM";
      audio.onloadedmetadata = function () {
        var desvio = (j.agora - j.inicio) + (Date.now() - t0) / 1000;
        if (desvio > 0 && desvio < audio.duration) audio.currentTime = desvio;
      };
      audio.onended = sintonizar;
      return audio.play();
    }).then(function () { marcar(true); }).catch(function () {
      marcar(false);
      aviso("Não consegui sintonizar a Rádio CRM agora. Tenta de novo em instantes.");
    });
  }
  function clicarRadio() {
    if (!CONFIG.radio.agoraUrl) { pop.hidden = !pop.hidden; return; }
    if (tocando) { audio.pause(); marcar(false); return; }
    sintonizar();
  }
  $("#radio-botao").addEventListener("click", clicarRadio);
  document.querySelectorAll('[data-acao="radio"]').forEach(function (b) {
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); clicarRadio(); });
  });
  document.addEventListener("click", function (e) { if (!pop.hidden && !player.contains(e.target) && !e.target.closest('[data-acao="radio"]')) pop.hidden = true; });

  /* ---------- o Login com Discord ---------- */
  var btnLogin = $("#btn-login"), rotulo = $("#login-rotulo");
  function mostrarUsuario(u) {
    var velho = btnLogin.querySelector("img");
    if (velho) velho.remove();
    if (!u) { rotulo.textContent = "Entrar com Discord"; btnLogin.querySelector("svg").style.display = ""; return; }
    btnLogin.querySelector("svg").style.display = "none";
    var av = u.avatar ? "https://cdn.discordapp.com/avatars/" + u.id + "/" + u.avatar + ".png?size=64" : "assets/img/favicon.png";
    btnLogin.insertBefore(el("img", { src: av, alt: "", width: "26", height: "26" }), rotulo);
    rotulo.textContent = "Olá, " + (u.nome || "jogador") + " · Sair";
  }
  function usuario() { try { return JSON.parse(ler("crm_usuario") || "null"); } catch (e) { return null; } }
  btnLogin.addEventListener("click", function () {
    if (usuario()) { guardar("crm_usuario", null); mostrarUsuario(null); aviso("Você saiu."); return; }
    if (!CONFIG.login.ligado) { aviso("O login com Discord chega em breve."); return; }
    var estado = Math.random().toString(36).slice(2) + Date.now().toString(36);
    guardar("crm_estado", estado);
    var volta = location.origin + location.pathname;
    location.href = "https://discord.com/oauth2/authorize?client_id=" + CONFIG.login.clientId +
      "&response_type=token&scope=identify&redirect_uri=" + encodeURIComponent(volta) + "&state=" + estado;
  });
  (function voltouDoDiscord() {
    if (location.hash.indexOf("access_token=") < 0) { mostrarUsuario(usuario()); return; }
    var q = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, "", location.pathname + location.search);
    if (!q.get("state") || q.get("state") !== ler("crm_estado")) { aviso("O login não confere. Tenta de novo."); return; }
    fetch("https://discord.com/api/users/@me", { headers: { Authorization: "Bearer " + q.get("access_token") } })
      .then(function (r) { return r.json(); })
      .then(function (u) {
        var eu = { id: u.id, nome: u.global_name || u.username, avatar: u.avatar };
        guardar("crm_usuario", JSON.stringify(eu));
        mostrarUsuario(eu);
        aviso("Bem-vindo, " + eu.nome + "!");
      })
      .catch(function () { aviso("Não consegui ler teu Discord agora."); });
  })();
})();
