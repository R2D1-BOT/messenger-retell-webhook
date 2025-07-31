const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mi_token_secreto';

// Middleware para parsear JSON
app.use(express.json());

// Webhook Verification (para Facebook)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verification token mismatch');
  }
});

// Webhook Events (para recibir mensajes)
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      console.log('Evento recibido:', webhookEvent);
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// ✅ Endpoint: Data Deletion (cumple con Facebook Platform Policy)
app.get('/data-deletion', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Solicitud de Eliminación de Datos - R2D1 BOT</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px;">
      <h1>Solicitud de Eliminación de Datos - R2D1 BOT</h1>
      <p><strong>Fecha de última actualización:</strong> Julio 2025</p>

      <h2>¿Cómo solicitar la eliminación?</h2>
      <p>Para solicitar la eliminación de tus datos personales de nuestro bot R2D1, por favor contacta con nosotros:</p>
      
      <h3>Información de Contacto</h3>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></li>
        <li><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</li>
      </ul>

      <p>Responderemos a tu solicitud de eliminación de datos en un plazo máximo de 30 días.</p>
      <p>Esta página cumple con los requisitos de la Política de Plataforma de Facebook para la Eliminación de Datos.</p>
    </body>
    </html>
  `);
});

// ✅ Endpoint: Privacy Policy (cumple con Facebook)
app.get('/privacy-policy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Política de Privacidad - R2D1 BOT</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px;">
      <h1>Política de Privacidad - R2D1 BOT</h1>
      <p><strong>Última actualización:</strong> Julio 2025</p>

      <h2>Información que Recopilamos</h2>
      <p>Nuestro bot R2D1 puede recopilar los siguientes datos cuando interactúas con nosotros a través de Facebook Messenger:</p>
      <ul>
        <li>ID de usuario de Facebook</li>
        <li>Mensajes enviados al bot</li>
        <li>Nombre y perfil público (si aplica)</li>
      </ul>

      <h2>Cómo Usamos tu Información</h2>
      <p>Utilizamos la información recopilada únicamente para:</p>
      <ul>
        <li>Proporcionar respuestas automatizadas</li>
        <li>Mejorar la experiencia del usuario</li>
        <li>Diagnosticar errores del sistema</li>
      </ul>

      <h2>Compartir Información</h2>
      <p>No compartimos tu información personal con terceros, excepto cuando sea requerido por ley.</p>

      <h2>Retención de Datos</h2>
      <p>Conservamos tus datos solo durante el tiempo necesario para proporcionar nuestros servicios, salvo obligación legal de conservación.</p>

      <h2>Tus Derechos</h2>
      <p>Puedes solicitar en cualquier momento:</p>
      <ul>
        <li>Acceso a tus datos</li>
        <li>Rectificación de datos incorrectos</li>
        <li>Eliminación de tus datos</li>
      </ul>

      <h2>Contacto</h2>
      <p>Para ejercer tus derechos o hacer preguntas sobre esta política, contáctanos:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></li>
        <li><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</li>
      </ul>
    </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
  console.log(`🔗 Data Deletion: https://messenger-retell-webhook.onrender.com/data-deletion`);
  console.log(`🔗 Privacy Policy: https://messenger-retell-webhook.onrender.com/privacy-policy`);
});
