# 🤖 STEPS WhatsApp Bot con IA

Bot inteligente para WhatsApp que responde automáticamente usando **DeepSeek GRATIS**, especializado en la tienda STEPS.

## 🚀 Características

- ✅ Funciona con tu WhatsApp personal (sin WhatsApp Business)
- 🧠 Respuestas inteligentes con **DeepSeek GRATIS** 🎉
- 💰 **SIN COSTOS** - Totalmente gratuito
- 🔒 Manejo seguro de API keys
- 📊 Monitoreo de uso de tokens
- 🛡️ Manejo de errores robusto

## 📋 Requisitos

- Node.js v14 o superior
- Cuenta de **OpenRouter** (GRATIS) - [Regístrate aquí](https://openrouter.ai)
- WhatsApp en tu móvil

## 🛠️ Instalación

1. **Clona o descarga este proyecto**
```bash
git clone [tu-repo]
cd stepsbot
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura tu API key de OpenRouter (GRATIS)**
   
   Edita el archivo `.env` y reemplaza `tu_openrouter_api_key_aqui` con tu API key real:
```
OPENROUTER_API_KEY=sk-or-v1-tu-api-key-real-aqui
```

4. **Ejecuta el bot**
```bash
node index.js
```

5. **Escanea el código QR**
   - Se abrirá un código QR en la terminal
   - Escanéalo con tu WhatsApp como si fuera WhatsApp Web
   - ¡Listo! El bot está funcionando

## 💡 Límites y Costos de OpenAI

### 📊 Límites por Tier:
- **Free**: 3 requests/min, 40K tokens/min
- **Tier 1** ($5+): 500 requests/min, 40K tokens/min  
- **Tier 2** ($50+): 5K requests/min, 80K tokens/min

### 💰 Costos GPT-3.5-Turbo:
- **Input**: $0.0015 por 1K tokens
- **Output**: $0.002 por 1K tokens
- **Aproximación**: 1 token ≈ 4 caracteres en español

### 🛡️ Protecciones incluidas:
- Límite diario de 10,000 tokens (configurable)
- Respuestas limitadas a 150 tokens máximo
- Contador automático de uso
- Reinicio diario del contador

## ⚙️ Configuración

### Cambiar el límite diario:
Edita `dailyLimit` en `index.js`:
```javascript
let dailyLimit = 10000; // Cambia este número
```

### Personalizar respuestas:
Modifica el prompt del sistema en la función `responderIA()`:
```javascript
content: 'Tu prompt personalizado aquí...'
```

## 🔧 Solución de Problemas

### Error 429 (Rate Limit):
- Estás enviando demasiadas requests muy rápido
- Espera unos segundos entre mensajes

### Error 401 (Unauthorized):
- Verifica que tu API key esté correcta en `.env`
- Asegúrate de tener créditos en tu cuenta OpenAI

### Bot no responde:
- Verifica que WhatsApp Web esté conectado
- Revisa la consola para errores
- Asegúrate de enviar mensajes individuales (no grupos)

## 📈 Monitoreo

El bot muestra en consola:
- Tokens usados por consulta
- Total tokens del día
- Límite configurado
- Errores y warnings

## ⚠️ Advertencias

- **NO** subas tu API key a GitHub
- **NO** abuses del bot o WhatsApp puede bloquearte  
- **Configura límites** para evitar costos inesperados
- **Usa** el bot responsablemente

## 🚀 Próximas mejoras

- [ ] Catálogo de productos desde base de datos
- [ ] Botones de respuesta rápida
- [ ] Integración con sistema de inventario
- [ ] Webhooks para notificaciones
- [ ] Dashboard web de administración

---

¿Problemas? ¡Escríbeme! 😎 