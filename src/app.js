// 점진적 향상: 내용은 모두 HTML에 들어 있고, 이 스크립트는 연표 접기·이전 소식 더보기·인물 검색/필터·카드 이동만 맡습니다.
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

  // 연표 '더보기': 최근 소식만 먼저 보이고, 나머지는 미끄러지듯 펼칩니다(JS가 없으면 처음부터 모두 보임).
  var reduceMotion = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var moreBtn = document.getElementById("timelineMore");
  var older = document.getElementById("timeline-older");
  var olderInner = older && older.querySelector(".timeline-older-inner");
  function setOlder(open, opts) {
    if (!moreBtn || !older) return;
    var instant = (opts && opts.instant) || reduceMotion.matches;
    var count = moreBtn.getAttribute("data-count");
    var before = moreBtn.getBoundingClientRect().top;
    var startedAbove = older.getBoundingClientRect().top < 0;
    if (instant || (!open && startedAbove)) older.classList.add("no-anim");
    older.classList.toggle("is-open", open);
    if ("inert" in older) older.inert = !open;
    older.setAttribute("aria-hidden", open ? "false" : "true");
    moreBtn.setAttribute("aria-expanded", String(open));
    moreBtn.querySelector(".more-label").textContent = open ? "이전 소식 접기" : "이전 소식 " + count + "건 더보기";
    if (older.classList.contains("no-anim")) {
      // 긴 목록 안쪽에서 접을 때는 애니메이션 없이 접고, 버튼이 화면의 같은 자리에 남도록 스크롤을 맞춥니다.
      void older.offsetHeight;
      if (!open && startedAbove) window.scrollTo({ top: window.scrollY + moreBtn.getBoundingClientRect().top - before, behavior: "instant" });
      requestAnimationFrame(function () { older.classList.remove("no-anim"); });
    }
  }
  if (moreBtn && older) {
    setOlder(false, { instant: true });
    moreBtn.addEventListener("click", function () {
      setOlder(moreBtn.getAttribute("aria-expanded") !== "true");
    });
  }
  function revealEvent(hash) {
    if (!/^#(event-|detail-)/.test(hash || "")) return false;
    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return false;
    var li = el.closest ? el.closest("li[id^='event-']") : el;
    if (older && older.contains(el) && moreBtn.getAttribute("aria-expanded") !== "true") setOlder(true, { instant: true });
    var t = li && li.querySelector(".event-toggle");
    if (t && t.getAttribute("aria-expanded") !== "true") t.click();
    (li || el).scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
    return true;
  }

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
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#event-"]');
    if (!a) return;
    ev.preventDefault();
    var hash = a.getAttribute("href");
    if (history.pushState) history.pushState(null, "", hash); else location.hash = hash;
    revealEvent(hash);
  });
  window.addEventListener("hashchange", function () { if (!revealEvent(location.hash)) reveal(location.hash); });
  if (location.hash && !revealEvent(location.hash)) reveal(location.hash);
})();
