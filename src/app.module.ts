import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmConfigService } from './database/typeorm/typeorm.service';
import { ApiModule } from './api/api.module';
import { configuration } from './config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getEnvPath } from './common/helper/env.helper'; // Importamos tu helper

const envFilePath: string = getEnvPath(`${process.cwd()}/src/common/envs`);

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ 
      envFilePath, // Usamos la ruta que tu proyecto espera
      load: [configuration], 
      isGlobal: true 
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}