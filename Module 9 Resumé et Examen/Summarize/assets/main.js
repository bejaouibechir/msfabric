// main.js — MS Fabric Formation v2
// Navigation, popups références, panneau source, sidebar
(function () {
  'use strict';
  const slides   = PRESENTATION.slides;
  const chapters = PRESENTATION.chapters;
  const total    = slides.length;
  let current    = 0;

  const $ = id => document.getElementById(id);
  const dom = {
    heading:      $('slide-heading'),
    body:         $('slide-body'),
    chLabel:      $('slide-chapter-label'),
    counter:      $('slide-counter'),
    chapterBadge: $('nav-chapter-badge'),
    progress:     $('progress-bar'),
    btnPrev:      $('btn-prev'),
    btnNext:      $('btn-next'),
    btnFS:        $('btn-fullscreen'),
    chapterList:  $('chapter-list'),
    slideArea:    $('slide-area'),
    // Source panel
    sourcePanel:  $('source-panel'),
    sourceOverlay:$('source-overlay'),
    sourceFrame:  $('source-frame'),
    sourcePanelTitle: $('source-panel-title'),
    btnCloseSource:   $('btn-close-source'),
    // Popup
    popup:        $('ref-popup'),
    popupTitle:   $('ref-popup-title'),
    popupExcerpt: $('ref-popup-excerpt'),
    popupBtn:     $('ref-popup-btn'),
  };

  // ---- Affichage slide ----
  function goTo(idx) {
    if (idx < 0 || idx >= total) return;
    current = idx;
    const s = slides[current];

    dom.heading.textContent      = s.title;
    dom.body.innerHTML           = s.content;
    dom.chLabel.textContent      = s.chapterTitle;
    dom.chapterBadge.textContent = s.chapterTitle;
    dom.counter.textContent      = (current + 1) + ' / ' + total;
    dom.progress.style.width     = (total > 1 ? current / (total - 1) * 100 : 100) + '%';
    dom.btnPrev.disabled         = current === 0;
    dom.btnNext.disabled         = current === total - 1;

    updateSidebarActive(s.chapterId);
    attachRefs(s.refs || {});
    hidePopup();
    dom.slideArea.scrollTop = 0;
  }

  // ---- Navigation ----
  dom.btnPrev.addEventListener('click', () => goTo(current - 1));
  dom.btnNext.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Escape') { hidePopup(); closeSource(); }
  });

  // ---- Plein écran ----
  dom.btnFS.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  // ---- Sidebar ----
  function buildSidebar() {
    dom.chapterList.innerHTML = '';
    chapters.forEach((ch, i) => {
      const li = document.createElement('li');
      li.dataset.id = ch.id;
      const num = document.createElement('span');
      num.className   = 'ch-num';
      num.textContent = i + 1;
      const txt = document.createElement('span');
      txt.textContent = ch.title;
      li.appendChild(num);
      li.appendChild(txt);
      li.addEventListener('click', () => {
        const idx = slides.findIndex(s => s.id === ch.slideIds[0]);
        if (idx >= 0) goTo(idx);
      });
      dom.chapterList.appendChild(li);
    });
  }

  function updateSidebarActive(chId) {
    dom.chapterList.querySelectorAll('li').forEach(li => {
      li.classList.toggle('active', li.dataset.id === chId);
    });
    // Scroll sidebar vers l'actif
    const active = dom.chapterList.querySelector('li.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---- Références ----
  function attachRefs(refs) {
    dom.body.querySelectorAll('span.ref').forEach(span => {
      const refId  = span.getAttribute('data-ref-id');
      const refNum = refId ? refId.replace('ref-', '') : null;
      const data   = refs[refNum];
      if (!data) return;
      span.addEventListener('mouseenter', e => showPopup(e, data));
      span.addEventListener('mouseleave', () =>
        setTimeout(() => { if (!dom.popup.matches(':hover')) hidePopup(); }, 160));
      span.addEventListener('click', e => {
        e.stopPropagation();
        showPopup(e, data);
        if (data.url) openSource(data.url, data.sourceTitle);
      });
    });
  }

  function showPopup(event, data) {
    dom.popupTitle.textContent   = data.sourceTitle || 'Source';
    dom.popupExcerpt.textContent = data.excerpt || '';
    if (data.url) {
      dom.popupBtn.disabled = false;
      dom.popupBtn.onclick  = () => { openSource(data.url, data.sourceTitle); hidePopup(); };
    } else {
      dom.popupBtn.disabled = true;
      dom.popupBtn.onclick  = null;
    }
    dom.popup.classList.remove('hidden');
    const r  = event.target.getBoundingClientRect();
    const pw = dom.popup.offsetWidth  || 380;
    const ph = dom.popup.offsetHeight || 220;
    const mg = 12;
    let left = r.left, top = r.bottom + mg;
    if (left + pw > window.innerWidth  - mg) left = window.innerWidth  - pw - mg;
    if (top  + ph > window.innerHeight - mg) top  = r.top  - ph - mg;
    if (left < mg) left = mg;
    if (top  < mg) top  = mg;
    dom.popup.style.left = left + 'px';
    dom.popup.style.top  = top  + 'px';
  }

  function hidePopup() { dom.popup.classList.add('hidden'); }
  document.addEventListener('click', e => { if (!dom.popup.contains(e.target)) hidePopup(); });
  dom.popup.addEventListener('mouseleave', hidePopup);

  // ---- Panneau source ----
  function openSource(url, title) {
    dom.sourceFrame.src             = url || '';
    dom.sourcePanelTitle.textContent = title || 'Document source';
    dom.sourcePanel.classList.remove('hidden');
    dom.sourceOverlay.classList.remove('hidden');
  }
  function closeSource() {
    dom.sourcePanel.classList.add('hidden');
    dom.sourceOverlay.classList.add('hidden');
    dom.sourceFrame.src = '';
  }
  dom.btnCloseSource.addEventListener('click', closeSource);
  dom.sourceOverlay.addEventListener('click', closeSource);

  // ---- Init ----
  buildSidebar();
  goTo(0);
})();
