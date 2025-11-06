# デプロイガイド

このアプリを無料でクラウドにデプロイする手順です。

---

## 🚀 デプロイオプション選択ガイド

### オプション1: Railway（最も簡単・推奨）
**すべて1箇所で管理、スリープなし**

- 📖 **ガイド**: [DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md)
- ✅ **メリット**: セットアップが最も簡単、常時稼働
- ⚠️ **制限**: 月$5分の無料クレジット

### オプション2: Supabase + Render
**既にRenderのデータベース無料枠を使っている方向け**

- 📖 **ガイド**: [DEPLOYMENT_SUPABASE.md](./DEPLOYMENT_SUPABASE.md)
- ✅ **メリット**: 完全無料、既存Renderアカウント活用
- ⚠️ **制限**: 15分でスリープ

### オプション3: Render.com（標準）
**Renderの無料枠がまだ残っている方向け**

- 📖 **ガイド**: 以下に続く
- ✅ **メリット**: すべて1箇所で管理
- ⚠️ **制限**: 無料データベースは1つまで、15分でスリープ

---

> **⚠️ 重要**: Renderの無料プランでは、データベースは1アカウントにつき1つまでしか作成できません。
>
> 既に他のプロジェクトでRenderのデータベースを使用している場合は、以下のいずれかを選択してください：
>
> 1. **[Railway](./DEPLOYMENT_RAILWAY.md)** を使う（推奨）
> 2. **[Supabase + Render](./DEPLOYMENT_SUPABASE.md)** を使う
> 3. 既存のRenderデータベースを削除して新規作成

---

## Render.com デプロイ手順（標準）

