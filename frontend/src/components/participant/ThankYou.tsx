import React from 'react';
import { Card } from '../common/Card';
import { CheckCircle } from 'lucide-react';

export const ThankYou: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">回答ありがとうございました！</h2>
        <p className="text-gray-600">
          あなたの回答が記録されました。
        </p>
      </Card>
    </div>
  );
};
