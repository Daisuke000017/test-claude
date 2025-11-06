import { Server, Socket } from 'socket.io';
import pollService from '../services/pollService';

interface HostJoinData {
  hostCode: string;
}

interface ParticipantJoinData {
  participantCode: string;
  sessionId: string;
}

export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Host joins poll room
    socket.on('host:join', async (data: HostJoinData) => {
      try {
        const { hostCode } = data;
        const result = await pollService.getPollByHostCode(hostCode);

        // Join room for this poll
        socket.join(`poll:${result.poll.id}:host`);

        console.log(`Host joined poll ${result.poll.id}`);

        socket.emit('host:joined', {
          success: true,
          pollId: result.poll.id,
        });
      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to join as host',
        });
      }
    });

    // Participant joins poll room
    socket.on('participant:join', async (data: ParticipantJoinData) => {
      try {
        const { participantCode, sessionId } = data;
        const poll = await pollService.getPollByParticipantCode(participantCode);

        // Join room for this poll
        socket.join(`poll:${poll.id}:participants`);

        console.log(`Participant joined poll ${poll.id}`);

        // Notify host
        io.to(`poll:${poll.id}:host`).emit('poll:participant-joined', {
          sessionId,
          timestamp: new Date().toISOString(),
        });

        socket.emit('participant:joined', {
          success: true,
          pollId: poll.id,
          status: poll.status,
        });
      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to join poll',
        });
      }
    });

    // Notify when response is submitted
    socket.on('response:submitted', async (data: { pollId: string }) => {
      try {
        const { pollId } = data;

        // Fetch updated results
        const poll = await pollService.getPollByHostCode(''); // We need pollId here

        // Notify host room about new response
        io.to(`poll:${pollId}:host`).emit('poll:new-response', {
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error handling response submission:', error);
      }
    });

    // Broadcast status change
    socket.on('poll:status-changed', (data: { pollId: string; status: string }) => {
      const { pollId, status } = data;

      // Notify all participants
      io.to(`poll:${pollId}:participants`).emit('poll:status-changed', {
        status,
        timestamp: new Date().toISOString(),
      });

      console.log(`Poll ${pollId} status changed to ${status}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
