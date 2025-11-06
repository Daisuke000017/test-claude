# リアルタイム投票アプリ

イベントやミーティングで使える、リアルタイム投票・アンケートアプリケーションです。

## 特徴

- **QRコードで簡単参加**: アカウント不要でQRコードをスキャンするだけで投票に参加
- **リアルタイム結果表示**: 投票と同時に結果がグラフでリアルタイムに更新
- **匿名投票**: 個人情報不要で安心して投票できる
- **複数質問対応**: 1つの投票で複数の質問を作成可能
- **モダンなUI**: Tailwind CSSによる美しく使いやすいインターフェース

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.io Client
- Zustand (状態管理)
- Recharts (グラフ表示)
- React Router v6

### バックエンド
- Node.js
- Express.js
- TypeScript
- Socket.io
- Prisma (ORM)
- PostgreSQL
- Redis (キャッシュ)
- Zod (バリデーション)

## セットアップ

### 前提条件
- Node.js 20以上
- Docker & Docker Compose

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd realtime-poll-app
```

### 2. データベース・Redisの起動

```bash
docker-compose up -d
```

### 3. バックエンドのセットアップ

```bash
cd backend

# 依存関係のインストール
npm install

# Prismaクライアントの生成
npm run prisma:generate

# データベースマイグレーション
npm run prisma:migrate

# 開発サーバーの起動
npm run dev
```

バックエンドは http://localhost:3000 で起動します。

### 4. フロントエンドのセットアップ

別のターミナルで:

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは http://localhost:5173 で起動します。

## 使い方

### 1. 投票の作成

1. ブラウザで http://localhost:5173 にアクセス
2. 「新しい投票を作成」ボタンをクリック
3. 投票タイトル、質問、選択肢を入力
4. 「投票を作成」ボタンをクリック

### 2. 投票の開始

1. 作成後、主催者ダッシュボードが表示されます
2. QRコードが表示されるので、参加者に共有
3. 「投票を開始」ボタンをクリックして投票を開始

### 3. 参加者の投票

1. QRコードをスキャン、またはURLにアクセス
2. 各質問に回答
3. 「回答を送信」ボタンをクリック

### 4. 結果の確認

主催者ダッシュボードで、リアルタイムに更新される結果を確認できます。

## プロジェクト構造

```
realtime-poll-app/
├── backend/                  # バックエンド
│   ├── src/
│   │   ├── controllers/     # リクエスト処理
│   │   ├── models/          # データモデル
│   │   ├── routes/          # ルーティング
│   │   ├── services/        # ビジネスロジック
│   │   ├── websocket/       # WebSocket処理
│   │   ├── middleware/      # ミドルウェア
│   │   └── utils/           # ユーティリティ
│   ├── prisma/              # Prismaスキーマ
│   └── package.json
│
├── frontend/                 # フロントエンド
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # API通信
│   │   ├── store/           # 状態管理
│   │   └── types/           # TypeScript型定義
│   └── package.json
│
└── docker-compose.yml        # Docker設定
```

## API エンドポイント

### 投票管理
- `POST /api/polls` - 新規投票作成
- `GET /api/polls/:hostCode/host` - 主催者用投票情報取得
- `GET /api/polls/:participantCode/join` - 参加者用投票情報取得
- `PUT /api/polls/:hostCode/status` - 投票ステータス変更
- `GET /api/polls/:hostCode/results` - 結果取得

### 回答
- `POST /api/polls/:participantCode/responses` - 回答送信

## WebSocketイベント

### 主催者側
- `host:join` - 主催者として投票に参加
- `poll:participant-joined` - 参加者が参加したときの通知
- `poll:new-response` - 新しい回答が送信されたときの通知

### 参加者側
- `participant:join` - 参加者として投票に参加
- `poll:status-changed` - 投票ステータスが変更されたときの通知

## 開発

### Prisma Studio（データベースGUI）

```bash
cd backend
npm run prisma:studio
```

http://localhost:5555 でPrisma Studioが起動します。

### ビルド

```bash
# バックエンド
cd backend
npm run build

# フロントエンド
cd frontend
npm run build
```

## ライセンス

MIT

## 作成者

Claude Code による実装
