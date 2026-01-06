import { OrchestrationService } from './orchestration.service';
import { Persona } from '../personas/entities/persona.entity';

const mockDeps = () => ({
  aiService: { generateAgentResponse: jest.fn() },
  personasService: { findByIds: jest.fn() },
  messagesService: { findAllByConversation: jest.fn(), createAgentMessage: jest.fn() },
  conversationsService: { findOne: jest.fn(), incrementRound: jest.fn(), update: jest.fn() },
  analyticsService: { updateTokens: jest.fn(), incrementAgentParticipation: jest.fn() },
  boardGateway: {
    emitAgentTypingStart: jest.fn(),
    emitAgentTypingStop: jest.fn(),
    emitAgentMessage: jest.fn(),
    emitRoundCompleted: jest.fn(),
  },
});

describe('OrchestrationService helpers', () => {
  const deps = mockDeps();
  const service = new OrchestrationService(
    deps.aiService as any,
    deps.personasService as any,
    deps.messagesService as any,
    deps.conversationsService as any,
    deps.analyticsService as any,
    deps.boardGateway as any,
  );

  it('classifies greeting intent', () => {
    const intent = (service as any).classifyIntentLocal('hello there');
    expect(intent).toBe('greeting');
  });

  it('extracts tagged personas by @id', () => {
    const personas: Persona[] = [
      { id: 'pm', name: 'PM', description: 'Product Manager' } as Persona,
      { id: 'dev', name: 'Developer', description: 'Writes code' } as Persona,
    ];

    const tagged = (service as any).extractTaggedPersonas(personas, 'hey @dev can you look?');
    expect(tagged).toHaveLength(1);
    expect(tagged[0].id).toBe('dev');
  });
});
