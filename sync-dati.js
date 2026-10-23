// Rigenera dati.js da glossario.csv e riassunto.csv (serve per aprire index.html con doppio clic).
// Uso: node sync-dati.js
const fs = require('fs');
const rd = f => fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '');
fs.writeFileSync('dati.js',
  '/* generato da sync-dati.js: non modificare a mano */\n' +
  'window.DATI = ' + JSON.stringify({ glossario: rd('glossario.csv'), riassunto: rd('riassunto.csv') }) + ';\n');
console.log('dati.js aggiornato');
