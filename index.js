require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { DateTime } = require("luxon");
const express = require("express");
const axios = require("axios");

const CUEVANA_URL = "https://wv4.cuevana.online";
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const TOKEN = process.env.BOT_TOKEN;
const ENTREGA_CHANNEL_ID = process.env.ENTREGA_CHANNEL_ID || "1340945885277851718";
const HF_API_KEY = process.env.HF_API_KEY;

const hf = new HfInference(HF_API_KEY);
const app = express();
app.get("/", (req, res) => res.send("Bot activo 🚀"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Servidor activo en el puerto ${PORT}`));

const sorteosActivos = new Map();

const preguntasTrivia = [
  { pregunta: "¿Cuál es el mineral más raro en Minecraft 1.8?", respuesta: "esmeralda", incorrectas: ["diamante", "oro", "hierro"] },
  { pregunta: "¿Cuántos bloques de altura tiene un Enderman?", respuesta: "3", incorrectas: ["2", "4", "5"] },
  { pregunta: "¿Qué mob se domesticó primero en Minecraft?", respuesta: "lobo", incorrectas: ["gato", "caballo", "cerdo"] },
  { pregunta: "¿Cuántos ojos de Ender necesitas para activar un portal al End?", respuesta: "12", incorrectas: ["10", "14", "16"] },
  { pregunta: "¿Cómo se llama el creador original de Minecraft?", respuesta: "Notch", incorrectas: ["Herobrine", "Jeb", "Dinnerbone"] },
  { pregunta: "¿Qué animal se puede montar en Minecraft 1.8?", respuesta: "caballo", incorrectas: ["cerdo", "vaca", "oveja"] },
  { pregunta: "¿Qué estructura contiene un portal al End?", respuesta: "fortaleza", incorrectas: ["templo", "aldea", "mina"] },
  { pregunta: "¿Qué item revive al jugador en Minecraft?", respuesta: "tótem de la inmortalidad", incorrectas: ["poción", "manzana dorada", "estrella del Nether"] },
  { pregunta: "¿Cuál es la mejor armadura en Minecraft 1.8?", respuesta: "diamante", incorrectas: ["hierro", "oro", "cuero"] },
  { pregunta: "¿Qué item se usa para obtener lana?", respuesta: "tijeras", incorrectas: ["pala", "hacha", "pico"] },
  { pregunta: "¿Qué bioma puedes encontrar en Minecraft 1.8?", respuesta: "bosque", incorrectas: ["desierto", "montaña", "pantano"] },
  { pregunta: "¿Cuántos tipos de aldeanos hay en Minecraft?", respuesta: "5", incorrectas: ["3", "7", "9"] },
  { pregunta: "¿Cuál es el animal más rápido de Minecraft?", respuesta: "caballo", incorrectas: ["lobo", "ocelote", "cerdo"] },
  { pregunta: "¿Cuántas piezas de obsidiana se necesitan para hacer un portal al Nether?", respuesta: "10", incorrectas: ["8", "12", "14"] },
  { pregunta: "¿Qué mob se añadió en la versión 1.8 de Minecraft?", respuesta: "conejos", incorrectas: ["gallinas", "vacas", "ovejas"] },
  { pregunta: "¿Cuál es la comida que te da más saturación en Minecraft?", respuesta: "estofado de conejo", incorrectas: ["pan", "carne", "manzana"] },
  { pregunta: "¿Cuántos fragmentos de Netherite se necesitan para un lingote?", respuesta: "4", incorrectas: ["2", "3", "5"] },
  { pregunta: "¿Cuál es el único mob que puede flotar en el agua?", respuesta: "pez", incorrectas: ["calamar", "araña", "vaca"] },
  { pregunta: "¿Qué bloque explota al ser golpeado por un rayo?", respuesta: "creeper cargado", incorrectas: ["tierra", "piedra", "madera"] },
  { pregunta: "¿Cuántos corazones tiene el Wither?", respuesta: "150", incorrectas: ["100", "200", "50"] },
  { pregunta: "¿Qué arma dispara flechas en Minecraft?", respuesta: "arco", incorrectas: ["espada", "pico", "hacha"] },
  { pregunta: "¿Qué bloque se usa para hacer un faro?", respuesta: "vidrio", incorrectas: ["madera", "piedra", "arcilla"] },
  { pregunta: "¿Cuál es la capital de Francia?", respuesta: "París", incorrectas: ["Londres", "Madrid", "Berlín"] },
  { pregunta: "¿En qué continente está Brasil?", respuesta: "América del Sur", incorrectas: ["África", "Asia", "Europa"] },
  { pregunta: "¿Quién escribió 'Harry Potter'?", respuesta: "J.K. Rowling", incorrectas: ["Tolkien", "Stephen King", "George R.R. Martin"] },
  { pregunta: "¿Cuál es el océano más grande del mundo?", respuesta: "Pacífico", incorrectas: ["Atlántico", "Índico", "Ártico"] },
  { pregunta: "¿Cuántos planetas hay en el sistema solar?", respuesta: "8", incorrectas: ["7", "9", "10"] },
  { pregunta: "¿Cuál es el animal más grande del planeta?", respuesta: "ballena azul", incorrectas: ["elefante", "tiburón", "jirafa"] },
  { pregunta: "¿Qué planeta es el más cercano al Sol?", respuesta: "Mercurio", incorrectas: ["Venus", "Marte", "Júpiter"] },
  { pregunta: "¿En qué año llegó el hombre a la Luna?", respuesta: "1969", incorrectas: ["1965", "1972", "1960"] },
  { pregunta: "¿Qué gas compone la mayor parte de la atmósfera terrestre?", respuesta: "nitrógeno", incorrectas: ["oxígeno", "dióxido de carbono", "argón"] },
  { pregunta: "¿Cuál es el río más largo del mundo?", respuesta: "Amazonas", incorrectas: ["Nilo", "Misisipi", "Yangtsé"] },
  { pregunta: "¿Qué animal es conocido por su cuello largo?", respuesta: "jirafa", incorrectas: ["elefante", "rinoceronte", "hipopótamo"] },
  { pregunta: "¿Cuántos continentes habitados hay?", respuesta: "6", incorrectas: ["5", "7", "4"] },
  { pregunta: "¿Qué elemento tiene el símbolo 'H'?", respuesta: "hidrógeno", incorrectas: ["helio", "hierro", "oro"] },
  { pregunta: "¿Qué país es conocido como la tierra del sol naciente?", respuesta: "Japón", incorrectas: ["China", "Corea", "Tailandia"] },
  { pregunta: "¿Cuál es el desierto más grande del mundo?", respuesta: "Antártida", incorrectas: ["Sahara", "Gobi", "Atacama"] },
  { pregunta: "¿Qué instrumento mide el tiempo?", respuesta: "reloj", incorrectas: ["termómetro", "barómetro", "compás"] },
  { pregunta: "¿Qué color tiene el cielo en un día despejado?", respuesta: "azul", incorrectas: ["verde", "rojo", "amarillo"] },
  { pregunta: "¿Cuántos días tiene un año bisiesto?", respuesta: "366", incorrectas: ["365", "364", "367"] },
  { pregunta: "¿Qué mamífero vuela?", respuesta: "murciélago", incorrectas: ["ardilla", "ratón", "gato"] },
  { pregunta: "¿Qué fruta es conocida por caer sobre Newton?", respuesta: "manzana", incorrectas: ["pera", "naranja", "plátano"] },
  { pregunta: "¿Cuál es el metal más abundante en la corteza terrestre?", respuesta: "aluminio", incorrectas: ["hierro", "cobre", "oro"] },
  { pregunta: "¿Qué ave no puede volar pero corre rápido?", respuesta: "avestruz", incorrectas: ["pingüino", "ganso", "pavo"] },
  { pregunta: "¿Qué país tiene más población del mundo?", respuesta: "China", incorrectas: ["India", "EE.UU.", "Rusia"] },
  { pregunta: "¿Qué estación sigue al verano?", respuesta: "otoño", incorrectas: ["invierno", "primavera", "verano"] },
  { pregunta: "¿Cuántos lados tiene un triángulo?", respuesta: "3", incorrectas: ["4", "5", "6"] },
  { pregunta: "¿Qué bebida es conocida como H2O?", respuesta: "agua", incorrectas: ["leche", "jugo", "café"] },
  { pregunta: "¿Qué animal es el rey de la selva?", respuesta: "león", incorrectas: ["tigre", "elefante", "jirafa"] },
  { pregunta: "¿Qué idioma se habla en Brasil?", respuesta: "portugués", incorrectas: ["español", "inglés", "francés"] },
  { pregunta: "¿Qué planeta tiene anillos visibles?", respuesta: "Saturno", incorrectas: ["Júpiter", "Marte", "Urano"] },
  { pregunta: "¿Qué inventó Thomas Edison?", respuesta: "bombilla", incorrectas: ["teléfono", "radio", "televisión"] },
  { pregunta: "¿Qué deporte se juega con una raqueta y una pelota pequeña?", respuesta: "tenis", incorrectas: ["fútbol", "básquet", "voleibol"] },
  { pregunta: "¿Qué parte del cuerpo usas para escuchar?", respuesta: "oído", incorrectas: ["ojo", "nariz", "boca"] },
  { pregunta: "¿Qué país es famoso por los tulipanes?", respuesta: "Países Bajos", incorrectas: ["Francia", "Italia", "Alemania"] },
  { pregunta: "¿Cuántos minutos tiene una hora?", respuesta: "60", incorrectas: ["50", "70", "80"] },
];

async function getFileContentFromGitHub() {
  const url = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const content = Buffer.from(response.data.content, "base64").toString("utf8");
    console.log("📥 Contenido obtenido de GitHub:", content);
    return { content: JSON.parse(content), sha: response.data.sha };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("📄 Archivo no encontrado en GitHub, devolviendo array vacío.");
      return { content: [], sha: null };
    }
    console.error("❌ Error al obtener el archivo de GitHub:", error.message);
    throw error;
  }
}

async function updateFileInGitHub(content, sha) {
  const url = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`;
  const data = {
    message: `Actualización de sorteos.json - ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    sha: sha,
  };

  try {
    const response = await axios.put(url, data, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    console.log(`✅ Archivo actualizado en GitHub. Nuevo SHA: ${response.data.content.sha}`);
    return response.data.content.sha;
  } catch (error) {
    console.error("❌ Error al actualizar el archivo en GitHub:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function createFileInGitHub(content) {
  const url = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`;
  const data = {
    message: `Creación de sorteos.json - ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
  };

  try {
    const response = await axios.put(url, data, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    console.log(`✅ Archivo creado en GitHub. SHA: ${response.data.content.sha}`);
    return response.data.content.sha;
  } catch (error) {
    console.error("❌ Error al crear el archivo en GitHub:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function actualizarSorteoEnGitHub(sorteoId) {
  const sorteoActivo = sorteosActivos.get(sorteoId);
  if (!sorteoActivo) {
    console.log(`⚠️ No se encontró sorteo activo con ID ${sorteoId} en memoria`);
    return;
  }

  const mensajeSorteo = sorteoActivo.mensaje;
  const reaccion = mensajeSorteo.reactions.cache.get("✅");
  const participantesActuales = new Set();

  if (reaccion) {
    const usuarios = await reaccion.users.fetch();
    usuarios.forEach((user) => !user.bot && participantesActuales.add(user));
  }

  sorteoActivo.participantes = participantesActuales;
  const participantesArray = Array.from(participantesActuales);

  console.log(`🔄 Actualizando sorteo ${sorteoId} con ${participantesArray.length} participantes únicos`);

  let intentos = 0;
  const maxIntentos = 5;
  let ultimaExcepcion = null;

  while (intentos < maxIntentos) {
    try {
      let fileData = await getFileContentFromGitHub();
      let fileContent = fileData.content || [];
      const sorteoIndex = fileContent.findIndex((s) => s.id === sorteoId);

      if (sorteoIndex !== -1) {
        const participantesActualizados = participantesArray.map((user) => ({
          id: user.id,
          tag: user.tag,
        }));
        fileContent[sorteoIndex].participantes = participantesActualizados;

        const newSha = await updateFileInGitHub(fileContent, fileData.sha);
        console.log(`✅ Sorteo ${sorteoId} actualizado en GitHub con ${participantesActualizados.length} participantes. Nuevo SHA: ${newSha}`);
        return;
      } else {
        console.log(`⚠️ Sorteo ${sorteoId} no encontrado en GitHub`);
        return;
      }
    } catch (error) {
      ultimaExcepcion = error;
      if (error.response && error.response.status === 409) {
        console.log(`⚠️ Conflicto 409 al actualizar sorteo ${sorteoId}. Reintentando (${intentos + 1}/${maxIntentos})...`);
        intentos++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.error(`❌ Error al actualizar sorteo ${sorteoId}:`, error.message);
        break;
      }
    }
  }

  if (intentos >= maxIntentos) {
    console.error(`❌ Fallo tras ${maxIntentos} intentos para actualizar sorteo ${sorteoId}. Último error:`, ultimaExcepcion.message);
  }
}

function obtenerPreguntaTriviaLocal() {
  const randomIndex = Math.floor(Math.random() * preguntasTrivia.length);
  const trivia = preguntasTrivia[randomIndex];
  const opciones = [...trivia.incorrectas, trivia.respuesta].sort(() => Math.random() - 0.5);
  return { pregunta: trivia.pregunta, opciones, respuesta: trivia.respuesta };
}

async function manejarTrivia(message) {
  const trivia = obtenerPreguntaTriviaLocal();

  const embedPregunta = new EmbedBuilder()
    .setColor("#3498db")
    .setTitle("🎲 ¡Trivia Time!")
    .setDescription(
      `¡A ver qué tan rápido puedes resolver esto!\n\n${trivia.pregunta}\n\n` +
        `**A)** ${trivia.opciones[0]}\n` +
        `**B)** ${trivia.opciones[1]}\n` +
        `**C)** ${trivia.opciones[2]}\n` +
        `**D)** ${trivia.opciones[3]}`
    )
    .setFooter({ text: "Responde con A, B, C o D en 15 segundos | Oliver", iconURL: bot.user.displayAvatarURL() });

  await message.channel.send({ embeds: [embedPregunta] });

  const opcionesValidas = ["a", "b", "c", "d"];
  const indiceCorrecto = trivia.opciones.indexOf(trivia.respuesta);
  const letraCorrecta = opcionesValidas[indiceCorrecto];
  const filtro = (respuesta) => opcionesValidas.includes(respuesta.content.toLowerCase());
  const tiempoInicio = Date.now();

  try {
    const respuestas = await message.channel.awaitMessages({
      filter: filtro,
      max: 1,
      time: 15000,
      errors: ["time"],
    });

    const respuestaUsuario = respuestas.first().content.toLowerCase();
    const ganador = respuestas.first().author;
    const tiempoFinal = (Date.now() - tiempoInicio) / 1000;

    if (respuestaUsuario === letraCorrecta) {
      const embedCorrecto = new EmbedBuilder()
        .setColor("#2ecc71")
        .setTitle("🎉 ¡Aplausos para el ganador!")
        .setDescription(
          `**${ganador.tag}** acertó en **${tiempoFinal.toFixed(2)} segundos**.\n` +
            `La respuesta era: **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}).`
        )
        .setFooter({ text: "¡Eres un crack! | Oliver", iconURL: bot.user.displayAvatarURL() });
      message.channel.send({ embeds: [embedCorrecto] });
    } else {
      const embedIncorrecto = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("❌ ¡Uy, por poco!")
        .setDescription(
          `**${ganador.tag}**, fallaste esta vez.\n` +
            `La respuesta correcta era: **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}).`
        )
        .setFooter({ text: "¡A darle otra vez! | Oliver", iconURL: bot.user.displayAvatarURL() });
      message.channel.send({ embeds: [embedIncorrecto] });
    }
  } catch (error) {
    const embedTiempo = new EmbedBuilder()
      .setColor("#e74c3c")
      .setTitle("⏳ ¡Se acabó el tiempo!")
      .setDescription(`Nadie respondió a tiempo. La respuesta era: **${trivia.respuesta}** (Opción ${letraCorrecta.toUpperCase()}).`)
      .setFooter({ text: "¡Prepárense para la próxima! | Oliver", iconURL: bot.user.displayAvatarURL() });
    message.channel.send({ embeds: [embedTiempo] });
  }
}

async function finalizarSorteo(sorteoId, mensajeSorteo, participantes, premio) {
  const sorteoActivo = sorteosActivos.get(sorteoId);
  if (sorteoActivo && sorteoActivo.intervalo) {
    clearInterval(sorteoActivo.intervalo);
  }

  const reaccion = mensajeSorteo.reactions.cache.get("✅");
  if (reaccion) {
    const usuarios = await reaccion.users.fetch();
    participantes.clear();
    usuarios.forEach((user) => !user.bot && participantes.add(user));
  }

  const creador = sorteoActivo.creador;
  const participantesArray = Array.from(participantes);
  let fileData = await getFileContentFromGitHub();
  let fileContent = fileData.content;
  const sorteoIndex = fileContent.findIndex((s) => s.id === sorteoId);
  let ganador = null;

  const imagenUrl = sorteoIndex !== -1 && fileContent[sorteoIndex].imagen ? fileContent[sorteoIndex].imagen : null;

  let resultadoEmbed;
  if (participantesArray.length === 0) {
    resultadoEmbed = new EmbedBuilder()
      .setColor("#e74c3c")
      .setTitle("❌ Sorteo finalizado")
      .setDescription(`No hubo participantes en el sorteo.\n\n**Premio:** ${premio}\n**Creado por:** ${creador.tag} (<@${creador.id}>)`)
      .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
      .setTimestamp();
    if (imagenUrl) resultadoEmbed.setImage(imagenUrl);
    await mensajeSorteo.edit({ embeds: [resultadoEmbed] });
  } else {
    ganador = participantesArray[Math.floor(Math.random() * participantesArray.length)];
    resultadoEmbed = new EmbedBuilder()
      .setColor("#ffd700")
      .setTitle("🏆 ¡Sorteo Finalizado!")
      .setDescription(
        `¡Felicidades ${ganador.tag}! Has ganado **${premio}**. 🎉\nContáctate con un administrador para reclamar tu premio.\n\n**Creado por:** ${creador.tag} (<@${creador.id}>)`
      )
      .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
      .setTimestamp();
    if (imagenUrl) resultadoEmbed.setImage(imagenUrl);
    await mensajeSorteo.edit({ embeds: [resultadoEmbed] });
    await mensajeSorteo.channel.send({ content: "@everyone", embeds: [resultadoEmbed] });
  }

  if (sorteoIndex !== -1) {
    fileContent[sorteoIndex].participantes = participantesArray.map((user) => ({ id: user.id, tag: user.tag }));
    fileContent[sorteoIndex].ganador = ganador ? { id: ganador.id, tag: ganador.tag } : null;
    try {
      await updateFileInGitHub(fileContent, fileData.sha);
      console.log(`✅ Sorteo ${sorteoId} finalizado y actualizado en GitHub con ${participantesArray.length} participantes`);
    } catch (error) {
      console.error(`❌ Fallo al actualizar sorteo ${sorteoId} en GitHub:`, error.message);
    }
  }

  sorteosActivos.delete(sorteoId);
}

async function enviarEmbedCumple(bot) {
  const canalId = "1340945885277851718";
  const canal = bot.channels.cache.get(canalId);

  if (!canal || !canal.isTextBased()) {
    console.error(`❌ No se encontró el canal con ID ${canalId} o no es un canal de texto.`);
    return;
  }

  const usuarioMencion = "<@1125246198270394469>";

  const embedCumple = new EmbedBuilder()
    .setTitle("🎉 ¡FELIZ CUMPLEAÑOS CHENTE! 🎂")
    .setDescription(
      `¡Hoy es un día súper especial porque celebramos el cumpleaños de nuestro gran amigo ${usuarioMencion}! 🥳 Que este día esté lleno de risas, juegos, dulces y momentos mágicos. ¡Eres el mejor, pequeño! ✨`
    )
    .setColor("#FF69B4")
    .addFields({ name: "🎈 Deseo", value: "¡Que tengas un año lleno de aventuras y diversión!", inline: true })
    .setImage("https://media.discordapp.net/attachments/1008091220544851970/1371344005698293903/image_4.jpg")
    .setFooter({ text: "Con mucho cariño de tus amigos de Discord 💖", iconURL: bot.user.displayAvatarURL() })
    .setTimestamp();

  const veces = 10;
  for (let i = 0; i < veces; i++) {
    setTimeout(async () => {
      try {
        await canal.send({
          content: "@everyone",
          embeds: [embedCumple],
        });
        console.log(`✅ Embed de cumpleaños enviado con @everyone (${i + 1}/${veces})`);
      } catch (error) {
        console.error(`❌ Error al enviar embed ${i + 1}:`, error.message);
      }
    }, i * 2000);
  }
}

bot.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(".")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args[0].toLowerCase();

  if (command === "help") {
    const helpEmbed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("Comandos disponibles")
      .setDescription("Aquí están los comandos que puedes usar:")
      .addFields(
        { name: ".recomendar", value: "Obtén una lista de películas recomendadas por género." },
        { name: ".pelicula <nombre>", value: "Busca una película en Cuevana y recibe un enlace directo." },
        { name: ".trivia", value: "Inicia una pregunta de trivia; el primero en responder correctamente gana." },
        { name: ".8ball <pregunta>", value: "Haz una pregunta y recibe una respuesta de la bola 8 mágica." },
        { name: ".memide [@usuario]", value: "Mide algo de alguien o de ti mismo si no mencionas a nadie." },
        { name: ".kiss <@usuario>", value: "Envía un beso sorpresa a alguien en el servidor. 💋" },
        { name: ".sorteo <premio> [tiempo]", value: "Inicia un sorteo con un premio y duración opcional (admin)." },
        { name: ".resumesort <canalId> <mensajeId>", value: "Reanuda un sorteo existente (admin)." },
        { name: ".entregar <sorteoId> <ganador>", value: "Registra la entrega de un sorteo (admin)." },
        { name: ".extendersorteo <canalId> <mensajeId> <tiempo>", value: "Extiende el tiempo de un sorteo (admin)." }
      )
      .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [helpEmbed] });
  }

  if (command === "recomendar") {
    const generos = {
      drama: [
        { titulo: "La vida es bella", enlace: "https://wv4.cuevana.online/pelicula/la-vida-es-bella" },
        { titulo: "En busca de la felicidad", enlace: "https://www.cuevana.is/pelicula/1402/en-busca-de-la-felicidad" },
        { titulo: "El indomable Will Hunting", enlace: "https://www.genteclic.com/en-busca-del-destino-1997-pelicula-online/" },
        { titulo: "Cadena de favores", enlace: "https://wv4.cuevana.online/pelicula/cadena-de-favores" },
        { titulo: "12 años de esclavitud", enlace: "https://wv4.cuevana.online/pelicula/12-anos-de-esclavitud" },
      ],
      romance: [
        { titulo: "El diario de una pasión", enlace: "https://www.cuevana.is/pelicula/11036/diario-de-una-pasion" },
        { titulo: "Antes del amanecer", enlace: "https://wow.cuevana3.nu/peliculas-online/116460/antes-de-amanecer-online-gratis-en-cuevana/" },
        {
          titulo: "A todos los chicos de los que me enamoré",
          enlace: "https://wow.cuevana3.nu/peliculas-online/104732/a-todos-los-chicos-para-siempre-online-gratis-en-cuevana/",
        },
        { titulo: "La La Land", enlace: "https://wv4.cuevana.online/pelicula/la-la-land-una-historia-de-amor" },
        { titulo: "La forma del agua", enlace: "https://wv4.cuevana.online/pelicula/la-forma-del-agua" },
      ],
      comedia: [
        { titulo: "Super Cool", enlace: "https://wv4.cuevana.online/pelicula/super-cool" },
        { titulo: "La gran apuesta", enlace: "https://wow.cuevana3.nu/peliculas-online/100774/la-gran-apuesta-online-gratis-en-cuevana/" },
        { titulo: "Buenos vecinos", enlace: "https://wow.cuevana3.nu/peliculas-online/99571/buenos-vecinos-online-gratis-en-cuevana/" },
        { titulo: "¿Qué pasó ayer?", enlace: "https://wv4.cuevana.online/pelicula/que-paso-ayer" },
        { titulo: "Tregua(s)", enlace: "https://cuevana.biz/pelicula/1097737/treguas" },
      ],
      accion: [
        { titulo: "Mad Max: Furia en el camino", enlace: "https://wv4.cuevana.online/pelicula/mad-max-furia-en-el-camino" },
        { titulo: "John Wick", enlace: "https://wow.cuevana3.nu/peliculas-online/100244/john-wick-otro-dia-para-matar-online-gratis-en-cuevana/" },
        { titulo: "Misión Imposible: Repercusión", enlace: "https://wv4.cuevana.online/pelicula/mision-imposible-repercusion" },
        { titulo: "Gladiador", enlace: "https://wv4.cuevana.online/pelicula/gladiador" },
        { titulo: "Batman: El caballero oscuro", enlace: "https://cuevana.biz/pelicula/155/batman-el-caballero-de-la-noche" },
      ],
    };

    const embed = new EmbedBuilder()
      .setColor("#ff9900")
      .setTitle("🎬 Recomendaciones de Películas")
      .setDescription("Aquí tienes algunas películas recomendadas por género:")
      .setFooter({ text: "Fuente: Cuevana", iconURL: bot.user.displayAvatarURL() })
      .setTimestamp();

    Object.entries(generos).forEach(([genero, peliculas]) => {
      embed.addFields({
        name: `📌 ${genero.charAt(0).toUpperCase() + genero.slice(1)}`,
        value: peliculas.map((p) => `🎥 **${p.titulo}** - [Ver aquí](${p.enlace})`).join("\n"),
        inline: false,
      });
    });

    message.reply({ embeds: [embed] });
  }

  if (command === "pelicula") {
    if (!args[1]) {
      const embedError = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription("Debes escribir el nombre de la película.\nEjemplo: `.pelicula Siempre el mismo día`")
        .setTimestamp();
      return message.reply({ embeds: [embedError] });
    }

    const pelicula = args.slice(1).join(" ").toLowerCase().replace(/\s+/g, "-");
    const url = `${CUEVANA_URL}/pelicula/${pelicula}`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(data);
      const titulo = $("h1").text().trim();

      if (titulo) {
        const embedPelicula = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle(`🎬 ${titulo}`)
          .setDescription(`🔗 **Enlace directo:**\n${url}`)
          .setFooter({ text: "Fuente: Cuevana", iconURL: bot.user.displayAvatarURL() })
          .setTimestamp();
        message.reply({ embeds: [embedPelicula] });
      } else {
        const embedNoEncontrado = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Película no encontrada")
          .setDescription("No encontré la película en Cuevana.")
          .setTimestamp();
        message.reply({ embeds: [embedNoEncontrado] });
      }
    } catch (error) {
      console.error("❌ Error buscando en Cuevana:", error.message);
      const embedErrorBusqueda = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error de búsqueda")
        .setDescription("Hubo un error buscando la película. Inténtalo de nuevo más tarde.")
        .setTimestamp();
      message.reply({ embeds: [embedErrorBusqueda] });
    }
  }

  if (command === "trivia") {
    console.log("Trivia activada por:", message.author.tag);
    await manejarTrivia(message);
  }

  const respuestas8Ball = [
    "🎱 Sí, sin duda alguna!",
    "🎱 Todo apunta a que sí.",
    "🎱 Por supuesto, ¿qué otra cosa esperabas?",
    "🎱 Definitivamente sí.",
    "🎱 Parece que sí, pero no te confíes.",
    "🎱 Mis fuentes dicen que sí.",
    "🎱 Apostaría por ello.",
    "🎱 Claro que sí, campeón.",
    "🎱 Pregunta de nuevo, pero con más fe.",
    "🎱 No veo por qué no.",
    "🎱 Probablemente sí, pero depende de ti.",
    "🎱 La magia dice que sí.",
    "🎱 Lo veo difícil... pero no imposible.",
    "🎱 No cuentes con ello.",
    "🎱 La respuesta está en tu corazón.",
    "🎱 Parece que el universo está en tu contra.",
    "🎱 No en esta realidad... ni en ninguna otra.",
    "🎱 No tengo tiempo para responder, pero sí para ignorarte.",
    "🎱 Jajaja, buena esa. Ah, ¿hablabas en serio?",
    "🎱 Pregunta de nuevo más tarde, estoy ocupado viendo memes.",
    "🎱 Quizás, pero no le digas a nadie que lo dije.",
    "🎱 Si te lo digo, tendría que desaparecerte.",
    "🎱 Solo el destino lo sabe... y él no me responde.",
    "🎱 Las estrellas no están alineadas para esto.",
    "🎱 No puedo predecirlo ahora, me duele la cabeza.",
    "🎱 Pregúntale a tu gato, él lo sabe mejor que yo.",
    "🎱 La respuesta está en Google, no en mí.",
    "🎱 Respuesta no disponible, intente con más monedas.",
    "🎱 Si sigues preguntando, el destino cambiará su respuesta.",
    "🎱 Puede que sí, pero ¿realmente quieres saberlo?",
    "🎱 Si respondo, ¿me das una galleta?",
    "🎱 No sé, pero suena como una mala idea.",
    "🎱 No tengo pruebas, pero tampoco dudas.",
    "🎱 Es un misterio que ni yo puedo resolver.",
    "🎱 No tengo una bola de cristal, solo un código defectuoso.",
    "🎱 Pregunta mejor a tu abuela, seguro sabe más.",
    "🎱 Si te lo digo, no tendría gracia.",
    "🎱 Mi algoritmo no está programado para responder eso... o sí?",
    "🎱 El caos del universo no tiene una respuesta clara.",
    "🎱 Si sigues insistiendo, la respuesta será la misma.",
    "🎱 No puedo responder sin la presencia de mi abogado.",
    "🎱 Haz la pregunta en voz alta y espera a que el destino responda.",
    "🎱 Déjame consultar con la almohada... No, mejor no.",
    "🎱 Probablemente sí, pero no pongas todas tus esperanzas en ello.",
    "🎱 ¿Estás seguro de querer saberlo? A veces es mejor la incertidumbre.",
    "🎱 Solo el tiempo lo dirá.",
    "🎱 La magia está fallando, vuelve a preguntar más tarde.",
    "🎱 ¡Sí! Pero con una condición que no te voy a decir.",
    "🎱 Si te lo digo, perderá la magia.",
    "🎱 Demasiadas variables en juego, no puedo calcularlo.",
    "🎱 ¿Tienes otra pregunta? Esta no me gusta.",
  ];

  if (command === "8ball") {
    if (args.length < 2) {
      return message.reply("❓ **Hazme una pregunta!** Usa `.8ball <pregunta>`");
    }

    const pregunta = args.slice(1).join(" ");
    const respuesta = respuestas8Ball[Math.floor(Math.random() * respuestas8Ball.length)];

    const embed8Ball = new EmbedBuilder()
      .setColor("#800080")
      .setTitle("🔮 Bola 8 Mágica")
      .setDescription(`**Pregunta:** ${pregunta}\n**Respuesta:** ${respuesta}`)
      .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
      .setTimestamp();

    message.reply({ embeds: [embed8Ball] });
  }

  if (command === "memide") {
    let usuarioMencionado = message.mentions.users.first() || message.author;
    let medida = (Math.random() * (20 - 3) + 3).toFixed(2);

    let respuestas = [];

    if (medida < 4) {
      respuestas = [
        `💀 ${usuarioMencionado}, tu medida es de **${medida} cm**... hermano, la genética te jugó sucio.`,
        `😂 ${usuarioMencionado} sacó **${medida} cm**... bro, ni con aumento de Zoom se ve.`,
        `💀 ${usuarioMencionado}, tu **${medida} cm** necesita una lupa. Fuerte, hermano.`,
        `📉 ${usuarioMencionado}, con **${medida} cm**... esto sí es un microchip.`,
        `💀 ${usuarioMencionado}, **${medida} cm**... hermano, eso ya es un mito urbano.`,
      ];
    } else if (medida < 7) {
      respuestas = [
        `😂 ${usuarioMencionado}, sacó **${medida} cm**... no es el tamaño, es el cariño que le pongas.`,
        `🤏 ${usuarioMencionado} tiene **${medida} cm**... dicen que el tamaño no importa, ánimo.`,
        `🤨 ${usuarioMencionado}, con **${medida} cm**... bueno, podría ser peor, ¿no?`,
        `😬 ${usuarioMencionado}, **${medida} cm**... hay que encontrar el lado positivo, algún lado debe tener.`,
        `📏 ${usuarioMencionado} sacó **${medida} cm**... técnicamente, sigue contando.`,
      ];
    } else if (medida < 10) {
      respuestas = [
        `🤔 ${usuarioMencionado}, tu medida es de **${medida} cm**... en el promedio, campeón.`,
        `😏 ${usuarioMencionado} tiene **${medida} cm**... nada mal, nada mal.`,
        `📊 ${usuarioMencionado} midió **${medida} cm**... estadísticamente aceptable.`,
        `🏆 ${usuarioMencionado}, **${medida} cm**... no rompes récords, pero respetable.`,
        `👌 ${usuarioMencionado} marca **${medida} cm**... lo justo y necesario.`,
      ];
    } else if (medida < 14) {
      respuestas = [
        `🔥 ${usuarioMencionado} con **${medida} cm**... digno de respeto.`,
        `🚀 ${usuarioMencionado} alcanzó **${medida} cm**... bien ahí, campeón.`,
        `👀 ${usuarioMencionado}, **${medida} cm**... ya estás en la zona top.`,
        `📏 ${usuarioMencionado}, con **${medida} cm**... más que suficiente para ser un crack.`,
        `😎 ${usuarioMencionado} tiene **${medida} cm**... nada de qué quejarse.`,
      ];
    } else {
      respuestas = [
        `🔥 ${usuarioMencionado} marcó **${medida} cm**... ¿seguro que eso es real?`,
        `🚀 ${usuarioMencionado}, **${medida} cm**... NASA quiere hablar contigo.`,
        `🐍 ${usuarioMencionado} reporta **${medida} cm**... eso ya es ilegal en algunos países.`,
        `📏 ${usuarioMencionado}, **${medida} cm**... eso es de otro nivel.`,
        `😳 ${usuarioMencionado} con **${medida} cm**... eso ya es para presumir.`,
      ];
    }

    let respuestaAleatoria = respuestas[Math.floor(Math.random() * respuestas.length)];
    message.channel.send(respuestaAleatoria);
  }

  if (command === "kiss") {
    if (args.length < 2 || message.mentions.users.size === 0) {
      return message.reply("💋 Usa el comando así: `.kiss @usuario`.");
    }

    const usuarioMencionado = message.mentions.users.first();
    const respuestas = [
      `😘 ${usuarioMencionado}, te han mandado un besito! ❤️`,
      `💋 Uy, qué romántico! ${usuarioMencionado} recibió un beso inesperado! 😘`,
      `💕 ${usuarioMencionado}, el amor está en el aire! Hasta en el servidor hay momentos tiernos. 🥰`,
      `😍 ${usuarioMencionado} ha sido besado estratégicamente para distraerlo!`,
      `💖 ${usuarioMencionado}, alguien está intentando robarte el corazón!`,
      `💘 ${usuarioMencionado}, alguien te mandó un 1v1 de besitos. 😘`,
      `💞 Atención, ${usuarioMencionado} ha sido atacado con un BESITO CRÍTICO! 💋`,
      `🔥 ${usuarioMencionado} está en llamas... pero no por la pelea, sino por tanto amor! 😍`,
      `⚔️ Servidor detenido! ${usuarioMencionado} recibió un beso y ahora está demasiado confundido. 💋`,
      `🌹 ${usuarioMencionado}, en vez de pelear te han mandado un beso sorpresa. 😘`,
    ];

    const respuestaAleatoria = respuestas[Math.floor(Math.random() * respuestas.length)];
    message.channel.send(respuestaAleatoria);
  }

  if (command === "sorteo") {
    if (!message.member.permissions.has("Administrator")) {
      return message.channel.send("❌ Solo los administradores pueden iniciar un sorteo.");
    }

    const argsSinComando = args.slice(1);
    if (argsSinComando.length < 1) {
      return message.channel.send("❌ Usa el formato: `.sorteo <premio> [tiempo]`\nEjemplo: `.sorteo \"Cofre Misterioso\" 30m`");
    }

    let tiempoMilisegundos;
    let unidadTiempo;
    let premio;

    const ultimoArg = argsSinComando[argsSinComando.length - 1];
    if (/^\d+[mdh]$/.test(ultimoArg)) {
      const valor = parseInt(ultimoArg.slice(0, -1));
      unidadTiempo = ultimoArg.slice(-1);
      if (unidadTiempo === "m") tiempoMilisegundos = valor * 60 * 1000;
      else if (unidadTiempo === "h") tiempoMilisegundos = valor * 60 * 60 * 1000;
      else if (unidadTiempo === "d") tiempoMilisegundos = valor * 24 * 60 * 60 * 1000;
      premio = argsSinComando.slice(0, -1).join(" ");
    } else {
      tiempoMilisegundos = 60 * 60 * 1000; // 1 hora por defecto
      unidadTiempo = "h";
      premio = argsSinComando.join(" ");
    }

    if (!premio) premio = "un premio sorpresa 🎁";
    const fechaFin = DateTime.now().plus({ milliseconds: tiempoMilisegundos }).toSeconds();
    const creador = message.author;

    let imagenUrl = null;
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (attachment.contentType.startsWith("image/")) {
        imagenUrl = attachment.url;
        console.log(`🖼️ Imagen detectada para el sorteo: ${imagenUrl}`);
      }
    }

    let mensajeSorteo = null;
    try {
      const fileData = await getFileContentFromGitHub();
      const fileContent = fileData.content;
      const sorteoExistente = fileContent.find((s) => DateTime.fromISO(s.fechaFin) > DateTime.now() && !s.ganador);
      if (sorteoExistente) {
        for (const guild of bot.guilds.cache.values()) {
          for (const channel of guild.channels.cache.values()) {
            if (channel.isTextBased()) {
              try {
                mensajeSorteo = await channel.messages.fetch(sorteoExistente.id);
                if (mensajeSorteo) break;
              } catch (fetchError) {
                if (fetchError.code !== 10008) throw fetchError;
              }
            }
          }
          if (mensajeSorteo) break;
        }
        if (mensajeSorteo) {
          await message.channel.send(`⚠️ Ya hay un sorteo activo en el canal <#${mensajeSorteo.channel.id}>. Usa ese mensaje para participar.`);
          return;
        }
      }
    } catch (error) {
      console.error("❌ Error al verificar sorteos existentes:", error.message);
    }

    const embedSorteo = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("🎉 ¡Sorteo!")
      .setDescription(
        `¡Participa reaccionando con ✅!\n\n**Premio:** ${premio}\n**Creado por:** ${creador.tag} (<@${creador.id}>)\n**Termina:** <t:${Math.floor(fechaFin)}:R>`
      )
      .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
      .setTimestamp();
    if (imagenUrl) embedSorteo.setImage(imagenUrl);

    mensajeSorteo = await message.channel.send({ content: "@everyone", embeds: [embedSorteo] });
    await mensajeSorteo.react("✅");
    console.log(`🎉 Sorteo iniciado por ${creador.tag}. ID: ${mensajeSorteo.id}, Canal: ${message.channel.id}`);

    const sorteoData = {
      id: mensajeSorteo.id,
      premio: premio,
      creador: { id: creador.id, tag: creador.tag },
      fechaFin: DateTime.fromSeconds(fechaFin).toISO(),
      participantes: [],
      ganador: null,
      imagen: imagenUrl || null,
    };

    try {
      let fileData = await getFileContentFromGitHub();
      let fileContent = fileData.content;
      let sha = fileData.sha;
      if (!Array.isArray(fileContent)) fileContent = [];
      fileContent.push(sorteoData);
      if (sha) {
        await updateFileInGitHub(fileContent, sha);
      } else {
        sha = await createFileInGitHub(fileContent);
      }
      console.log(`📝 Sorteo ${mensajeSorteo.id} guardado inicialmente en GitHub`);
    } catch (error) {
      console.error(`❌ Fallo al guardar sorteo inicial ${mensajeSorteo.id} en GitHub:`, error.message);
    }

    const participantes = new Set();
    const filtro = (reaction, user) => reaction.emoji.name === "✅" && !user.bot;
    const collector = mensajeSorteo.createReactionCollector({ filter: filtro, time: tiempoMilisegundos });

    const reaccionInicial = mensajeSorteo.reactions.cache.get("✅");
    if (reaccionInicial) {
      const usuarios = await reaccionInicial.users.fetch();
      usuarios.forEach((user) => !user.bot && participantes.add(user));
    }

    collector.on("collect", async (reaction, user) => {
      participantes.add(user);
      console.log(`✅ ${user.tag} participó en el sorteo ${mensajeSorteo.id}`);
      sorteosActivos.get(mensajeSorteo.id).participantes = participantes;
      await actualizarSorteoEnGitHub(mensajeSorteo.id);
    });

    const intervaloActualizacion = setInterval(async () => {
      await actualizarSorteoEnGitHub(mensajeSorteo.id);
    }, 1 * 60 * 1000);

    collector.on("end", async () => {
      clearInterval(intervaloActualizacion);
      console.log(`⏰ Sorteo ${mensajeSorteo.id} ha finalizado. Participantes: ${participantes.size}`);
      await finalizarSorteo(mensajeSorteo.id, mensajeSorteo, participantes, premio);
    });

    sorteosActivos.set(mensajeSorteo.id, {
      premio: premio,
      creador: creador,
      fechaFin: DateTime.fromSeconds(fechaFin).toMillis(),
      participantes: participantes,
      collector: collector,
      mensaje: mensajeSorteo,
      intervalo: intervaloActualizacion,
    });

    await message.channel.send(
      `✅ Sorteo iniciado correctamente por ${creador.tag}. Termina en ${
        unidadTiempo === "m"
          ? `${tiempoMilisegundos / 60000} minutos`
          : unidadTiempo === "h"
          ? `${tiempoMilisegundos / (60 * 60 * 1000)} horas`
          : `${tiempoMilisegundos / (24 * 60 * 60 * 1000)} días`
      }.`
    );
  }

  if (command === "resumesort") {
    if (!message.member.permissions.has("Administrator")) {
      return message.channel.send("❌ Solo los administradores pueden reanudar un sorteo.");
    }

    const canalId = args[1];
    const mensajeId = args[2];
    if (!canalId || !mensajeId) {
      return message.reply("❌ Usa: `.resumesort <canalId> <mensajeId>`\nEjemplo: `.resumesort 123456789012345678 987654321098765432`");
    }

    try {
      const canal = await bot.channels.fetch(canalId);
      if (!canal) return message.reply("❌ No encontré ese canal. Verifica el ID.");

      const mensajeSorteo = await canal.messages.fetch(mensajeId);
      const embedOriginal = mensajeSorteo.embeds[0];
      if (!embedOriginal || embedOriginal.title !== "🎉 ¡Sorteo!") {
        return message.reply("❌ Ese mensaje no parece ser un sorteo válido.");
      }

      const descripcion = embedOriginal.description;
      const match = descripcion.match(/<t:(\d+):R>/);
      if (!match) return message.reply("❌ No pude encontrar la fecha de finalización en el sorteo.");

      const fechaFin = parseInt(match[1], 10);
      const fin = DateTime.fromSeconds(fechaFin).setZone("America/Guayaquil");
      const ahora = DateTime.now().setZone("America/Guayaquil");
      const tiempoRestanteMs = fin.diff(ahora).as("milliseconds");

      const premioMatch = descripcion.match(/\*\*Premio:\*\* (.+?)\n/);
      const premio = premioMatch ? premioMatch[1] : "un premio sorpresa 🎁";

      if (tiempoRestanteMs <= 0) {
        const reaccion = mensajeSorteo.reactions.cache.get("✅");
        let participantes = new Set();
        if (reaccion) {
          const usuarios = await reaccion.users.fetch();
          usuarios.forEach((user) => !user.bot && participantes.add(user));
        }

        const participantesArray = Array.from(participantes);
        if (participantesArray.length === 0) {
          const embedNoGanador = new EmbedBuilder()
            .setColor("#e74c3c")
            .setTitle("❌ Sorteo finalizado")
            .setDescription("No hubo participantes en el sorteo. 😢")
            .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
            .setTimestamp();
          await mensajeSorteo.edit({ embeds: [embedNoGanador] });
          return message.reply("✅ Sorteo ya había terminado sin participantes.");
        }

        const ganador = participantesArray[Math.floor(Math.random() * participantesArray.length)];
        const embedGanador = new EmbedBuilder()
          .setColor("#ffd700")
          .setTitle("🏆 ¡Sorteo Finalizado!")
          .setDescription(
            `¡Felicidades ${ganador.tag}! Has ganado **${premio}**. 🎉\nContáctate con un administrador para reclamar tu premio.`
          )
          .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
          .setTimestamp();

        await mensajeSorteo.edit({ embeds: [embedGanador] });
        await canal.send({ content: "@everyone", embeds: [embedGanador] });
        return message.reply("✅ Sorteo ya había terminado, ganador anunciado.");
      }

      const embedActualizado = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("🎉 ¡Sorteo!")
        .setDescription(`¡Participa reaccionando con ✅!\n\n**Premio:** ${premio}\n**Termina:** <t:${Math.floor(fechaFin)}:R>`)
        .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
        .setTimestamp();
      await mensajeSorteo.edit({ embeds: [embedActualizado] });

      const filtro = (reaction, user) => reaction.emoji.name === "✅" && !user.bot;
      const collector = mensajeSorteo.createReactionCollector({ filter: filtro, time: tiempoRestanteMs });

      let participantes = new Set();
      const reaccion = mensajeSorteo.reactions.cache.get("✅");
      if (reaccion) {
        const usuarios = await reaccion.users.fetch();
        usuarios.forEach((user) => !user.bot && participantes.add(user));
      }

      collector.on("collect", (reaction, user) => {
        participantes.add(user);
      });

      collector.on("end", async () => {
        await finalizarSorteo(mensajeSorteo.id, mensajeSorteo, participantes, premio);
      });

      message.reply(`✅ Sorteo reanudado en el mensaje original. Termina en <t:${Math.floor(fechaFin)}:R>.`);
    } catch (error) {
      console.error("❌ Error al reanudar el sorteo:", error.message);
      message.reply("❌ No pude reanudar el sorteo. Verifica los IDs o los permisos.");
    }
  }

  if (command === "entregar") {
    if (!message.member.permissions.has("Administrator")) {
      return message.channel.send("❌ Solo los administradores pueden registrar la entrega de un sorteo.");
    }

    const sorteoId = args[1];
    const ganadorTag = args[2];

    if (!sorteoId || !ganadorTag) {
      return message.channel.send("❌ Usa el formato: `.entregar <sorteoId> <ganador>`\nEjemplo: `.entregar 1345194140069269644 isteve98_`");
    }

    try {
      const entregaChannel = await bot.channels.fetch(ENTREGA_CHANNEL_ID);
      if (!entregaChannel) {
        return message.channel.send("❌ No encontré el canal de entrega. Verifica el ID.");
      }

      const fileData = await getFileContentFromGitHub();
      const fileContent = fileData.content;
      const sorteo = fileContent.find((s) => s.id === sorteoId);

      if (!sorteo) {
        return message.channel.send("❌ No encontré un sorteo con ese ID en los registros.");
      }

      const premio = sorteo.premio || "un premio sorpresa 🎁";
      const ganadorRegistrado = sorteo.ganador ? sorteo.ganador.tag : "No asignado";

      if (ganadorRegistrado !== ganadorTag) {
        return message.channel.send(`❌ El ganador registrado (${ganadorRegistrado}) no coincide con el proporcionado (${ganadorTag}).`);
      }

      const entregaEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("🎁 ¡Sorteo Entregado!")
        .setDescription(`El premio del sorteo ha sido entregado con éxito.\n\n**Ganador:** ${ganadorTag}\n**Premio:** ${premio}`)
        .setThumbnail("https://i.imgur.com/YV9TL5b.png")
        .addFields(
          { name: "ID del Sorteo", value: sorteoId, inline: true },
          { name: "Fecha de Entrega", value: `<t:${Math.floor(DateTime.now().toSeconds())}:R>`, inline: true }
        )
        .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
        .setTimestamp();

      await entregaChannel.send({ embeds: [entregaEmbed] });
      console.log(`✅ Mensaje de entrega enviado al canal ${ENTREGA_CHANNEL_ID} para sorteo ${sorteoId}`);
      message.reply(`✅ Entrega registrada y mensaje enviado al canal <#${ENTREGA_CHANNEL_ID}>.`);
    } catch (error) {
      console.error("❌ Error al registrar entrega:", error.message);
      message.channel.send("❌ Hubo un error al registrar la entrega. Verifica los datos e intenta de nuevo.");
    }
  }

  if (command === "extendersorteo") {
    if (!message.member.permissions.has("Administrator")) {
      return message.channel.send("❌ Solo los administradores pueden extender un sorteo.");
    }

    const canalId = args[1];
    const mensajeId = args[2];
    const tiempoAdicional = args[3];

    if (!canalId || !mensajeId || !tiempoAdicional) {
      return message.channel.send(
        "❌ Usa: `.extendersorteo <canalId> <mensajeId> <tiempoAdicional>`\nEjemplo: `.extendersorteo 1344529511097827348 1344848938120773723 10m`"
      );
    }

    let tiempoAdicionalMs;
    if (/^\d+[mdh]$/.test(tiempoAdicional)) {
      const valor = parseInt(tiempoAdicional.slice(0, -1));
      const unidad = tiempoAdicional.slice(-1);
      if (unidad === "m") tiempoAdicionalMs = valor * 60 * 1000;
      else if (unidad === "h") tiempoAdicionalMs = valor * 60 * 60 * 1000;
      else if (unidad === "d") tiempoAdicionalMs = valor * 24 * 60 * 60 * 1000;
    } else {
      return message.channel.send("❌ El tiempo adicional debe terminar en 'm' (minutos), 'h' (horas) o 'd' (días). Ejemplo: `10m` o `1d`.");
    }

    try {
      const canal = await bot.channels.fetch(canalId);
      if (!canal) return message.channel.send("❌ No encontré ese canal. Verifica el ID.");

      const mensajeSorteo = await canal.messages.fetch(mensajeId);
      const embedOriginal = mensajeSorteo.embeds[0];
      if (!embedOriginal || !embedOriginal.title.startsWith("🎉 ¡Sorteo!")) {
        return message.channel.send("❌ Ese mensaje no parece ser un sorteo válido.");
      }

      const descripcion = embedOriginal.description;
      const match = descripcion.match(/<t:(\d+):R>/);
      if (!match) return message.channel.send("❌ No pude encontrar la fecha de finalización en el sorteo.");

      const fechaFinActual = parseInt(match[1], 10) * 1000;
      const ahora = DateTime.now().toMillis();
      const tiempoRestanteMs = fechaFinActual - ahora;

      if (tiempoRestanteMs <= 0) {
        return message.channel.send("❌ El sorteo ya ha terminado. Usa `.resumesort` para finalizarlo manualmente si no se ha cerrado.");
      }

      const nuevaFechaFinMs = fechaFinActual + tiempoAdicionalMs;
      const nuevaFechaFinSegundos = Math.floor(nuevaFechaFinMs / 1000);

      const premioMatch = descripcion.match(/\*\*Premio:\*\* (.+?)\n/);
      const premio = premioMatch ? premioMatch[1] : "un premio sorpresa 🎁";

      const embedActualizado = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("🎉 ¡Sorteo! (Tiempo extendido)")
        .setDescription(`¡Participa reaccionando con ✅!\n\n**Premio:** ${premio}\n**Termina:** <t:${nuevaFechaFinSegundos}:R>`)
        .setFooter({ text: "Oliver", iconURL: bot.user.displayAvatarURL() })
        .setTimestamp();
      await mensajeSorteo.edit({ embeds: [embedActualizado] });

      const filtro = (reaction, user) => reaction.emoji.name === "✅" && !user.bot;
      const collector = mensajeSorteo.createReactionCollector({ filter: filtro, time: tiempoRestanteMs + tiempoAdicionalMs });

      let participantes = new Set();
      const reaccion = mensajeSorteo.reactions.cache.get("✅");
      if (reaccion) {
        const usuarios = await reaccion.users.fetch();
        usuarios.forEach((user) => !user.bot && participantes.add(user));
      }

      collector.on("collect", (reaction, user) => {
        participantes.add(user);
      });

      collector.on("end", async () => {
        await finalizarSorteo(mensajeSorteo.id, mensajeSorteo, participantes, premio);
      });

      await message.channel.send(
        `✅ Sorteo extendido correctamente. Nuevo tiempo restante: ${Math.floor((tiempoRestanteMs + tiempoAdicionalMs) / 60000)} minutos.`
      );
    } catch (error) {
      console.error("❌ Error al extender el sorteo:", error.message);
      await message.channel.send("❌ No pude extender el sorteo. Verifica los IDs o los permisos.");
    }
  }
});

