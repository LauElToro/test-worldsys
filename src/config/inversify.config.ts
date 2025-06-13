import { Container } from 'inversify';
import { SqlServerService } from '../services/sqlserver.service';
import { FileProcessorService } from '../services/file-processor.service';
import { HealthController } from '../controllers/health.controller';

const container = new Container();

container.bind<SqlServerService>('SqlServerService').to(SqlServerService).inSingletonScope();
container.bind<FileProcessorService>('FileProcessorService').to(FileProcessorService).inSingletonScope();
container.bind<HealthController>('HealthController').to(HealthController).inSingletonScope();

export { container };
