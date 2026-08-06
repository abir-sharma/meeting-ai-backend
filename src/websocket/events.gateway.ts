import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

/**
 * Single shared gateway used to push background-job results back to clients.
 *
 * Clients subscribe to a "room" and receive an event when the matching
 * queued job finishes:
 *   - meetings:      join-meeting   { meetingId }   -> 'meeting-update'
 *   - voice profiles: join-voice    { profileId }   -> 'voice-profile-update'
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('join-meeting')
  handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { meetingId } = data || {};
    if (meetingId) {
      client.join(`meeting:${meetingId}`);
      console.log(`Client ${client.id} joined meeting ${meetingId}`);
    }
  }

  @SubscribeMessage('join-voice')
  handleJoinVoice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { profileId } = data || {};
    if (profileId) {
      client.join(`voice:${profileId}`);
      console.log(`Client ${client.id} joined voice ${profileId}`);
    }
  }

  // ---- emit helpers used by queue processors ----

  emitMeetingUpdate(meetingId: string, payload: any) {
    this.server
      ?.to(`meeting:${meetingId}`)
      .emit('meeting-update', payload);
  }

  emitVoiceProfileUpdate(profileId: string, payload: any) {
    this.server
      ?.to(`voice:${profileId}`)
      .emit('voice-profile-update', payload);
  }
}
