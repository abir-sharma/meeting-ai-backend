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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {

    console.log("Device connected:", client.id)

  }

  handleDisconnect(client: Socket) {

    console.log("Device disconnected:", client.id)

  }

  @SubscribeMessage('join-meeting')
  handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {

    const { meetingId } = data

    client.join(meetingId)

    console.log(`Client joined meeting ${meetingId}`)

  }

}