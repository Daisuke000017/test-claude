import { Request, Response, NextFunction } from 'express';
import pollService from '../services/pollService';
import {
  createPollSchema,
  submitResponseSchema,
  updatePollStatusSchema,
} from '../models/pollValidation';
import { AppError } from '../middleware/errorHandler';

export class PollController {
  async createPoll(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createPollSchema.parse(req.body);
      const result = await pollService.createPoll(validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPollByHostCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { hostCode } = req.params;
      const result = await pollService.getPollByHostCode(hostCode);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPollByParticipantCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { participantCode } = req.params;
      const poll = await pollService.getPollByParticipantCode(participantCode);

      res.json({
        success: true,
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePollStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { hostCode } = req.params;
      const { status } = updatePollStatusSchema.parse(req.body);

      const poll = await pollService.updatePollStatus(hostCode, status);

      res.json({
        success: true,
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const { participantCode } = req.params;
      const validatedData = submitResponseSchema.parse(req.body);

      const result = await pollService.submitResponses(participantCode, validatedData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPollResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { hostCode } = req.params;
      const results = await pollService.getPollResults(hostCode);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PollController();
