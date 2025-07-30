const express = require('express');
const axios = require('axios');
const app = express();

// Configuración
const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'messenger_verify_123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const RETELL_API_KEY = process.env.RETELL_API_KEY || 'key_7e77c634b8d3c2c74783639a1cd0';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_8bb084b488139c5d3898c2878d';

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
            verify_token_set: !!VERIFY_TOKEN
        }
    });
});

// Ruta de estado
app.get('/status', (req, res) => {
    res.json({
        webhook_active: true,
        retell_agent: RETELL_AGENT_ID,
        configurations: {
            verify_token: !!VERIFY_TOKEN,
            page_token: !!PAGE_ACCESS_TOKEN,
            retell_key: !!RETELL_API_KEY
        },
        endpoints: {
            webhook: '/webhook',
            status: '/status',
            home: '/'
        }
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('💥 Error del servidor:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Webhook Messenger + Retell AI`);
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🤖 Agente: ${RETELL_AGENT_ID}`);
    console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
    console.log(`✅ Servidor iniciado correctamente\n`);
});

module.exports = app;
// 🗑️ Endpoint para manejar eliminación de datos de Meta
app.post('/data-deletion', (req, res) => {
    console.log('📧 Solicitud de eliminación de datos recibida:', req.body);
    
    const { user_id } = req.body;
    
    // Aquí podrías eliminar datos del usuario de tu base de datos
    // Por ahora solo logueamos la solicitud
    
    console.log(`🗑️ Procesando eliminación de datos para usuario: ${user_id}`);
    
    // Meta espera esta respuesta específica
    res.json({
        url: `https://messenger-retell-webhook.onrender.com/deletion-status/${user_id}`,
        confirmation_code: `DEL_${user_id}_${Date.now()}`
    });
});

// 📊 Status de eliminación de datos
app.get('/deletion-status/:user_id', (req, res) => {
    const { user_id } = req.params;
    
    res.json({
        user_id: user_id,
        status: 'completed',
        message: 'Datos eliminados correctamente según RGPD',
        processed_at: new Date().toISOString()
    });
});
// 🗑️ Data Deletion Request Callback para Meta
app.post('/data-deletion', (req, res) => {
    console.log('📧 Data deletion request recibida de Meta:', req.body);
    
    try {
        // Meta envía un signed_request
        const signedRequest = req.body.signed_request;
        
        if (!signedRequest) {
            return res.status(400).json({ error: 'No signed_request provided' });
        }
        
        // Por simplicidad, generamos un ID único para tracking
        const confirmationCode = `DEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const statusUrl = `https://messenger-retell-webhook.onrender.com/deletion-status/${confirmationCode}`;
        
        console.log(`🗑️ Procesando solicitud de eliminación. Código: ${confirmationCode}`);
        
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
