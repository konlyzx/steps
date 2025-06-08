require('dotenv').config({ path: '.env' });
const venom = require('venom-bot');
const OpenAI = require('openai');
const express = require('express');

// Servidor Express para mantener el bot activo
const app = express();
app.get('/', (req, res) => res.send('🤖 Bot de WhatsApp STEPS activo ✅ - DeepSeek GRATIS!'));
app.get('/status', (req, res) => res.json({ 
  status: 'active', 
  model: 'deepseek-r1', 
  tokensUsed: tokenCount,
  dailyLimit: dailyLimit 
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌐 Servidor web escuchando en puerto ${port}`);
  console.log(`📱 Accede a http://localhost:${port} para ver el estado del bot`);
});

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
let dailyLimit = 50000000000000000000000000000000000000000000000000000000000000000000000000; // Límite más alto porque DeepSeek es GRATIS! 🎉

// Sistema de conversaciones y límites
const conversaciones = new Map(); // Para mantener contexto
const limiteMensajesPorChat = 10; // Límite de mensajes por conversación
const numeroAsesor = "573181472095"; // Número del asesor (pon tu número real aquí)

// Función para contar tokens aproximadamente
function estimarTokens(texto) {
  // Aproximación: 1 token ≈ 4 caracteres en español
  return Math.ceil(texto.length / 4);
}

// Función para obtener contexto de conversación
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

// Base de conocimiento de zapatillas
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

// Función para responder con IA
async function responderIA(mensajeUsuario, contexto) {
  console.log(`🤖 Procesando mensaje: "${mensajeUsuario}"`);
  
  try {
    // Verificar límite de tokens
    const tokensEstimados = estimarTokens(mensajeUsuario) + 200;
    
    if (tokenCount + tokensEstimados > dailyLimit) {
      return '⚠️ Límite diario de consultas alcanzado. El bot se reactivará mañana. ¡Gracias por tu paciencia!';
    }

    console.log(`🔧 Enviando consulta a DeepSeek...`);

    // Construir historial de conversación para contexto
    const mensajesConContexto = [
      {
        role: 'system',
        content: `Eres un experto en zapatillas de STEPS, especializado en Nike y Adidas. 

INFORMACIÓN DE PRODUCTOS:
Nike: ${JSON.stringify(baseDatos.nike)}
Adidas: ${JSON.stringify(baseDatos.adidas)}

INSTRUCCIONES:
- Solo habla de zapatillas Nike y Adidas
- Mantén la conversación enfocada en calzado deportivo
- Si preguntan por otras marcas, redirige a Nike/Adidas
- Sé específico con modelos y precios
- Si necesitan información detallada o quieren comprar, menciona que los conectarás con un asesor
- Responde en español, de forma amigable y profesional
- Máximo 150 palabras por respuesta`
      },
      ...contexto.historial.slice(-4), // Últimos 4 mensajes para contexto
      {
        role: 'user',
        content: mensajeUsuario,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat:free',
      messages: mensajesConContexto,
      max_tokens: 150,
    });
    
    // Actualizar contador de tokens
    tokenCount += completion.usage.total_tokens;
    console.log(`🔢 Tokens usados en esta consulta: ${completion.usage.total_tokens}`);
    console.log(`📊 Total tokens hoy: ${tokenCount}/${dailyLimit} (DeepSeek GRATIS! 🎉)`);
    
    const respuesta = completion.choices[0].message.content;
    console.log(`✅ Respuesta generada: "${respuesta}"`);
    
    return respuesta;
  } catch (err) {
    console.error('Error al consultar DeepSeek:', err);
    
    if (err.response?.status === 429) {
      return '⏳ Muchas consultas muy rápido. Espera un momentito y vuelve a intentar.';
    } else if (err.response?.status === 401) {
      return '🔑 Problema con la configuración. Contacta al administrador.';
    }
    
    return 'Oops, algo falló... ¿Puedes intentar de nuevo?';
  }
}

// Función para procesar selecciones de quick replies
async function procesarSeleccion(client, userId, seleccion, contexto) {
  let respuesta = '';
  
  switch (seleccion) {
    case 'nike':
      respuesta = `👟 **NIKE - Modelos Disponibles en STEPS**\n\n` +
                 `🔥 **Catálogo actual:**\n` +
                 `• Air Max 90\n` +
                 `• Air Max 270\n` +
                 `• Air Force 1\n` +
                 `• Jordan 1\n` +
                 `• React Infinity Run\n` +
                 `• Zoom Pegasus\n\n` +
                 `💻 **Para ver mejor cada producto, fotos y detalles completos visita:**\n` +
                 `🌐 **steps.co**\n\n` +
                 `📱 Ahí encontrarás toda la información detallada de cada modelo.`;
      
      // Marcar que ya seleccionó y detener IA para este usuario
      contexto.iaDesactivada = true;
      break;
      
    case 'adidas':
      respuesta = `👟 **ADIDAS - Modelos Disponibles en STEPS**\n\n` +
                 `🔥 **Catálogo actual:**\n` +
                 `• Ultraboost 22\n` +
                 `• Stan Smith\n` +
                 `• Superstar\n` +
                 `• NMD R1\n` +
                 `• Gazelle\n` +
                 `• Forum Low\n\n` +
                 `💻 **Para ver mejor cada producto, fotos y detalles completos visita:**\n` +
                 `🌐 **steps.co**\n\n` +
                 `📱 Ahí encontrarás toda la información detallada de cada modelo.`;
      
      // Marcar que ya seleccionó y detener IA para este usuario
      contexto.iaDesactivada = true;
      break;
      

      
    case 'asesor':
      // IA se desconecta completamente - asesor humano toma control
      contexto.derivadoAsesor = true;
      contexto.iaDesactivada = true;
      
      respuesta = `👨‍💼 **Te estoy conectando con un asesor especializado**\n\n` +
                 `⏰ **Un experto humano se hará cargo de tu consulta ahora**\n\n` +
                 `🤖 Mi función como asistente automático termina aquí.\n` +
                 `👤 A partir de este momento, un asesor real de STEPS te atenderá personalmente.`;
                 
      // Notificar al asesor que debe tomar control INMEDIATAMENTE
      if (userId !== numeroAsesor) {
        await client.sendText(numeroAsesor, 
          `🚨 **ASESOR REQUERIDO - TOMAR CONTROL YA**\n\n` +
          `👤 **Cliente:** ${userId}\n` +
          `🤖 **Estado:** IA desactivada - TÚ TIENES CONTROL\n` +
          `📝 **Acción:** Cliente pidió asesor humano\n\n` +
          `⚠️ **IMPORTANTE:** Responde AHORA - el bot automático ya no funcionará para este cliente.\n` +
          `💬 Todos los mensajes futuros los debes manejar TÚ manualmente.`
        );
      }
      break;
      
    default:
      respuesta = 'Opción no reconocida. ¿En qué puedo ayudarte?';
  }
  
  await client.sendText(userId, respuesta);
  
  // Agregar al historial
  contexto.historial.push({
    role: 'user',
    content: `Seleccionó: ${seleccion}`
  });
  
  contexto.historial.push({
    role: 'assistant',
    content: respuesta
  });
  
  contexto.mensajes++;
  console.log(`✅ Selección procesada: ${seleccion}`);
}

// Función para enviar quick replies con sintaxis correcta de Venom
async function enviarQuickReplies(client, chatId, mensaje, opciones) {
  try {
    // Crear lista de opciones
    const sections = [{
      title: 'Opciones disponibles',
      rows: opciones.map((opcion, index) => ({
        rowId: opcion.id,
        title: opcion.title,
        description: ''
      }))
    }];

    const listMessage = {
      text: mensaje,
      buttonText: 'Ver opciones',
      sections: sections,
      title: 'STEPS - Zapatillas',
      footer: 'Selecciona una opción'
    };

    await client.sendListMessage(chatId, listMessage);
    console.log('✅ Quick replies enviados correctamente');
  } catch (error) {
    console.log('⚠️ Lista no soportada, enviando botones simples');
    
    // Fallback: enviar botones simples
    try {
      const buttons = opciones.map(opcion => ({
        buttonId: opcion.id,
        buttonText: { displayText: opcion.title },
        type: 1
      }));

      await client.sendButtons(chatId, mensaje, buttons, 'STEPS - Zapatillas');
      console.log('✅ Botones simples enviados');
    } catch (error2) {
      console.log('⚠️ Botones no soportados, enviando mensaje con opciones');
      
      // Último fallback: mensaje de texto con opciones numeradas
      let mensajeConOpciones = mensaje + '\n\n';
      opciones.forEach((opcion, index) => {
        mensajeConOpciones += `${index + 1}. ${opcion.title}\n`;
      });
      mensajeConOpciones += '\n💬 Responde con el número de tu elección.';
      
      await client.sendText(chatId, mensajeConOpciones);
      console.log('✅ Mensaje con opciones numeradas enviado');
    }
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
    session: 'bot-kevin',
    multidevice: true,
    folderNameToken: 'tokens',
    mkdirFolderToken: '',
    headless: false, // Cambiado a false para mostrar el QR claramente
    devtools: false,
    useChrome: true,
    debug: false,
    logQR: true,
    autoClose: false, // ¡¡Esto es clave!! - No cerrar automáticamente
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run'
    ],
    refreshQR: 15000,
    waitForLogin: 0, // Sin timeout para login
  })
  .then((client) => start(client))
  .catch((err) => console.log(err));

