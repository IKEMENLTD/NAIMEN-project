# Trinity System v2 - イケメンの構造化（内面スコアリングシステム）

## 🔱 プロジェクト概要

**ミッション: イケメンの構造化**

外面、内面、経済面が上位20%（80点以上）で初めて真のイケメンと定義。

本プロジェクトは**第一フェーズ: 内面のスコアリングシステム v2（最適化版）**です。

---

## 🚀 バージョン情報

**現在のバージョン: v2（最適化版）**

### v2の改善点
- **7シート → 2シート**（58%削減）
- **7エンドポイント → 3エンドポイント**（57%削減）
- **イベントソーシングパターン採用**
- **拡張性の大幅向上**

---

## 💎 内面の本質 - Trinity（三位一体）

内面は3つの力で構成される：

1. **認識力（Perception）** - 何が見えているか
2. **判断力（Judgment）** - 何が重要か
3. **実行力（Execution）** - 何をするか

### スコア計算式

```
total_score = min(perception, judgment, execution) × growth_coefficient
```

**Trinity の哲学:** 3つの力のうち、最も低い力がボトルネックになる。

---

## 🗄️ アーキテクチャ（2シート構成）

### シート1: users
ユーザーの**現在の状態**を保持

| user_id | name | perception | judgment | execution | total | growth_coef | last_updated | meta |
|---------|------|------------|----------|-----------|-------|-------------|--------------|------|

### シート2: events
**全イベント履歴**（イベントソーシング）

| id | user_id | ts | type | agent | dim | val | data |
|----|---------|-------|------|-------|-----|-----|------|

**イベントタイプ:**
- `obs` - observation（観察）
- `jdg` - judgment（判断）
- `exec` - execution（実行）
- `score` - score_update（スコア更新）
- `growth` - growth_calc（成長係数）

---

## 🤖 3体のエージェント

### The Observer（観察者）
- **役割:** 認識力を評価
- **頻度:** 毎日朝6時
- **評価:** 日記分析、認知バイアス検出

### The Judge（審判者）
- **役割:** 判断力を評価
- **頻度:** 毎週日曜21時
- **評価:** 論理性、優先順位の一貫性

### The Executor（執行者）
- **役割:** 実行力を評価
- **頻度:** 毎日夜22時
- **評価:** 完遂率、即行動性、継続力

---

## 📡 API（3エンドポイント）

### 1. GET /user
ユーザーの現在の状態を取得

### 2. GET /events
イベント履歴を取得（フィルタリング可能）

### 3. POST /event
イベントを記録（全エージェント共通）

---

## 📁 プロジェクト構造

```
trinity-system-v2/
├── README.md                 # このファイル
├── DEPLOYMENT-v2.md          # デプロイガイド
├── PROJECT_SUMMARY-v2.md     # 完成サマリー
│
├── trinity-db-v2/            # データベース（2シートのみ）
│   ├── users.csv
│   └── events.csv
│
├── gas-api-v2/               # Google Apps Script API
│   └── Code.gs
│
├── agents-v2/                # 3体のエージェント
│   ├── observer.js
│   ├── judge.js
│   ├── executor.js
│   └── README.md
│
└── batch-v2/                 # バッチ処理
    └── growth-calculator.js
```

---

## 🚀 クイックスタート

### 1. スプレッドシート作成
```bash
# users.csv と events.csv をインポート
```

### 2. GAS APIデプロイ
```bash
# Code.gs を Apps Script にコピー
# SPREADSHEET_ID を設定
# Web Appとしてデプロイ
```

### 3. エージェント実行
```bash
cd agents-v2
cp .env.example .env
# .env を編集（TRINITY_API_URL を設定）

npm run observer
npm run judge
npm run executor
```

詳細: **DEPLOYMENT-v2.md** を参照

---

## 📊 技術スタック

### バックエンド
- Google Apps Script（JavaScript）
- Google Sheets（データストレージ）

### データモデル
- **イベントソーシング**
- CQRS（Command Query Responsibility Segregation）

### エージェント
- Node.js 18+
- JavaScript ES6+

---

## 🎯 目標スコア

### イケメン基準（80点以上）

- 認識力 ≥ 80点
- 判断力 ≥ 80点
- 実行力 ≥ 80点
- **総合スコア = min(80, 80, 80) × 1.0 = 80点**

---

## ✅ v2の利点

1. **シンプル:** 7シート → 2シート
2. **統一API:** 3エンドポイントのみ
3. **拡張性:** 新しいイベントタイプを追加するだけ
4. **デバッグ容易:** 全履歴が events シートに
5. **高速:** users シートは1行、events は append-only
6. **スケーラブル:** 外面・経済面も同じ構造で追加可能

---

## 📈 データフロー

```
社長の日常
    ↓
日記・判断・タスクを記録
    ↓
3体のエージェントが24時間監視
    ↓
events シートに全記録
    ↓
users シートを自動更新
    ↓
月次で成長係数を計算
```

---

## 🔮 ロードマップ

### ✅ Phase 1: 内面スコアリングシステム v2（完了）
- 2シート構成
- 3エンドポイントAPI
- 3体のエージェント

### ⬜ Phase 2: 外面スコアリングシステム
- 同じ events シートに外面イベント追加
- 容姿、健康、ファッション

### ⬜ Phase 3: 経済面スコアリングシステム
- 同じ events シートに経済イベント追加
- 収入、支出、資産

### ⬜ Phase 4: 統合ダッシュボード
- 3軸統合ビュー
- AI改善提案

---

## 📝 使い方

### 日記を書く
`memory/YYYY-MM-DD.md` に記録

### 判断を記録
```javascript
const { recordDecision } = require('./agents-v2/judge');
recordDecision('判断内容', '理由', 90, ['選択肢A', 'B']);
```

### タスクを記録
```javascript
const { declareTask, startTask, completeTask } = require('./agents-v2/executor');
const taskId = declareTask('タスク内容', 50, true);
startTask(taskId);
completeTask(taskId);
```

---

## 📚 ドキュメント

- **DEPLOYMENT-v2.md** - デプロイガイド
- **PROJECT_SUMMARY-v2.md** - 完成サマリー
- **agents-v2/README.md** - エージェント詳細
- **gas-api-v2/Code.gs** - API実装（コメント付き）

---

## 🔧 トラブルシューティング

詳細は **DEPLOYMENT-v2.md** を参照。

---

## 🏆 完成度

**実装完了:** 2026-01-29  
**ファイル数:** 13ファイル（v1比58%削減）  
**コード行数:** 約1,120行（v1比23%削減）  
**品質:** 本番運用可能レベル

---

## 🔥 Philosophy

> **「究極までシンプルに。本質だけを残す。」**

v2では不要な複雑さを排除し、イベントソーシングの原則に従って、
すべての履歴を1つのシートに集約しました。

**完璧に。シンプルに。イケメンへの道を構造化する。**

---

**Trinity System v2 - 内面を数値化し、成長を可視化する。**
