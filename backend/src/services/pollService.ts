import prisma from '../utils/database';
import redisClient from '../utils/redis';
import { generateHostCode, generateParticipantCode } from '../utils/codeGenerator';
import { CreatePollInput, SubmitResponseInput } from '../models/pollValidation';
import { AppError } from '../middleware/errorHandler';
import QRCode from 'qrcode';

export class PollService {
  async createPoll(data: CreatePollInput) {
    const hostCode = generateHostCode();
    const participantCode = generateParticipantCode();

    // Create poll with questions and options
    const poll = await prisma.poll.create({
      data: {
        title: data.title,
        description: data.description,
        isAnonymous: data.isAnonymous,
        allowMultiple: data.allowMultiple,
        maxChoices: data.maxChoices,
        hostCode,
        participantCode,
        questions: {
          create: data.questions.map((q, index) => ({
            title: q.title,
            description: q.description,
            questionType: q.questionType,
            order: index,
            options: {
              create: q.options?.map((optionText, optIndex) => ({
                text: optionText,
                order: optIndex,
              })) || [],
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Generate QR code
    const participantUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/poll/${participantCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(participantUrl);

    return {
      pollId: poll.id,
      hostCode: poll.hostCode,
      participantCode: poll.participantCode,
      qrCodeUrl: qrCodeDataUrl,
      poll,
    };
  }

  async getPollByHostCode(hostCode: string) {
    const poll = await prisma.poll.findUnique({
      where: { hostCode },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    // Get stats
    const totalParticipants = await prisma.session.count({
      where: { pollId: poll.id },
    });

    const totalResponses = await prisma.response.count({
      where: { question: { pollId: poll.id } },
    });

    return {
      poll,
      stats: {
        totalParticipants,
        totalResponses,
      },
    };
  }

  async getPollByParticipantCode(participantCode: string) {
    const poll = await prisma.poll.findUnique({
      where: { participantCode },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    return poll;
  }

  async updatePollStatus(hostCode: string, status: string) {
    const poll = await prisma.poll.findUnique({
      where: { hostCode },
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    const updatedPoll = await prisma.poll.update({
      where: { hostCode },
      data: {
        status: status as any,
        ...(status === 'ACTIVE' && !poll.startedAt && { startedAt: new Date() }),
        ...(status === 'CLOSED' && { closedAt: new Date() }),
      },
    });

    // Clear cache
    await redisClient.del(`poll:results:${poll.id}`);

    return updatedPoll;
  }

  async submitResponses(participantCode: string, data: SubmitResponseInput) {
    const poll = await prisma.poll.findUnique({
      where: { participantCode },
      include: { questions: true },
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    if (poll.status !== 'ACTIVE') {
      throw new AppError('Poll is not active', 400);
    }

    // Create or get session
    let session = await prisma.session.findFirst({
      where: {
        pollId: poll.id,
        fingerprint: data.sessionId,
      },
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          pollId: poll.id,
          fingerprint: data.sessionId,
        },
      });
    } else {
      // Check if already responded
      const existingResponses = await prisma.response.findFirst({
        where: { sessionId: session.id },
      });

      if (existingResponses && !poll.allowMultiple) {
        throw new AppError('You have already submitted a response', 400);
      }
    }

    // Create responses
    const responses = await Promise.all(
      data.responses.map((resp) =>
        prisma.response.create({
          data: {
            questionId: resp.questionId,
            optionId: resp.optionId,
            textAnswer: resp.textAnswer,
            sessionId: session.id,
          },
        })
      )
    );

    // Clear results cache
    await redisClient.del(`poll:results:${poll.id}`);

    return { success: true, sessionId: session.id };
  }

  async getPollResults(hostCode: string) {
    const poll = await prisma.poll.findUnique({
      where: { hostCode },
      include: {
        questions: {
          include: {
            options: {
              include: {
                responses: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    // Check cache
    const cacheKey = `poll:results:${poll.id}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate results
    const results = {
      pollId: poll.id,
      title: poll.title,
      status: poll.status,
      questions: poll.questions.map((question) => {
        const totalVotes = question.options.reduce(
          (sum, opt) => sum + opt.responses.length,
          0
        );

        return {
          questionId: question.id,
          title: question.title,
          totalVotes,
          results: question.options.map((option) => ({
            optionId: option.id,
            text: option.text,
            count: option.responses.length,
            percentage: totalVotes > 0 ? (option.responses.length / totalVotes) * 100 : 0,
          })),
        };
      }),
    };

    // Cache for 5 seconds
    await redisClient.setEx(cacheKey, 5, JSON.stringify(results));

    return results;
  }
}

export default new PollService();
