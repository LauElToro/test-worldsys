import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { inject, injectable } from 'inversify';
import { SqlServerService } from './sqlserver.service';

const CHECKPOINT_FILE = path.resolve(__dirname, '../checkpoint.json');

@injectable()
export class FileProcessorService {
  private readonly BATCH_SIZE = 500;
  private readonly MAX_RETRIES = 3;

  constructor(
    @inject('SqlServerService') private db: SqlServerService
  ) {}

  private async withRetries<T>(fn: () => Promise<T>, retries: number): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        if (err.code === 'ECONNCLOSED') {
          console.warn('🔄 Reconectando a SQL Server...');
          await this.db.connect();
        }
        if (attempt > retries) throw err;
        console.warn(`⚠️ Reintento ${attempt} fallido. Esperando ${attempt ** 2}s...`);
        await new Promise(res => setTimeout(res, attempt ** 2 * 1000));
      }
    }
  }

  private loadCheckpoint(): number {
    try {
      if (fs.existsSync(CHECKPOINT_FILE)) {
        const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
        return data.lastLine ?? 0;
      }
    } catch {
      console.warn('⚠️ Error al leer checkpoint. Iniciando desde línea 0.');
    }
    return 0;
  }

  private saveCheckpoint(line: number) {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastLine: line }), 'utf-8');
  }

  async processFile(filePath: string): Promise<{ lines: number; failed: number }> {
    await this.withRetries(() => this.db.connect(), this.MAX_RETRIES);

    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const startFrom = this.loadCheckpoint();
    let batch: string[][] = [];
    let totalLines = 0;
    let failed = 0;
    let currentLine = 0;

    for await (const line of rl) {
      currentLine++;
      if (currentLine <= startFrom) continue;

      try {
        const parts = line.split('|');
        if (parts.length !== 7) throw new Error('Cantidad de columnas inválida');

        const [nombre, apellido, dni, estado, fechaIngreso, esPep, esSujetoObligado] = parts.map(p => p.trim());

        if (!nombre || !apellido || !dni || !estado || !fechaIngreso) {
          throw new Error('Campos obligatorios faltantes');
        }

        batch.push([nombre, apellido, dni, estado, fechaIngreso, esPep, esSujetoObligado]);

        if (batch.length >= this.BATCH_SIZE) {
          await this.withRetries(() => this.db.insertBatch(batch), this.MAX_RETRIES);
          this.saveCheckpoint(currentLine);
          batch = [];
        }

        totalLines++;
      } catch (err) {
        console.error(`❌ Línea inválida ${currentLine}:`, err);
        failed++;
      }
    }

    if (batch.length > 0) {
      try {
        await this.withRetries(() => this.db.insertBatch(batch), this.MAX_RETRIES);
        this.saveCheckpoint(currentLine);
      } catch (err) {
        console.error('❌ Error al insertar el último batch:', err);
      }
    }

    return { lines: totalLines, failed };
  }
}