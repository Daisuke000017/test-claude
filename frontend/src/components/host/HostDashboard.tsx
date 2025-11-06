import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { pollApi } from '../../services/api';
import socketService from '../../services/socket';
import { usePollStore } from '../../store/usePollStore';
import { Poll, PollResults } from '../../types';
import { Users, Play, Pause, StopCircle, BarChart3 } from 'lucide-react';

export const HostDashboard: React.FC = () => {
  const { hostCode } = useParams<{ hostCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  const participantUrl = `${window.location.origin}/poll/${poll?.participantCode}`;

  useEffect(() => {
    if (!hostCode) return;

    const fetchPoll = async () => {
      try {
        const data = await pollApi.getPollByHostCode(hostCode);
        setPoll(data.poll);
        setParticipantCount(data.stats.totalParticipants);

        // Fetch initial results
        const resultsData = await pollApi.getPollResults(hostCode);
        setResults(resultsData);

        // Connect to WebSocket
        socketService.connect();
        socketService.joinAsHost(hostCode);

        // Listen for participant joins
        socketService.on('poll:participant-joined', () => {
          setParticipantCount((prev) => prev + 1);
        });

        // Listen for new responses
        socketService.on('poll:new-response', async () => {
          // Refresh results
          const newResults = await pollApi.getPollResults(hostCode);
          setResults(newResults);
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
  }, [hostCode, navigate]);

  const handleStatusChange = async (status: string) => {
    if (!hostCode || !poll) return;

    try {
      await pollApi.updatePollStatus(hostCode, status);
      socketService.notifyStatusChange(poll.id, status);
      setPoll({ ...poll, status: status as any });
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  if (loading || !poll) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{poll.title}</h1>
        <div className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          <span className="font-semibold">{participantCount}</span>
          <span className="text-gray-600">参加者</span>
        </div>
      </div>

      {poll.description && (
        <p className="text-gray-600">{poll.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">参加用QRコード</h2>
          <div className="flex flex-col items-center space-y-4">
            <QRCodeSVG value={participantUrl} size={200} />
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">参加コード:</p>
              <code className="block bg-gray-100 px-4 py-2 rounded text-center font-mono">
                {poll.participantCode}
              </code>
            </div>
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">参加URL:</p>
              <input
                type="text"
                readOnly
                value={participantUrl}
                className="input text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">投票コントロール</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">ステータス:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  poll.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : poll.status === 'PAUSED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : poll.status === 'CLOSED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {poll.status === 'ACTIVE'
                  ? '進行中'
                  : poll.status === 'PAUSED'
                  ? '一時停止'
                  : poll.status === 'CLOSED'
                  ? '終了'
                  : '下書き'}
              </span>
            </div>

            {poll.status === 'DRAFT' && (
              <Button
                onClick={() => handleStatusChange('ACTIVE')}
                className="w-full"
              >
                <Play className="inline w-4 h-4 mr-2" />
                投票を開始
              </Button>
            )}

            {poll.status === 'ACTIVE' && (
              <>
                <Button
                  onClick={() => handleStatusChange('PAUSED')}
                  variant="secondary"
                  className="w-full"
                >
                  <Pause className="inline w-4 h-4 mr-2" />
                  一時停止
                </Button>
                <Button
                  onClick={() => handleStatusChange('CLOSED')}
                  variant="outline"
                  className="w-full"
                >
                  <StopCircle className="inline w-4 h-4 mr-2" />
                  投票を終了
                </Button>
              </>
            )}

            {poll.status === 'PAUSED' && (
              <>
                <Button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="w-full"
                >
                  <Play className="inline w-4 h-4 mr-2" />
                  再開
                </Button>
                <Button
                  onClick={() => handleStatusChange('CLOSED')}
                  variant="outline"
                  className="w-full"
                >
                  <StopCircle className="inline w-4 h-4 mr-2" />
                  投票を終了
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {results && (
        <Card>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            リアルタイム結果
          </h2>
          <div className="space-y-6">
            {results.questions.map((question) => (
              <div key={question.questionId}>
                <h3 className="font-semibold mb-3">{question.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  合計投票数: {question.totalVotes}
                </p>
                <div className="space-y-2">
                  {question.results.map((result) => (
                    <div key={result.optionId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{result.text}</span>
                        <span className="font-semibold">
                          {result.count} ({result.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
