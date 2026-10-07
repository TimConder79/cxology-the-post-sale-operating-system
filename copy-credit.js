// Appends a source credit when a reader copies a passage (not short snippets or form fields).
(function () {
  var MIN_CHARS = 40;
  var BOOK_PAGE = /\/(chapter-[^/]+|preface|book|glossary|frameworks)\.html$/;

  document.addEventListener('copy', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return;
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    var text = sel.toString();
    if (text.trim().length < MIN_CHARS || !e.clipboardData) return;

    var canon = document.querySelector('link[rel="canonical"]');
    var url = canon ? canon.href : location.origin + location.pathname;
    var source = BOOK_PAGE.test(location.pathname)
      ? 'The Post-Sale Operating System by Tim Conder'
      : 'Tim Conder, CXology';

    var box = document.createElement('div');
    for (var i = 0; i < sel.rangeCount; i++) box.appendChild(sel.getRangeAt(i).cloneContents());
    var link = document.createElement('a');
    link.href = url;
    link.textContent = url;

    e.clipboardData.setData('text/plain', text + '\n\nSource: ' + source + '\n' + url);
    e.clipboardData.setData('text/html', box.innerHTML + '<p>Source: ' + source + '<br>' + link.outerHTML + '</p>');
    e.preventDefault();
  });
})();
