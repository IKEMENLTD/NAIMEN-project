# Trinity Agents v2 - 3体のエージェント（最適化版）

## 🔱 概要

**Trinity System v2** の核心となる3体のエージェント：

1. **The Observer（観察者）** - 認識力を評価
2. **The Judge（審判者）** - 判断力を評価
3. **The Executor（執行者）** - 実行力を評価

---

## 🚀 セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
```

編集して以下を設定：

```env
TRINITY_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
USER_ID=uuid-001
WORKSPACE=/root/clawd
```

### 2. 実行

```bash
# 個別実行
npm run observer
npm run judge
npm run executor

# 全て実行
npm run all
```

---

## 🤖 各エージェントの詳細

### Observer（observer.js）

**役割:** 現実をありのまま見る力を測定

**観察対象:**
- 日記の質（事実と解釈の分離度）
- 認知バイアスの検出

**実行タイミング:** 毎日朝6時

**イベント記録:**
- `obs` - 観察記録
- `score` - 認識力スコア更新

---

### Judge（judge.js）

**役割:** 本質を掴み、優先順位を正しくつける力を測定

**観察対象:**
- 意思決定の論理性
- 優先順位の一貫性

**実行タイミング:** 毎週日曜日21時

**イベント記録:**
- `jdg` - 判断記録
- `score` - 判断力スコア更新

**判断を記録する:**
```javascript
const { recordDecision } = require('./judge');

recordDecision(
  '判断内容',
  '理由（なぜその判断をしたか）',
  90, // 優先度（0-100）
  ['選択肢A', '選択肢B', '選択肢C']
);
```

---

### Executor（executor.js）

**役割:** 選択を現実にする力を測定

**観察対象:**
- タスクの完遂率
- 判断から実行までのタイムラグ
- 継続力（習慣の定着）

**実行タイミング:** 毎日夜22時

**イベント記録:**
- `exec` - 実行記録
- `score` - 実行力スコア更新

**タスクを記録する:**
```javascript
const { declareTask, startTask, completeTask } = require('./executor');

// タスク宣言
const taskId = declareTask('朝のルーティン', 50, true);

// タスク開始
startTask(taskId);

// タスク完了
completeTask(taskId);
```

---

## 📊 スコアリングロジック

### 認識力（Perception）
```
スコア = 日記の質 × 0.7 + バイアス検出力 × 0.3
```

### 判断力（Judgment）
```
スコア = 論理性 × 0.6 + 優先順位の一貫性 × 0.4
```

### 実行力（Execution）
```
スコア = 完遂率 × 0.4 + 即行動 × 0.3 + 継続力 × 0.3
```

### 総合スコア
```
total_score = min(perception, judgment, execution) × growth_coefficient
```

---

## 🔄 データフロー

```
社長の行動・思考
    ↓
日記・タスク・判断を記録
    ↓
3体のエージェントが観察
    ↓
events シートに記録
    ↓
users シートを自動更新
```

---

## 📅 Cron設定

### 基本設定
- Observer: 毎日 6:00
- Judge: 毎週日曜 21:00
- Executor: 毎日 22:00

**crontab:**
```cron
0 6 * * * cd /root/clawd/agents-v2 && node observer.js
0 21 * * 0 cd /root/clawd/agents-v2 && node judge.js
0 22 * * * cd /root/clawd/agents-v2 && node executor.js
```

---

## 🧪 テスト

### 手動テスト
```bash
# すべてのエージェントを順次実行
npm run all

# 個別実行
npm run observer
npm run judge
npm run executor
```

---

## 📁 ファイル構造

```
agents-v2/
├── observer.js        # 観察者エージェント
├── judge.js           # 審判者エージェント
├── executor.js        # 執行者エージェント
├── package.json       # npm設定
├── .env.example       # 環境変数テンプレート
└── README.md          # このファイル
```

---

## 🔧 トラブルシューティング

### エラー: API call failed
- GAS API URLが正しいか確認
- Web Appが正しくデプロイされているか確認

### エラー: ファイルが見つかりません
- `WORKSPACE` 環境変数が正しいか確認
- ディレクトリが存在するか確認

---

## ✅ v2の改善点

1. **APIの統一:** 全エージェントが同じAPI構造を使用
2. **イベントベース:** 全てが events シートに記録される
3. **シンプル:** 不要な複雑さを排除
4. **拡張性:** 新しいエージェントを追加しやすい

---

**完璧に動作確認してから本格運用を開始してください。**
