require('dotenv').config({ path: '.env' });
const venom = require('venom-bot');
const OpenAI = require('openai');

// Override para usar OPENROUTER_API_KEY en lugar de OPENAI_API_KEY
if (!process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
}

// Configura OpenRouter con DeepSeek (GRATIS!)
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "https://steps-bot.local",
    "X-Title": process.env.SITE_NAME || "STEPS WhatsApp Bot",
  },
});

// Contador de tokens para monitoreo
let tokenCount = 0;
let dailyLimit = 50000; // Límite más alto porque DeepSeek es GRATIS! 🎉

// Función para contar tokens aproximadamente
function estimarTokens(texto) {
  // Aproximación: 1 token ≈ 4 caracteres en español
  return Math.ceil(texto.length / 4);
}

// Función para responder con IA
async function responderIA(mensajeUsuario) {
  try {
    // Verificar límite de tokens
    const tokensEstimados = estimarTokens(mensajeUsuario) + 200; // +200 para la respuesta estimada
    
    if (tokenCount + tokensEstimados > dailyLimit) {
      return '⚠️ Límite diario de consultas alcanzado. El bot se reactivará mañana. ¡Gracias por tu paciencia!';
    }

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-r1:free',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente de una tienda llamada STEPS. Responde de forma clara, amigable y útil. Especializado en zapatillas deportivas. Solo en español. Mantén las respuestas concisas pero informativas.',
        },
        {
          role: 'user',
          content: mensajeUsuario,
        },
      ],
      max_tokens: 150, // Opcional: DeepSeek es gratuito, pero mantenemos por consistencia
    });
    
    // Actualizar contador de tokens
    tokenCount += completion.usage.total_tokens;
    console.log(`🔢 Tokens usados en esta consulta: ${completion.usage.total_tokens}`);
    console.log(`📊 Total tokens hoy: ${tokenCount}/${dailyLimit} (DeepSeek GRATIS! 🎉)`);
    
    return completion.choices[0].message.content;
  } catch (err) {
    console.error('Error al consultar DeepSeek:', err);
    
    // Mensajes de error más específicos
    if (err.response?.status === 429) {
      return '⏳ Muchas consultas muy rápido. Espera un momentito y vuelve a intentar.';
    } else if (err.response?.status === 401) {
      return '🔑 Problema con la configuración. Contacta al administrador.';
    }
    
    return 'Oops, algo falló... ¿Puedes intentar de nuevo?';
  }
}

// Reiniciar contador diario
setInterval(() => {
  tokenCount = 0;
  console.log('🔄 Contador de tokens reiniciado para nuevo día');
}, 24 * 60 * 60 * 1000); // 24 horas

// Arranca el bot
venom
  .create({
    session: 'steps-bot',
    multidevice: true,
    folderNameToken: 'tokens',
    mkdirFolderToken: '',
    headless: true,
    devtools: false,
    useChrome: true,
    debug: false,
    logQR: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    refreshQR: 15000,
    autoClose: 60000,
    waitForLogin: 60000,
  })
  .then((client) => start(client))
  .catch((err) => console.log(err));

function start(client) {
  console.log('🤖 Bot de WhatsApp STEPS corriendo con DeepSeek GRATIS! 🎉');
  console.log(`📊 Límite diario configurado: ${dailyLimit} tokens (sin costos!)`);

  client.onMessage(async (message) => {
    if (message.body && !message.isGroupMsg) {
      console.log(`📩 Mensaje de ${message.from}: ${message.body}`);

      // Llama a ChatGPT con el mensaje del usuario
      const respuesta = await responderIA(message.body);

      // Envía la respuesta
      await client.sendText(message.from, respuesta);
    }
  });
}
