require('dotenv').config({ path: '.env' });
const venom = require('venom-bot');
const OpenAI = require('openai');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Variables de entorno y configuración
const isProduction = process.env.PRODUCTION === 'true' || process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

// Variables globales para QR y estado del bot
let qrCode = '';
let botStatus = 'Iniciando...';
let venomClient = null;

// Servidor Express
const app = express();

// Endpoints principales
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>STEPS WhatsApp Bot PRO</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f0f0f0; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          .status { padding: 10px; border-radius: 5px; margin: 20px 0; }
          .active { background: #d4edda; color: #155724; }
          .waiting { background: #fff3cd; color: #856404; }
          .error { background: #f8d7da; color: #721c24; }
          .qr-section { margin: 30px 0; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 STEPS WhatsApp Bot PRO</h1>
          <div class="status ${botStatus.includes('Conectado') ? 'active' : botStatus.includes('Error') ? 'error' : 'waiting'}">
            <strong>Estado:</strong> ${botStatus}
          </div>
          <div class="qr-section">
            ${qrCode ? `
              <h2>📱 Escanea este QR con WhatsApp</h2>
              <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
                <pre style="font-size: 8px; line-height: 8px;">${qrCode}</pre>
              </div>
              <p><em>Abre WhatsApp → Menú → Dispositivos vinculados → Vincular dispositivo</em></p>
            ` : ''}
          </div>
          <div style="margin-top: 30px;">
            <h3>🚀 Funcionalidades</h3>
            <ul style="text-align: left;">
              <li>🧠 IA DeepSeek (GRATIS)</li>
              <li>📱 Quick Replies interactivos</li>
              <li>👟 Catálogo Nike y Adidas</li>
              <li>👨‍💼 Derivación a asesor humano</li>
              <li>🌐 Redirección a steps.co</li>
            </ul>
          </div>
        </div>
        <script>
          // Auto-refresh cada 10 segundos para actualizar estado
          setTimeout(() => window.location.reload(), 10000);
        </script>
      </body>
    </html>
  `);
});

app.get('/status', (req, res) => res.json({ 
  status: botStatus,
  hasQR: !!qrCode,
  isProduction: isProduction,
  model: 'deepseek-chat',
  tokensUsed: tokenCount,
  dailyLimit: dailyLimit,
  activeConversations: conversaciones.size,
  timestamp: new Date().toISOString()
}));

app.get('/qr', (req, res) => {
  if (qrCode) {
    res.json({ qr: qrCode, status: 'available' });
  } else {
    res.json({ status: 'not_available', message: 'QR no disponible. El bot puede estar conectado.' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🌐 Servidor corriendo en puerto ${port}`);
  console.log(`📱 Dashboard: ${isProduction ? 'https://tu-app.fly.dev' : `http://localhost:${port}`}`);
  console.log(`🔧 Modo: ${isProduction ? 'PRODUCCIÓN' : 'LOCAL'}`);
});

// Override para usar OPENROUTER_API_KEY
if (!process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
}

// Configura OpenRouter con DeepSeek
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "https://steps-bot.fly.dev",
    "X-Title": process.env.SITE_NAME || "STEPS WhatsApp Bot",
  },
});

// Sistema de conversaciones
let tokenCount = 0;
let dailyLimit = 500000;
const conversaciones = new Map();
const limiteMensajesPorChat = 10;
const numeroAsesor = "573181472095";

// Funciones principales
function estimarTokens(texto) {
  return Math.ceil(texto.length / 4);
}

function obtenerContexto(userId) {
  if (!conversaciones.has(userId)) {
    conversaciones.set(userId, {
      mensajes: 0,
      historial: [],
      derivadoAsesor: false,
      iaDesactivada: false
    });
  }
  return conversaciones.get(userId);
}

const baseDatos = {
  nike: {
    modelos: ["Air Max 90", "Air Max 270", "Air Force 1", "Jordan 1", "React Infinity", "Zoom Pegasus"],
    precios: "Desde $150.000 hasta $450.000 COP",
    caracteristicas: "Tecnología Air, comodidad superior, diseños icónicos"
  },
  adidas: {
    modelos: ["Ultraboost 22", "Stan Smith", "Superstar", "NMD R1", "Gazelle", "Forum Low"],
    precios: "Desde $120.000 hasta $380.000 COP", 
    caracteristicas: "Tecnología Boost, diseño alemán, materiales premium"
  }
};

