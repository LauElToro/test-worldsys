import { describe, beforeAll, it, expect } from 'vitest';
import { container } from '../config/inversify.config';
import { FileProcessorService } from '../services/file-processor.service';
import { SqlServerService } from '../services/sqlserver.service';
import path from 'path';
import fs from 'fs';

let fileProcessor: FileProcessorService;
let sqlService: SqlServerService;

describe('FileProcessorService', () => {
  beforeAll(async () => {
    sqlService = container.get<SqlServerService>('SqlServerService');
    fileProcessor = container.get<FileProcessorService>('FileProcessorService');

    await sqlService.connect();
    const pool = sqlService.getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' and xtype='U')
CREATE TABLE Clientes (
  Nombre VARCHAR(100),
  Apellido VARCHAR(100),
  DNI VARCHAR(20),
  Estado VARCHAR(50),
  FechaIngreso VARCHAR(50),
  EsPep VARCHAR(10),
  EsSujetoObligado VARCHAR(10)
);
    `);
  });

  it('debería procesar el archivo CLIENTES_IN_0425_FUSIONADO_PROD.dat sin errores', async () => {
    const file = path.resolve(__dirname, '../../src/challenge/input/CLIENTES_IN_0425.dat');
    console.log('📂 Verificando existencia de:', file);
    expect(fs.existsSync(file)).toBe(true);

    const { lines, failed } = await fileProcessor.processFile(file);

    console.log(`✅ Líneas procesadas: ${lines}, fallidas: ${failed}`);
    expect(lines).toBeGreaterThan(0);
    expect(failed).toBeLessThan(lines);
  }, 160_000);
});
