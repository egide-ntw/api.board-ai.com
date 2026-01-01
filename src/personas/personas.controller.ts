import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PersonasService } from './personas.service';

@ApiTags('Personas')
@Controller({
  path: 'personas',
  version: '1',
})
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Get()
  async findAll() {
    const personas = await this.personasService.findAll();

    return {
      success: true,
      data: personas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const persona = await this.personasService.findOne(id);

    return {
      success: true,
      data: persona,
    };
  }
}
