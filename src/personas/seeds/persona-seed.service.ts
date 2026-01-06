import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { defaultPersonas } from './default-personas';

@Injectable()
export class PersonaSeedService {
  constructor(
    @InjectRepository(Persona)
    private personasRepository: Repository<Persona>,
  ) {}

  async run(): Promise<void> {
    console.log('Seeding personas...');

    for (const personaData of defaultPersonas) {
      const existing = await this.personasRepository.findOne({
        where: { id: personaData.id },
      });

      if (!existing) {
        const persona = this.personasRepository.create(personaData);
        await this.personasRepository.save(persona);
        console.log(`Created persona: ${persona.name}`);
      } else {
        console.log(`Persona ${existing.name} already exists, skipping...`);
      }
    }

    console.log('Persona seeding completed!');
  }
}
