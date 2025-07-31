const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mi_token_secreto';

app.use(express.json());

// Webhook verification (Facebook)
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

// Webhook events
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      console.log('Received webhook event:', webhookEvent);
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// ✅ Data Deletion Endpoint (required by Facebook)
app.get('/data-deletion', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Solicitud de Eliminación de Datos</title>
    </head>
    <body>
      <h1>Eliminar mis datos personales</h1>
      <p>Para solicitar la eliminación de tus datos personales del bot R2D1, envía un correo a:</p>
      <p><strong>Email:</strong> <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></p>
      <p>Nos comprometemos a responder en un plazo máximo de 30 días.</p>
    </body>
    </html>
  `);
});

// ✅ Privacy Policy Endpoint (required by Facebook)
app.get('/privacy-policy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Política de Privacidad - R2D1 BOT</title>
    </head>
    <body>
      <h1>Política de Privacidad - R2D1 BOT</h1>
      <p>Última actualización: Julio 2025</p>

      <h2>Información que Recopilamos</h2>
      <p>Nuestro bot R2D1 puede recopilar datos cuando interactúas con nosotros a través de Facebook Messenger.</p>

      <h2>Cómo Usamos tu Información</h2>
      <p>Utilizamos la información únicamente para proporcionar nuestros servicios.</p>

      <h2>Compartir Información</h2>
      <p>No compartimos tu información personal con terceros, excepto cuando sea requerido por ley.</p>

      <h2>Retención de Datos</h2>
      <p>Conservamos tus datos solo durante el tiempo necesario para proporcionar nuestros servicios.</p>

      <h2>Tus Derechos</h2>
      <p>Puedes solicitar acceso, corrección o eliminación de tus datos.</p>

      <h2>Contacto</h2>
      <p><strong>Email:</strong> <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></p>
      <p><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</p>
    </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
