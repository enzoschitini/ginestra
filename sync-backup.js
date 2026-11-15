// Rigenera backup_data/elenco.json con i file .json presenti nella cartella (serve al selettore di mg_cache).
// Uso: node sync-backup.js
const fs = require('fs');
const nomi = fs.readdirSync('backup_data').filter(f => /\.json$/i.test(f) && f !== 'elenco.json').sort();
fs.writeFileSync('backup_data/elenco.json', JSON.stringify(nomi, null, 2) + '\n');
console.log('elenco.json aggiornato: ' + nomi.length + ' backup');
