# Trinity System v2 - イケメンの構造化（内面スコアリングシステム）

## 🔱 概要

**ミッション: イケメンの構造化**

外面、内面、経済面が上位20%（80点以上）で初めて真のイケメンと定義。

本プロジェクトは**第一フェーズ: 内面のスコアリングシステム v2（最適化版）**を実装します。

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

---

## 🗄️ データベース設計（2シート構成）

### シート1: users（現在の状態）
ユーザーの最新スコアと状態を保持

| user_id | name | created_at | perception | judgment | execution | total | growth_coef | last_updated | meta |
|---------|------|------------|------------|----------|-----------|-------|-------------|--------------|------|

### シート2: events（全イベント履歴）
すべての観察・判断・実行・スコア更新・成長計算を記録

| id | user_id | ts | type | agent | dim | val | data |
|----|---------|-------|------|-------|-----|-----|------|

**イベントタイプ:**
- `obs` - observation（観察記録）
- `jdg` - judgment（判断記録）
- `exec` - execution（実行記録）
- `score` - score_update（スコア更新）
- `growth` - growth_calc（成長係数計算）

---

## 🤖 3体のエージェント

### The Observer（観察者）
- **役割:** 認識力を評価
- **実行頻度:** 毎日朝6時

### The Judge（審判者）
- **役割:** 判断力を評価
- **実行頻度:** 毎週日曜21時

### The Executor（執行者）
- **役割:** 実行力を評価
- **実行頻度:** 毎日夜22時

---

## 📡 API エンドポイント（3つのみ）

### 1. GET /user
ユーザーの現在の状態を取得

```
GET /?path=user&user_id=uuid-001
```

### 2. GET /events
イベント履歴を取得

```
GET /?path=events&user_id=uuid-001&type=score&limit=100
```

**パラメータ:**
- `type`: obs | jdg | exec | score | growth | all
- `agent`: observer | judge | executor | system | all
- `dim`: perception | judgment | execution | all
- `from`: YYYY-MM-DD
- `to`: YYYY-MM-DD
- `limit`: 件数（デフォルト100）

### 3. POST /event
イベントを記録

```json
{
  "user_id": "uuid-001",
  "type": "score",
  "agent": "observer",
  "dim": "perception",
  "val": 75,
  "data": { "method": "diary_analysis" }
}
```

---

## 📁 プロジェクト構造

```
trinity-system-v2/
├── README-v2.md              # このファイル
├── DEPLOYMENT-v2.md          # デプロイガイド
│
├── trinity-db-v2/            # データベース（CSV）
│   ├── users.csv
│   └── events.csv
│
├── gas-api-v2/               # Google Apps Script API
│   └── Code.gs
│
├── agents-v2/                # 3体のエージェント
│   ├── observer.js
│   ├── judge.js
│   └── executor.js
│
└── batch-v2/                 # バッチ処理
    └── growth-calculator.js
```

---

## 🚀 クイックスタート

### 1. データベース構築
```bash
# users.csv と events.csv をGoogleスプレッドシートにインポート
```

### 2. GAS APIデプロイ
```bash
# Code.gs をApps Scriptにコピー
# スプレッドシートIDを設定
# Web Appとしてデプロイ
```

### 3. エージェント設定
```bash
cd agents-v2
# .env を作成して TRINITY_API_URL を設定
node observer.js
node judge.js
node executor.js
```

---

## ✅ v2の改善点

### 1. シンプル化
- **7シート → 2シート**
- 管理が容易
- 構造が明確

### 2. イベントソーシング
- すべての履歴を events シートに集約
- 任意の時点の状態を再構築可能
- デバッグが容易

### 3. API のシンプル化
- **7エンドポイント → 3エンドポイント**
- 統一されたインターフェース
- 拡張が容易

### 4. 拡張性
- 新しいイベントタイプを追加しやすい
- 外面・経済面も同じ構造で追加可能
- 新しいエージェントも容易に追加

### 5. パフォーマンス
- users シートは1行のみ（超高速）
- events シートは append-only（書き込み高速）

---

## 📊 データフロー

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
    ↓
イケメン度を可視化
```

---

## 🎯 目標スコア

### イケメン基準（80点以上）

- **認識力 ≥ 80点**
- **判断力 ≥ 80点**
- **実行力 ≥ 80点**
- **総合スコア = min(80, 80, 80) × 1.0 = 80点**

---

## 📝 使い方

### 日記の書き方
`memory/YYYY-MM-DD.md` に記録：

```markdown
# 2026-01-29

## 朝
- 06:00に起床した（事実）
- 瞑想を15分行った（事実）

## 振り返り
集中力が高まったと感じる（解釈）
```

### 判断の記録
```javascript
const { recordDecision } = require('./agents-v2/judge');

recordDecision(
  'プロジェクトXを優先',
  'なぜなら期限が近く、重要度が高いため',
  90,
  ['プロジェクトX', 'タスクA', '両方並行']
);
```

### タスクの記録
```javascript
const { declareTask, startTask, completeTask } = require('./agents-v2/executor');

const taskId = declareTask('朝のルーティン', 50, true);
startTask(taskId);
completeTask(taskId);
```

---

## 🔥 Philosophy

> **「究極までシンプルに。本質だけを残す。」**

v2では不要な複雑さを排除し、イベントソーシングの原則に従って、
すべての履歴を1つのシートに集約しました。

**完璧に。止まらない。イケメンへの道を構造化する。**

---

**Trinity System v2 - 内面を数値化し、成長を可視化する。**
