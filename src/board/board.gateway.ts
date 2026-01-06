import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove from user sockets map
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.userSockets.set(data.userId, client);
    
    return {
      event: 'joined_conversation',
      data: { conversationId: data.conversationId },
    };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    
    return {
      event: 'left_conversation',
      data: { conversationId: data.conversationId },
    };
  }

  // Emit agent typing indicator
  emitAgentTyping(conversationId: string, agentType: string) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('agent_typing', {
      agentType,
      timestamp: new Date(),
    });
  }

  emitAgentTypingStart(conversationId: string, agentId: string, agentName?: string) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('agent_typing_start', {
      agentId,
      agentName,
      timestamp: new Date(),
    });
  }

  emitAgentTypingStop(conversationId: string, agentId: string, agentName?: string) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('agent_typing_stop', {
      agentId,
      agentName,
      timestamp: new Date(),
    });
  }

  // Emit agent response
  emitAgentResponse(conversationId: string, message: any) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('agent_response', {
      message,
      timestamp: new Date(),
    });
  }

  emitAgentMessage(conversationId: string, payload: any) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('agent_message_received', {
      ...payload,
      timestamp: new Date(),
    });
  }

  // Emit round completed
  emitRoundCompleted(conversationId: string, roundNumber: number) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('round_completed', {
      roundNumber,
      timestamp: new Date(),
    });
  }

  // Emit conversation status change
  emitStatusChange(conversationId: string, status: string) {
    if (!this.server) return;
    this.server.to(`conversation:${conversationId}`).emit('status_change', {
      status,
      timestamp: new Date(),
    });
  }
}
