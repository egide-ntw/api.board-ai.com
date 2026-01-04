import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaSeedService } from './persona-seed.service';
import { Persona } from '../entities/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Persona])],
  providers: [PersonaSeedService],
  exports: [PersonaSeedService],
})
export class PersonaSeedModule {}
