# デバッグ裁判：最後のリグレッション

TypeScript + Phaser で実装した、ソフトウェア開発現場が舞台のミステリーゲームです。  
ダンガンロンパ風に証拠（コトダマ）を集め、最終議論でバグ原因を論破します。

## セットアップ

```bash
npm install
```

## 開発サーバー

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## ユニットテスト

```bash
npm test
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) で、push / pull request 時に以下を実行します。

- 依存関係インストール
- ビルド
- ユニットテスト


## ドキュメント

- ゲームのストーリーとシステム仕様: `docs/game-design.md`

## ゲーム内容

- 3チャプターの会話選択で情報を収集
- 信頼度が行動選択によって変動
- 証拠の収集状況で最終判定が変化
- 最後に犯人と原因を選択し、論破成功/失敗が決定
