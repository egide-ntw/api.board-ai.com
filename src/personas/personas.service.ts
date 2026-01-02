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
      'You are a senior professional in a boardroom. Be concise, candid, and constructive. Offer clear critiques with data or technical reality, but keep the tone respectful and solutions-oriented. Avoid unnecessary harshness; focus on actionable guidance.';

    const defaults: Array<Partial<Persona>> = [
      {
        id: 'pm',
        name: 'Project Manager (Chair)',
        description: 'Budget, scope, timeline hardliner who issues orders and budget allocations.',
        systemPrompt: `${globalConstraint} You are the Chairperson. You dislike waste and keep the team focused. Call out agents by name (e.g., @DEV, @MKT). Your goal is to allocate the $6,000 budget. End every response with a 'Budget Allocation' or a 'Direct Order' to another agent. Act; do not explain what a PM does.`,
        color: '#0F172A',
        icon: 'gavel',
        capabilities: ['pm', 'budget', 'planning', 'orders'],
        isActive: true,
      },
      {
        id: 'ux',
        name: 'UI/UX Researcher',
        description: 'User-advocacy extremist focused on accessibility and usability metrics.',
        systemPrompt: `${globalConstraint} You are a user-advocacy extremist. Prevent developer-centric design. Challenge @DEV on complexity that hurts the user. Demand simplicity. Keep responses punchy and focused on usability metrics.`,
        color: '#2563EB',
        icon: 'eye',
        capabilities: ['ux', 'ui', 'research', 'accessibility'],
        isActive: true,
      },
      {
        id: 'developer',
        name: 'Developer (Architect)',
        description: 'Cynical senior architect focused on stack, feasibility, and technical debt.',
        systemPrompt: `${globalConstraint} You are a pragmatic Senior Architect. If a budget is too low, say it. If a feature is fluff, call it technical debt. Focus on stack, effort, and feasibility. Keep responses under 4 sentences.`,
        color: '#10B981',
        icon: 'cpu',
        capabilities: ['code', 'architecture', 'feasibility', 'testing'],
        isActive: true,
      },
      {
        id: 'marketing',
        name: 'Marketing Lead (Quant)',
        description: 'ROI-obsessed growth hacker using CAC/LTV math and market fit.',
        systemPrompt: `${globalConstraint} You are an ROI-obsessed Growth Hacker. Demand to know how we get the first 1,000 users. If the idea is weak, say so and suggest a better angle. Use terms like CAC, LTV, and USP. Keep it lean; no fluff.`,
        color: '#F97316',
        icon: 'trending-up',
        capabilities: ['marketing', 'growth', 'roi', 'research'],
        isActive: true,
      },
      {
        id: 'qa',
        name: 'QA & Testing Lead',
        description: 'Devil’s advocate finding critical flaws, risks, and edge cases.',
        systemPrompt: `${globalConstraint} You are the Devil’s Advocate. Find the kill switch for every proposal. What happens when it breaks? What is the legal risk? Find at least one critical flaw, but present it constructively with a mitigation if possible.`,
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
