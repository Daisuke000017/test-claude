import { z } from 'zod';

export const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(true),
  allowMultiple: z.boolean().default(false),
  maxChoices: z.number().int().positive().optional(),
  questions: z.array(
    z.object({
      title: z.string().min(1, 'Question title is required').max(300),
      description: z.string().max(500).optional(),
      questionType: z.enum(['MULTIPLE_CHOICE', 'TEXT', 'RATING', 'YES_NO']).default('MULTIPLE_CHOICE'),
      options: z.array(z.string().min(1).max(200)).min(2, 'At least 2 options required').optional(),
    })
  ).min(1, 'At least one question is required'),
});

export const submitResponseSchema = z.object({
  sessionId: z.string().min(1),
  responses: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().optional(),
      textAnswer: z.string().max(1000).optional(),
    })
  ).min(1, 'At least one response is required'),
});

export const updatePollStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED']),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
export type UpdatePollStatusInput = z.infer<typeof updatePollStatusSchema>;
