/* P50 — 01/11/2026, Grok.
   Nao troca o audio. O site.js continua dono de #mini-ouvir, #radio-volume,
   #mini-faixa e #radio-status. Aqui so le o estado "tocando" que ele ja marca
   (#radio-crm.tocando, ou o <audio id="radio-audio"> em play/pause)
   e esconde o player enquanto a gaveta do menu esta aberta no celular. */
(function () {
  function ligar() {
    var bar = document.querySelector(".mini-radio");
    if (!bar || bar.dataset.miniPronto === "1") return;
    bar.dataset.miniPronto = "1";

    var audio = document.getElementById("radio-audio");
    var topo = document.getElementById("radio-crm");
    var lateral = document.getElementById("lateral");
    var mq = window.matchMedia("(max-width: 960px)");

    function tocando() {
      var peloAudio = !!(audio && !audio.paused && !audio.ended);
      var pelaClasse = !!(topo && topo.classList.contains("tocando"));
      bar.classList.toggle("mini-tocando", peloAudio || pelaClasse);
    }

    function menu() {
      var aberto = !!(mq.matches && lateral && lateral.classList.contains("aberta"));
      bar.classList.toggle("mini-sob-menu", aberto);
      if (aberto) bar.setAttribute("inert", "");
      else bar.removeAttribute("inert");
    }

    tocando();
    menu();

    if (audio) {
      audio.addEventListener("play", tocando);
      audio.addEventListener("playing", tocando);
      audio.addEventListener("pause", tocando);
      audio.addEventListener("ended", tocando);
    }
    if (topo && window.MutationObserver) {
      new MutationObserver(tocando).observe(topo, { attributes: true, attributeFilter: ["class"] });
    }
    if (lateral && window.MutationObserver) {
      new MutationObserver(menu).observe(lateral, { attributes: true, attributeFilter: ["class"] });
    }
    if (mq.addEventListener) mq.addEventListener("change", menu);
    else if (mq.addListener) mq.addListener(menu);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
  else ligar();
})();