// Función IA
async function responderIA(mensajeUsuario, contexto) {
  console.log(`🤖 Procesando: "${mensajeUsuario}"`);
  
  try {
    const tokensEstimados = estimarTokens(mensajeUsuario) + 200;
    
    if (tokenCount + tokensEstimados > dailyLimit) {
      return '⚠️ Límite diario alcanzado. El bot se reactivará mañana.';
    }

    const mensajesConContexto = [
      {
        role: 'system',
        content: `Eres un experto en zapatillas de STEPS, especializado en Nike y Adidas. 

PRODUCTOS:
Nike: ${JSON.stringify(baseDatos.nike)}
Adidas: ${JSON.stringify(baseDatos.adidas)}

INSTRUCCIONES:
- Solo habla de zapatillas Nike y Adidas
- Mantén la conversación enfocada en calzado deportivo
- Si preguntan por otras marcas, redirige a Nike/Adidas
- Sé específico con modelos y precios
- Si necesitan info detallada, menciona que los conectarás con asesor
- Responde en español, amigable y profesional
- Máximo 150 palabras`
      },
      ...contexto.historial.slice(-4),
      { role: 'user', content: mensajeUsuario }
    ];

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat:free',
      messages: mensajesConContexto,
      max_tokens: 150,
    });
    
    tokenCount += completion.usage.total_tokens;
    console.log(`🔢 Tokens: ${completion.usage.total_tokens} | Total: ${tokenCount}/${dailyLimit}`);
    
    return completion.choices[0].message.content;
  } catch (err) {
    console.error('Error DeepSeek:', err);
    return 'Error temporal. ¿Puedes intentar de nuevo?';
  }
}

// Procesar selecciones
async function procesarSeleccion(client, userId, seleccion, contexto) {
  let respuesta = '';
  
  switch (seleccion) {
    case 'nike':
      respuesta = `👟 **NIKE - Modelos STEPS**\n\n🔥 **Catálogo:**\n• Air Max 90\n• Air Max 270\n• Air Force 1\n• Jordan 1\n• React Infinity Run\n• Zoom Pegasus\n\n💻 **Ver fotos y detalles:**\n🌐 **steps.co**`;
      contexto.iaDesactivada = true;
      break;
      
    case 'adidas':
      respuesta = `👟 **ADIDAS - Modelos STEPS**\n\n🔥 **Catálogo:**\n• Ultraboost 22\n• Stan Smith\n• Superstar\n• NMD R1\n• Gazelle\n• Forum Low\n\n💻 **Ver fotos y detalles:**\n🌐 **steps.co**`;
      contexto.iaDesactivada = true;
      break;
      
    case 'asesor':
      contexto.derivadoAsesor = true;
      contexto.iaDesactivada = true;
      respuesta = `👨‍💼 **Conectando con asesor especializado**\n\n⏰ **Un experto humano se hará cargo ahora**\n\n🤖 Mi función automática termina aquí.\n👤 Un asesor real de STEPS te atenderá.`;
      
      if (userId !== numeroAsesor) {
        await client.sendText(numeroAsesor, 
          `🚨 **ASESOR REQUERIDO**\n👤 Cliente: ${userId}\n🤖 IA desactivada - TÚ TIENES CONTROL\n⚠️ Responde AHORA`
        );
      }
      break;
      
    default:
      respuesta = '❓ Opción no reconocida. ¿En qué puedo ayudarte?';
  }
  
  await client.sendText(userId, respuesta);
  contexto.historial.push(
    { role: 'user', content: `Seleccionó: ${seleccion}` },
    { role: 'assistant', content: respuesta }
  );
  contexto.mensajes++;
  console.log(`✅ Procesado: ${seleccion}`);
}

// Quick replies
async function enviarQuickReplies(client, chatId, mensaje, opciones) {
  try {
    const sections = [{
      title: 'Opciones disponibles',
      rows: opciones.map(opcion => ({
        rowId: opcion.id,
        title: opcion.title,
        description: ''
      }))
    }];

    await client.sendListMessage(chatId, {
      text: mensaje,
      buttonText: 'Ver opciones',
      sections: sections,
      title: 'STEPS - Zapatillas',
      footer: 'Selecciona una opción'
    });
  } catch (error) {
    // Fallback a mensaje con opciones numeradas
    let mensajeConOpciones = mensaje + '\n\n';
    opciones.forEach((opcion, index) => {
      mensajeConOpciones += `${index + 1}. ${opcion.title}\n`;
    });
    mensajeConOpciones += '\n💬 Responde con el número.';
    await client.sendText(chatId, mensajeConOpciones);
  }
}

// Reiniciar contador diario
setInterval(() => {
  tokenCount = 0;
  console.log('🔄 Contador tokens reiniciado');
}, 24 * 60 * 60 * 1000);

