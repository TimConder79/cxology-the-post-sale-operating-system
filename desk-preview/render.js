// Shared play-card rendering for the Desk and the test results page.
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")
  .replace(/\[\[(\d+)\]\]/g, (_, n) => `<sup><a href="#SRC-${n}">${n}</a></sup>`)
  .replace(/\[\[applied\]\]/g, `<span class="applied">Applied to your situation</span>`);

function md(text) {
  const out = []; let list = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const ol = line.match(/^\d+[.)]\s+(.*)/), ul = line.match(/^[-*]\s+(.*)/);
    if ((ol || ul) && !list) { list = ol ? "ol" : "ul"; out.push(`<${list}>`); }
    if (!(ol || ul) && list && line) { out.push(`</${list}>`); list = null; }
    if (ol || ul) out.push(`<li>${inline((ol || ul)[1])}</li>`);
    else if (/^#{1,3}\s/.test(line)) out.push(`<h2>${inline(line.replace(/^#+\s*/, ""))}</h2>`);
    else if (line) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push(`</${list}>`);
  return out.join("");
}

// Text-fragment link takes the reader to the exact cited passage on the page.
const deepLink = (s) => {
  const words = s.quote.replace(/\s+/g, " ").split(" ");
  const frag = words.length > 10 ? `${words.slice(0, 5).join(" ")},${words.slice(-4).join(" ")}` : words.join(" ");
  return `${s.url}#:~:text=${frag.split(",").map(encodeURIComponent).join(",")}`;
};

function render(result, id) {
  const card = document.createElement("div");
  if (result.error) { card.className = "card warn"; card.innerHTML = `<p>${esc(result.error)}</p>`; return card; }
  if (result.blocked) {
    card.className = "card warn";
    card.innerHTML = `<p>I couldn't ground an answer to this in the book, so I won't guess. Try describing the situation differently, or <a href="https://zcal.co/timcxology/intro" target="_blank">talk to Tim directly</a>.</p>`;
    return card;
  }
  card.className = "card " + result.kind;
  let html = md(result.text).replaceAll('href="#SRC-', `href="#${id}-`);
  if (result.kits?.length) {
    html += `<h2>Action kits</h2>` + result.kits.map((k, i) => {
      const q = encodeURIComponent(k.prompt);
      return `<div class="kit"><div class="kit-head"><div class="kit-icon">${i + 1}</div><div><div class="kit-name">${esc(k.name)}</div><div class="kit-desc">${esc(k.desc)}</div></div></div>
        <div class="kit-actions"><button class="primary" data-copy="${i}">Copy prompt</button>
        <a class="ghost" target="_blank" href="https://claude.ai/new?q=${q}">Open in Claude</a>
        <a class="ghost" target="_blank" href="https://chatgpt.com/?q=${q}">Open in ChatGPT</a></div>
        <details class="prompt"><summary>Preview the prompt</summary><pre>${esc(k.prompt)}</pre></details></div>`;
    }).join("");
  }
  if (result.sources.length) {
    html += `<div class="deeper"><h3>Go deeper in the book</h3>` + result.sources.map((s, i) =>
      `<div class="src" id="${id}-${i + 1}"><div class="n">${i + 1}</div><a href="${esc(deepLink(s))}" target="_blank">${esc(s.title)}</a><blockquote>${esc(s.quote.length > 280 ? s.quote.slice(0, 280) + "..." : s.quote)}</blockquote></div>`).join("") + `</div>`;
  }
  if (result.kind === "play") html += `<p class="cta">Messy situation? <a href="https://zcal.co/timcxology/intro" target="_blank">Talk it through with Tim</a>.</p>`;
  card.innerHTML = html;
  card.querySelectorAll("[data-copy]").forEach((b) => b.onclick = async () => {
    try { await navigator.clipboard.writeText(result.kits[b.dataset.copy].prompt); b.textContent = "Copied"; }
    catch { b.textContent = "Use Preview to copy"; }
    setTimeout(() => (b.textContent = "Copy prompt"), 1600);
  });
  return card;
}
