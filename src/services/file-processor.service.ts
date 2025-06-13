import fs from 'fs';
import readline from 'readline';
import { inject, injectable } from 'inversify';
import { SqlServerService } from './sqlserver.service';

@injectable()
export class FileProcessorService {
  private readonly BATCH_SIZE = 500;

  constructor(
    @inject('SqlServerService') private db: SqlServerService
  ) {}

  async processFile(filePath: string): Promise<{ lines: number; failed: number }> {
    await this.db.connect();

    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let batch: string[][] = [];
    let lines = 0;
    let failed = 0;

    for await (const line of rl) {
      try {
        const data = JSON.parse(line);

        if (!data.Nombre || !data.Apellido || !data.Email) {
          throw new Error('Campos faltantes');
        }

        batch.push([
          String(data.Nombre),
          String(data.Apellido),
          String(data.Email),
        ]);

        if (batch.length >= this.BATCH_SIZE) {
          await this.db.insertBatch(batch);
          batch = [];
        }

        lines++;
      } catch (err) {
        console.error(`❌ Línea corrupta o inválida en línea ${lines + failed + 1}:`, err);
        failed++;
      }
    }

    if (batch.length > 0) {
      try {
        await this.db.insertBatch(batch);
      } catch (err) {
        console.error('❌ Error al insertar el último batch:', err);
      }
    }

    return { lines, failed };
  }
}