// Configuración dinámica según entorno
const venomConfig = {
  session: 'steps-bot-pro',
  multidevice: true,
  folderNameToken: 'tokens',
  mkdirFolderToken: '',
  headless: isProduction, // TRUE en producción, FALSE en local
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: false, // Manejamos QR manualmente
  autoClose: false,
  browserArgs: isProduction ? [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ] : [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ],
  refreshQR: 15000,
  waitForLogin: 0,
};

// Iniciar Venom Bot
console.log(`🚀 Iniciando bot en modo ${isProduction ? 'PRODUCCIÓN' : 'LOCAL'}`);
botStatus = 'Iniciando Venom Bot...';

venom
  .create(venomConfig)
  .then((client) => {
    venomClient = client;
    start(client);
  })
  .catch((err) => {
    console.error('❌ Error iniciando bot:', err);
    botStatus = `Error: ${err.message}`;
  });

// Event listeners para QR
venom.ev.on('qr', (qr) => {
  qrCode = qr;
  botStatus = 'Esperando escaneo de QR...';
  console.log('📱 QR generado - Disponible en /');
});

venom.ev.on('connected', () => {
  qrCode = '';
  botStatus = 'Conectado ✅';
  console.log('✅ Bot conectado exitosamente');
});

venom.ev.on('disconnected', () => {
  botStatus = 'Desconectado - Reintentando...';
  console.log('🔄 Bot desconectado, reintentando...');
});

function start(client) {
  console.log('🤖 STEPS Bot PRO activo con DeepSeek!');
  console.log(`📊 Límite: ${dailyLimit} tokens/día`);
  console.log(`👨‍💼 Asesor: ${numeroAsesor}`);
  
  botStatus = 'Conectado y funcionando ✅';

  client.onMessage(async (message) => {
    if (message.body && !message.isGroupMsg) {
      const userId = message.from;
      const mensajeUsuario = message.body.toLowerCase();
      
      console.log(`📩 ${userId}: ${message.body}`);
      const contexto = obtenerContexto(userId);
      
      // IA desactivada - solo asesor humano
      if (contexto.iaDesactivada || contexto.derivadoAsesor) {
        console.log(`🚫 IA OFF para ${userId} - Asesor maneja`);
        return;
      }
      
      // Límite de mensajes
      if (contexto.mensajes >= limiteMensajesPorChat && !contexto.derivadoAsesor) {
        contexto.derivadoAsesor = true;
        await client.sendText(userId, 
          `🔄 Límite de ${limiteMensajesPorChat} mensajes alcanzado.\n\n👨‍💼 Te conectaré con un asesor humano.`
        );
        
        if (userId !== numeroAsesor) {
          await client.sendText(numeroAsesor, 
            `🆕 CLIENTE DERIVADO\n👤 ${userId}\n💬 ${contexto.mensajes} mensajes\n📝 "${message.body}"`
          );
        }
        return;
      }

      // Quick replies
      if (message.selectedButtonId || message.selectedRowId) {
        const seleccion = message.selectedButtonId || message.selectedRowId;
        await procesarSeleccion(client, userId, seleccion, contexto);
        return;
      }

      // Solicitud directa de asesor
      if (mensajeUsuario.includes('asesor') || mensajeUsuario.includes('humano') || mensajeUsuario.includes('comprar')) {
        contexto.derivadoAsesor = true;
        await client.sendText(userId, 
          `👨‍💼 ¡Perfecto! Te conectaré con un asesor especializado.\n\n⏰ Un experto se comunicará contigo pronto.`
        );
        
        if (userId !== numeroAsesor) {
          await client.sendText(numeroAsesor, 
            `🆕 SOLICITUD ASESOR\n👤 ${userId}\n📝 "${message.body}"`
          );
        }
        return;
      }

      // Procesar con IA
      contexto.mensajes++;
      contexto.historial.push({ role: 'user', content: message.body });

      const respuesta = await responderIA(message.body, contexto);
      
      contexto.historial.push({ role: 'assistant', content: respuesta });
      await client.sendText(userId, respuesta);

      // Quick replies para nuevos usuarios
      if (contexto.mensajes <= 2) {
        await enviarQuickReplies(client, userId, 
          '¿Qué te interesa ver? 👇', 
          [
            { id: 'nike', title: '👟 Nike' },
            { id: 'adidas', title: '👟 Adidas' }, 
            { id: 'asesor', title: '👨‍💼 Asesor Humano' }
          ]
        );
      }

      console.log(`✅ Respuesta enviada. Chat: ${contexto.mensajes}/${limiteMensajesPorChat}`);
    }
  });
}
