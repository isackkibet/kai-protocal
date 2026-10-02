// KAI Web menu: the phone/tablet panel and the Products dropdown.
(function () {
  var burger = document.querySelector('.kw-burger');
  var panel = document.getElementById('kw-panel');
  var drop = document.querySelector('.kw-drop');
  var dropBtn = document.querySelector('.kw-drop-btn');

  function setPanel(open) {
    if (!burger || !panel) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.hidden = !open;
  }
  function setDrop(open) {
    if (!drop || !dropBtn) return;
    drop.classList.toggle('kw-open', open);
    dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (burger) burger.addEventListener('click', function () { setPanel(panel.hidden); });
  if (dropBtn) dropBtn.addEventListener('click', function (e) { e.stopPropagation(); setDrop(!drop.classList.contains('kw-open')); });

  document.addEventListener('click', function (e) {
    if (drop && !drop.contains(e.target)) setDrop(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setDrop(false); setPanel(false); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100) setPanel(false); });
})();
