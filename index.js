const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === 'mi_token_secreto') {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Token no coincide');
  }
});

// Webhook events
app.post('/webhook', (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// ✅ Data Deletion - HTML VÁLIDO
app.get('/data-deletion', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Eliminar Datos - R2D1 BOT</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
        h1 { color: #0056b3; }
        a { color: #0056b3; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Solicitud de Eliminación de Datos - R2D1 BOT</h1>
      <p><strong>Fecha de última actualización:</strong> Julio 2025</p>

      <h2>¿Cómo solicitar la eliminación?</h2>
      <p>Para solicitar la eliminación de tus datos personales, contacta con nosotros:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></li>
        <li><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</li>
      </ul>

      <p>Responderemos en un plazo máximo de 30 días.</p>
      <p>Esta página cumple con la Política de Plataforma de Facebook.</p>
    </body>
    </html>
  `);
});

// ✅ Privacy Policy - HTML VÁLIDO
app.get('/privacy-policy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Política de Privacidad - R2D1 BOT</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
        h1 { color: #0056b3; }
        a { color: #0056b3; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Política de Privacidad - R2D1 BOT</h1>
      <p><strong>Última actualización:</strong> Julio 2025</p>

      <h2>Información que Recopilamos</h2>
      <p>Recopilamos datos cuando interactúas con nuestro bot en Facebook Messenger.</p>

      <h2>Cómo Usamos tu Información</h2>
      <p>Para proporcionar respuestas automatizadas y mejorar el servicio.</p>

      <h2>Compartir Información</h2>
      <p>No compartimos tus datos con terceros, excepto por obligación legal.</p>

      <h2>Retención de Datos</h2>
      <p>Los datos se conservan solo mientras sea necesario.</p>

      <h2>Tus Derechos</h2>
      <p>Puedes solicitar acceso, corrección o eliminación de tus datos.</p>

      <h2>Contacto</h2>
      <p><strong>Email:</strong> <a href="mailto:investlan@hotmail.es">investlan@hotmail.es</a></p>
      <p><strong>Dirección:</strong> Calle Rechaval, N°22, Yaiza, Lanzarote, España</p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
