import fs from 'fs';
import path from 'path';

const outputPath = path.resolve(__dirname, '../data/CLIENTES_IN_0425_FUSIONADO_PROD.dat');
const TOTAL_LINES_PER_BLOCK = 1_000;
const BLOCKS = 10;

const nombres = ['Juan', 'Ana', 'Luis', 'María', 'Carlos', 'Lucía'];
const apellidos = ['Pérez', 'Gómez', 'Rodríguez', 'Fernández', 'López', 'Martínez'];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

(async () => {
  console.log(`✍️ Generando archivo masivo de ${TOTAL_LINES_PER_BLOCK * BLOCKS} líneas...`);

  for (let b = 0; b < BLOCKS; b++) {
    const stream = fs.createWriteStream(outputPath, { flags: 'a' });

    for (let i = 0; i < TOTAL_LINES_PER_BLOCK; i++) {
      const nombre = getRandom(nombres);
      const apellido = getRandom(apellidos);
      const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${b}${i}@testmail.com`;

      const linea = JSON.stringify({ Nombre: nombre, Apellido: apellido, Email: email }) + '\n';
      if (!stream.write(linea)) {
      await new Promise<void>((resolve) => stream.once('drain', resolve));
     }
    }

    stream.end();
    console.log(`✅ Bloque ${b + 1}/${BLOCKS} generado`);
  }
})();