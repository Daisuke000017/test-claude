import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Vote, QrCode, BarChart3, Users } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-6xl mx-auto p-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            リアルタイム投票アプリ
          </h1>
          <p className="text-xl text-gray-700">
            イベントやミーティングで使える簡単投票システム
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Button
            onClick={() => navigate('/create')}
            className="text-lg px-8 py-4"
          >
            <Vote className="inline w-6 h-6 mr-2" />
            新しい投票を作成
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <QrCode className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">QRコードで簡単参加</h3>
            <p className="text-sm text-gray-600">
              アカウント不要でQRコードをスキャンするだけ
            </p>
          </Card>

          <Card className="text-center">
            <BarChart3 className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">リアルタイム結果表示</h3>
            <p className="text-sm text-gray-600">
              投票と同時に結果がグラフで更新
            </p>
          </Card>

          <Card className="text-center">
            <Users className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">匿名投票</h3>
            <p className="text-sm text-gray-600">
              個人情報不要で安心して投票
            </p>
          </Card>

          <Card className="text-center">
            <Vote className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">複数の質問に対応</h3>
            <p className="text-sm text-gray-600">
              1つの投票で複数の質問を作成可能
            </p>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-6">使い方</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">投票を作成</h3>
              <p className="text-sm text-gray-600">
                質問と選択肢を入力して投票を作成
              </p>
            </div>
            <div>
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">QRコードを共有</h3>
              <p className="text-sm text-gray-600">
                参加者にQRコードやURLを共有
              </p>
            </div>
            <div>
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">結果をリアルタイム確認</h3>
              <p className="text-sm text-gray-600">
                投票結果がリアルタイムで更新
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
