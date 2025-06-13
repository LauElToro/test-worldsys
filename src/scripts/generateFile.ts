import fs from 'fs';
import path from 'path';

const outputPath = path.resolve(__dirname, '../data/CLIENTES_IN_0425_FUSIONADO_PROD.dat');
const stream = fs.createWriteStream(outputPath, { flags: 'w' });

const TOTAL_LINES = 1_000;

const nombres = ['Juan', 'Ana', 'Luis', 'María', 'Carlos', 'Lucía'];
const apellidos = ['Pérez', 'Gómez', 'Rodríguez', 'Fernández', 'López', 'Martínez'];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

(async () => {
  console.log(`✍️ Generando archivo con ${TOTAL_LINES} líneas...`);
  for (let i = 0; i < TOTAL_LINES; i++) {
    const nombre = getRandom(nombres);
    const apellido = getRandom(apellidos);
    const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@testmail.com`;

    const linea = JSON.stringify({ Nombre: nombre, Apellido: apellido, Email: email }) + '\n';
    if (!stream.write(linea)) {
     await new Promise<void>((resolve) => stream.once('drain', resolve));
    }
 }
  stream.end(() => console.log(`✅ Archivo generado en ${outputPath}`));
})();