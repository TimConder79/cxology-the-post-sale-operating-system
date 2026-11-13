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

// KIT-001: one prompt. Revision 2: a prompt can list up to three needs (materials the reader adds first).
// The reader's answers replace {{MATERIALS}} in their own browser; nothing they paste is sent to the server.
const LINK_LIMIT = 6000;
const SITES = { claude: "https://claude.ai/new", chatgpt: "https://chatgpt.com/" };
const ASK_FIRST = "Before drafting anything, ask me for every item marked \"not provided\" in one short list, then wait for my answers.";

function needField(n, kitIndex, j) {
  const id = `kit${kitIndex}-need${j}`;
  if (n.kind === "choice") return `<fieldset class="need"><legend>${esc(n.label)}</legend>${(n.options || []).map((o) => `<label class="need-choice"><input type="radio" name="${id}" value="${esc(o)}"> ${esc(o)}</label>`).join("")}</fieldset>`;
  if (n.kind === "paste") return `<label class="need" for="${id}">${esc(n.label)}<textarea id="${id}" rows="3" placeholder="Paste here"></textarea></label>`;
  return `<label class="need" for="${id}">${esc(n.label)}<input id="${id}" type="text"></label>`;
}

function kitHtml(k, index, number) {
  const needs = k.needs || [];
  return `<div class="kit${number ? "" : " kit-inline"}" data-kit="${index}"><div class="kit-head">${number ? `<div class="kit-icon">${number}</div>` : ""}<div><div class="kit-name">${esc(k.name)}</div><div class="kit-desc">${esc(k.desc || "")}</div></div></div>
    ${needs.length ? `<div class="kit-needs"><div class="needs-intro">Add these first so the draft comes back right the first time:</div>${needs.map((n, j) => needField(n, index, j)).join("")}</div>` : ""}
    <div class="kit-actions"><button class="primary" data-copy="${index}">Copy prompt</button>
    <a class="ghost" target="_blank" rel="noopener" data-site="claude">Open in Claude</a>
    <a class="ghost" target="_blank" rel="noopener" data-site="chatgpt">Open in ChatGPT</a></div>
    <div class="kit-note" aria-live="polite"></div>
    <details class="prompt"><summary>Preview the prompt</summary><pre></pre></details></div>`;
}

// The prompt as it will be sent: the reader's answers in place of {{MATERIALS}}; empty ones marked for the AI to ask.
function buildPrompt(k, el) {
  const needs = k.needs || [];
  if (!needs.length) return { prompt: k.prompt.replace(/^.*\{\{MATERIALS\}\}.*\n?/m, ""), missing: 0 };
  let missing = 0;
  const lines = needs.map((n, j) => {
    const id = `kit${el.dataset.kit}-need${j}`;
    const v = n.kind === "choice" ? (el.querySelector(`input[name="${id}"]:checked`)?.value || "") : (el.querySelector(`[id="${id}"]`)?.value || "").trim();
    if (!v) missing++;
    return `- ${n.label}: ${v ? (n.kind === "paste" ? "\n" + v : v) : "not provided"}`;
  });
  let prompt = k.prompt.replace("{{MATERIALS}}", "\n" + lines.join("\n"));
  if (missing) prompt += "\n\n" + ASK_FIRST;
  return { prompt, missing };
}

function wireKit(el, k) {
  const refresh = () => {
    const { prompt, missing } = buildPrompt(k, el);
    const q = encodeURIComponent(prompt);
    el.querySelectorAll("a[data-site]").forEach((a) => {
      const site = a.dataset.site, base = SITES[site] + (site === "claude" ? "?q=" : "?q=");
      const long = base.length + q.length > LINK_LIMIT;
      a.href = long ? SITES[site] : base + q;
      a.dataset.fallback = long ? "1" : "";
      a.textContent = `${missing ? "Open anyway in" : "Open in"} ${site === "claude" ? "Claude" : "ChatGPT"}`;
    });
    el.querySelector("details.prompt pre").textContent = prompt;
    return prompt;
  };
  el.querySelectorAll(".kit-needs input, .kit-needs textarea").forEach((f) => f.addEventListener("input", refresh));
  el.querySelectorAll('.kit-needs input[type="radio"]').forEach((f) => f.addEventListener("change", refresh));
  el.querySelector("[data-copy]").onclick = async (e) => {
    const b = e.currentTarget;
    b.textContent = (await copyText(refresh())) ? "Copied" : "Use Preview to copy";
    setTimeout(() => (b.textContent = "Copy prompt"), 1600);
  };
  // Long prompts can't ride in the link: the link opens the AI tool right away (so no pop-up blocker
  // interferes) while the prompt is copied for pasting.
  el.querySelectorAll("a[data-site]").forEach((a) => a.addEventListener("click", () => {
    const prompt = refresh();
    if (!a.dataset.fallback) return;
    const note = el.querySelector(".kit-note");
    copyText(prompt).then((ok) => { note.textContent = ok ? "Prompt copied. Paste it into the chat that just opened." : "Copy didn't work here. Use Preview the prompt to copy it."; });
  }));
  refresh();
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
  // Older answers (the hand-run RevOps example) carry prompts without a move number: shown together at the end.
  const kits = result.kits || [];
  const loose = kits.map((k, i) => ({ k, i })).filter(({ k }) => !k.move);
  if (loose.length) html += `<h2>Action kits</h2>` + loose.map(({ k, i }, n) => kitHtml(k, i, n + 1)).join("");
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

  // KIT-001: each prompt sits directly under its move, with one privacy line above the first.
  const moved = kits.map((k, i) => ({ k, i })).filter(({ k }) => k.move);
  const movesList = card.querySelector(`[id="${id}-moves"]`)?.nextElementSibling;
  if (moved.length && movesList?.tagName === "OL") {
    movesList.insertAdjacentHTML("beforebegin", `<p class="kit-privacy">Each move has an AI prompt with your situation filled in. It only includes what you typed; don't paste confidential customer details into an outside AI tool.</p>`);
    const items = movesList.querySelectorAll(":scope > li");
    moved.forEach(({ k, i }) => items[k.move - 1]?.insertAdjacentHTML("beforeend", kitHtml(k, i, null)));
  }

  // A citation number opens "Go deeper" and brings its passage into view.
  card.addEventListener("click", (e) => {
    // The jump link scrolls without adding a browser history entry, so Back still leaves the page.
    const jump = e.target.closest("a.jump");
    if (jump) {
      e.preventDefault();
      card.querySelector(`[id="${id}-moves"]`)?.scrollIntoView({ block: "start" });
      return;
    }
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
  card.querySelectorAll(".kit[data-kit]").forEach((el) => wireKit(el, kits[el.dataset.kit]));
  return card;
}
