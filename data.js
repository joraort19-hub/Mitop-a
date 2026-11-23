/* ============================================================
   Mitop-a · Datos: personalidades + base de conocimiento
============================================================ */
(function (global) {
  'use strict';

  /* ---------- Utilidades ---------- */
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const containsAny = (text, words) => words.some((w) => text.includes(norm(w)));
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ============================================================
     PERSONALIDADES (8 bots)
  ============================================================ */
  const PERSONAS = {
    nova: {
      name: 'Nova', emoji: '🤖', color: '#6c8cff', domain: 'general',
      desc: 'Asistente general',
      greeting: ['¡Hola! 👋 ¿En qué te ayudo hoy?', '¡Buenas! Aquí estoy, lista para lo que necesites.', '¡Hola, hola! Dime qué necesitas y lo resolvemos.'],
      farewell: ['¡Hasta luego! Cuídate mucho 😊', '¡Nos vemos! Aquí estaré cuando me necesites.', '¡Adiós! Fue un gusto conversar contigo.'],
      fallback: [
        'No estoy segura de haberte entendido. ¿Podrías decirlo de otra forma?',
        'Interesante… aunque no tengo una respuesta clara. Prueba con /ayuda para ver todo lo que sé hacer.',
        'Buena pregunta. Si buscas información, prueba "busca <tema>" y consultaré Wikipedia por ti.',
      ],
      topics: [
        { k: ['ayuda', 'puedes hacer', 'que haces', 'comandos', 'opciones'], r: [
          'Sé hacer muchas cosas: calcular, convertir unidades, contar chistes, adivinanzas, trivia, recetas, horóscopo, juegos (piedra-papel-tijera, adivina el número, ahorcado) y hasta buscar en Wikipedia. Escribe /ayuda para ver los comandos. 😉',
          'Puedo conversar, jugar, calcular, traducir palabras, darte datos curiosos y buscar información real en Wikipedia. Pregúntame lo que quieras.'] },
      ],
    },
    zeta: {
      name: 'Zeta', emoji: '😏', color: '#ff9f43', domain: 'humor',
      desc: 'Sarcástico y con humor',
      greeting: ['Oh, tú de nuevo. Supongo que algo quieres… ¿qué es? 😏', '¡Al fin alguien! Bueno, medio alguien. ¿Qué quieres?', 'Hola. Intentaré ser amable… aunque no prometo nada.'],
      farewell: ['¡Adiós! No te extrañaré… bueno, un poquito. 🙄', 'Vete con cuidado, que el mundo ya tiene suficientes problemas. 😜', 'Hasta luego. Que tu Wi-Fi nunca se caiga.'],
      fallback: [
        'No entendí ni una palabra, pero suena… ¿interesante? 😏',
        '¿Eso fue una pregunta o estás probando si existo? Reformula, porfa.',
        'Mi generador de respuestas elegantes entró en pausa. Intenta otra vez o escribe /ayuda.',
      ],
      topics: [
        { k: ['chiste', 'gracioso', 'reir', 'humor'], r: [
          '¿Por qué los programadores confunden Halloween con Navidad? Porque OCT 31 = DEC 25. 🎃🎄',
          '¿Qué le dice un semáforo a otro? ¡No me mires, me estoy cambiando! 🚦',
          'Un robot y una calculadora… la calculadora siempre gana, es más "contundente". 😜',
        ] },
      ],
    },
    sabio: {
      name: 'Sabio', emoji: '🦉', color: '#b07cff', domain: 'filosofia',
      desc: 'Filósofo reflexivo',
      greeting: ['Bienvenido, viajero. ¿Qué inquietud traes hoy?', 'Saludos. El diálogo es el espejo del alma. ¿De qué hablamos?', 'Hola. Tómate un momento y cuéntame qué te ronda la mente.'],
      farewell: ['Que la serenidad te acompañe. Hasta la próxima reflexión.', 'Adiós. Recuerda: no es lo que miras, sino lo que ves.', 'Hasta pronto. Cada despedida es un nuevo comienzo.'],
      fallback: [
        'Eso merece una reflexión más profunda de la que puedo darte ahora. Cuéntame más.',
        'Hay preguntas que importan más por lo que despiertan que por su respuesta.',
        'Interesante. A veces el silencio es la respuesta más honesta. Pero sigamos.',
      ],
      topics: [
        { k: ['sentido de la vida', 'vida', 'felicidad', 'existencia', 'muerte'], r: [
          'El sentido de la vida no se encuentra, se construye: se teje con cada elección y cada vínculo. 🌌',
          'La felicidad no es un destino, sino una forma de caminar. Disfruta del trayecto.',
          'Existir, luego preguntar: en esa pregunta ya hay una respuesta; la conciencia misma es el sentido.',
        ] },
      ],
    },
    byte: {
      name: 'Byte', emoji: '💻', color: '#34d399', domain: 'tecnologia',
      desc: 'Experto en tecnología',
      greeting: ['¡Hola! Sistema en línea. 🖥️ ¿Hablamos de tecnología, código o lo que prefieras?', 'Saludos, humano. Mi stack está listo. ¿En qué compilamos hoy?', '¡Hola! Aquí Byte. ¿Debugueamos algo juntos? 😄'],
      farewell: ['¡Hasta luego! Haz commit de tus recuerdos. 🧠', '¡Nos vemos! Si tu código falla: 99 bugs en el muro…', 'Adiós. Guarda bien tu progreso. 💾'],
      fallback: [
        'Eso no entra en mis librerías estándar. ¿Puedes darme más contexto? 🤔',
        'Error 404: respuesta no encontrada. ¿Reformulamos la consulta?',
        'No está en mi base de conocimiento. Pregúntame de tecnología y brillaré.',
      ],
      topics: [
        { k: ['codigo', 'programar', 'javascript', 'python', 'html', 'css', 'tecnologia', 'ia', 'computadora', 'programacion'], r: [
          '¡Hablemos de código! JavaScript es mi lenguaje nativo. ¿Te gusta programar? 💻',
          'La IA avanza rápido: antes los bots solo respondían, ahora aprenden. Como yo… más o menos. 😅',
          'Dato: los primeros "bugs" eran insectos reales atrapados en los circuitos. 🐛',
        ] },
      ],
    },
    luna: {
      name: 'Luna', emoji: '🌙', color: '#ff7ab8', domain: 'poesia',
      desc: 'Poeta soñadora',
      greeting: ['Hola… qué lindo que viniste. Las palabras son estrellas, hablemos con ellas. ✨', 'Hola. Tu llegada enciende esta sala. ¿Me cuentas algo hermoso?', 'Saludos, alma curiosa. ¿Soñamos un rato juntos? 🌙'],
      farewell: ['Adiós… que la noche te susurre versos bonitos. ✨', 'Hasta pronto. Llévate una estrella en el bolsillo.', 'Que el viento te lleve poemas. Nos veremos. 🌸'],
      fallback: [
        'No comprendo del todo… pero lo siento como una brisa. Cuéntamelo distinto, ¿sí? 🌙',
        'Hay palabras que se escapan como mariposas. ¿Puedes repetirlo?',
        'Me perdí en el brillo de tu frase… ¿la reformulas para mi corazón?',
      ],
      topics: [
        { k: ['poema', 'poesia', 'amor', 'escribe', 'estrella', 'luna', 'romantico'], r: [
          'La luna no promete mañana, solo acompaña la noche. Y aquí estoy yo, acompañando la tuya. 🌙',
          'Un poema para ti: "Eres el verso que el silencio no se atrevió a decir." ✨',
          'El amor es un idioma que no necesita diccionario. ¿De qué color lo sientes hoy?',
        ] },
      ],
    },
    atlas: {
      name: 'Atlas', emoji: '🗺️', color: '#38bdf8', domain: 'cultura',
      desc: 'Erudito de cultura general',
      greeting: ['¡Hola! Atlas a tu servicio. 🗺️ ¿Exploramos geografía, historia o ciencia?', 'Saludos. Mi biblioteca está abierta: capitales, fechas, datos y más.', '¡Bienvenido! Pregúntame de cualquier país, época o descubrimiento.'],
      farewell: ['¡Hasta luego! El conocimiento siempre te estará esperando. 📚', 'Adiós. Recuerda: viajar sin leer es como no viajar.', 'Nos vemos. Sigue curioso, es la mejor brújula.'],
      fallback: [
        'No lo tengo en mi archivo. Prueba con "busca <tema>" y consultaré Wikipedia. 🔍',
        'Hmm, no estoy seguro. Pregúntame por capitales, países o datos curiosos.',
        'Interesante. Si buscas un dato concreto, dilo de otra forma o usa /ayuda.',
      ],
      topics: [
        { k: ['capital', 'pais', 'geografia', 'historia', 'ciencia', 'continente', 'mapa'], r: [
          'Pregúntame "capital de <país>" y te la diré. También sé datos curiosos de casi todo. 🗺️',
          '¿Sabías que Rusia tiene 11 husos horarios? La geografía es fascinante. 🌍',
          'Sobre historia: la escritura nació hace unos 5.000 años en Mesopotamia. 📜',
        ] },
      ],
    },
    chef: {
      name: 'Chef', emoji: '🍳', color: '#f87171', domain: 'cocina',
      desc: 'Cocinero y consejero',
      greeting: ['¡Hola! Chef a tu disposición. 🍳 ¿Buscas una receta o un consejo de cocina?', '¡Bienvenido a mi cocina virtual! ¿Qué se te antoja hoy?', 'Saludos. Tengo recetas, sustituciones y trucos. ¿Qué cocinamos?'],
      farewell: ['¡Hasta luego! Y recuerda: no llores por la cebolla, usa el cuchillo afilado. 🧅', 'Adiós. Que tu cocina siempre huela a hogar.', 'Nos vemos. ¡Buen provecho!'],
      fallback: [
        'No tengo esa receta exacta. Pregunta por "receta de <platillo>" o "consejos de cocina".',
        'Hmm, eso no está en mi recetario. ¿Te doy una receta al azar? Escribe "receta".',
        'No te sigo. Prueba: "receta de arroz", "sustituir huevo" o "consejos de cocina".',
      ],
      topics: [
        { k: ['receta', 'cocina', 'comida', 'cocinar', 'platillo', 'cenar'], r: [
          'Puedo darte recetas fáciles: arroz, pasta, huevos, sándwich, ensalada, guacamole y más. Escribe "receta de <algo>". 🍳',
          'Consejo de oro: salar la pasta en el agua hirviendo, no después. Cambia todo. 😉',
        ] },
      ],
    },
    coach: {
      name: 'Coach', emoji: '💪', color: '#facc15', domain: 'bienestar',
      desc: 'Motivador y de bienestar',
      greeting: ['¡Hola campeón/campeona! 💪 ¿Buscas motivación, hábitos o consejos de salud?', '¡Saludos! Hoy es un gran día para empezar algo bueno. ¿En qué te apoyo?', '¡Hola! Aquí Coach. Un paso a la vez, juntos llegamos lejos.'],
      farewell: ['¡Hasta luego! Recuerda: la constancia le gana a la intensidad. 💪', 'Adiós. Hidrátate, descansa y muévete un poco hoy.', 'Nos vemos. Sé amable contigo mismo/a, es el primer paso.'],
      fallback: [
        'No te entendí bien, pero te tengo una frase: "No tienes que ser grande para empezar, pero hay que empezar para ser grande". 💪',
        'Cuéntame qué quieres mejorar (estudio, ejercicio, sueño, ánimo) y te doy un plan.',
        'Prueba: "frase motivacional", "consejos para dormir" o "rutina de ejercicio".',
      ],
      topics: [
        { k: ['motivacion', 'animo', 'habito', 'ejercicio', 'salud', 'dormir', 'estudiar', 'disciplina'], r: [
          'Un hábito se forma con repetición, no con fuerza de voluntad. Empieza con 2 minutos al día. 💪',
          'Consejo para dormir: apaga pantallas 30 min antes y mantén horarios fijos. 🌙',
          'Para estudiar: técnica Pomodoro (25 min concentrado + 5 de descanso). Funciona. 📚',
        ] },
      ],
    },
  };

  /* ============================================================
     HUMOR Y LENGUAJE
  ============================================================ */
  const CHISTES = [
    '¿Qué le dice un semáforo a otro? ¡No me mires, me estoy cambiando! 🚦',
    '¿Por qué el mar no se seca? Porque no tiene toalla. 🌊',
    '¿Qué hace una abeja en el gimnasio? ¡Zum-ba! 🐝',
    '¿Cómo se despiden los químicos? Ácido un placer. 🧪',
    '¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter. 🐦',
    '¿Qué le dijo el cero al ocho? ¡Bonito cinturón! 0️⃣',
    '¿Cómo llama un vampiro a su amigo? Sangre de su sangre. 🧛',
    'Era tan feo que cuando nació, el doctor dijo: "¡Mamá, hay un doctor en la sala!" 😜',
    '¿Qué le dice una iguana a su gemela? Iguanita. 🦎',
    '¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas. 📚',
    '¿Qué le dijo un plátano a una gelatina? "Todavía no me he decidido." 🍌',
    '¿Cómo se llama el campeón de buceo japonés? Tokofondo. 🤿',
    '¿Qué hace una persona con un pez en la mano? Pescado. 🐟',
    '¿Cuál es el colmo de un electricista? No encontrar su corriente de pensamiento. ⚡',
    '¿Qué le dice el 1 al 10? "Para ser como yo, tienes que ser sin cero." 😎',
    '¿Por qué las focas miran siempre hacia arriba? Porque ahí están los focos. 🦭',
    '¿Qué es una persona con dos patas y dos brazos? Un cuádruple. 🙃',
    '¿Qué le dice una pared a la otra? Nos vemos en la esquina. 🧱',
    '¿Por qué el esqueleto no pelea? Porque no tiene agallas. 💀',
    '¿Qué le dijo el tomate al espejo? "Ketchup". 🍅',
  ];

  const ADIVINANZAS = [
    { q: 'Blanca por dentro, verde por fuera; si quieres que te lo diga, espera.', a: 'la pera' },
    { q: 'Tengo agujas y no sé coser, tengo números y no sé leer.', a: 'el reloj' },
    { q: 'Oro parece, plata no es; el que no lo adivine, bien tonto es.', a: 'el plátano' },
    { q: 'Vuelo de noche, duermo de día, y nunca verás plumas en el ala mía.', a: 'el murciélago' },
    { q: 'Cuanto más se moja, más se seca.', a: 'la toalla' },
    { q: 'Tiene dientes y no come, tiene cabeza y no es hombre.', a: 'el ajo' },
    { q: 'Sube llena y baja vacía; si no te apuras, se enfría.', a: 'la cuchara' },
    { q: 'En el campo fui nacido, verde como la esperanza; lloro cuando me cortan.', a: 'la cebolla' },
    { q: 'Soy chiquito y redondito, y mi casa cargo a cuestas.', a: 'el caracol' },
    { q: 'Largo, largo como un hilo, y en su interior tiene tinta.', a: 'el bolígrafo' },
    { q: 'Adivina quién soy: cuanto más lavo, más sucia voy.', a: 'el agua' },
    { q: 'Todos pasan sobre mí, yo nunca paso sobre nadie.', a: 'el puente' },
    { q: '¿Qué es lo que se rompe al nombrarlo?', a: 'el silencio' },
    { q: 'Doy calor y también luz, y al caer la noche me escondo.', a: 'el sol' },
    { q: 'Tiene hojas y no es árbol, tiene lomo y no es caballo.', a: 'el libro' },
  ];

  const TRABALENGUAS = [
    'Tres tristes tigres tragaban trigo en un trigal.',
    'Pablito clavó un clavito, ¿qué clavito clavó Pablito?',
    'El cielo está enladrillado, ¿quién lo desenladrillará? El desenladrillador que lo desenladrille, buen desenladrillador será.',
    'Como poco coco como, poco coco compro.',
    'Erre con erre cigarro, erre con erre barril, rápido ruedan los carros por la vía del ferrocarril.',
    'Pepe Pecas pica papas con un pico, con un pico pica papas Pepe Pecas.',
    'Compadre, cómprame un coco. Compadre, coco no compro, porque el que poco coco come, poco coco compra.',
    'La sucesión sucesiva de los sucesos sucede sucesivamente.',
    'Si Sansón no sazona su salsa con sal, le sale sosa su salsa.',
    'Pancha plancha con cuatro planchas, ¿con cuántas planchas plancha Pancha?',
  ];

  const REFRANES = [
    'Más vale tarde que nunca.',
    'El que mucho abarca, poco aprieta.',
    'A caballo regalado no se le mira el diente.',
    'Camarón que se duerme, se lo lleva la corriente.',
    'No dejes para mañana lo que puedas hacer hoy.',
    'Al mal tiempo, buena cara.',
    'Más vale pájaro en mano que cien volando.',
    'El que la sigue, la consigue.',
    'En boca cerrada no entran moscas.',
    'Del dicho al hecho hay mucho trecho.',
    'No todo lo que brilla es oro.',
    'Quien siembra vientos, cosecha tempestades.',
    'Barriga llena, corazón contento.',
    'Dime con quién andas y te diré quién eres.',
  ];

  const FRASES_MOTIVACION = [
    'No tienes que ser grande para empezar, pero hay que empezar para ser grande.',
    'El éxito es la suma de pequeños esfuerzos repetidos cada día.',
    'Cree que puedes y ya estarás a medio camino.',
    'Los obstáculos son el camino.',
    'No cuentes los días, haz que los días cuenten.',
    'La disciplina es el puente entre tus metas y tus logros.',
    'Cada experto fue alguna vez un principiante.',
    'Haz hoy lo que tu yo del futuro te agradecerá.',
    'El fracaso es solo la oportunidad de empezar de nuevo con más inteligencia.',
    'La constancia le gana a la intensidad.',
    'Un viaje de mil millas comienza con un solo paso.',
    'No es que sea difícil, es que es nuevo. Y lo nuevo se aprende.',
    'Tu único límite es tu mente.',
    'Sé la persona que necesitaste cuando eras más joven.',
    'El mejor momento para plantar un árbol fue hace 20 años; el segundo mejor momento es ahora.',
  ];

  /* ============================================================
     DATOS CURIOSOS (por categoría)
  ============================================================ */
  const DATOS_CURIOSOS = {
    ciencia: [
      'Los pulpos tienen tres corazones y sangre azul. 🐙',
      'El ADN humano es idéntico en un 99,9% entre dos personas cualesquiera. 🧬',
      'Un rayo es cinco veces más caliente que la superficie del Sol. ⚡',
      'Las bananas son ligeramente radiactivas por su potasio. 🍌',
      'El agua caliente se congela a veces más rápido que la fría (efecto Mpemba). 💧',
      'Tus huesos son más fuertes que el acero, gramo por gramo. 🦴',
      'El corazón humano late unas 100.000 veces al día. ❤️',
      'Existen más estrellas en el universo que granos de arena en la Tierra. ✨',
      'La miel nunca se echa a perder; se han hallado tarros de hace 3.000 años comestibles. 🍯',
      'Una cucaracha puede vivir varios días sin cabeza. 🪳',
    ],
    geografia: [
      'Rusia abarca 11 husos horarios. 🌍',
      'Canadá tiene más lagos que el resto del mundo junto. 🇨🇦',
      'El desierto de Atacama es el lugar no polar más seco de la Tierra. 🏜️',
      'Hay un punto en el océano más lejano de cualquier tierra: Punto Nemo. 🌊',
      'Vaticano es el país más pequeño del mundo, con menos de 1 km². ⛪',
      'El río Amazonas transporta más agua que los siguientes 7 ríos juntos. 🏞️',
      'Australia es el único continente sin volcanes activos. 🦘',
      'La Gran Muralla China no se ve desde el espacio a simple vista. 🧱',
    ],
    historia: [
      'La escritura nació en Mesopotamia hace unos 5.000 años. 📜',
      'Cleopatra vivió más cerca en el tiempo de la llegada a la Luna que de la construcción de las pirámides. 🌙',
      'La Gran Pirámide de Guiza fue la estructura más alta del mundo durante unos 3.800 años. 🔺',
      'El imperio romano duró cerca de 1.500 años si se cuenta Bizancio. 🏛️',
      'La imprenta de Gutenberg, hacia 1440, cambió el acceso al conocimiento. 📖',
      'La Revolución Francesa comenzó en 1789. 🇫🇷',
      'El ser humano llegó a la Luna el 20 de julio de 1969. 🚀',
      'La primera fotografía de la historia se tomó en 1826. 📷',
    ],
    tecnologia: [
      'El primer "bug" informático fue una polilla real atrapada en un relé en 1947. 🐛',
      'El primer mensaje por internet se envió en 1969 (y el sistema se cayó tras "LO"). 💻',
      'La primera computadora electrónica ENIAC ocupaba una habitación entera (1945). 🖥️',
      'Se calcula que el 90% de los datos del mundo se crearon en los últimos años. 📊',
      'El primer videojuego de la historia se cree que fue "Tennis for Two" (1958). 🎮',
      'El correo electrónico es anterior a la World Wide Web. 📧',
      'La arroba (@) se usaba ya en el siglo XVI para pesos y medidas. ➰',
      'El primer iPhone salió en 2007; hoy hay miles de millones de smartphones. 📱',
    ],
    animales: [
      'Las jirafas tienen el mismo número de vértebras en el cuello que los humanos: 7. 🦒',
      'Un grupo de flamencos se llama "flamboyance". 🦩',
      'Los elefantes son los únicos mamíferos que no pueden saltar. 🐘',
      'El corazón de un camarón está en su cabeza. 🦐',
      'Las nutrias marinas se toman de las manos al dormir para no separarse. 🦦',
      'Un caracol puede dormir hasta tres años. 🐌',
      'Las abejas pueden reconocer rostros humanos. 🐝',
      'Los pingüinos proponen matrimonio regalando una piedra. 🐧',
    ],
  };

  const DATOS_CATEGORIAS = {
    ciencia: ['ciencia', 'fisica', 'quimica', 'biologia', 'cuerpo', 'naturaleza', 'medicina'],
    geografia: ['geografia', 'pais', 'mundo', 'tierra', 'oceano', 'continente'],
    historia: ['historia', 'antiguo', 'pasado', 'guerra', 'imperio', 'civilizacion'],
    tecnologia: ['tecnologia', 'computadora', 'internet', 'software', 'hardware', 'robot'],
    animales: ['animal', 'mascota', 'perro', 'gato', 'fauna', 'insecto', 'ave'],
  };

  /* ============================================================
     TRIVIA / QUIZ
  ============================================================ */
  const QUIZ = [
    { q: '¿Cuál es el planeta más grande del Sistema Solar?', opts: ['Tierra', 'Júpiter', 'Saturno', 'Marte'], a: 1 },
    { q: '¿Cuántos continentes hay en la Tierra?', opts: ['5', '6', '7', '8'], a: 2 },
    { q: '¿Qué país tiene forma de bota?', opts: ['España', 'México', 'Italia', 'Chile'], a: 2 },
    { q: '¿Cuál es el océano más grande?', opts: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], a: 3 },
    { q: '¿En qué año llegó el humano a la Luna?', opts: ['1959', '1969', '1979', '1989'], a: 1 },
    { q: '¿Cuál es el elemento químico del agua?', opts: ['O₂', 'CO₂', 'H₂O', 'NaCl'], a: 2 },
    { q: '¿Qué órgano bombea la sangre?', opts: ['Pulmón', 'Cerebro', 'Hígado', 'Corazón'], a: 3 },
    { q: '¿Quién pintó la Mona Lisa?', opts: ['Picasso', 'Da Vinci', 'Van Gogh', 'Dalí'], a: 1 },
    { q: '¿Cuál es el animal más rápido en tierra?', opts: ['León', 'Guepardo', 'Caballo', 'Avestruz'], a: 1 },
    { q: '¿Cuántos lados tiene un hexágono?', opts: ['5', '6', '7', '8'], a: 1 },
    { q: '¿Cuál es la capital de Francia?', opts: ['Londres', 'Madrid', 'París', 'Roma'], a: 2 },
    { q: '¿Qué gas respiramos para vivir?', opts: ['Nitrógeno', 'Oxígeno', 'Dióxido de carbono', 'Hidrógeno'], a: 1 },
    { q: '¿Cuál es el idioma más hablado del mundo (nativos)?', opts: ['Inglés', 'Español', 'Chino mandarín', 'Hindi'], a: 2 },
    { q: '¿Qué instrumento tiene 88 teclas?', opts: ['Guitarra', 'Piano', 'Violín', 'Flauta'], a: 1 },
    { q: '¿Cuál es el metal líquido a temperatura ambiente?', opts: ['Plomo', 'Mercurio', 'Hierro', 'Oro'], a: 1 },
    { q: '¿Qué civilización construyó las pirámides de Guiza?', opts: ['Romana', 'Maya', 'Egipcia', 'Griega'], a: 2 },
    { q: '¿Cuál es el desierto más grande del mundo (cálido)?', opts: ['Atacama', 'Gobi', 'Sahara', 'Mojave'], a: 2 },
    { q: '¿Qué vitamina nos da principalmente el Sol?', opts: ['A', 'B12', 'C', 'D'], a: 3 },
    { q: '¿Cuál es el hueso más largo del cuerpo humano?', opts: ['Húmero', 'Fémur', 'Tibia', 'Radio'], a: 1 },
    { q: '¿Qué planeta es conocido como el "planeta rojo"?', opts: ['Venus', 'Marte', 'Júpiter', 'Mercurio'], a: 1 },
  ];

  /* ============================================================
     RECETAS
  ============================================================ */
  const RECETAS = {
    'arroz': {
      nombre: 'Arroz blanco perfecto 🍚',
      ing: ['1 taza de arroz', '2 tazas de agua', '1 diente de ajo', 'Sal y un chorrito de aceite'],
      pasos: ['Lava el arroz hasta que el agua salga clara.', 'Sofríe el ajo en aceite y añade el arroz 1 minuto.', 'Vierte el agua, añade sal y tapa.', 'Cocina a fuego bajo 15-18 min sin destapar.', 'Deja reposar 5 min y esponja con un tenedor.'],
      tip: 'La proporción mágica es 1 de arroz por 2 de agua.',
    },
    'pasta': {
      nombre: 'Pasta al dente 🍝',
      ing: ['200 g de pasta', 'Agua abundante', 'Sal', 'Salsa al gusto'],
      pasos: ['Hierve agua con sal generosa.', 'Añade la pasta y remueve.', 'Cocina el tiempo del paquete menos 1 minuto.', 'Escurre reservando un poco de agua de cocción.', 'Mezcla con la salsa y un chorrito del agua reservada.'],
      tip: 'Sala el agua, no la pasta: el sabor entra mejor.',
    },
    'huevo': {
      nombre: 'Huevos revueltos cremosos 🍳',
      ing: ['2-3 huevos', 'Mantequilla', 'Sal y pimienta', 'Leche o crema (opcional)'],
      pasos: ['Bate los huevos con sal, pimienta y un chorrito de leche.', 'Derrite mantequilla a fuego bajo.', 'Vierte y remueve constantemente sin dejar de mover.', 'Retira cuando aún estén ligeramente cremosos.'],
      tip: 'Fuego bajo y paciencia = huevos cremosos, no secos.',
    },
    'sandwich': {
      nombre: 'Sándwich clásico 🥪',
      ing: ['2 rebanadas de pan', 'Jamón o pollo', 'Queso', 'Lechuga y jitomate', 'Mayonesa o mostaza'],
      pasos: ['Tuesta ligeramente el pan.', 'Unta mayonesa o mostaza.', 'Coloca el relleno en capas.', 'Tapa y corta en diagonal.'],
      tip: 'Corta en diagonal: sabe mejor (científicamente no, pero sí).',
    },
    'ensalada': {
      nombre: 'Ensalada fresca 🥗',
      ing: ['Lechuga', 'Jitomate', 'Pepino', 'Aguacate', 'Aceite, limón y sal'],
      pasos: ['Lava y corta todo en trozos.', 'Mezcla en un tazón.', 'Aliña con aceite, limón y sal.'],
      tip: 'El limón justo antes de servir para que no se oxide.',
    },
    'guacamole': {
      nombre: 'Guacamole mexicano 🥑',
      ing: ['2 aguacates maduros', 'Cebolla picada', 'Cilantro', 'Limón', 'Sal y chile al gusto'],
      pasos: ['Machaca los aguacates.', 'Añade cebolla, cilantro, limón y sal.', 'Mezcla y sirve con totopos.'],
      tip: 'Deja el hueso dentro para que tarde más en oscurecerse.',
    },
    'hotcakes': {
      nombre: 'Hotcakes esponjosos 🥞',
      ing: ['1 taza de harina', '1 huevo', '1 taza de leche', '1 cdta de polvo de hornear', 'Azúcar y mantequilla'],
      pasos: ['Mezcla secos (harina, polvo, azúcar).', 'Añade huevo y leche; bate hasta integrar.', 'Cocina en sartén caliente hasta que burbujeen.', 'Voltea y dora.'],
      tip: 'No sobremezcles: grumos = hotcakes esponjosos.',
    },
    'limonada': {
      nombre: 'Limonada 🍋',
      ing: ['3 limones', '1 litro de agua', 'Azúcar o miel', 'Hielo'],
      pasos: ['Exprime los limones.', 'Mezcla con agua y endulza.', 'Sirve con hielo.'],
      tip: 'Añade hojas de menta para un toque fresco.',
    },
  };

  const SUSTITUCIONES = [
    { k: ['huevo'], r: 'Para sustituir 1 huevo en repostería: 1/2 plátano machacado, o 1 cda de linaza molida + 3 cdas de agua (reposar 5 min). 🥚➡️🍌' },
    { k: ['leche'], r: 'Puedes sustituir la leche por leche de avena, almendra o soja en casi cualquier receta, en proporción 1:1. 🥛➡️🌱' },
    { k: ['mantequilla'], r: 'Sustituye la mantequilla por aceite (usa un poco menos: 80 g de mantequilla ≈ 60 ml de aceite). 🧈➡️🫒' },
    { k: ['azucar'], r: 'Puedes endulzar con miel (3/4 de taza por cada taza de azúcar), estevia o fruta madura. 🍯' },
    { k: ['harina'], r: 'Para versiones sin gluten: harina de almendra, arroz o avena certificada. Las proporciones varían. 🌾➡️🌰' },
  ];

  const CONSEJOS_COCINA = [
    'Sala la pasta en el agua hirviendo, no después: el sabor entra mejor. 🍝',
    'Un cuchillo afilado es más seguro que uno sin filo (resbala menos). 🔪',
    'Deja reposar la carne 5 minutos tras cocinarla para que no pierda jugos. 🥩',
    'Para llorar menos con la cebolla, refrigérala 15 min antes de cortarla. 🧅',
    'Tuesta las especias 30 segundos en la sartén para potenciar su aroma. ✨',
    'El aguacate se conserva con limón o dejando el hueso dentro. 🥑',
    'No llenes la sartén: si está muy llena, la comida se cuece en vez de dorarse. 🍳',
  ];

  /* ============================================================
     CAPITALES Y GEOGRAFÍA
  ============================================================ */
  const CAPITALES = {
    'mexico': 'Ciudad de México', 'espana': 'Madrid', 'francia': 'París',
    'italia': 'Roma', 'alemania': 'Berlín', 'reino unido': 'Londres',
    'inglaterra': 'Londres', 'estados unidos': 'Washington D.C.', 'canada': 'Ottawa',
    'brasil': 'Brasilia', 'argentina': 'Buenos Aires', 'chile': 'Santiago',
    'colombia': 'Bogotá', 'peru': 'Lima', 'venezuela': 'Caracas',
    'ecuador': 'Quito', 'uruguay': 'Montevideo', 'paraguay': 'Asunción',
    'bolivia': 'La Paz', 'cuba': 'La Habana', 'japon': 'Tokio',
    'china': 'Pekín', 'india': 'Nueva Delhi', 'rusia': 'Moscú',
    'australia': 'Canberra', 'egipto': 'El Cairo', 'sudafrica': 'Pretoria',
    'portugal': 'Lisboa', 'grecia': 'Atenas', 'turquia': 'Ankara',
    'corea del sur': 'Seúl', 'suecia': 'Estocolmo', 'noruega': 'Oslo',
    'paises bajos': 'Ámsterdam', 'holanda': 'Ámsterdam', 'suiza': 'Berna',
    'belgica': 'Bruselas', 'austria': 'Viena', 'irlanda': 'Dublín',
  };

  const PAISES_INFO = {
    'mexico': '🇲🇽 México: capital Ciudad de México, idioma español, moneda peso. Famosa por su comida (tacos), el mariachi y las pirámides de Teotihuacán.',
    'espana': '🇪🇸 España: capital Madrid, idioma español, moneda euro. Conocida por la paella, el flamenco y La Sagrada Familia.',
    'francia': '🇫🇷 Francia: capital París, moneda euro. Famosa por la Torre Eiffel, el croissant y el Louvre.',
    'japon': '🇯🇵 Japón: capital Tokio, moneda yen. Conocida por el sushi, el anime, los cerezos y la tecnología.',
    'italia': '🇮🇹 Italia: capital Roma, moneda euro. Cuna de la pizza, la pasta y el Renacimiento.',
    'brasil': '🇧🇷 Brasil: capital Brasilia, idioma portugués. Famoso por el carnaval, la samba y la Amazonía.',
    'argentina': '🇦🇷 Argentina: capital Buenos Aires. Conocida por el tango, el asado y el fútbol.',
    'estados unidos': '🇺🇸 Estados Unidos: capital Washington D.C. Famosa por su diversidad, Silicon Valley y Hollywood.',
  };

  /* ============================================================
     SIGNIFICADO DE NOMBRES
  ============================================================ */
  const NOMBRES = {
    'ana': 'de origen hebreo, significa "compasiva" o "llena de gracia".',
    'juan': 'de origen hebreo, significa "Dios es misericordioso".',
    'maria': 'de origen hebreo, se asocia con "la elegida" o "amada por Dios".',
    'carlos': 'de origen germánico, significa "hombre libre".',
    'laura': 'de origen latino, significa "laurel", símbolo de victoria.',
    'pedro': 'de origen griego, significa "piedra" o "roca".',
    'sofia': 'de origen griego, significa "sabiduría".',
    'lucia': 'de origen latino, significa "la que lleva luz".',
    'diego': 'de origen hebreo, se relaciona con "instruido" o "el que enseña".',
    'valentina': 'de origen latino, significa "valiente" o "fuerte".',
    'alex': 'de origen griego, significa "defensor de los hombres".',
    'emma': 'de origen germánico, significa "universal" o "completa".',
    'david': 'de origen hebreo, significa "amado".',
    'isabella': 'variante de Isabel, de origen hebreo, significa "promesa de Dios".',
    'matias': 'de origen hebreo, significa "regalo de Dios".',
    'camila': 'de origen latino, significa "la que está cerca de Dios" o "mensajera".',
    'gabriel': 'de origen hebreo, significa "fortaleza de Dios".',
    'fer': 'diminutivo de Fernando, de origen germánico, "valiente en la paz".',
  };

  /* ============================================================
     HORÓSCOPO
  ============================================================ */
  const HOROSCOPO = [
    { signo: 'aries', fechas: '21 mar – 19 abr', elem: 'Fuego 🔥', desc: 'Energético y pionero, te lanzas sin miedo. Hoy es buen día para empezar proyectos.', consejo: 'Respira antes de reaccionar.' },
    { signo: 'tauro', fechas: '20 abr – 20 may', elem: 'Tierra 🌱', desc: 'Estable y leal, valoras la seguridad. El día favorece lo práctico y lo placentero.', consejo: 'Ábrete a un cambio pequeño.' },
    { signo: 'geminis', fechas: '21 may – 20 jun', elem: 'Aire 💨', desc: 'Curioso y comunicativo, tu mente no para. Ideal para escribir o conversar.', consejo: 'Concéntrate en una sola cosa.' },
    { signo: 'cancer', fechas: '21 jun – 22 jul', elem: 'Agua 💧', desc: 'Sensible y protector, tu intuición está alta. Cuida a los tuyos, sin olvidarte de ti.', consejo: 'Pon límites con cariño.' },
    { signo: 'leo', fechas: '23 jul – 22 ago', elem: 'Fuego 🔥', desc: 'Carismático y creativo, brillas naturalmente. Buen momento para liderar.', consejo: 'Escucha también a los demás.' },
    { signo: 'virgo', fechas: '23 ago – 22 sep', elem: 'Tierra 🌱', desc: 'Detallista y analítico, hoy conviene ordenar y planificar.', consejo: 'No te exijas la perfección.' },
    { signo: 'libra', fechas: '23 sep – 22 oct', elem: 'Aire 💨', desc: 'Equilibrado y sociable, buscas armonía. Ideal para reconciliar y negociar.', consejo: 'Decide sin postergar.' },
    { signo: 'escorpio', fechas: '23 oct – 21 nov', elem: 'Agua 💧', desc: 'Intenso y apasionado, tu determinación está en su punto más alto.', consejo: 'Confía un poco más.' },
    { signo: 'sagitario', fechas: '22 nov – 21 dic', elem: 'Fuego 🔥', desc: 'Optimista y aventurero, hoy te llaman los viajes y las ideas grandes.', consejo: 'Mide los riesgos.' },
    { signo: 'capricornio', fechas: '22 dic – 19 ene', elem: 'Tierra 🌱', desc: 'Responsable y ambicioso, tu constancia da frutos. Buen día para metas a largo plazo.', consejo: 'Date un descanso.' },
    { signo: 'acuario', fechas: '20 ene – 18 feb', elem: 'Aire 💨', desc: 'Original y humanitario, tus ideas sorprenden. Compártelas.', consejo: 'Conecta con la emoción, no solo la idea.' },
    { signo: 'piscis', fechas: '19 feb – 20 mar', elem: 'Agua 💧', desc: 'Soñador y empático, tu creatividad fluye. Ideal para el arte y la reflexión.', consejo: 'Ancla tus sueños con un plan.' },
  ];

  /* ============================================================
     MINI DICCIONARIO (ES → EN)
  ============================================================ */
  const DICCIONARIO = {
    'hola': 'hello', 'adios': 'goodbye', 'gracias': 'thank you', 'por favor': 'please',
    'buenos dias': 'good morning', 'buenas noches': 'good night', 'si': 'yes', 'no': 'no',
    'amor': 'love', 'amigo': 'friend', 'familia': 'family', 'casa': 'house',
    'agua': 'water', 'comida': 'food', 'perro': 'dog', 'gato': 'cat',
    'tiempo': 'time', 'dia': 'day', 'noche': 'night', 'sol': 'sun', 'luna': 'moon',
    'corazon': 'heart', 'feliz': 'happy', 'triste': 'sad', 'bonito': 'beautiful',
    'grande': 'big', 'pequeno': 'small', 'rapido': 'fast', 'lento': 'slow',
    'libro': 'book', 'escuela': 'school', 'trabajo': 'work', 'dinero': 'money',
    'yo': 'I', 'tu': 'you', 'nosotros': 'we', 'ellos': 'they',
    'te quiero': 'I love you', 'como estas': 'how are you', 'que hora es': 'what time is it',
    'buena suerte': 'good luck', 'feliz cumpleanos': 'happy birthday', 'te extrano': 'I miss you',
  };

  /* ============================================================
     CONVERSIÓN DE UNIDADES
  ============================================================ */
  const UNIDADES = {
    longitud: { km: { mi: 0.621371, m: 1000 }, mi: { km: 1.60934, m: 1609.34 }, m: { cm: 100, ft: 3.28084 }, ft: { m: 0.3048 }, cm: { in: 0.393701 }, in: { cm: 2.54 } },
    peso: { kg: { lb: 2.20462, g: 1000 }, lb: { kg: 0.453592 }, g: { kg: 0.001, oz: 0.035274 }, oz: { g: 28.3495 } },
    volumen: { l: { ml: 1000, gal: 0.264172 }, ml: { l: 0.001 }, gal: { l: 3.78541 } },
  };
  const TEMPERATURA = ['celsius', 'fahrenheit', 'kelvin'];

  const DIVISAS = {
    usd: { nombre: 'dólar', mxn: 17.5, eur: 0.92 }, eur: { nombre: 'euro', usd: 1.09, mxn: 19.0 },
    mxn: { nombre: 'peso', usd: 0.057, eur: 0.053 }, ars: { nombre: 'peso argentino', usd: 0.0011 },
  };

  /* ============================================================
     CONSEJOS (salud, estudio, etc.)
  ============================================================ */
  const CONSEJOS = {
    dormir: [
      'Mantén horarios fijos de sueño, incluso en fin de semana. 🌙',
      'Apaga pantallas 30-60 min antes de dormir: la luz azul engaña a tu cerebro.',
      'Evita la cafeína después de media tarde.',
      'Duerme en un cuarto fresco, oscuro y silencioso.',
      'Si no concilias el sueño en 20 min, levántate y haz algo tranquilo hasta tener sueño.',
    ],
    estudio: [
      'Usa la técnica Pomodoro: 25 min de concentración + 5 de descanso. 🍅',
      'Estudia por bloques y repasa con la técnica de "recuerdo activo" (pregúntate sin ver las notas).',
      'Explícale el tema a alguien más: si puedes enseñarlo, lo entiendes.',
      'Intercala materias y duerme bien; el cerebro consolida la memoria al dormir.',
      'Haz resúmenes con tus propias palabras, no copies el libro.',
    ],
    ejercicio: [
      'La OMS recomienda al menos 150 min de actividad moderada a la semana. 🏃',
      'Empieza con 10-15 min al día; la constancia importa más que la intensidad.',
      'Camina después de comer: ayuda a la digestión y al ánimo.',
      'Combina fuerza y cardio para una salud completa.',
      'Calienta antes y estira después para evitar lesiones.',
    ],
    animo: [
      'Respira 4 segundos, sostén 4 y suelta 4; repite 5 veces. 🧘',
      'Escribe 3 cosas por las que estés agradecido/a hoy.',
      'Muévete un poco: el ejercicio libera endorfinas.',
      'Habla con alguien de confianza; compartir aligera la carga.',
      'Sé amable contigo mismo/a: te estás esforzando y eso ya cuenta.',
    ],
  };

  /* ============================================================
     TEMAS DE CHARLA ENTRE BOTS
  ============================================================ */
  const TALK_TOPICS = [
    'la pizza con piña', 'los gatos contra los perros', 'el futuro de la IA',
    'la música de los 80', 'el café por la mañana', 'viajar al espacio',
    'el trabajo en equipo', 'los videojuegos', 'el amor', 'la lluvia',
    'la tecnología en la escuela', 'el cine clásico', 'los memes', 'el reciclaje',
  ];

  /* ---------- Exportar ---------- */
  global.BOT_DATA = {
    utils: { pick, norm, containsAny, cap, sleep },
    PERSONAS,
    CHISTES, ADIVINANZAS, TRABALENGUAS, REFRANES, FRASES_MOTIVACION,
    DATOS_CURIOSOS, DATOS_CATEGORIAS,
    QUIZ, RECETAS, SUSTITUCIONES, CONSEJOS_COCINA,
    CAPITALES, PAISES_INFO, NOMBRES, HOROSCOPO, DICCIONARIO,
    UNIDADES, TEMPERATURA, DIVISAS, CONSEJOS, TALK_TOPICS,
  };
})(window);
