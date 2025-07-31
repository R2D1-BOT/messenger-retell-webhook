const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// Configuración
const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mi_token_secreto_123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID;

// Middleware
app.use(express.json());

// Verificación del webhook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verificado exitosamente');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Recibir mensajes
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach((entry) => {
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            const senderId = webhookEvent.sender.id;
            
            if (webhookEvent.message) {
                handleMessage(senderId, webhookEvent.message);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Manejar mensajes
async function handleMessage(senderId, receivedMessage) {
    let response;

    if (receivedMessage.text) {
        response = {
            text: `Eco: ${receivedMessage.text}`
        };
    }

    await callSendAPI(senderId, response);
}

// Enviar mensaje a través de la API de Messenger
async function callSendAPI(senderId, response) {
    const requestBody = {
        recipient: {
            id: senderId
        },
        message: response
    };

    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, requestBody);
        console.log('Mensaje enviado exitosamente');
    } catch (error) {
        console.error('Error enviando mensaje:', error.response?.data || error.message);
    }
}

// Data Deletion endpoint para Facebook
app.get('/data-deletion', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Data Deletion - R2D1 BOT</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .contact { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Data Deletion Request - R2D1 BOT</h1>
            <p>Para solicitar la eliminación de tus datos personales de nuestro bot R2D1, por favor contacta con nosotros:</p>
            
            <div class="contact">
                <h3>Información de Contacto:</h3>
                <p><strong>Email:</strong> investlan@hotmail.es</p>
                <p><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</p>
            </div>
            
            <p>Responderemos a tu solicitud de eliminación de datos en un plazo máximo de 30 días.</p>
            <p>Esta página cumple con los requisitos de Facebook Platform Policy para Data Deletion.</p>
            
            <p><em>Fecha de última actualización: Julio 2025</em></p>
        </div>
    </body>
    </html>
    `);
});

// Privacy Policy endpoint para Facebook
app.get('/privacy-policy', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Privacy Policy - R2D1 BOT</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            h1, h2 { color: #333; }
            .contact { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Privacy Policy - R2D1 BOT</h1>
            
            <h2>Información que Recopilamos</h2>
            <p>Nuestro bot R2D1 puede recopilar los siguientes datos cuando interactúas con nosotros a través de Facebook Messenger:</p>
            <ul>
                <li>Mensajes que nos envías</li>
                <li>ID de usuario de Facebook (para responder a tus mensajes)</li>
                <li>Información básica del perfil público</li>
            </ul>
            
            <h2>Cómo Usamos tu Información</h2>
            <p>Utilizamos la información recopilada únicamente para:</p>
            <ul>
                <li>Responder a tus mensajes y consultas</li>
                <li>Mejorar nuestro servicio de bot</li>
                <li>Cumplir con los requisitos legales aplicables</li>
            </ul>
            
            <h2>Compartir Información</h2>
            <p>No compartimos tu información personal con terceros, excepto cuando sea requerido por ley.</p>
            
            <h2>Retención de Datos</h2>
            <p>Conservamos tus datos solo durante el tiempo necesario para proporcionar nuestros servicios.</p>
            
            <h2>Tus Derechos</h2>
            <p>Puedes solicitar:</p>
            <ul>
                <li>Acceso a tus datos personales</li>
                <li>Corrección de datos inexactos</li>
                <li>Eliminación de tus datos</li>
            </ul>
            
            <div class="contact">
                <h3>Contacto:</h3>
                <p><strong>Email:</strong> investlan@hotmail.es</p>
                <p><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</p>
            </div>
            
            <p><em>Última actualización: Julio 2025</em></p>
        </div>
    </body>
    </html>
    `);
});

// Ruta de salud
app.get('/', (req, res) => {
    res.send('R2D1 Webhook está funcionando! 🤖');
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});