function start(client) {
  console.log('🤖 Bot de WhatsApp STEPS PRO corriendo con DeepSeek GRATIS! 🎉');
  console.log(`📊 Límite diario configurado: ${dailyLimit} tokens (sin costos!)`);
  console.log(`👨‍💼 Número de asesor configurado: ${numeroAsesor}`);

  client.onMessage(async (message) => {
    if (message.body && !message.isGroupMsg) {
      const userId = message.from;
      const mensajeUsuario = message.body.toLowerCase();
      
      console.log(`📩 Mensaje de ${userId}: ${message.body}`);

      // Obtener contexto de conversación
      const contexto = obtenerContexto(userId);
      
      // SI LA IA ESTÁ DESACTIVADA, NO RESPONDER (asesor humano debe manejar)
      if (contexto.iaDesactivada || contexto.derivadoAsesor) {
        console.log(`🚫 IA desactivada para ${userId} - Asesor humano debe responder`);
        return; // No hacer nada, el asesor humano maneja todo
      }
      
      // Verificar límite de mensajes por chat
      if (contexto.mensajes >= limiteMensajesPorChat && !contexto.derivadoAsesor) {
        contexto.derivadoAsesor = true;
        await client.sendText(userId, 
          `🔄 Has alcanzado el límite de ${limiteMensajesPorChat} mensajes.\n\n` +
          `👨‍💼 Te voy a conectar con un asesor humano para una atención más personalizada.\n\n` +
          `📞 En breve un especialista se comunicará contigo para ayudarte con tu compra.`
        );
        
        // Notificar al asesor
        if (userId !== numeroAsesor) {
          await client.sendText(numeroAsesor, 
            `🆕 CLIENTE DERIVADO\n` +
            `👤 Usuario: ${userId}\n` +
            `💬 Mensajes intercambiados: ${contexto.mensajes}\n` +
            `📝 Último mensaje: "${message.body}"\n\n` +
            `⚡ Contacta al cliente para continuar la atención.`
          );
        }
        return;
      }

      // Manejar selecciones de quick replies
      if (message.selectedButtonId || message.selectedRowId) {
        const seleccion = message.selectedButtonId || message.selectedRowId;
        console.log(`🎯 Usuario seleccionó: ${seleccion}`);
        
        // Procesar selección
        await procesarSeleccion(client, userId, seleccion, contexto);
        return;
      }

      // Manejar respuestas directas de asesor
      if (mensajeUsuario.includes('asesor') || mensajeUsuario.includes('humano') || 
          mensajeUsuario.includes('persona') || mensajeUsuario.includes('comprar')) {
        
        contexto.derivadoAsesor = true;
        await client.sendText(userId, 
          `👨‍💼 ¡Perfecto! Te conectaré con uno de nuestros asesores especializados.\n\n` +
          `⏰ Un experto en zapatillas Nike y Adidas se comunicará contigo en los próximos minutos.\n\n` +
          `💡 Mientras tanto, puedes decirnos qué tipo de zapatilla buscas para acelerar el proceso.`
        );
        
        if (userId !== numeroAsesor) {
          await client.sendText(numeroAsesor, 
            `🆕 SOLICITUD DE ASESOR\n` +
            `👤 Usuario: ${userId}\n` +
            `💬 Mensajes: ${contexto.mensajes}\n` +
            `📝 Mensaje: "${message.body}"\n\n` +
            `🚀 Cliente solicita atención personalizada.`
          );
        }
        return;
      }

      // Incrementar contador de mensajes
      contexto.mensajes++;
      
      // Agregar mensaje al historial
      contexto.historial.push({
        role: 'user',
        content: message.body
      });

      // Generar respuesta con IA
      const respuesta = await responderIA(message.body, contexto);
      
      // Agregar respuesta al historial
      contexto.historial.push({
        role: 'assistant', 
        content: respuesta
      });

      // Enviar respuesta
      await client.sendText(userId, respuesta);

      // Enviar quick replies SOLO si es un usuario nuevo (primeros 2 mensajes)
      const esNuevoUsuario = contexto.mensajes <= 2;

      if (esNuevoUsuario) {
        await enviarQuickReplies(client, userId, 
          '¿Qué te interesa ver? 👇', 
          [
            { id: 'nike', title: '👟 Nike' },
            { id: 'adidas', title: '👟 Adidas' }, 
            { id: 'asesor', title: '👨‍💼 Asesor Humano' }
          ]
        );
      }

      console.log(`✅ Respuesta enviada. Mensajes en chat: ${contexto.mensajes}/${limiteMensajesPorChat}`);
    }
  });
}