bot.once("ready", async () => {
  console.log(`✅ Bot iniciado como ${bot.user.tag}`);

  await enviarEmbedCumple(bot);

  try {
    const fileData = await getFileContentFromGitHub();
    const fileContent = fileData.content;
    if (Array.isArray(fileContent)) {
      for (const sorteo of fileContent) {
        const ahora = DateTime.now().toMillis();
        const fechaFinMs = DateTime.fromISO(sorteo.fechaFin).toMillis();
        const tiempoRestanteMs = fechaFinMs - ahora;

        if (tiempoRestanteMs > 0 && !sorteo.ganador) {
          let mensajeSorteo = null;
          try {
            for (const guild of bot.guilds.cache.values()) {
              for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                  try {
                    mensajeSorteo = await channel.messages.fetch(sorteo.id);
                    console.log(`✅ Mensaje ${sorteo.id} encontrado en canal ${channel.id} del servidor ${guild.id}`);
                    break;
                  } catch (fetchError) {
                    if (fetchError.code !== 10008) throw fetchError;
                  }
                }
              }
              if (mensajeSorteo) break;
            }

            if (!mensajeSorteo) {
              console.error(`❌ Mensaje ${sorteo.id} no encontrado`);
              continue;
            }

            const participantes = new Set(sorteo.participantes.map((p) => bot.users.cache.get(p.id) || { id: p.id, tag: p.tag }));
            const creador = { id: sorteo.creador.id, tag: sorteo.creador.tag };
            const filtro = (reaction, user) => reaction.emoji.name === "✅" && !user.bot;
            const collector = mensajeSorteo.createReactionCollector({ filter: filtro, time: tiempoRestanteMs });

            collector.on("collect", async (reaction, user) => {
              participantes.add(user);
              console.log(`✅ ${user.tag} participó en el sorteo ${mensajeSorteo.id}`);
              sorteosActivos.get(mensajeSorteo.id).participantes = participantes;
              await actualizarSorteoEnGitHub(mensajeSorteo.id);
            });

            collector.on("end", async () => {
              await finalizarSorteo(sorteo.id, mensajeSorteo, participantes, sorteo.premio);
            });

            const intervaloActualizacion = setInterval(async () => {
              await actualizarSorteoEnGitHub(mensajeSorteo.id);
            }, 30 * 1000);

            sorteosActivos.set(sorteo.id, {
              premio: sorteo.premio,
              creador: creador,
              fechaFin: fechaFinMs,
              participantes: participantes,
              collector: collector,
              mensaje: mensajeSorteo,
              intervalo: intervaloActualizacion,
            });

            console.log(`✅ Sorteo ${sorteo.id} restaurado con ${participantes.size} participantes, creado por ${creador.tag}`);
          } catch (error) {
            console.error(`❌ Error al restaurar sorteo ${sorteo.id}:`, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error al cargar sorteos al iniciar:", error.message);
  }
});

process.on("SIGTERM", async () => {
  console.log("🛑 Bot detenido. Guardando sorteos activos...");
  for (const [sorteoId, sorteoActivo] of sorteosActivos) {
    await actualizarSorteoEnGitHub(sorteoId);
  }
  process.exit(0);
});

// Iniciar el bot
bot.login(TOKEN);
