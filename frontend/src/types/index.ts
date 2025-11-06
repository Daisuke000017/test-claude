export type PollStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'YES_NO';

export interface Poll {
  id: string;
  title: string;
  description?: string;
  isAnonymous: boolean;
  allowMultiple: boolean;
  maxChoices?: number;
  hostCode: string;
  participantCode: string;
  status: PollStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  closedAt?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  pollId: string;
  title: string;
  description?: string;
  questionType: QuestionType;
  order: number;
  options: Option[];
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: string;
  questionId: string;
  text: string;
  order: number;
}

export interface CreatePollData {
  title: string;
  description?: string;
  isAnonymous: boolean;
  allowMultiple: boolean;
  maxChoices?: number;
  questions: {
    title: string;
    description?: string;
    questionType: QuestionType;
    options: string[];
  }[];
}

export interface ResponseData {
  questionId: string;
  optionId?: string;
  textAnswer?: string;
}

export interface SubmitResponseData {
  sessionId: string;
  responses: ResponseData[];
}

export interface QuestionResult {
  questionId: string;
  title: string;
  totalVotes: number;
  results: {
    optionId: string;
    text: string;
    count: number;
    percentage: number;
  }[];
}

export interface PollResults {
  pollId: string;
  title: string;
  status: PollStatus;
  questions: QuestionResult[];
}
