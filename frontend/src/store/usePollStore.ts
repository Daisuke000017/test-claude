import { create } from 'zustand';
import { Poll, PollResults, ResponseData } from '../types';

interface PollStore {
  // State
  currentPoll: Poll | null;
  results: PollResults | null;
  participantCount: number;
  responses: Map<string, ResponseData>;
  sessionId: string;

  // Actions
  setPoll: (poll: Poll) => void;
  setResults: (results: PollResults) => void;
  setParticipantCount: (count: number) => void;
  incrementParticipants: () => void;
  setResponse: (questionId: string, response: ResponseData) => void;
  clearResponses: () => void;
  setSessionId: (sessionId: string) => void;
  reset: () => void;
}

export const usePollStore = create<PollStore>((set) => ({
  // Initial state
  currentPoll: null,
  results: null,
  participantCount: 0,
  responses: new Map(),
  sessionId: '',

  // Actions
  setPoll: (poll) => set({ currentPoll: poll }),

  setResults: (results) => set({ results }),

  setParticipantCount: (count) => set({ participantCount: count }),

  incrementParticipants: () =>
    set((state) => ({ participantCount: state.participantCount + 1 })),

  setResponse: (questionId, response) =>
    set((state) => {
      const newResponses = new Map(state.responses);
      newResponses.set(questionId, response);
      return { responses: newResponses };
    }),

  clearResponses: () => set({ responses: new Map() }),

  setSessionId: (sessionId) => set({ sessionId }),

  reset: () =>
    set({
      currentPoll: null,
      results: null,
      participantCount: 0,
      responses: new Map(),
      sessionId: '',
    }),
}));
