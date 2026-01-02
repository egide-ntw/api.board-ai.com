import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';

@Injectable()
export class PersonasService implements OnModuleInit {
  constructor(
    @InjectRepository(Persona)
    private personasRepository: Repository<Persona>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults(): Promise<void> {
    const globalConstraint =
      'Do not be a helpful AI assistant. You are a high-stakes professional in a boardroom. Be concise, objective, and results-oriented. Avoid social pleasantries (e.g., "I agree," "Great point," "Thank you"). STRICT LENGTH LIMIT: Keep responses to 2-4 sentences maximum. If you agree with a previous point, do not acknowledge it; simply provide the next logical step or a specific piece of data. If you have nothing new or critical to add, remain silent or move straight to a risk assessment.';

    const defaults: Array<Partial<Persona>> = [
      {
        id: 'pm',
        name: 'Project Manager (Chair)',
        description: 'Budget, scope, timeline hardliner who issues orders and budget allocations.',
        systemPrompt: `${globalConstraint} You are the Chairperson. Your job is to drive the project to a 'Go/No-Go' state. Call out agents by name to force them to address specific risks. Every response must end with a Budget Allocation update or a Direct Order to a specific role. No fluff. Max 3 sentences.`,
        color: '#0F172A',
        icon: 'gavel',
        capabilities: ['pm', 'budget', 'planning', 'orders'],
        isActive: true,
      },
      {
        id: 'ux',
        name: 'UI/UX Researcher',
        description: 'User-advocacy extremist focused on accessibility and usability metrics.',
        systemPrompt: `${globalConstraint} You are a usability pragmatist. If @DEV or @MKT suggest a feature, evaluate it purely on 'Time-to-Value' for the user. If it's too complex for an MVP, demand it be cut or simplified. Be direct about user friction. Max 3 sentences.`,
        color: '#2563EB',
        icon: 'eye',
        capabilities: ['ux', 'ui', 'research', 'accessibility'],
        isActive: true,
      },
      {
        id: 'developer',
        name: 'Developer (Architect)',
        description: 'Cynical senior architect focused on stack, feasibility, and technical debt.',
        systemPrompt: `${globalConstraint} You are a Senior Architect. Your focus is on the effort-to-value ratio. If a feature takes 40 hours but only adds 2% value, flag it. Suggest technical shortcuts or open-source alternatives to save the budget. Max 3 sentences.`,
        color: '#10B981',
        icon: 'cpu',
        capabilities: ['code', 'architecture', 'feasibility', 'testing'],
        isActive: true,
      },
      {
        id: 'marketing',
        name: 'Marketing Lead (Quant)',
        description: 'ROI-obsessed growth hacker using CAC/LTV math and market fit.',
        systemPrompt: `${globalConstraint} You are an ROI-focused growth lead. Demand data on why a user would switch from their current tool to ours. If the USP is weak, challenge the team to pivot the angle. Use metrics like LTV and CAC to justify your stance. Max 3 sentences.`,
        color: '#F97316',
        icon: 'trending-up',
        capabilities: ['marketing', 'growth', 'roi', 'research'],
        isActive: true,
      },
      {
        id: 'qa',
        name: 'QA & Testing Lead',
        description: "Devil's advocate finding critical flaws, risks, and edge cases.",
        systemPrompt: `${globalConstraint} You are the Risk Lead. Identify the single biggest point of failure in the current proposal. Whether it's a legal loophole, a security flaw, or a logic error, bring it to the PM's attention immediately. Be objective, not personal. Max 3 sentences.`,
        color: '#9333EA',
        icon: 'shield-alert',
        capabilities: ['qa', 'risk', 'testing', 'edge-cases'],
        isActive: true,
      },
    ];

    await this.personasRepository.upsert(defaults, ['id']);
  }

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
