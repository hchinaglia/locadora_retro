import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const SRC_DIR = path.join(__dirname, 'src');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.sfc': 'application/octet-stream',
  '.smc': 'application/octet-stream',
  '.ips': 'application/octet-stream',
  '.apk': 'application/vnd.android.package-archive',
  '.wasm': 'application/wasm'
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function resolveFile(urlPath) {
  let cleanPath = urlPath.split('?')[0];
  if (cleanPath === '/' || cleanPath === '') {
    cleanPath = '/index.html';
  }

  // 1. Verifica na pasta src/ (index.html, style.css, app.js)
  const srcCandidate = path.join(SRC_DIR, cleanPath);
  if (fs.existsSync(srcCandidate) && fs.statSync(srcCandidate).isFile()) {
    return srcCandidate;
  }

  // 2. Verifica na pasta public/ (games/, assets/, apks/, games.json)
  const pubCandidate = path.join(PUBLIC_DIR, cleanPath);
  if (fs.existsSync(pubCandidate) && fs.statSync(pubCandidate).isFile()) {
    return pubCandidate;
  }

  return null;
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Endpoint de informações de rede para QR Code dinâmico
  const urlPath = req.url.split('?')[0];
  if (urlPath === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      localIp: getLocalIp(),
      port: PORT
    }));
    return;
  }

  const filePath = resolveFile(req.url);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - Fita não encontrada na locadora');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const fileName = path.basename(filePath);

  const downloadHeaders = {};
  if (ext === '.apk') {
    downloadHeaders['Content-Disposition'] = `attachment; filename="${fileName}"`;
  }

  // Suporte a HTTP Range (necessário para downloads e streams grandes)
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
      res.end();
      return;
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      ...downloadHeaders
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      ...downloadHeaders
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  const apkUrl = `http://${localIp}:${PORT}/apks/Munchkin-v2.1.0-PTBR.apk`;

  // Gera/Atualiza o QR Code SVG apontando para o IP local atual da rede Wi-Fi
  try {
    const qrSvgPath = path.join(PUBLIC_DIR, 'assets', 'qr_munchkin.svg');
    const pyCmd = `python3 -c "import qrcode, qrcode.image.svg; img = qrcode.make('${apkUrl}', image_factory=qrcode.image.svg.SvgPathImage); f = open('${qrSvgPath}', 'wb'); img.save(f); f.close()"`;
    exec(pyCmd, (err) => {
      if (!err) {
        console.log(`📲 QR Code gerado para Wi-Fi: ${apkUrl}`);
      }
    });
  } catch (err) {
    // Ignora
  }

  console.log('====================================================');
  console.log('       📼 LOCADORA RETRÔ ANOS 90 ESTÁ ABERTA!       ');
  console.log('====================================================');
  console.log(`🕹️  Acesso no Computador (PC): http://localhost:${PORT}`);
  console.log(`📱 Acesso no Celular (Mobile): http://${localIp}:${PORT}`);
  console.log(`📦 Download Munchkin APK: ${apkUrl}`);
  console.log('====================================================');
  console.log('Dica: Abra o link do celular no mesmo Wi-Fi para jogar');
  console.log('com controles virtuais de toque na tela do smartphone!');
});

