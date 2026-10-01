/* Glossary deep links: chapter.html#term=<text>&n=<k> scrolls to and highlights
   the k-th whole-word occurrence of <text> inside the chapter body. */
(function () {
  var m = location.hash.match(/^#term=([^&]+)(?:&n=(\d+))?/);
  if (!m) return;
  var term, nth = parseInt(m[2] || '0', 10);
  try { term = decodeURIComponent(m[1]); } catch (e) { return; }
  var root = document.querySelector('.chapter-body');
  if (!root || !term) return;
  var esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var re = new RegExp('(^|[^A-Za-z0-9])(' + esc + ')(?![A-Za-z0-9])', 'g');
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      var p = n.parentElement;
      return p && !p.closest('script,style,svg') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  var count = 0, node, hit = null;
  while ((node = walker.nextNode())) {
    re.lastIndex = 0;
    var r;
    while ((r = re.exec(node.nodeValue))) {
      if (count === nth) { hit = { node: node, start: r.index + r[1].length }; break; }
      count++;
    }
    if (hit) break;
  }
  if (!hit) return;
  var range = document.createRange();
  range.setStart(hit.node, hit.start);
  range.setEnd(hit.node, hit.start + term.length);
  var mark = document.createElement('mark');
  mark.className = 'term-hl';
  range.surroundContents(mark);
  function go() { mark.scrollIntoView({ block: 'center' }); }
  if (document.readyState === 'complete') setTimeout(go, 60);
  else window.addEventListener('load', function () { setTimeout(go, 60); });
})();
