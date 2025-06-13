import { describe, beforeAll, it, expect } from 'vitest';
import { FileProcessorService } from '../services/file-processor.service';
import { SqlServerService } from '../services/sqlserver.service';
import path from 'path';
import fs from 'fs';

const service = new FileProcessorService(new SqlServerService());

describe('FileProcessorService', () => {
  beforeAll(async () => {
    const sqlService = new SqlServerService();
    await sqlService.connect();
    const pool = sqlService.getPool();
    const conn = await pool.connect();
    await conn.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Logs' and xtype='U')
      CREATE TABLE Logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        timestamp VARCHAR(100),
        level VARCHAR(50),
        message VARCHAR(MAX),
        meta NVARCHAR(MAX)
      );
    `);
    conn.close();
  });

  it('debería procesar el archivo CLIENTES_IN_0425_FUSIONADO_PROD.dat sin errores', async () => {
    const file = path.join(__dirname, '..', '..', 'src', 'data', 'CLIENTES_IN_0425_FUSIONADO_PROD.dat');
    console.log('📂 Verificando existencia de:', file);
    expect(fs.existsSync(file)).toBe(true);
    await service.processFile(file);
  }, 120_000);
});
