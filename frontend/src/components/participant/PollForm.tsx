import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { pollApi } from '../../services/api';
import socketService from '../../services/socket';
import { Poll, ResponseData } from '../../types';
import { nanoid } from 'nanoid';

export const PollForm: React.FC = () => {
  const { participantCode } = useParams<{ participantCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<Map<string, ResponseData>>(new Map());
  const [sessionId] = useState(() => nanoid());

  useEffect(() => {
    if (!participantCode) return;

    const fetchPoll = async () => {
      try {
        const pollData = await pollApi.getPollByParticipantCode(participantCode);
        setPoll(pollData);

        // Connect to WebSocket
        socketService.connect();
        socketService.joinAsParticipant(participantCode, sessionId);

        // Listen for status changes
        socketService.on('poll:status-changed', (data: { status: string }) => {
          setPoll((prev) => (prev ? { ...prev, status: data.status as any } : null));
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch poll:', error);
        alert('投票の取得に失敗しました');
        navigate('/');
      }
    };

    fetchPoll();

    return () => {
      socketService.disconnect();
    };
  }, [participantCode, sessionId, navigate]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setResponses((prev) => {
      const newResponses = new Map(prev);
      newResponses.set(questionId, { questionId, optionId });
      return newResponses;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantCode || !poll) return;

    // Validate all questions answered
    if (responses.size !== poll.questions.length) {
      alert('すべての質問に回答してください');
      return;
    }

    setSubmitting(true);

    try {
      await pollApi.submitResponses(participantCode, {
        sessionId,
        responses: Array.from(responses.values()),
      });

      // Notify host
      socketService.notifyResponseSubmitted(poll.id);

      navigate(`/poll/${participantCode}/thanks`);
    } catch (error: any) {
      console.error('Failed to submit responses:', error);
      alert(error.response?.data?.error?.message || '回答の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !poll) {
    return <LoadingSpinner />;
  }

  if (poll.status === 'DRAFT') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <h2 className="text-2xl font-bold text-center mb-4">投票準備中</h2>
          <p className="text-center text-gray-600">
            この投票はまだ開始されていません。しばらくお待ちください。
          </p>
        </Card>
      </div>
    );
  }

  if (poll.status === 'CLOSED') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <h2 className="text-2xl font-bold text-center mb-4">投票終了</h2>
          <p className="text-center text-gray-600">
            この投票は既に終了しています。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-2">{poll.title}</h1>
      {poll.description && (
        <p className="text-center text-gray-600 mb-8">{poll.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {poll.questions.map((question, index) => (
          <Card key={question.id}>
            <h3 className="text-lg font-semibold mb-4">
              質問 {index + 1}: {question.title}
            </h3>
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={responses.get(question.id)?.optionId === option.id}
                    onChange={() => handleOptionSelect(question.id, option.id)}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-gray-900">{option.text}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}

        <Button
          type="submit"
          disabled={submitting || responses.size !== poll.questions.length}
          className="w-full"
        >
          {submitting ? '送信中...' : '回答を送信'}
        </Button>
      </form>
    </div>
  );
};
