# Supabase + Render デプロイガイド

Renderのデータベース無料枠を使っている場合、Supabaseの無料PostgreSQLと組み合わせる方法です。

## 構成
- **データベース**: Supabase（無料・無制限）
- **Redis**: Upstash（無料）
- **バックエンド**: Render（無料）
- **フロントエンド**: Vercel（無料）

すべて無料で運用可能！

---

## ステップ1: Supabaseでデータベースを作成

### 1-1. Supabaseにサインアップ

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントで認証

### 1-2. 新しいプロジェクトを作成

1. 「New Project」をクリック
2. 以下を入力:
   - **Name**: `realtime-poll`
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` または近いリージョン
   - **Pricing Plan**: `Free`
3. 「Create new project」をクリック
4. プロジェクトの作成を待つ（1-2分）

### 1-3. 接続文字列を取得

1. プロジェクトダッシュボードで「Settings」→「Database」をクリック
2. 「Connection string」セクションで「URI」を選択
3. 接続文字列をコピー:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
4. `[YOUR-PASSWORD]` を実際のパスワードに置き換える

---

## ステップ2: Upstash Redisを作成

### 2-1. Upstashにサインアップ

1. https://upstash.com にアクセス
2. 「Get Started」→GitHubアカウントで認証

### 2-2. Redisデータベースを作成

1. 「Create Database」をクリック
2. 以下を設定:
   - **Name**: `realtime-poll-redis`
   - **Type**: `Regional`
   - **Region**: `ap-northeast-1` (Tokyo) または近いリージョン
   - **TLS**: `Enabled`
3. 「Create」をクリック

### 2-3. 接続URLを取得

1. データベースダッシュボードで「Details」タブを開く
2. 「REST API」セクションで「UPSTASH_REDIS_REST_URL」をコピー

   または

   「Redis Connect」セクションで接続URLをコピー:
   ```
   redis://default:[password]@xxx.upstash.io:6379
   ```

---

## ステップ3: Renderでバックエンドをデプロイ

### 3-1. 新しいWeb Serviceを作成

1. https://dashboard.render.com にアクセス
2. 「New +」→「Web Service」をクリック
3. GitHubリポジトリを接続:
   - リポジトリ: `Daisuke000017/test-claude`
   - ブランチ: `claude/what-can-you-do-011CUoyh2bWjfgdLTC5ivkSL`

### 3-2. サービス設定

以下の設定を入力:

**基本設定**:
- **Name**: `realtime-poll-backend`
- **Region**: `Oregon (US West)` または近いリージョン
- **Branch**: `claude/what-can-you-do-011CUoyh2bWjfgdLTC5ivkSL`
- **Root Directory**: `backend`
- **Runtime**: `Node`

**Build設定**:
- **Build Command**:
  ```
  npm install && npx prisma generate && npm run build
  ```
- **Start Command**:
  ```
  npx prisma migrate deploy && npm start
  ```

**Plan**: `Free`

### 3-3. 環境変数を設定

「Advanced」→「Add Environment Variable」で以下を追加:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
REDIS_URL=rediss://default:[password]@xxx.upstash.io:6379
FRONTEND_URL=https://realtime-poll-frontend.vercel.app
PORT=10000
```

**重要**:
- `DATABASE_URL` はSupabaseからコピーした接続文字列
- `REDIS_URL` はUpstashからコピーした接続文字列
- `FRONTEND_URL` は後でVercelのURLに更新

### 3-4. デプロイ

1. 「Create Web Service」をクリック
2. デプロイが完了するまで待つ（5-10分）
3. デプロイ完了後、URLをコピー（例: `https://realtime-poll-backend.onrender.com`）

---

## ステップ4: Vercelでフロントエンドをデプロイ

### 4-1. Vercelにサインアップ

1. https://vercel.com にアクセス
2. 「Sign Up」→GitHubアカウントで認証

### 4-2. 新しいプロジェクトを作成

1. 「New Project」をクリック
2. 「Import Git Repository」
3. リポジトリを検索: `Daisuke000017/test-claude`
4. 「Import」をクリック

### 4-3. プロジェクト設定

以下を設定:

**Configure Project**:
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`（自動設定）
- **Output Directory**: `dist`（自動設定）

**Environment Variables**:
「Add」をクリックして以下を追加:

```
VITE_API_URL=https://realtime-poll-backend.onrender.com/api
VITE_SOCKET_URL=https://realtime-poll-backend.onrender.com
```

**重要**: バックエンドの実際のURLを使用してください

### 4-4. デプロイ

1. 「Deploy」をクリック
2. デプロイが完了するまで待つ（2-3分）
3. デプロイ完了後、URLが表示されます（例: `https://realtime-poll-frontend.vercel.app`）

---

## ステップ5: バックエンドの環境変数を更新

フロントエンドのURLが確定したので、バックエンドを更新:

1. Renderのバックエンドサービスに戻る
2. 「Environment」タブをクリック
3. `FRONTEND_URL` を実際のVercel URLに更新:
   ```
   FRONTEND_URL=https://realtime-poll-frontend.vercel.app
   ```
4. 「Save Changes」をクリック
5. サービスが自動的に再デプロイされます

---

## ステップ6: 動作確認

1. VercelのフロントエンドURLにアクセス
2. 投票を作成
3. QRコードが表示されることを確認
4. 別のブラウザ/タブで参加
5. リアルタイムで結果が更新されることを確認

---

## トラブルシューティング

### Prismaマイグレーションエラー

**エラー**: `Migration failed`

**解決策**:
1. Supabaseダッシュボードで「SQL Editor」を開く
2. 手動でマイグレーションを実行するか、Renderのログを確認

### データベース接続エラー

**エラー**: `Can't reach database server`

**解決策**:
1. Supabaseの接続文字列が正しいか確認
2. パスワードに特殊文字が含まれる場合、URLエンコードが必要
3. Supabaseプロジェクトが「Active」状態か確認

### Redis接続エラー

**エラー**: `Redis connection failed`

**解決策**:
1. UpstashのRedis URLが正しいか確認
2. `rediss://`（TLS付き）を使用しているか確認
3. Upstashダッシュボードでデータベースが「Active」か確認

### CORS エラー

**エラー**: `CORS policy: No 'Access-Control-Allow-Origin'`

**解決策**:
- バックエンドの `FRONTEND_URL` が正しいVercel URLに設定されているか確認
- Renderサービスを再デプロイ

---

## 各サービスの無料枠

| サービス | 無料枠 | 制限 |
|---------|-------|------|
| **Supabase** | PostgreSQL 500MB | データベース2つまで |
| **Upstash** | Redis 10,000コマンド/日 | データベース1つ |
| **Render** | 750時間/月 | 15分でスリープ |
| **Vercel** | 100GB帯域/月 | 無制限デプロイ |

**すべて完全無料で運用可能**

ただし、Renderは15分非アクティブでスリープ状態になるため、初回アクセス時に30秒〜1分の起動時間が必要です。

---

## この構成の利点

✅ **完全無料**: すべてのサービスが無料枠内で動作
✅ **Renderの制限を回避**: データベースは別サービスを使用
✅ **グローバル対応**: Vercelで高速配信
✅ **スケーラブル**: 必要に応じて有料プランにアップグレード可能

---

## 次のステップ

デプロイ完了後:
- カスタムドメインの設定（Vercel/Render両方で可能）
- Supabaseのバックアップ設定
- 監視とログの設定

---

## サポート

問題が発生した場合:
1. 各サービスのログを確認（Render, Vercel, Supabase）
2. 環境変数が正しく設定されているか確認
3. GitHubのIssueで質問
