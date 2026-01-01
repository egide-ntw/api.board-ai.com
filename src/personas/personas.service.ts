import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private personasRepository: Repository<Persona>,
  ) {}

  async findAll(): Promise<Persona[]> {
    return this.personasRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Persona> {
    const persona = await this.personasRepository.findOne({
      where: { id },
    });

    if (!persona) {
      throw new NotFoundException(`Persona ${id} not found`);
    }

    return persona;
  }

  async findByIds(ids: string[]): Promise<Persona[]> {
    return this.personasRepository
      .createQueryBuilder('persona')
      .where('persona.id IN (:...ids)', { ids })
      .andWhere('persona.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
