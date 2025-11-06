import { customAlphabet } from 'nanoid';

// 読みやすい文字だけを使用（0, O, I, l などを除外）
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 8);

export const generateHostCode = (): string => {
  return `H-${nanoid()}`;
};

export const generateParticipantCode = (): string => {
  return `P-${nanoid()}`;
};

export const generateSessionId = (): string => {
  return nanoid();
};
