const vscode = acquireVsCodeApi();

const textarea = document.getElementById('input');
const sendBtn  = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const chat     = document.getElementById('chat');

let isThinking    = false;
let currentBubble = null;
let currentRaw    = '';
let thinkingEl    = null;
let messageCount  = 0;
let loadingTimer  = null;

// ── Event listeners ──────────────────────────────────────────────

sendBtn.addEventListener('click', send);
clearBtn.addEventListener('click', clearChat);

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 130) + 'px';
});

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

// Suggestion chips and copy buttons via event delegation
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (chip) {
    fillInput(chip.dataset.text);
    return;
  }
  const copyBtn = e.target.closest('.copy-btn');
  if (copyBtn) {
    copyCode(copyBtn.dataset.target, copyBtn);
    return;
  }

  const permBtn = e.target.closest('[data-perm-id]');
  if (permBtn) {
    const id       = permBtn.dataset.permId;
    const approved = permBtn.dataset.approved === 'true';
    resolvePermission(id, approved);
  }
});

// Extension messages
window.addEventListener('message', ({ data }) => {
  if      (data.command === 'chunk')      appendChunk(data.text);
  else if (data.command === 'done')       finalizeMessage();
  else if (data.command === 'error')      appendError(data.text);
  else if (data.command === 'permission') showPermission(data.id, data.action, data.detail);
});

// ── Core actions ─────────────────────────────────────────────────

function send() {
  const text = textarea.value.trim();
  if (!text || isThinking) return;

  removeWelcome();
  appendUserMessage(text);
  appendThinking();
  setLoading(true);

  vscode.postMessage({ command: 'ask', text });
  textarea.value = '';
  textarea.style.height = 'auto';
}

function fillInput(text) {
  textarea.value = text;
  textarea.focus();
  textarea.dispatchEvent(new Event('input'));
}

function clearChat() {
  chat.innerHTML = buildWelcomeHtml();
  currentBubble = null;
  currentRaw    = '';
  thinkingEl    = null;
  messageCount  = 0;
  setLoading(false);
}

// ── Message builders ─────────────────────────────────────────────

function removeWelcome() {
  const w = document.getElementById('welcome');
  if (w) w.remove();

  if (messageCount === 0) {
    const divider = document.createElement('div');
    divider.className = 'day-divider';
    divider.textContent = 'Today';
    chat.appendChild(divider);
  }
}

function appendUserMessage(text) {
  messageCount++;
  const msg = document.createElement('div');
  msg.className = 'message user';
  msg.innerHTML =
    '<div class="msg-meta"><span>' + timestamp() + '</span>' +
    '<div class="avatar user-av">U</div></div>' +
    '<div class="bubble">' + escHtml(text) + '</div>';
  chat.appendChild(msg);
  scrollBottom();
}

function appendThinking() {
  thinkingEl = document.createElement('div');
  thinkingEl.className = 'thinking-wrap';
  thinkingEl.innerHTML =
    '<div class="msg-meta"><div class="avatar ai-av">AI</div><span>AI Agent</span></div>' +
    '<div class="thinking-bubble">' +
      '<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>' +
      'Thinking…' +
    '</div>';
  chat.appendChild(thinkingEl);
  scrollBottom();
}

function startAiMessage() {
  if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; }
  messageCount++;
  currentRaw = '';

  const msg    = document.createElement('div');
  const meta   = document.createElement('div');
  const bubble = document.createElement('div');

  msg.className    = 'message ai';
  meta.className   = 'msg-meta';
  bubble.className = 'bubble';
  currentBubble    = bubble;

  meta.innerHTML = '<div class="avatar ai-av">AI</div><span>AI Agent · ' + timestamp() + '</span>';

  msg.appendChild(meta);
  msg.appendChild(bubble);
  chat.appendChild(msg);
  scrollBottom();
}

function appendChunk(text) {
  if (!currentBubble) startAiMessage();
  currentRaw += text;
  currentBubble.innerHTML = renderMarkdown(currentRaw);
  scrollBottom();
}

