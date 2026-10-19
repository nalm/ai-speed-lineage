// 점진적 향상: 내용은 모두 HTML에 들어 있고, 이 스크립트는 연표 접기·인물 검색/필터·카드 이동만 맡습니다.
(function () {
  "use strict";
  // 연표: JS가 있을 때만 접어 둡니다.
  document.querySelectorAll(".event-toggle").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  });

  // 인물 검색·필터
  var input = document.getElementById("searchInput");
  var resultLine = document.getElementById("resultLine");
  var emptyState = document.getElementById("emptyState");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".person"));
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));
  var active = "all";
  function apply() {
    var term = (input.value || "").trim().toLocaleLowerCase("ko");
    var shown = 0;
    cards.forEach(function (card) {
      var inCamp = active === "all" || (active === "korea" ? card.dataset.country === "한국" : card.dataset.camp === active);
      var ok = inCamp && (!term || card.dataset.search.indexOf(term) !== -1);
      card.hidden = !ok;
      if (ok) shown++;
    });
    resultLine.textContent = shown + "명을 표시하고 있습니다.";
    emptyState.style.display = shown ? "none" : "block";
  }
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      active = btn.dataset.filter;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      apply();
    });
  });
  if (input) input.addEventListener("input", apply);

  // 계보 노드·이름 링크 → 인물 카드 (필터에 가려져 있으면 필터를 풉니다)
  function reveal(hash) {
    if (!/^#person-/.test(hash)) return;
    var card = document.getElementById(hash.slice(1));
    if (!card) return;
    if (card.hidden) {
      active = "all"; input.value = "";
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.filter === "all" ? "true" : "false"); });
      apply();
    }
    cards.forEach(function (c) { c.classList.remove("is-target"); });
    card.classList.add("is-target");
    card.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    card.focus({ preventScroll: true });
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#person-"]');
    if (!a) return;
    ev.preventDefault();
    var hash = a.getAttribute("href");
    if (history.pushState) history.pushState(null, "", hash); else location.hash = hash;
    reveal(hash);
  });
  window.addEventListener("hashchange", function () { reveal(location.hash); });
  if (location.hash) reveal(location.hash);
})();
