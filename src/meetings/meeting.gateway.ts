import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets'

import { Server, Socket } from 'socket.io'
import { MeetingsService } from './meetings.service'

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(
    private readonly meetingsService: MeetingsService
  ) {}

  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {

    console.log("Device connected:", client.id)

  }

  handleDisconnect(client: Socket) {

    console.log("Device disconnected:", client.id)

  }

  @SubscribeMessage('join-meeting')
  async joinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ) {

    const { meetingId } = data

    client.join(meetingId)

    console.log(`Client joined meeting ${meetingId}`)

  }

  @SubscribeMessage('audio-chunk')
  async handleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {

    const { meetingId, audio } = payload

    console.log("Audio received from:", client.id)

    await this.meetingsService.processAudio(meetingId, audio)

  }

}