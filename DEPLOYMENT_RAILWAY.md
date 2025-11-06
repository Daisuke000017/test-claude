# Railway デプロイガイド

Railwayは全てのサービスを1箇所で管理できる最も簡単なデプロイ方法です。

## 前提条件
- GitHubアカウント
- [Railway.app](https://railway.app)のアカウント（無料）

**無料枠**: $5分のクレジット/月（個人プロジェクトには十分）

---

## ステップ1: Railwayにサインアップ

1. https://railway.app にアクセス
2. 「Login」→「Login with GitHub」をクリック
3. GitHubアカウントで認証

---

## ステップ2: 新しいプロジェクトを作成

1. ダッシュボードで「New Project」をクリック
2. 「Deploy from GitHub repo」を選択
3. リポジトリを検索: `Daisuke000017/test-claude`
4. ブランチを選択: `claude/what-can-you-do-011CUoyh2bWjfgdLTC5ivkSL`

---

## ステップ3: サービスを追加

### 3-1. PostgreSQLを追加

1. プロジェクト画面で「+ New」→「Database」→「Add PostgreSQL」をクリック
2. 自動的にデータベースが作成されます
3. データベース名をクリック→「Variables」タブで `DATABASE_URL` を確認（自動設定されます）

### 3-2. Redisを追加

1. プロジェクト画面で「+ New」→「Database」→「Add Redis」をクリック
2. 自動的にRedisが作成されます
3. Redis名をクリック→「Variables」タブで `REDIS_URL` を確認（自動設定されます）

---

## ステップ4: バックエンドをデプロイ

1. プロジェクト画面で既に追加されているGitHubサービスをクリック
2. 「Settings」タブに移動
3. 以下を設定:

   **Root Directory**:
   ```
   backend
   ```

   **Build Command**:
   ```
   npm install && npx prisma generate && npm run build
   ```

   **Start Command**:
   ```
   npx prisma migrate deploy && npm start
   ```

4. 「Variables」タブに移動して環境変数を追加:

   **自動的に設定される変数**（確認のみ）:
   - `DATABASE_URL` - PostgreSQLから自動的に参照
   - `REDIS_URL` - Redisから自動的に参照

   **手動で追加する変数**:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://<your-frontend-domain>.railway.app
   PORT=3000
   ```

5. 「Networking」タブに移動
6. 「Generate Domain」をクリックして公開URLを生成
7. 生成されたURL（例: `https://realtime-poll-backend-production.up.railway.app`）をコピー

---

## ステップ5: フロントエンドをデプロイ

### オプションA: Railway（すべて1箇所）

1. プロジェクト画面で「+ New」→「GitHub Repo」→同じリポジトリを選択
2. 「Settings」タブで以下を設定:

   **Root Directory**:
   ```
   frontend
   ```

   **Build Command**:
   ```
   npm install && npm run build
   ```

   **Start Command**:
   ```
   npx serve -s dist -l 3000
   ```

3. まず `package.json` に `serve` を追加する必要があります（後述）

4. 「Variables」タブで環境変数を追加:
   ```
   VITE_API_URL=https://<backend-url>.railway.app/api
   VITE_SOCKET_URL=https://<backend-url>.railway.app
   ```

5. 「Networking」タブで「Generate Domain」をクリック

6. 生成されたフロントエンドURLをバックエンドの `FRONTEND_URL` に設定

### オプションB: Vercel（フロントエンドのみ・推奨）

1. https://vercel.com にアクセス
2. 「New Project」→リポジトリをインポート
3. 設定:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 環境変数:
   ```
   VITE_API_URL=https://<backend-url>.railway.app/api
   VITE_SOCKET_URL=https://<backend-url>.railway.app
   ```
5. デプロイ完了後、URLをバックエンドの `FRONTEND_URL` に設定

---

## ステップ6: 環境変数の最終調整

### バックエンドの `FRONTEND_URL` を更新

1. Railwayのバックエンドサービスをクリック
2. 「Variables」タブで `FRONTEND_URL` を実際のフロントエンドURLに更新
3. サービスが自動的に再デプロイされます

---

## ステップ7: 動作確認

1. フロントエンドのURLにアクセス
2. 投票を作成
3. QRコードが表示されることを確認
4. 別のタブで参加してリアルタイム更新を確認

---

## フロントエンドでserveを使う場合の追加設定

Railwayでフロントエンドもデプロイする場合、`serve`パッケージが必要です：

**frontend/package.json** に追加:

```json
{
  "dependencies": {
    ...existing dependencies,
    "serve": "^14.2.1"
  }
}
```

これを追加するコミットを作成してプッシュしてください。

---

## トラブルシューティング

### ビルドエラー: Prisma関連

**エラー**: `Prisma Client could not be generated`

**解決策**: Build Commandに `npx prisma generate` が含まれているか確認

### 環境変数が反映されない

**解決策**:
1. 「Variables」タブで変数を確認
2. サービスを手動で再デプロイ（右上の「Deploy」ボタン）

### データベース接続エラー

**解決策**:
- PostgreSQLサービスが起動しているか確認
- `DATABASE_URL` がバックエンドの環境変数に自動的に追加されているか確認

---

## Railway vs Render比較

| 機能 | Railway | Render |
|------|---------|--------|
| 無料枠 | $5/月のクレジット | 750時間/月 |
| スリープ | なし | 15分で自動スリープ |
| 起動速度 | 常時起動 | 初回30秒〜1分 |
| セットアップ | より簡単 | やや複雑 |
| データベース制限 | なし（クレジット内） | 1つまで |

**Railway推奨理由**: すべて1箇所で管理でき、スリープなしで常時稼働

---

## コスト見積もり（無料枠内に収める方法）

Railway無料枠（$5/月）の使用例：

- **PostgreSQL**: ~$1/月
- **Redis**: ~$0.50/月
- **バックエンド**: ~$2/月
- **合計**: ~$3.50/月（無料枠内）

**フロントエンドはVercelを使うことで無料枠を節約できます**

---

## サポート

問題が発生した場合:
1. Railwayのデプロイログを確認
2. 環境変数が正しく設定されているか確認
3. GitHubのIssueで質問

---

## 次のステップ

デプロイ完了後:
- カスタムドメインの設定
- 環境変数の最適化
- モニタリングの設定
