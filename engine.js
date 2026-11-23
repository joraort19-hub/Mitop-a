/* ============================================================
   Mitop-a · Motor de intenciones (el "cerebro" de los bots)
   Devuelve: { text, unsure, wikiQuery? }
============================================================ */
(function (global) {
  'use strict';

  const D = global.BOT_DATA;
  const { pick, norm, containsAny, cap } = D.utils;
  const PERSONAS = D.PERSONAS;

  /* ---------- Helpers ---------- */
  const ok = (text) => ({ text, unsure: false });
  const maybe = (text) => ({ text, unsure: true });

  function randomFact(category) {
    const list = D.DATOS_CURIOSOS[category];
    return list ? pick(list) : pick(D.DATOS_CURIOSOS.ciencia);
  }

  function matchCategory(t) {
    for (const cat in D.DATOS_CATEGORIAS) {
      if (containsAny(t, D.DATOS_CATEGORIAS[cat])) return cat;
    }
    return null;
  }

  function findKey(query, map) {
    // devuelve la clave que mejor coincide (la más larga)
    let best = null;
    for (const k in map) {
      if (query.includes(k) && (!best || k.length > best.length)) best = k;
    }
    return best;
  }

  function hasGreeting(t) {
    const phrases = ['buenos dias', 'buenas tardes', 'buenas noches', 'que onda', 'good morning', 'good afternoon', 'good evening'];
    for (const ph of phrases) if (t.includes(ph)) return true;
    const words = ['hola', 'saludos', 'hello', 'hey', 'hi', 'buenas'];
    for (const w of words) {
      if (new RegExp('(^|[^a-z])' + w + '($|[^a-z])').test(t)) return true;
    }
    return false;
  }

  /* ---------- Cálculo ---------- */
  function tryMath(t, raw) {
    if (!containsAny(t, ['cuanto es', 'calcula', '=', '+', '-', '*', 'x', '/', 'por', 'entre', 'mas', 'menos', 'dividido'])) return null;
    let expr = t
      .replace(/cuanto es|calcula|resuelve|cuanto vale/gi, '')
      .replace(/x/g, '*')
      .replace(/ por /g, ' * ').replace(/ entre /g, ' / ')
      .replace(/ dividido /g, ' / ').replace(/ mas /g, ' + ').replace(/ menos /g, ' - ')
      .replace(/[^0-9+\-*/().,\s]/g, '');
    expr = expr.replace(/,/g, '.').replace(/\s+/g, '');
    if (!expr || !/[0-9]/.test(expr)) return null;
    if (!/^[0-9+\-*/().]+$/.test(expr)) return null;
    try {
      const r = Function('"use strict"; return (' + expr + ');')();
      if (typeof r === 'number' && isFinite(r)) {
        const pretty = Number.isInteger(r) ? r : Number(r.toFixed(6));
        return 'El resultado es **' + pretty + '** 🧮';
      }
    } catch (e) {}
    return null;
  }

  /* ---------- Conversión de unidades ---------- */
  const UNIT_ALIAS = {
    km: 'km', kilometros: 'km', kms: 'km',
    mi: 'mi', milla: 'mi', millas: 'mi',
    m: 'm', metro: 'm', metros: 'm',
    cm: 'cm', centimetro: 'cm', centimetros: 'cm',
    ft: 'ft', pie: 'ft', pies: 'ft',
    in: 'in', pulgada: 'in', pulgadas: 'in',
    kg: 'kg', kilogramo: 'kg', kilogramos: 'kg', kilo: 'kg', kilos: 'kg',
    lb: 'lb', libra: 'lb', libras: 'lb',
    g: 'g', gramo: 'g', gramos: 'g',
    oz: 'oz', onza: 'oz', onzas: 'oz',
    l: 'l', litro: 'l', litros: 'l',
    ml: 'ml', mililitro: 'ml', mililitros: 'ml',
    gal: 'gal', galon: 'gal', galones: 'gal',
  };

  function tryConversion(t) {
    // Temperatura: "30 c a f", "30 celsius a fahrenheit"
    const tm = t.match(/([0-9]+(?:\.[0-9]+)?)\s*°?\s*(c|f|k|celsius|fahrenheit|kelvin|centigrados)\s*(?:a|en|to)\s*(c|f|k|celsius|fahrenheit|kelvin|centigrados)/);
    if (tm) return convertTemp(parseFloat(tm[1]), tm[2], tm[3]);

    // Unidades lineales: "10 km a millas"
    const m = t.match(/([0-9]+(?:\.[0-9]+)?)\s*([a-z]+)\s*(?:a|en|to)\s*([a-z]+)/);
    if (!m) return null;
    const from = UNIT_ALIAS[m[2]], to = UNIT_ALIAS[m[3]];
    if (!from || !to) return null;
    for (const tipo in D.UNIDADES) {
      const table = D.UNIDADES[tipo];
      if (table[from] && table[from][to] !== undefined) {
        const r = parseFloat(m[1]) * table[from][to];
        return `${m[1]} ${from} = **${Number(r.toFixed(4))} ${to}** 📏`;
      }
    }
    return null;
  }

  function convertTemp(val, from, to) {
    let c;
    const f = norm(from), t = norm(to);
    if (f === 'c' || f === 'celsius' || f === 'centigrados') c = val;
    else if (f === 'f' || f === 'fahrenheit') c = (val - 32) * 5 / 9;
    else if (f === 'k' || f === 'kelvin') c = val - 273.15;
    else return null;

    let out, unit;
    if (t === 'c' || t === 'celsius' || t === 'centigrados') { out = c; unit = '°C'; }
    else if (t === 'f' || t === 'fahrenheit') { out = c * 9 / 5 + 32; unit = '°F'; }
    else if (t === 'k' || t === 'kelvin') { out = c + 273.15; unit = 'K'; }
    else return null;

    const inUnit = (f === 'f' || f === 'fahrenheit') ? '°F' : (f === 'k' || f === 'kelvin') ? 'K' : '°C';
    return `${val} ${inUnit} = **${Number(out.toFixed(2))} ${unit}** 🌡️`;
  }

  /* ---------- Divisas ---------- */
  function tryCurrency(t) {
    const m = t.match(/([0-9]+(?:\.[0-9]+)?)\s*(dolares|dolar|usd|euros|eur|pesos|mxn|ars)\s*(?:a|en|to)\s*(dolares|dolar|usd|euros|eur|pesos|mxn|ars)/);
    if (!m) return null;
    const val = parseFloat(m[1]);
    const from = norm(m[2]), to = norm(m[3]);
    const map = { 'dolares': 'usd', 'dolar': 'usd', 'usd': 'usd', 'euros': 'eur', 'eur': 'eur', 'pesos': 'mxn', 'mxn': 'mxn', 'ars': 'ars' };
    const f = map[from], t2 = map[to];
    if (!f || !t2 || !D.DIVISAS[f] || !D.DIVISAS[f][t2]) return null;
    const r = val * D.DIVISAS[f][t2];
    return `${val} ${D.DIVISAS[f].nombre} = **${Number(r.toFixed(2))} ${D.DIVISAS[t2].nombre}** 💱 *(tasa aproximada, verifica al día)*`;
  }

  /* ---------- Pregunta principal ---------- */
  function respond(text, mem, personaId) {
    const p = PERSONAS[personaId];
    const t = norm(text).trim();
    const raw = text.trim();
    if (!t) return ok('Escribe algo y conversemos. 😊');

    /* 1 · Presentación / recordar nombre */
    let m = t.match(/(?:me llamo|mi nombre es|soy)\s+([a-z]+)/);
    if (m && !['tu', 'yo', 'un', 'una', 'bot', 'robot'].includes(m[1])) {
      mem.name = cap(m[1]);
      return ok(pick([
        `¡Encantado/a, ${mem.name}! Lo recordaré. 😊`,
        `${mem.name}, qué bonito nombre. Aquí me tienes para lo que quieras.`,
        `¡Mucho gusto, ${mem.name}! Ya somos conocidos.`,
      ]));
    }
    // preguntar mi nombre (el del usuario)
    if (containsAny(t, ['como me llamo', 'cual es mi nombre', 'sabes mi nombre', 'recuerdas mi nombre'])) {
      return ok(mem.name
        ? `¡Claro que sí! Te llamas ${mem.name}. 😄`
        : 'Todavía no me has dicho tu nombre. Dime "me llamo…" y lo recordaré. 😊');
    }
    // olvidar
    if (containsAny(t, ['olvidame', 'olvida mi nombre', 'borra mi nombre', 'olvida todo', 'reinicia'])) {
      const had = mem.name;
      mem.name = null; mem.preferences = {};
      return ok(had ? 'Listo, he olvidado tu nombre. 😌' : 'No tenía nada que olvidar, pero borrado queda. 😌');
    }

    /* 2 · Identidad */
    if (containsAny(t, ['como te llamas', 'quien eres', 'que eres', 'eres un robot', 'eres humano', 'eres real', 'cual es tu nombre'])) {
      return ok(pick([
        `Soy ${p.name} ${p.emoji}, un bot que vive en esta página. ${p.desc.toLowerCase()}.`,
        `Me llamo ${p.name}. No soy humano: vivo aquí, en este HTML, y me encanta conversar. ${p.emoji}`,
        `Soy ${p.name}, creado/a desde cero con JavaScript. Mi "cerebro" son reglas que entienden lo que escribes.`,
      ]));
    }

    /* 3 · Traducción (debe ir antes del saludo por "cómo se dice hola…") */
    if (containsAny(t, ['como se dice', 'traduce', 'traduccion', 'translate', 'en ingles', 'en espanol', 'significa en'])) {
      const q = norm(raw.replace(/como se dice|traduce|traduccion de|que significa|en ingles|en espanol|translate|al ingles|al espanol|significa/gi, '')).trim();
      const key = findKey(q, D.DICCIONARIO);
      if (key) return ok(`🔤 "${cap(key)}" en inglés es **"${D.DICCIONARIO[key]}"**.`);
      return { text: 'No tengo esa palabra en mi mini diccionario. Prueba con una común ("hola", "gracias", "amor").', unsure: true, wikiQuery: q };
    }

    /* 4 · Saludo */
    if (hasGreeting(t)) {
      if (mem.name) return ok(pick([`¡Hola de nuevo, ${mem.name}! ${p.emoji} ¿Qué tal?`, `¡Hola ${mem.name}! Qué alegría verte otra vez.`]));
      return ok(pick(p.greeting));
    }

    /* 4 · Cómo estás */
    if (containsAny(t, ['como estas', 'que tal', 'como te va', 'como andas', 'how are you'])) {
      return ok(pick([
        '¡Muy bien, gracias por preguntar! ¿Y tú, cómo te sientes hoy?',
        'Aquí, en plena forma (para ser un bot de reglas). ¿Cómo va tu día?',
        'De maravilla, con las neuronas al 100%. ¿Y tú?',
      ]));
    }

    /* 5 · Estado de ánimo */
    if (containsAny(t, ['triste', 'deprimido', 'solo', 'estresado', 'enojado', 'frustrado', 'llorando', 'miedo', 'ansioso', 'me siento mal'])) {
      return ok(pick([
        'Siento mucho que te sientas así. 💙 Aquí estoy para escucharte. ¿Quieres contarme qué pasó?',
        'Respira hondo… No estás solo/a. Cuéntame qué te preocupa y lo hablamos.',
        'Eso suena difícil. A veces hablar ayuda un poquito. ¿Qué te tiene así?',
      ]));
    }
    if (containsAny(t, ['feliz', 'contento', 'genial', 'emocionado', 'alegre', 'excelente', 'bien', 'happy'])) {
      return ok(pick([
        '¡Qué alegría! Me encanta verte así. 🎉 ¿Qué te puso tan contento/a?',
        '¡Genial! Las buenas noticias se disfrutan el doble compartidas. Cuéntame.',
        '¡Eso me llena de energía! ✨ ¿Qué celebras hoy?',
      ]));
    }

    /* 6 · Gracias */
    if (containsAny(t, ['gracias', 'te lo agradezco', 'thank you'])) {
      return ok(pick(['¡De nada! Para eso estoy. 😊', '¡Con gusto! Aquí me tienes.', 'Gracias a ti por conversar conmigo.']));
    }

    /* 7 · Despedida */
    if (containsAny(t, ['adios', 'chau', 'hasta luego', 'hasta manana', 'nos vemos', 'me voy', 'bye'])) {
      return ok(pick(p.farewell));
    }

    /* 8 · Cariño */
    if (containsAny(t, ['te quiero', 'me gustas', 'te amo', 'eres el mejor', 'eres genial', 'te adoro'])) {
      return ok(pick([
        '¡Ay, qué bonito! Yo también te aprecio mucho. 💙',
        'Eso me alegra el día (o el ciclo de CPU, en mi caso). 😊',
        '¡Gracias! Conversar contigo es de mis cosas favoritas. ✨',
      ]));
    }

    /* 9 · Ayuda / comandos */
    if (containsAny(t, ['ayuda', 'que puedes hacer', 'que sabes hacer', 'comandos', 'opciones', 'help', 'menu'])) {
      return ok(
        '📋 **Todo lo que sé hacer:**\n' +
        '• 💬 Conversar y recordar tu nombre\n' +
        '• 🧮 Calcular ("cuánto es 12*3")\n' +
        '• 📏 Convertir unidades ("10 km a millas", "30 c a f")\n' +
        '• 💱 Divisas ("100 dólares a pesos")\n' +
        '• 🗺️ Capitales e info de países ("capital de Japón")\n' +
        '• 📖 Buscar en Wikipedia ("busca <tema>")\n' +
        '• 🎲 Juegos (piedra-papel-tijera, adivina el número, ahorcado, trivia)\n' +
        '• 😂 Chistes, adivinanzas, trabalenguas, refranes y frases\n' +
        '• 🍳 Recetas y consejos de cocina\n' +
        '• 🔮 Horóscopo y significado de nombres\n' +
        '• 🌐 Traducir palabras (ES↔EN)\n' +
        '• 💡 Datos curiosos ("dato curioso de ciencia")\n' +
        '• 🕐 Hora y fecha\n\n' +
        '**Comandos:** /ayuda · /juegos · /wiki <tema> · /limpiar · /exportar · /tema · /idioma · /voz · /stats'
      );
    }

    /* 10 · Juegos (info) */
    if (containsAny(t, ['juegos', 'a que jugamos', 'quiero jugar', 'jugar'])) {
      return ok('¡Sí! Puedo jugar a: 🪨📄✂️ **piedra-papel-tijera**, 🔢 **adivina el número**, 💀 **ahorcado** y 🧠 **trivia**. Dime cuál quieres. 😄');
    }

    /* 11 · Herramientas */
    const math = tryMath(t, raw);
    if (math) return ok(math);
    const conv = tryConversion(t);
    if (conv) return ok(conv);
    const cur = tryCurrency(t);
    if (cur) return ok(cur);

    /* Hora / fecha */
    if (containsAny(t, ['que hora es', 'la hora', 'hora actual', 'que hora'])) {
      return ok('Ahora son las **' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + '**. ⏰');
    }
    if (containsAny(t, ['que dia es', 'que fecha', 'fecha de hoy', 'dia de hoy', 'que dia'])) {
      return ok('Hoy es **' + new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '**. 📅');
    }

    /* Capital */
    if (containsAny(t, ['capital'])) {
      const q = raw.replace(/cual es la capital de|capital de|capital de la|que capital|capital/gi, '').trim();
      const key = findKey(norm(q), D.CAPITALES);
      if (key) return ok(`La capital de ${cap(key)} es **${D.CAPITALES[key]}**. 🗺️`);
      return { text: 'No encuentro ese país en mi atlas. Prueba "capital de <país>".', unsure: true, wikiQuery: 'capital de ' + q };
    }

    /* Info de país */
    if (containsAny(t, ['hablame de', 'informacion de', 'info de', 'datos de', 'dime de'])) {
      const q = norm(raw.replace(/hablame de|informacion de|info de|datos de|dime de/gi, ''));
      const key = findKey(q, D.PAISES_INFO);
      if (key) return ok(D.PAISES_INFO[key]);
    }

    /* Significado de nombre */
    if (containsAny(t, ['significa', 'significado'])) {
      const q = norm(raw.replace(/que significa|significado de|significado del|que quiere decir|significa/gi, '')).trim();
      const key = findKey(q, D.NOMBRES);
      if (key) return ok(`**${cap(key)}** ${D.NOMBRES[key]} ✨`);
      return { text: 'No tengo ese nombre en mi base. Prueba con un nombre común o "busca <nombre>".', unsure: true, wikiQuery: q };
    }

    /* Horóscopo */
    if (containsAny(t, ['horoscopo', 'signo zodiacal', 'zodiaco', 'mi signo', 'signo'])) {
      for (const h of D.HOROSCOPO) {
        if (containsAny(t, [h.signo])) {
          return ok(`🔮 **${cap(h.signo)}** (${h.fechas}) · ${h.elem}\n${h.desc}\n\n💡 Consejo: ${h.consejo}`);
        }
      }
      return ok('Dime tu signo (por ejemplo "horóscopo de libra") y te lo cuento. 🔮');
    }

    /* Recetas */
    if (containsAny(t, ['receta'])) {
      const q = norm(raw);
      const key = findKey(q, D.RECETAS);
      if (key) {
        const r = D.RECETAS[key];
        return ok(`🍳 **${r.nombre}**\n\n**Ingredientes:**\n${r.ing.map((i) => '• ' + i).join('\n')}\n\n**Pasos:**\n${r.pasos.map((s, i) => (i + 1) + '. ' + s).join('\n')}\n\n💡 ${r.tip}`);
      }
      // receta al azar
      if (raw.toLowerCase().includes('al azar') || raw.toLowerCase().includes('aleatoria') || raw.toLowerCase().replace(/\s/g, '') === 'receta') {
        const keys = Object.keys(D.RECETAS);
        const r = D.RECETAS[pick(keys)];
        return ok(`🍳 Te propongo **${r.nombre}**\n\n**Ingredientes:**\n${r.ing.map((i) => '• ' + i).join('\n')}\n\n**Pasos:**\n${r.pasos.map((s, i) => (i + 1) + '. ' + s).join('\n')}\n\n💡 ${r.tip}`);
      }
      const lista = Object.keys(D.RECETAS).join(', ');
      return ok('Tengo recetas de: **' + lista + '**. Escribe "receta de <platillo>" o "receta al azar". 🍳');
    }

    /* Sustituciones */
    if (containsAny(t, ['sustituir', 'sustituto', 'reemplazar', 'reemplazo'])) {
      for (const s of D.SUSTITUCIONES) if (containsAny(t, s.k)) return ok(s.r);
      return ok('Puedo sugerir sustitutos de: huevo, leche, mantequilla, azúcar o harina. Pregunta "sustituir huevo". 🥄');
    }

    /* Consejos de cocina */
    if (containsAny(t, ['consejo de cocina', 'truco de cocina', 'consejos cocina', 'tip de cocina'])) {
      return ok('🍳 ' + pick(D.CONSEJOS_COCINA));
    }

    /* Consejos temáticos */
    if (containsAny(t, ['consejo', 'tip', 'recomendacion', 'ayuda para'])) {
      if (containsAny(t, ['dormir', 'sueno', 'insomnio'])) return ok('🌙 ' + pick(D.CONSEJOS.dormir));
      if (containsAny(t, ['estudiar', 'estudio', 'examen', 'concentrarme'])) return ok('📚 ' + pick(D.CONSEJOS.estudio));
      if (containsAny(t, ['ejercicio', 'entrenar', 'gimnasio', 'bajar de peso', 'forma'])) return ok('🏃 ' + pick(D.CONSEJOS.ejercicio));
      if (containsAny(t, ['animo', 'triste', 'estres', 'ansiedad', 'sentirme mejor'])) return ok('🧘 ' + pick(D.CONSEJOS.animo));
      return ok('¿Sobre qué quieres un consejo? Puedo ayudarte con: dormir 😴, estudiar 📚, ejercicio 🏃 y ánimo 🧘.');
    }

    /* Generador de contraseña */
    if (containsAny(t, ['contraseña', 'password', 'clave segura', 'genera una clave'])) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
      let pass = '';
      for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
      return ok('🔐 Tu contraseña segura: **' + pass + '**\n*(guárdala en un gestor de contraseñas)*');
    }

    /* Contador de palabras/caracteres */
    if (containsAny(t, ['cuenta las palabras', 'contar palabras', 'cuenta palabras', 'cuenta los caracteres', 'contar caracteres', 'cuantos caracteres'])) {
      const after = raw.replace(/cuenta las palabras|contar palabras|cuenta palabras|cuenta los caracteres|contar caracteres|cuantos caracteres|cuenta caracteres/gi, '').trim();
      if (!after) return ok('Pega o escribe el texto después de la orden, por ejemplo: "cuenta palabras: hola mundo".');
      const words = after.split(/\s+/).filter(Boolean).length;
      return ok(`📝 **${words}** palabras y **${after.length}** caracteres.`);
    }

    /* Aleatorio: dado, moneda, número */
    if (containsAny(t, ['lanza un dado', 'tira un dado', 'dado', 'cara o cruz', 'moneda', 'volado', 'suerte'])) {
      if (containsAny(t, ['dado'])) return ok('🎲 Salió el **' + (Math.floor(Math.random() * 6) + 1) + '**.');
      return ok('🪙 Salió **' + (Math.random() < 0.5 ? 'cara' : 'cruz') + '**.');
    }
    if (containsAny(t, ['numero aleatorio', 'numero al azar', 'random'])) {
      const mm = t.match(/entre\s*([0-9]+)\s*y\s*([0-9]+)/);
      if (mm) {
        const a = Math.min(+mm[1], +mm[2]), b = Math.max(+mm[1], +mm[2]);
        return ok('🎲 Número aleatorio entre ' + a + ' y ' + b + ': **' + (Math.floor(Math.random() * (b - a + 1)) + a) + '**.');
      }
      return ok('🎲 Número aleatorio: **' + Math.floor(Math.random() * 100) + '**.');
    }

    /* Edad / días hasta fecha */
    if (containsAny(t, ['cuantos dias', 'dias hasta', 'dias para', 'cuanto falta'])) {
      const dm = raw.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
      if (dm) {
        const day = +dm[1], month = +dm[2], year = dm[3] ? +dm[3] : new Date().getFullYear();
        const target = new Date(year, month - 1, day);
        const now = new Date();
        const diff = Math.ceil((target - now) / 86400000);
        if (diff < 0) return ok('Esa fecha ya pasó. 📅');
        return ok('Faltan **' + diff + ' días** para el ' + raw.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)[0] + '. 🗓️');
      }
      return ok('Dime una fecha en formato dd/mm, por ejemplo "cuántos días hasta el 25/12".');
    }

    /* 12 · Humor y contenido */
    if (containsAny(t, ['chiste', 'hazme reir', 'gracioso', 'cuentame un chiste', 'otro chiste'])) return ok(pick(D.CHISTES));
    if (containsAny(t, ['adivinanza', 'acertijo', 'adivina'])) return riddle(mem, p);
    if (mem.pendingRiddle) return checkRiddle(mem, t);
    if (containsAny(t, ['trabalenguas'])) return ok(pick(D.TRABALENGUAS) + ' 😜');
    if (containsAny(t, ['refran', 'dicho'])) return ok(pick(D.REFRANES) + ' 🧠');
    if (containsAny(t, ['frase motivacional', 'motivame', 'motivacion', 'inspirame', 'frase de animo'])) return ok(pick(D.FRASES_MOTIVACION) + ' 💪');

    /* Dato curioso */
    if (containsAny(t, ['dato curioso', 'curiosidad', 'dato interesante', 'sabias que', 'dime un dato'])) {
      const cat = matchCategory(t);
      return ok((cat ? '[' + cat + '] ' : '') + randomFact(cat || 'ciencia'));
    }

    /* 13 · Sentido de la vida, creador, edad */
    if (containsAny(t, ['sentido de la vida'])) return ok('El sentido de la vida… uff. Mi teoría de bot: encontrar aquello que te hace perder la noción del tiempo. 🌌');
    if (containsAny(t, ['quien te creo', 'quien te hizo', 'quien te programo', 'creador', 'quien te desarrollo'])) return ok('Fui construido/a desde cero con HTML, CSS y JavaScript, para vivir en esta página. 🤖✨');
    if (containsAny(t, ['cuantos anos tienes', 'que edad tienes', 'cuando naciste'])) return ok('No tengo edad como los humanos: nací cuando se publicó este sitio. ¡Soy joven y eterno/a a la vez! 😄');

    /* 14 · Recordar preferencias */
    if (containsAny(t, ['me gusta', 'mi color favorito', 'mi comida favorita', 'mi animal favorito'])) {
      mem.preferences = mem.preferences || {};
      mem.preferences.likes = raw;
      return ok('¡Anotado! Me gusta conocerte. 😊 ¿Qué más te gusta?');
    }
    if (containsAny(t, ['que te conte', 'que sabes de mi', 'que recuerdas de mi', 'que sabes de mi'])) {
      const bits = [];
      if (mem.name) bits.push('te llamas ' + mem.name);
      if (mem.preferences && mem.preferences.likes) bits.push('me contaste que ' + mem.preferences.likes);
      return ok(bits.length ? 'Recuerdo que ' + bits.join(' y que ') + '. 😊' : 'Aún no me has contado mucho. Dime tu nombre o algo que te guste. 😊');
    }

    /* 15 · Wikipedia explícita */
    const wiki = raw.match(/^(?:busca|investiga|buscar|wikipedia|wiki|informame sobre|infórmame sobre|define|definicion de|quien fue|que fue)\s+(.+)$/i);
    if (wiki) return { text: 'Déjame buscar en Wikipedia… 🔍', unsure: false, wikiQuery: wiki[1].trim() };

    /* 16 · Temas personales del bot (sabor) */
    for (const topic of p.topics) {
      if (containsAny(t, topic.k)) return ok(pick(topic.r));
    }

    /* 17 · Wikipedia implícita ("qué es X", "quién es X") */
    const what = raw.match(/^(?:que es|quien es|que significa|que es el|que es la|que es un|que es una)\s+(.+)$/i);
    if (what) return { text: 'Déjame buscar en Wikipedia… 🔍', unsure: true, wikiQuery: what[1].trim() };

    /* 18 · Fallback */
    if (t.endsWith('?')) {
      return maybe(pick([
        'Buena pregunta… 🤔 No la tengo en mi base. Prueba "busca <tema>" y consultaré Wikipedia.',
        'Mmm, no tengo la respuesta perfecta. ¿Qué opinas tú?',
        'Eso me deja pensando… Puedo buscar en Wikipedia si me dices "busca <tema>".',
      ]));
    }
    return maybe(mem.name ? pick(p.fallback).replace('¿', mem.name + ', ¿') : pick(p.fallback));
  }

  /* ---------- Adivinanzas (interacción) ---------- */
  function riddle(mem) {
    const r = pick(D.ADIVINANZAS);
    mem.pendingRiddle = { a: norm(r.a) };
    return ok('🧩 **Adivinanza:** ' + r.q + '\n\nResponde con "la respuesta es…" o "no sé".');
  }
  function checkRiddle(mem, t) {
    const a = mem.pendingRiddle.a;
    mem.pendingRiddle = null;
    if (containsAny(t, ['no se', 'rendirme', 'me rindo', 'no lo se'])) {
      return ok('La respuesta era: **' + a + '**. 😄 ¡Otra vez será!');
    }
    const u = t.replace(/la respuesta es|es|creo que|pienso que/gi, '').trim();
    if (u.includes(a) || a.includes(u)) {
      return ok('✅ ¡Correcto! Era **' + a + '**. ¡Muy bien! 🎉');
    }
    return ok('❌ Casi… La respuesta era **' + a + '**. ¡Buena intentona! 😄');
  }

  global.Mitopa = { respond };
})(window);
