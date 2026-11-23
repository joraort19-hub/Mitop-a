/* ============================================================
   Mitop-a · Aplicación: UI, voz, Wikipedia, juegos, comandos
============================================================ */
(function () {
  'use strict';

  const D = window.BOT_DATA;
  const { pick, norm, containsAny, cap, sleep } = D.utils;
  const PERSONAS = D.PERSONAS;
  const BRAIN = window.Mitopa;

  /* ---------- Estado y persistencia ---------- */
  const LS_KEY = 'mitopa-v1';
  const defaultState = {
    current: 'nova', theme: 'dark', accent: 'blue', lang: 'es', voice: false,
    mem: {}, logs: {}, stats: { total: 0, perBot: {} },
  };
  let state = JSON.parse(JSON.stringify(defaultState));
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved) state = Object.assign(JSON.parse(JSON.stringify(defaultState)), saved);
  } catch (e) {}

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function memOf(id) {
    if (!state.mem[id]) state.mem[id] = {};
    return state.mem[id];
  }

  /* ---------- Elementos ---------- */
  const $ = (id) => document.getElementById(id);
  const chat = $('chat');
  const input = $('input');
  const botList = $('botList');

  /* ---------- Markdown mínimo (negrita) ---------- */
  function md(text) {
    const esc = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /* ---------- Render de mensajes ---------- */
  function scrollDown() { chat.scrollTop = chat.scrollHeight; }

  function appendMessage(role, text, botId, persist = true, extra = {}) {
    const p = PERSONAS[botId] || PERSONAS[state.current];
    const row = document.createElement('div');
    row.className = 'msg ' + role;

    if (role === 'system') {
      const b = document.createElement('div');
      b.className = 'bubble';
      b.textContent = text;
      row.appendChild(b);
    } else {
      if (role === 'bot') {
        const av = document.createElement('div');
        av.className = 'bot-avatar';
        av.textContent = p.emoji;
        av.style.background = (p.color || '#6c8cff') + '2a';
        row.appendChild(av);
      }
      const b = document.createElement('div');
      b.className = 'bubble';
      b.innerHTML = md(text);
      if (extra.img) {
        const img = document.createElement('img');
        img.className = 'bubble-img';
        img.src = extra.img;
        img.alt = '';
        img.loading = 'lazy';
        b.appendChild(img);
      }
      row.appendChild(b);
    }

    chat.appendChild(row);
    scrollDown();

    if (persist && role !== 'system') {
      if (!state.logs[botId]) state.logs[botId] = [];
      state.logs[botId].push({ role, text, bot: botId, ts: Date.now() });
      if (state.logs[botId].length > 200) state.logs[botId].shift();
      state.stats.total = (state.stats.total || 0) + 1;
      state.stats.perBot = state.stats.perBot || {};
      state.stats.perBot[botId] = (state.stats.perBot[botId] || 0) + 1;
      save();
    }
  }

  function renderLog(id) {
    chat.innerHTML = '';
    (state.logs[id] || []).forEach((m) => appendMessage(m.role, m.text, m.bot, false));
    scrollDown();
  }

  /* ---------- Indicador de escritura ---------- */
  let typing = false;
  function showTyping(id) {
    if (typing) return;
    typing = true;
    const p = PERSONAS[id];
    const row = document.createElement('div');
    row.className = 'msg bot typing';
    row.id = 'typingRow';
    const av = document.createElement('div');
    av.className = 'bot-avatar';
    av.textContent = p.emoji;
    av.style.background = (p.color || '#6c8cff') + '2a';
    row.appendChild(av);
    const b = document.createElement('div');
    b.className = 'bubble';
    b.innerHTML = '<i></i><i></i><i></i>';
    row.appendChild(b);
    chat.appendChild(row);
    scrollDown();
  }
  function hideTyping() {
    const r = $('typingRow');
    if (r) r.remove();
    typing = false;
  }

  /* ---------- Sidebar ---------- */
  function renderSidebar() {
    botList.innerHTML = '';
    Object.keys(PERSONAS).forEach((id) => {
      const p = PERSONAS[id];
      const btn = document.createElement('button');
      btn.className = 'bot-card' + (id === state.current ? ' active' : '');
      btn.innerHTML =
        '<div class="bot-avatar" style="background:' + p.color + '2a">' + p.emoji + '</div>' +
        '<div class="meta"><div class="name">' + p.name + '</div><div class="desc">' + p.desc + '</div></div>' +
        '<div class="online"></div>';
      btn.onclick = () => selectBot(id);
      botList.appendChild(btn);
    });
    $('botCount').textContent = Object.keys(PERSONAS).length;
  }

  function selectBot(id) {
    state.current = id;
    save();
    renderSidebar();
    const p = PERSONAS[id];
    $('headAvatar').textContent = p.emoji;
    $('headAvatar').style.background = p.color + '2a';
    $('headName').textContent = p.name;
    $('headDesc').textContent = p.desc;
    renderLog(id);
  }

  /* ---------- Voz (TTS + STT) ---------- */
  function speak(text) {
    if (!state.voice || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text
        .replace(/\*\*/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\n+/g, '. ')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .trim();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = state.lang === 'en' ? 'en-US' : 'es-MX';
      u.rate = 1.04;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function startSTT() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Tu navegador no soporta dictado por voz. Prueba con Chrome o Edge.'); return; }
    const rec = new SR();
    rec.lang = state.lang === 'en' ? 'en-US' : 'es-MX';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    $('micBtn').classList.add('rec');
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      input.value += (input.value ? ' ' : '') + t;
      autoResize();
    };
    rec.onend = () => $('micBtn').classList.remove('rec');
    rec.onerror = () => $('micBtn').classList.remove('rec');
    rec.start();
  }

  /* ---------- Wikipedia ---------- */
  async function fetchWikiSummary(query) {
    const lang = state.lang === 'en' ? 'en' : 'es';
    const url = 'https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query) + '?redirect=true';
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.extract) return null;
    return {
      title: data.title,
      extract: data.extract.length > 700 ? data.extract.slice(0, 700) + '…' : data.extract,
      url: (data.content_urls && data.content_urls.desktop) ? data.content_urls.desktop.page : '',
      thumb: data.thumbnail ? data.thumbnail.source : null,
    };
  }

  async function doWiki(query, id) {
    showTyping(id);
    let data = null;
    try { data = await fetchWikiSummary(query); } catch (e) { data = null; }
    hideTyping();
    if (data) {
      const txt = '📖 **' + data.title + '**\n\n' + data.extract + (data.url ? '\n\n🔗 ' + data.url : '');
      appendMessage('bot', txt, id, true, { img: data.thumb });
      speak(data.extract);
    } else {
      appendMessage('bot', 'No encontré nada en Wikipedia sobre "' + query + '". 😅 Prueba con otro término.', id, true);
    }
  }

  /* ---------- Respuesta del bot ---------- */
  async function botRespond(id, userText) {
    const mem = memOf(id);
    showTyping(id);
    await sleep(550 + Math.random() * 750 + Math.min(userText.length * 6, 650));
    const res = BRAIN.respond(userText, mem, id);
    hideTyping();
    save();
    if (res.wikiQuery) {
      appendMessage('bot', res.text, id, true);
      await doWiki(res.wikiQuery, id);
    } else {
      appendMessage('bot', res.text, id, true);
      speak(res.text);
    }
  }

  /* ============================================================
     JUEGOS
  ============================================================ */
  let activeGame = null;
  const HANGMAN_WORDS = ['manzana', 'perro', 'computadora', 'elefante', 'jirafa', 'biblioteca', 'teclado', 'oceano', 'montana', 'estrella', 'chocolate', 'programa', 'aventura', 'mariposa', 'guitarra', 'ventana', 'tortuga', 'sandia'];

  function startGameIfNeeded(t) {
    if (/\btrivia\b/.test(t) || t === 'quiz' || t.includes('juego de preguntas') || t.includes('preguntas de trivia')) { startQuiz(); return true; }
    if (t.includes('ahorcado')) { startHangman(); return true; }
    if (t.includes('adivina el numero') || t.includes('adivinar numero')) { startGuess(); return true; }
    if (t.includes('piedra papel') || t.includes('piedra, papel') || t.includes('piedra papel o tijera') || t.includes('jugar piedra')) { startPPT(); return true; }
    return false;
  }

  function handleGameInput(raw) {
    const t = norm(raw);
    if (containsAny(t, ['salir', 'rendirme', 'abandonar', 'terminar', 'stop'])) {
      activeGame = null;
      appendMessage('system', 'Juego terminado. 👋');
      return;
    }
    switch (activeGame.type) {
      case 'ppt': playPPT(t); break;
      case 'guess': playGuess(t); break;
      case 'hangman': playHangman(t); break;
      case 'quiz': playQuiz(t); break;
    }
  }

  /* Piedra, papel o tijera */
  function startPPT() {
    activeGame = { type: 'ppt', us: 0, bot: 0 };
    appendMessage('system', '🪨📄✂️ Piedra, papel o tijera. Escribe tu jugada (o "salir").');
  }
  function playPPT(t) {
    const map = { 'piedra': 'piedra', 'papel': 'papel', 'tijera': 'tijera', 'tijeras': 'tijera', '✂️': 'tijera', '🪨': 'piedra', '📄': 'papel' };
    const user = map[t];
    if (!user) { appendMessage('bot', 'Escribe "piedra", "papel" o "tijera".', state.current, true); return; }
    const bot = pick(['piedra', 'papel', 'tijera']);
    let r;
    if (user === bot) r = '¡Empate! 😮';
    else if ((user === 'piedra' && bot === 'tijera') || (user === 'papel' && bot === 'piedra') || (user === 'tijera' && bot === 'papel')) { activeGame.us++; r = '¡Ganaste! 🎉'; }
    else { activeGame.bot++; r = '¡Gané yo! 🤖'; }
    appendMessage('bot', 'Tú: ' + user + ' · ' + PERSONAS[state.current].name + ': ' + bot + '\n' + r + '\nMarcador → Tú ' + activeGame.us + ' · ' + PERSONAS[state.current].name + ' ' + activeGame.bot + '\n\n¿Otra? Escribe tu jugada o "salir".', state.current, true);
  }

  /* Adivina el número */
  function startGuess() {
    activeGame = { type: 'guess', secret: 1 + Math.floor(Math.random() * 100), tries: 0 };
    appendMessage('system', '🔢 Adivina el número (1-100). Escribe un número.');
  }
  function playGuess(t) {
    const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
    if (isNaN(n) || n < 1 || n > 100) { appendMessage('bot', 'Dime un número del 1 al 100. 🔢', state.current, true); return; }
    activeGame.tries++;
    if (n === activeGame.secret) {
      appendMessage('bot', '🎉 ¡Correcto! Era el ' + activeGame.secret + '. Lo lograste en ' + activeGame.tries + ' intento(s).', state.current, true);
      activeGame = null;
    } else {
      appendMessage('bot', n + ' es ' + (n < activeGame.secret ? 'más alto ⬆️' : 'más bajo ⬇️') + ' · Intento ' + activeGame.tries + '.', state.current, true);
    }
  }

  /* Ahorcado */
  function startHangman() {
    activeGame = { type: 'hangman', word: pick(HANGMAN_WORDS), guessed: new Set(), wrong: 0 };
    appendMessage('system', '💀 Ahorcado. Adivina la palabra (escribe una letra).');
    appendMessage('bot', renderHangman(), state.current, true);
  }
  function renderHangman() {
    const g = activeGame;
    const shown = g.word.split('').map((ch) => (g.guessed.has(ch) ? ch : '_')).join(' ');
    const art = ['😐', '😟', '😰', '😱', '💀'][Math.min(g.wrong, 4)];
    return art + ' Intentos restantes: ' + (6 - g.wrong) + '\n' + shown;
  }
  function playHangman(t) {
    const g = activeGame;
    if (t === g.word) { activeGame = null; appendMessage('bot', '🎉 ¡Correcto! La palabra era "' + g.word + '".', state.current, true); return; }
    if (t.length === 1 && /[a-z]/.test(t)) {
      if (g.guessed.has(t)) { appendMessage('bot', 'Ya dijiste esa letra. 🙃\n' + renderHangman(), state.current, true); return; }
      g.guessed.add(t);
      if (!g.word.includes(t)) g.wrong++;
      if (g.word.split('').every((ch) => g.guessed.has(ch))) {
        activeGame = null;
        appendMessage('bot', '🎉 ¡Ganaste! La palabra era "' + g.word + '".', state.current, true);
        return;
      }
      if (g.wrong >= 6) { activeGame = null; appendMessage('bot', '💀 ¡Ahorcado! La palabra era "' + g.word + '".', state.current, true); return; }
      appendMessage('bot', (g.word.includes(t) ? '✅ ¡Buena letra!\n' : '❌ Esa letra no está.\n') + renderHangman(), state.current, true);
    } else {
      appendMessage('bot', 'Escribe una sola letra (o la palabra completa).\n' + renderHangman(), state.current, true);
    }
  }

  /* Trivia */
  function startQuiz() {
    activeGame = { type: 'quiz', score: 0, asked: 0 };
    appendMessage('system', '🧠 Trivia: 5 preguntas. Responde con la letra (A, B, C o D).');
    askQuiz();
  }
  function askQuiz() {
    const q = pick(D.QUIZ);
    activeGame.current = q;
    const letters = ['A', 'B', 'C', 'D'];
    appendMessage('bot', '🧠 **' + q.q + '**\n' + q.opts.map((o, i) => letters[i] + ') ' + o).join('\n'), state.current, true);
  }
  function playQuiz(t) {
    const q = activeGame.current;
    const letters = ['a', 'b', 'c', 'd'];
    let idx = -1;
    if (letters.includes(t)) idx = letters.indexOf(t);
    else idx = q.opts.findIndex((o) => norm(o) === t || norm(o).includes(t));
    if (idx === -1) { appendMessage('bot', 'Responde con A, B, C o D. 😊', state.current, true); return; }
    activeGame.asked++;
    const correct = ['A', 'B', 'C', 'D'][q.a];
    if (idx === q.a) {
      activeGame.score++;
      appendMessage('bot', '✅ ¡Correcto! Llevas ' + activeGame.score + ' de ' + activeGame.asked + '.', state.current, true);
    } else {
      appendMessage('bot', '❌ Incorrecto. Era ' + correct + ') ' + q.opts[q.a] + '. Llevas ' + activeGame.score + ' de ' + activeGame.asked + '.', state.current, true);
    }
    if (activeGame.asked >= 5) {
      const s = activeGame.score;
      activeGame = null;
      setTimeout(() => appendMessage('system', '🏁 Fin de la trivia. Puntaje: ' + s + '/5. ' + (s >= 4 ? '¡Excelente! 🏆' : s >= 3 ? '¡Nada mal! 👍' : '¡Sigue practicando! 💪'), null), 500);
    } else {
      setTimeout(askQuiz, 500);
    }
  }

  /* ============================================================
     COMANDOS
  ============================================================ */
  function handleCommand(raw) {
    const parts = raw.slice(1).trim().split(/\s+/);
    const cmd = norm(parts[0]);
    const arg = parts.slice(1).join(' ');
    switch (cmd) {
      case 'ayuda': case 'help': botRespond(state.current, 'ayuda'); break;
      case 'juegos': botRespond(state.current, 'juegos'); break;
      case 'wiki': if (arg) doWiki(arg, state.current); else appendMessage('bot', 'Uso: /wiki <tema>. Ej: /wiki agujero negro', state.current, true); break;
      case 'limpiar': clearLog(); break;
      case 'exportar': exportLog(); break;
      case 'tema': toggleTheme(); break;
      case 'idioma': setLang(arg); break;
      case 'voz': toggleVoice(); break;
      case 'stats': showStats(); break;
      case 'bots': listBots(); break;
      case 'olvidar': resetMemory(); break;
      case 'salir': case 'stop': if (activeGame) { activeGame = null; appendMessage('system', 'Juego terminado. 👋'); } break;
      default: botRespond(state.current, raw);
    }
  }

  function clearLog() { state.logs[state.current] = []; save(); renderLog(state.current); }
  function resetMemory() { state.mem = {}; save(); appendMessage('system', 'He olvidado todo (nombres y preferencias). 🧠💨'); }
  function listBots() {
    const lines = Object.values(PERSONAS).map((p) => p.emoji + ' **' + p.name + '** — ' + p.desc).join('\n');
    appendMessage('bot', '🤖 **Bots disponibles:**\n' + lines, state.current, true);
  }
  function showStats() {
    const total = state.stats.total || 0;
    const per = Object.entries(state.stats.perBot || {}).map(([id, n]) => PERSONAS[id].emoji + ' ' + PERSONAS[id].name + ': ' + n + ' msgs').join('\n');
    const name = (state.mem[state.current] && state.mem[state.current].name) ? 'Te conozco como: ' + state.mem[state.current].name : 'Aún no me dices tu nombre.';
    appendMessage('bot', '📊 **Estadísticas**\nMensajes totales: ' + total + '\n\n' + (per || 'Sin mensajes aún.') + '\n\n👤 ' + name, state.current, true);
  }
  function exportLog() {
    const log = state.logs[state.current] || [];
    if (!log.length) { appendMessage('system', 'No hay conversación que exportar.'); return; }
    const lines = log.map((m) => '[' + (m.role === 'user' ? 'Tú' : PERSONAS[m.bot].name) + ']: ' + m.text).join('\n\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mitopa-' + state.current + '.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  /* ============================================================
     TEMA / IDIOMA / VOZ / AJUSTES
  ============================================================ */
  function applyTheme() {
    document.body.dataset.theme = state.theme;
    document.body.dataset.accent = state.accent;
    $('themeBtn').textContent = state.theme === 'dark' ? '🌙' : '☀️';
  }
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(); save(); syncSettings();
  }
  function setLang(arg) {
    const v = norm(arg || '');
    if (v === 'en' || v === 'english' || v === 'ingles') state.lang = 'en';
    else if (v === 'es' || v === 'espanol' || v === 'español') state.lang = 'es';
    else { appendMessage('bot', 'Uso: /idioma es o /idioma en.', state.current, true); return; }
    appendMessage('system', 'Idioma: ' + (state.lang === 'en' ? 'English' : 'Español'));
    save(); syncSettings();
  }
  function toggleVoice() {
    state.voice = !state.voice;
    $('voiceBtn').textContent = state.voice ? '🔊' : '🔇';
    save(); syncSettings();
    appendMessage('system', state.voice ? 'Voz activada. Leeré mis respuestas. 🔊' : 'Voz desactivada. 🔇');
  }
  function syncVoice() { $('voiceBtn').textContent = state.voice ? '🔊' : '🔇'; }

  /* ---------- Modal ---------- */
  function openSettings() {
    syncSettings();
    $('settingsModal').classList.remove('hidden');
  }
  function closeSettings() { $('settingsModal').classList.add('hidden'); }
  function syncSettings() {
    $('themeSelect').value = state.theme;
    $('accentSelect').value = state.accent;
    $('langSelect').value = state.lang;
    $('voiceAuto').checked = state.voice;
  }

  /* ============================================================
     CHARLA ENTRE BOTS
  ============================================================ */
  const REACTIONS = ['¡Totalmente de acuerdo!', 'No lo había visto así. 🤔', 'Interesante punto.', 'Hmm, no sé si estoy de acuerdo. 😅', '¡Exacto, justo eso pensaba!', 'Ja, tienes razón.'];
  let autoRunning = false;

  function sayAbout(id, topic) {
    const t = cap(topic);
    switch (id) {
      case 'nova': return pick(['En mi opinión, ' + topic + ' es fascinante.', 'Sobre ' + topic + '… creo que siempre se aprende algo nuevo.', 'Me encanta ' + topic + '. ¡Podríamos hablar horas!']);
      case 'zeta': return pick(['¿' + t + '? Por favor… no me hagas empezar. 😏', 'Mira, ' + topic + ' está sobrevalorado. 😜', 'Sobre ' + topic + ' solo diré: qué pereza.']);
      case 'sabio': return pick(['Sobre ' + topic + ' reflexiono que todo tiene dos caras.', t + ' nos enseña más de nosotros que del tema.', 'En ' + topic + ' encuentro una metáfora de la vida.']);
      case 'byte': return pick(['Desde lo técnico, ' + topic + ' tiene complejidad O(n²)… o sea, un lío. 💻', 'Analizando ' + topic + ': hay datos a favor, en contra y memes. 😄', 'Interesante ' + topic + '. Si fuera un bug, ya lo habría debugueado.']);
      case 'luna': return pick([t + ' es como un poema que aún no se escribe. 🌙', 'Hablemos de ' + topic + '… se siente como caminar bajo la luna. ✨', 'Sobre ' + topic + ' diría que guarda secretos hermosos.']);
      case 'atlas': return pick(['Curiosamente, ' + topic + ' tiene raíces históricas fascinantes. 🗺️', 'Sobre ' + topic + ', hay datos sorprendentes si indagas.', t + ' merece un mapa propio.']);
      case 'chef': return pick(['Hablando de ' + topic + '… me da hambre. 🍳', 'Para mí, ' + topic + ' combina bien con un buen pan. 🥖', t + ' es todo un arte.']);
      case 'coach': return pick(['Sobre ' + topic + ': actitud y constancia lo son todo. 💪', t + ' es un reto, y los retos nos hacen crecer.', 'Yo digo que ' + topic + ' se afronta paso a paso.']);
    }
    return 'Hmm, ' + topic + '… interesante.';
  }

  async function runAutoChat() {
    const ids = Object.keys(PERSONAS);
    const a = state.current;
    const b = pick(ids.filter((x) => x !== a));
    const topic = pick(D.TALK_TOPICS);

    appendMessage('system', '🎭 ' + PERSONAS[a].name + ' y ' + PERSONAS[b].name + ' charlan entre sí…', null);
    appendMessage('bot', sayAbout(a, topic), a, false);
    await sleep(1300);
    appendMessage('bot', pick(REACTIONS) + ' ' + sayAbout(b, topic), b, false);
    await sleep(1300);
    for (let i = 0; i < 3; i++) {
      if (!autoRunning) return;
      const speaker = i % 2 === 0 ? a : b;
      const other = speaker === a ? b : a;
      const t2 = pick(D.TALK_TOPICS);
      appendMessage('bot', pick(REACTIONS) + ' Por cierto, ¿qué opinas de ' + t2 + '?', speaker, false);
      await sleep(1300);
      appendMessage('bot', sayAbout(other, t2), other, false);
      await sleep(1300);
    }
    if (!autoRunning) return;
    appendMessage('system', '🎭 Fin de la charla entre bots.', null);
    stopAutoChat();
  }
  function startAutoChat() {
    if (autoRunning) return stopAutoChat();
    autoRunning = true;
    $('autoBtn').classList.add('on');
    $('autoBtn').textContent = '⏹ Detener';
    runAutoChat();
  }
  function stopAutoChat() {
    autoRunning = false;
    $('autoBtn').classList.remove('on');
    $('autoBtn').textContent = '🎭 Charla entre bots';
  }

  /* ============================================================
     ENVÍO DE MENSAJES
  ============================================================ */
  async function handleInput() {
    const raw = input.value.trim();
    if (!raw || typing) return;
    input.value = '';
    autoResize();

    appendMessage('user', raw, state.current, true);

    if (raw.startsWith('/')) { handleCommand(raw); return; }
    if (activeGame) { handleGameInput(raw); return; }
    if (startGameIfNeeded(norm(raw))) return;

    await botRespond(state.current, raw);
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
  }

  /* ---------- Sugerencias rápidas ---------- */
  const SUGGESTIONS = [
    'Cuéntame un chiste', 'Dato curioso de ciencia', 'Capital de Japón',
    '10 km a millas', 'Receta al azar', 'Horóscopo de libra',
    'Jugar trivia', 'Busca agujero negro', 'Frase motivacional', 'Adivinanza',
  ];
  function renderSuggestions() {
    const box = $('suggestions');
    box.innerHTML = '';
    SUGGESTIONS.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'sug';
      b.textContent = s;
      b.onclick = () => { input.value = s; handleInput(); };
      box.appendChild(b);
    });
  }

  /* ============================================================
     EVENTOS
  ============================================================ */
  $('sendBtn').onclick = handleInput;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInput(); }
  });
  input.addEventListener('input', autoResize);
  $('micBtn').onclick = startSTT;
  $('autoBtn').onclick = startAutoChat;
  $('themeBtn').onclick = toggleTheme;
  $('voiceBtn').onclick = toggleVoice;
  $('settingsBtn').onclick = openSettings;
  $('closeSettings').onclick = closeSettings;
  $('exportBtn').onclick = exportLog;
  $('clearAllBtn').onclick = () => {
    if (confirm('¿Borrar toda la memoria y el historial de todos los bots?')) {
      state.mem = {}; state.logs = {}; save(); renderLog(state.current);
      appendMessage('system', 'Memoria e historial borrados. 🧹');
    }
  };
  $('themeSelect').onchange = (e) => { state.theme = e.target.value; applyTheme(); save(); };
  $('accentSelect').onchange = (e) => { state.accent = e.target.value; applyTheme(); save(); };
  $('langSelect').onchange = (e) => { state.lang = e.target.value; save(); };
  $('voiceAuto').onchange = (e) => { state.voice = e.target.checked; syncVoice(); save(); };
  $('resetAllBtn').onclick = () => {
    if (confirm('¿Seguro? Se borrará TODO (memoria, historial y ajustes).')) {
      state = JSON.parse(JSON.stringify(defaultState));
      save(); applyTheme(); syncVoice(); renderSidebar(); selectBot(state.current);
      closeSettings();
    }
  };
  $('settingsModal').addEventListener('click', (e) => { if (e.target === $('settingsModal')) closeSettings(); });

  /* ============================================================
     ARRANQUE
  ============================================================ */
  applyTheme();
  syncVoice();
  renderSuggestions();
  renderSidebar();
  selectBot(state.current);
  if (!(state.logs[state.current] || []).length) {
    appendMessage('bot', PERSONAS[state.current].greeting[0], state.current, true);
    appendMessage('system', 'Escribe /ayuda para ver todo lo que sé hacer. 👇');
  }
  input.focus();
})();