### 前提条件
- GitHubアカウント
- [Render.com](https://render.com)のアカウント（無料）
- **Renderで無料データベースをまだ使っていないこと**

---

## ステップ1: Render.comにサインアップ

1. https://render.com にアクセス
2. 「Get Started」をクリック
3. GitHubアカウントで認証

---

## ステップ2: PostgreSQLデータベースを作成

1. Renderダッシュボードで「New +」→「PostgreSQL」をクリック
2. 以下の設定を入力:
   - **Name**: `realtime-poll-db`
   - **Database**: `realtimepoll`
   - **User**: `postgres`（自動設定）
   - **Region**: `Oregon (US West)`（または近い地域）
   - **Plan**: `Free`
3. 「Create Database」をクリック
4. データベースが作成されたら、**Internal Database URL** をコピー（後で使用）

---

## ステップ3: Redisを作成

1. Renderダッシュボードで「New +」→「Redis」をクリック
2. 以下の設定を入力:
   - **Name**: `realtime-poll-redis`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Free`
   - **Maxmemory Policy**: `noeviction`
3. 「Create Redis」をクリック
4. Redisが作成されたら、**Internal Redis URL** をコピー（後で使用）

---

## ステップ4: バックエンドをデプロイ

1. Renderダッシュボードで「New +」→「Web Service」をクリック
2. GitHubリポジトリを接続:
   - 「Connect a repository」をクリック
   - リポジトリを選択: `Daisuke000017/test-claude`
   - ブランチを選択: `claude/what-can-you-do-011CUoyh2bWjfgdLTC5ivkSL`
3. 以下の設定を入力:

   **基本設定:**
   - **Name**: `realtime-poll-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `claude/what-can-you-do-011CUoyh2bWjfgdLTC5ivkSL`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```
     npx prisma migrate deploy && npm start
     ```
   - **Plan**: `Free`

4. 環境変数を設定:
   「Advanced」→「Add Environment Variable」で以下を追加:

   ```
   NODE_ENV=production
   DATABASE_URL=[ステップ2でコピーしたInternal Database URL]
   REDIS_URL=[ステップ3でコピーしたInternal Redis URL]
   FRONTEND_URL=https://realtime-poll-frontend.onrender.com
   PORT=10000
   ```

5. 「Create Web Service」をクリック
6. デプロイが完了するまで待つ（5-10分）
7. デプロイ完了後、URLをコピー（例: `https://realtime-poll-backend.onrender.com`）

---

## ステップ5: フロントエンドをデプロイ

### オプションA: Render（静的サイト）

1. Renderダッシュボードで「New +」→「Static Site」をクリック
2. 同じGitHubリポジトリを選択
3. 以下の設定を入力:

   **基本設定:**
   - **Name**: `realtime-poll-frontend`
   - **Branch**: `claude/what-can-you-do-011CUoyh2bWjfgdLTC5ivkSL`
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

4. 環境変数を設定:
   ```
   VITE_API_URL=https://realtime-poll-backend.onrender.com/api
   VITE_SOCKET_URL=https://realtime-poll-backend.onrender.com
   ```

5. 「Create Static Site」をクリック
6. デプロイが完了するまで待つ（3-5分）

### オプションB: Vercel（より高速・推奨）

1. https://vercel.com にアクセスしてサインアップ
2. 「New Project」をクリック
3. GitHubリポジトリをインポート: `Daisuke000017/test-claude`
4. 以下の設定:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 環境変数を追加:
   ```
   VITE_API_URL=https://realtime-poll-backend.onrender.com/api
   VITE_SOCKET_URL=https://realtime-poll-backend.onrender.com
   ```
6. 「Deploy」をクリック

---

## ステップ6: バックエンドの環境変数を更新

フロントエンドのURLが確定したら、バックエンドの環境変数を更新:

1. Renderのバックエンドサービス設定に移動
2. 「Environment」タブをクリック
3. `FRONTEND_URL` を実際のフロントエンドURLに更新:
   ```
   FRONTEND_URL=https://realtime-poll-frontend.onrender.com
   ```
   または Vercelを使用した場合:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. 「Save Changes」をクリック
5. サービスが自動的に再デプロイされます

---

## ステップ7: 動作確認

フロントエンドのURLにアクセスして、アプリが正常に動作することを確認:

1. 投票を作成
2. QRコードが表示されることを確認
3. 別のブラウザ/タブで投票に参加
4. リアルタイムで結果が更新されることを確認

---

## トラブルシューティング

### バックエンドのビルドエラー

**エラー**: `Prisma Client could not be generated`

**解決策**: Build Commandに `npx prisma generate` が含まれているか確認

### データベース接続エラー

**エラー**: `Can't reach database server`

**解決策**:
- DATABASE_URLが正しいか確認（Internal Database URLを使用）
- データベースとバックエンドが同じリージョンにあるか確認

### CORS エラー

**エラー**: `CORS policy: No 'Access-Control-Allow-Origin'`

**解決策**:
- バックエンドの `FRONTEND_URL` 環境変数が正しいフロントエンドURLに設定されているか確認

### Redisが接続できない

**エラー**: `Redis connection failed`

**解決策**:
- REDIS_URLが正しいか確認（Internal Redis URLを使用）
- Redisとバックエンドが同じリージョンにあるか確認

---

## 無料プランの制限

### Render無料プラン:
- サービスが15分間非アクティブだとスリープ状態になる
- 初回アクセス時に起動に30秒〜1分かかる
- 月750時間の稼働時間制限

### 本番環境での推奨:
- 有料プラン（月$7〜）にアップグレード
- または Railway, Fly.io などの他のプラットフォームを検討

---

## 代替デプロイオプション

### Railway（推奨代替案）

1. https://railway.app にアクセス
2. GitHubリポジトリを接続
3. PostgreSQL + Redis + Node.jsサービスを追加
4. 環境変数を設定

**メリット**: より高速、スリープなし（一定の無料枠あり）

### Fly.io（バックエンド）+ Vercel（フロントエンド）

**メリット**: グローバルに分散、高速
**デメリット**: セットアップがやや複雑

---

## サポート

デプロイで問題が発生した場合は、以下を確認してください:

1. Renderのビルドログを確認
2. 環境変数が正しく設定されているか確認
3. データベースとRedisが正常に動作しているか確認

それでも解決しない場合は、GitHubのIssueで質問してください。
