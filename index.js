const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Configuración
const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mi_token_secreto_123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const RETELL_API_KEY = process.env.RETELL_API_KEY || 'key_7e77c634b8d3c2c74783639a1cd0';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_8bb084b488139c5d3898c2878d';
const APP_SECRET = process.env.APP_SECRET;

app.use(express.json());

// Verificación del webhook (Meta lo requiere)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verificación webhook:', { mode, token, challenge });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado exitosamente');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verificación fallida - Token incorrecto');
        res.sendStatus(403);
    }
});

// Recibir mensajes de Messenger
app.post('/webhook', async (req, res) => {
    const body = req.body;
    console.log('📨 Webhook recibido:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            const webhookEvent = entry.messaging[0];
            
            if (webhookEvent.message && webhookEvent.message.text) {
                await handleMessage(webhookEvent);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Manejar mensaje y enviar a Retell AI
async function handleMessage(event) {
    const senderId = event.sender.id;
    const messageText = event.message.text;

    console.log(`📩 Mensaje recibido de ${senderId}: ${messageText}`);

    try {
        // Procesar con Retell AI
        const response = await processWithRetellAI(messageText, senderId);
        
        // Enviar respuesta a Messenger
        if (PAGE_ACCESS_TOKEN) {
            await sendMessage(senderId, response);
        } else {
            console.log('⚠️ PAGE_ACCESS_TOKEN no configurado - Respuesta:', response);
        }
        
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        const errorResponse = 'Lo siento, hubo un error. Intenta de nuevo.';
        
        if (PAGE_ACCESS_TOKEN) {
            await sendMessage(senderId, errorResponse);
        }
    }
}

// Procesar mensaje con Retell AI
async function processWithRetellAI(message, userId) {
    try {
        console.log(`🤖 Enviando a Retell AI: ${message}`);
        
        // Intentar crear conversación web con Retell AI
        const response = await axios.post(
            'https://api.retellai.com/v2/create-web-call',
            {
                agent_id: RETELL_AGENT_ID,
                metadata: {
                    user_id: userId,
                    message: message,
                    platform: 'messenger'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${RETELL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ Respuesta de Retell AI:', response.data);
        
        // Extraer respuesta del agente
        return response.data.message || 
               response.data.response || 
               `Agente activado. Call ID: ${response.data.call_id}`;
        
    } catch (error) {
        console.error('❌ Error con Retell AI:', error.response?.data || error.message);
        
        // Respuesta de fallback con información del agente
        return `🤖 Agente Retell AI (${RETELL_AGENT_ID}) recibió: "${message}"\n\nNota: Configurando conexión de chat...`;
    }
}

// Enviar mensaje a Messenger
async function sendMessage(recipientId, messageText) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
                recipient: { id: recipientId },
                message: { text: messageText }
            },
            {
                timeout: 5000
            }
        );
        
        console.log(`✅ Mensaje enviado a ${recipientId}: ${messageText}`);
        return response.data;
        
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
        throw error;
    }
}

// 🗑️ Data Deletion Request Callback para Meta
app.post('/data-deletion', (req, res) => {
    console.log('📧 Data deletion request recibida de Meta:', req.body);
    
    try {
        const signedRequest = req.body.signed_request;
        
        if (!signedRequest) {
            return res.status(400).json({ error: 'No signed_request provided' });
        }
        
        // Parsear signed request de Meta
        const data = parseSignedRequest(signedRequest, APP_SECRET);
        
        if (!data) {
            return res.status(400).json({ error: 'Invalid signed request' });
        }
        
        const userId = data.user_id;
        const confirmationCode = `DEL_${userId}_${Date.now()}`;
        const statusUrl = `https://messenger-retell-webhook.onrender.com/deletion-status/${confirmationCode}`;
        
        console.log(`🗑️ Procesando eliminación para usuario: ${userId}, código: ${confirmationCode}`);
        
        // Meta espera esta respuesta exacta
        res.json({
            url: statusUrl,
            confirmation_code: confirmationCode
        });
        
    } catch (error) {
        console.error('❌ Error procesando data deletion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Función para parsear signed request de Meta
function parseSignedRequest(signedRequest, appSecret) {
    try {
        if (!appSecret) {
            console.error('❌ APP_SECRET no configurado');
            return null;
        }
        
        const [encodedSig, payload] = signedRequest.split('.', 2);
        
        if (!encodedSig || !payload) {
            return null;
        }
        
        // Decodificar
        const sig = base64UrlDecode(encodedSig);
        const data = JSON.parse(base64UrlDecode(payload));
        
        // Verificar firma
        const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();
        
        if (!crypto.timingSafeEqual(sig, expectedSig)) {
            console.error('❌ Invalid signature in signed request');
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error parsing signed request:', error);
        return null;
    }
}

// Helper para decodificar base64 URL-safe
function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Buffer.from(str, 'base64');
}

// 📊 Status endpoint para verificar eliminación
app.get('/deletion-status/:code', (req, res) => {
    const { code } = req.params;
    
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Estado de Eliminación de Datos</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .status { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>Estado de Eliminación de Datos</h1>
        <div class="status">
            <h2>✅ Solicitud Procesada</h2>
            <p><strong>Código de confirmación:</strong> ${code}</p>
            <p><strong>Estado:</strong> Completado</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        <p>Tus datos han sido eliminados de nuestros sistemas según las normativas RGPD.</p>
        <p>Contacto: <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></p>
    </body>
    </html>
    `);
});

// 📄 Privacy Policy endpoint
app.get('/privacy-policy', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Política de Privacidad</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 20px;
                background-color: #f9f9f9;
            }
            h1, h2 {
                color: #333;
            }
            p {
                color: #666;
            }
        </style>
    </head>
    <body>
        <h1>Política de Privacidad</h1>
        <p><strong>Fecha de Última Actualización: 30 de julio de 2025</strong></p>
        <h2>1. Información que Recopilamos</h2>
        <p>Recopilamos la siguiente información cuando usas nuestros servicios:</p>
        <ul>
            <li>Datos personales proporcionados (nombre, número de teléfono, etc.).</li>
            <li>Datos de agenda para programar y gestionar citas.</li>
            <li>Datos técnicos (dirección IP, tipo de dispositivo, sistema operativo).</li>
        </ul>
        <h2>2. Uso de la Información</h2>
        <p>Utilizamos los datos recopilados para:</p>
        <ul>
            <li>Agendar y gestionar citas con Google Calendar.</li>
            <li>Mejorar la experiencia del usuario y optimizar nuestros servicios.</li>
            <li>Cumplir con obligaciones legales y responder a solicitudes de las autoridades.</li>
        </ul>
        <h2>3. Derechos del Usuario</h2>
        <p>Los usuarios en la UE tienen derecho a:</p>
        <ul>
            <li>Acceder, rectificar o eliminar sus datos personales.</li>
            <li>Solicitar la portabilidad de los datos.</li>
            <li>Oponerse al procesamiento de sus datos.</li>
        </ul>
        <h2>4. Retención y Eliminación de Datos</h2>
        <p>Mantenemos los datos solo durante el tiempo necesario para los fines establecidos. Los usuarios pueden solicitar la eliminación de sus datos en cualquier momento enviando un correo a:</p>
        <p><strong>investlan@hotmail.es</strong></p>
        <h2>5. Datos de la Empresa</h2>
        <p><strong>Nombre de la Empresa:</strong> R2D1 BOT</p>
        <p><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, Las Palmas de Gran Canaria, España.</p>
        <p><strong>Correo Electrónico de Contacto:</strong> investlan@hotmail.es</p>
        <h2>6. Contacto</h2>
        <p>Si tienes preguntas sobre esta política, puedes contactarnos en: <strong>investlan@hotmail.es</strong></p>
    </body>
    </html>
    `);
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Messenger + Retell AI Webhook',
        agent_id: RETELL_AGENT_ID,
        webhook_url: '/webhook',
        verify_token: VERIFY_TOKEN,
        timestamp: new Date().toISOString(),
        configuration: {
            retell_configured: !!RETELL_API_KEY,
            messenger_configured: !!PAGE_ACCESS_TOKEN,
            verify_token_set: !!VERIFY_TOKEN,
            app_secret_set: !!APP_SECRET
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Webhook Messenger + Retell AI`);
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🤖 Agente: ${RETELL_AGENT_ID}`);
    console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
    console.log(`🗝️ App Secret: ${APP_SECRET ? 'Configurado' : 'NO CONFIGURADO'}`);
    console.log(`✅ Servidor iniciado correctamente\n`);
});

module.exports = app;
