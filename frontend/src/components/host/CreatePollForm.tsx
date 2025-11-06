import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { pollApi } from '../../services/api';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionInput {
  title: string;
  options: string[];
}

export const CreatePollForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { title: '', options: ['', ''] },
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { title: '', options: ['', ''] }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await pollApi.createPoll({
        title,
        description,
        isAnonymous: true,
        allowMultiple: false,
        questions: questions.map((q) => ({
          title: q.title,
          questionType: 'MULTIPLE_CHOICE',
          options: q.options.filter((opt) => opt.trim() !== ''),
        })),
      });

      navigate(`/host/${result.hostCode}`);
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('投票の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">新しい投票を作成</h1>

      <Card>
        <h2 className="text-xl font-semibold mb-4">基本情報</h2>
        <Input
          label="投票タイトル *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 今日のランチは？"
          required
        />
        <div className="mb-4">
          <label className="label">説明（任意）</label>
          <textarea
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="投票の詳細を入力..."
            rows={3}
          />
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">質問</h2>
          <Button type="button" onClick={addQuestion} variant="outline">
            <Plus className="inline w-4 h-4 mr-1" />
            質問を追加
          </Button>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={qIndex}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">質問 {qIndex + 1}</h3>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <Input
              label="質問内容 *"
              value={question.title}
              onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
              placeholder="質問を入力..."
              required
            />

            <div className="space-y-2">
              <label className="label">選択肢 *</label>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`選択肢 ${oIndex + 1}`}
                    required
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                onClick={() => addOption(qIndex)}
                variant="secondary"
                className="w-full"
              >
                <Plus className="inline w-4 h-4 mr-1" />
                選択肢を追加
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? '作成中...' : '投票を作成'}
        </Button>
      </div>
    </form>
  );
};
