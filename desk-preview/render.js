// Shared answer rendering for the Desk, the results page, the console, and the preview.
// FND-005: grouped and collapsed sources, citation numbers that open their passage, a jump link to the
// moves, a "Copy answer" control, and plain error cards.
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")
  .replace(/\[\[(\d+)\]\]/g, (_, n) => `<sup><a href="#SRC-${n}" data-cite="${n}" aria-label="Source ${n}">${n}</a></sup>`)
  .replace(/\[\[applied\]\]/g, `<span class="applied">Applied to your situation</span>`);

const TIM = `<a href="https://zcal.co/timcxology/intro" target="_blank">talk it through with Tim</a>`;

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

// Display-only cleanup of cited passages: the source text can carry markdown heading and list markers.
// Stored quotes stay verbatim, so the citation checks are unaffected.
const cleanQuote = (q) => q.replace(/(^|\s)#{1,6}\s+/g, "$1").replace(/(^|\n)\s*[-*]\s+/g, "$1").replace(/\s+/g, " ").trim();

// One entry per source page, its passages beneath it, citation numbers unchanged.
function groupSources(sources) {
  const groups = [];
  sources.forEach((s, i) => {
    let g = groups.find((x) => x.url === s.url);
    if (!g) groups.push((g = { title: s.title, url: s.url, items: [] }));
    g.items.push({ n: i + 1, s });
  });
  return groups;
}

// Plain-text version for "Copy answer": headings, numbered moves, [n] markers, then the sources.
function answerAsText(result) {
  const body = result.text
    .replace(/\[\[applied\]\]/g, " (applied to your situation)")
    .replace(/\[\[(\d+)\]\]/g, "[$1]")
    .replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,3}\s*(.+)$/gm, (_, h) => h.toUpperCase())
    .trim();
  const src = (result.sources || []).map((s, i) => `[${i + 1}] ${s.title}: ${s.url}\n    "${cleanQuote(s.quote)}"`).join("\n");
  return `${result.q ? result.q + "\n\n" : ""}${body}${src ? "\n\nSOURCES\n" + src : ""}\n\nFrom the CXology Desk, grounded in The Post-Sale Operating System by Tim Conder (cxology.co).`;
}

// Clipboard with a fallback for browsers or contexts where the async Clipboard API is unavailable.
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  const t = document.createElement("textarea");
  t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
  document.body.appendChild(t); t.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch {}
  t.remove(); return ok;
}

function errorCard(error) {
  const e = typeof error === "string" ? { kind: "failed", message: "Something went wrong on our side. Try again in a moment." } : error;
  const card = document.createElement("div");
  card.className = "card warn";
  const withTim = ["unavailable", "declined"].includes(e.kind);
  const msg = withTim ? esc(e.message).replace(/talk it through with Tim\.$/, TIM + ".") : esc(e.message);
  card.innerHTML = `<p>${msg}</p><div class="answer-actions"><button class="ghost retry">Try again</button></div>`;
  return card;
}

function render(result, id) {
  if (result.error) return errorCard(result.error);
  const card = document.createElement("div");
  if (result.blocked) {
    card.className = "card warn";
    card.innerHTML = `<p>I couldn't ground an answer to this in the book, so I won't guess. Try describing the situation differently, or ${TIM}.</p>`;
    return card;
  }
  card.className = "card " + result.kind;
  let html = md(result.text).replaceAll('href="#SRC-', `href="#${id}-`);
  const isPlay = result.kind === "play" && /<h2>Your next 3 moves/i.test(html);
  if (isPlay) {
    html = html.replace(/<h2>(Your next 3 moves)/i, `<h2 id="${id}-moves">$1`);
    html = `<a class="jump" href="#${id}-moves">Jump to your next 3 moves</a>` + html;
  }
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
  html += `<div class="answer-actions"><button class="ghost copy-answer">Copy answer</button></div>`;
  const sources = result.sources || [];
  if (sources.length) {
    const groups = groupSources(sources);
    const summary = `Go deeper in the book: ${sources.length} passage${sources.length === 1 ? "" : "s"} from ${groups.length} source${groups.length === 1 ? "" : "s"}`;
    html += `<details class="deeper" id="${id}-deeper"${sources.length === 1 ? " open" : ""}><summary>${summary}</summary>` +
      groups.map((g) => `<div class="src-group"><a class="src-title" href="${esc(g.url)}" target="_blank">${esc(g.title)}</a>` +
        g.items.map(({ n, s }) => `<div class="src" id="${id}-${n}"><div class="n">${n}</div><blockquote>${esc((q => q.length > 280 ? q.slice(0, 280) + "..." : q)(cleanQuote(s.quote)))} <a class="passage-link" href="${esc(deepLink(s))}" target="_blank">Open passage</a></blockquote></div>`).join("") +
        `</div>`).join("") + `</details>`;
  }
  if (result.kind === "play") html += `<p class="cta">Messy situation? <a href="https://zcal.co/timcxology/intro" target="_blank">Talk it through with Tim</a>.</p>`;
  card.innerHTML = html;

  // A citation number opens "Go deeper" and brings its passage into view.
  card.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-cite]");
    if (!a) return;
    e.preventDefault();
    const deeper = card.querySelector(".deeper");
    const target = card.querySelector(`[id="${id}-${a.dataset.cite}"]`);
    if (!deeper || !target) return;
    deeper.open = true;
    target.scrollIntoView({ block: "center" }); // instant: smooth scrolling is unreliable across browsers
    target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash");
  });
  card.querySelector(".copy-answer").onclick = async (e) => {
    const b = e.currentTarget;
    b.textContent = (await copyText(answerAsText(result))) ? "Copied" : "Copy didn't work in this browser";
    setTimeout(() => (b.textContent = "Copy answer"), 1800);
  };
  card.querySelectorAll("[data-copy]").forEach((b) => b.onclick = async () => {
    b.textContent = (await copyText(result.kits[b.dataset.copy].prompt)) ? "Copied" : "Use Preview to copy";
    setTimeout(() => (b.textContent = "Copy prompt"), 1600);
  });
  return card;
}
