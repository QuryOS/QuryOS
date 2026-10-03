<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quri OS</title>
  <link rel="manifest" href="manifest.json">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  </style>
</head>
<body>
  <iframe id="visor" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" allow="camera; microphone; fullscreen; display-capture"></iframe>

<script>
const params = new URLSearchParams(window.location.search);
const urlApp = params.get('url');

if (urlApp) {
  document.getElementById('visor').src = decodeURIComponent(urlApp);
}

// ✅ Para volver: el usuario usa el gesto de atrás del sistema o botón físico
// Si quieres puedes agregar el botón de volver DESDE el launcher/escritorio
</script>
</body>
</html>