function finalizeMessage() {
  if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; }
  if (!currentBubble) {
    appendError('No response received. Make sure LM Studio is running with a model loaded.');
    return;
  }
  currentBubble = null;
  currentRaw    = '';
  setLoading(false);
}

function appendError(text) {
  if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; }
  const msg = document.createElement('div');
  msg.className = 'message ai';
  msg.innerHTML =
    '<div class="msg-meta"><div class="avatar ai-av">AI</div><span>AI Agent</span></div>' +
    '<div class="bubble error">' + escHtml(text) + '</div>';
  chat.appendChild(msg);
  setLoading(false);
  scrollBottom();
}

// ── Utilities ────────────────────────────────────────────────────

function setLoading(v) {
  isThinking        = v;
  sendBtn.disabled  = v;
  if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
  if (v) {
    loadingTimer = setTimeout(() => {
      appendError('Request timed out. Please try again.');
    }, 60000);
  }
}

function scrollBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function copyCode(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent || '').then(() => {
    if (btn) {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
    }
  });
}

function renderMarkdown(raw) {
  let out = escHtml(raw);

  // Fenced code blocks — backticks work naturally in a .js file
  out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    const label = lang || 'code';
    return (
      '<div class="code-header">' +
        '<span>' + label + '</span>' +
        '<button class="copy-btn" data-target="' + id + '">Copy</button>' +
      '</div>' +
      '<pre><code id="' + id + '">' + code.trim() + '</code></pre>'
    );
  });

  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold / italic
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headings
  out = out.replace(/^### (.+)$/gm, '<strong style="font-size:12px;opacity:.7">$1</strong>');
  out = out.replace(/^## (.+)$/gm,  '<strong style="font-size:13px">$1</strong>');
  out = out.replace(/^# (.+)$/gm,   '<strong style="font-size:14px">$1</strong>');

  // Bullets
  out = out.replace(/^[•\-*] (.+)$/gm, '&bull; $1');

  // Newlines
  out = out.replace(/\n/g, '<br>');

  return out;
}

function buildWelcomeHtml() {
  const chips = [
    ['Explain this code',       'Explain this code'],
    ['Refactor for readability', 'Refactor for readability'],
    ['Find bugs in this code',  'Find bugs'],
    ['Add TypeScript types',    'Add TypeScript types'],
  ];
  const chipHtml = chips
    .map(([text, label]) =>
      '<button class="suggestion-chip" data-text="' + text + '">' + label + '</button>'
    )
    .join('');

  return (
    '<div class="welcome" id="welcome">' +
      '<div class="welcome-logo">🤖</div>' +
      '<h2>AI Coding Assistant</h2>' +
      '<p>Select code in your editor and ask me to fix, refactor, or explain it.</p>' +
      '<div class="suggestions">' + chipHtml + '</div>' +
    '</div>'
  );
}

// ── Permission prompt ─────────────────────────────────────────────

function showPermission(id, action, detail) {
  const actionLabel = {
    read_file:  '📂 Read file',
    write_file: '✏️  Write file',
  }[action] || action;

  const card = document.createElement('div');
  card.className = 'perm-card';
  card.id = 'perm-' + id;
  card.innerHTML =
    '<div class="perm-info">' +
      '<div class="perm-label">' + actionLabel + '</div>' +
      '<div class="perm-detail">' + escHtml(detail) + '</div>' +
    '</div>' +
    '<div class="perm-btns">' +
      '<button class="perm-allow" data-perm-id="' + id + '" data-approved="true">Allow</button>' +
      '<button class="perm-deny"  data-perm-id="' + id + '" data-approved="false">Deny</button>' +
    '</div>';
  chat.appendChild(card);
  scrollBottom();
}

function resolvePermission(id, approved) {
  const card = document.getElementById('perm-' + id);
  if (card) {
    const label = approved ? '✓ Allowed' : '✗ Denied';
    const cls   = approved ? 'perm-status allowed' : 'perm-status denied';
    card.querySelector('.perm-btns').innerHTML = '<span class="' + cls + '">' + label + '</span>';
  }
  vscode.postMessage({ command: 'permission_response', id, approved });
}
