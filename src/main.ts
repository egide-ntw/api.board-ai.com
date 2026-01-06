import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
// Use require to avoid TS type mismatch between undici types and DOM lib
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Blob: UndiciBlob, File: UndiciFile, FormData: UndiciFormData } = require('undici');
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';

// Polyfill missing Web File APIs in Node 18 runtimes (e.g., Railway default) used by undici
const globalWebApi = globalThis as typeof globalThis & {
  File?: typeof globalThis.File;
  Blob?: typeof globalThis.Blob;
  FormData?: typeof globalThis.FormData;
};

if (!globalWebApi.File) {
  globalWebApi.File = UndiciFile as typeof globalThis.File;
}
if (!globalWebApi.Blob) {
  globalWebApi.Blob = UndiciBlob as typeof globalThis.Blob;
}
if (!globalWebApi.FormData) {
  globalWebApi.FormData = UndiciFormData as typeof globalThis.FormData;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // Ensure Socket.IO gateway mounts correctly on Express server
  app.useWebSocketAdapter(new IoAdapter(app));

  const options = new DocumentBuilder()
    .setTitle('Board AI - Multi-Agent Debate System')
    .setDescription(
      `Board AI API enables autonomous multi-agent debates where specialized AI personas collaborate to provide diverse perspectives.
      
**Key Features:**
- 5 Specialized AI Personas (Marketing, Developer, Designer, Legal, Finance)
- Real-time WebSocket Communication
- Session Analytics & Token Tracking
- File Upload Support
- Round-based Debate System
- JWT Authentication

**Getting Started:**
1. Register/Login to get JWT token
2. Create a conversation with selected personas
3. Send messages and receive multi-perspective responses
4. Monitor analytics and track discussions

**WebSocket Connection:**
- Namespace: \`/board\`
- Events: agent_typing, agent_response, round_completed, status_change`,
    )
    .setVersion('1.0.0')
    .setContact(
      'Board AI Support',
      'https://github.com/yourusername/board-ai',
      'support@board-ai.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Conversations', 'Manage boardroom conversation sessions')
    .addTag('Messages', 'Send and retrieve conversation messages')
    .addTag('Personas', 'AI agent persona management')
    .addTag('Attachments', 'File upload and management')
    .addTag('Analytics', 'Session metrics and token usage')
    .addTag('Orchestration', 'Multi-agent debate coordination')
    .addServer('http://localhost:8080', 'Local Development')
    .addServer('https://api.board-ai.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Board AI API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #5f3dc4; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      tryItOutEnabled: true,
    },
  });

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
