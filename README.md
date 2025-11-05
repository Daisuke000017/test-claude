# 🎨 リアルタイム共同お絵かきアプリ

WebRTC (PeerJS)を使用した、完全無料のリアルタイム共同お絵かきアプリです。

## ✨ 機能

- 🖌️ リアルタイムでの共同お絵かき
- 🎨 カラーピッカーとブラシサイズ調整
- 👥 複数人同時接続（P2P方式）
- 🔗 ルームコードで簡単に参加
- 🗑️ キャンバスクリア機能
- 💾 画像として保存
- 📱 レスポンシブデザイン

## 🚀 使い方

### ローカルで実行

1. リポジトリをクローン
   ```bash
   git clone <repository-url>
   cd test-claude
   ```

2. ブラウザで `index.html` を開く、または：
   ```bash
   python3 -m http.server 8000
   ```

3. `http://localhost:8000` にアクセス

### お絵かきの始め方

1. **ルームを作成する場合**
   - 「ルームを作成」ボタンをクリック
   - 表示されるルームIDをコピー
   - 友達にルームIDを共有

2. **ルームに参加する場合**
   - 共有されたルームIDを入力
   - 「参加する」ボタンをクリック

3. **お絵かきを楽しむ**
   - カラーピッカーで色を選択
   - ブラシサイズを調整
   - マウスやタッチで描画
   - 他の参加者とリアルタイムで共同作業！

### 🌐 無料デプロイ方法

#### Vercel（おすすめ）

1. [Vercel](https://vercel.com)にサインアップ
2. GitHubリポジトリを接続
3. プロジェクトをインポート
4. 自動デプロイ完了！

#### Netlify

1. [Netlify](https://netlify.com)にサインアップ
2. 「New site from Git」を選択
3. リポジトリを接続
4. デプロイ設定は自動検出されます

#### GitHub Pages

1. リポジトリの Settings > Pages
2. Source: `main` ブランチ / `root` フォルダ
3. Save をクリック
4. 数分後に公開URL が表示されます

### 📱 対応環境

- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- デスクトップ・タブレット・スマートフォン
- インターネット接続必須（WebRTC通信のため）

## 🛠️ 技術スタック

- HTML5 Canvas
- Vanilla JavaScript
- PeerJS (WebRTC)
- CSS3

## 📝 ライセンス

MIT License
