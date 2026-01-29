# Trinity Agents - 3体のエージェント

## 🔱 概要

**Trinity System** の核心となる3体のエージェント：

1. **The Observer（観察者）** - 認識力を評価
2. **The Judge（審判者）** - 判断力を評価
3. **The Executor（執行者）** - 実行力を評価

各エージェントが24時間体制で観察・評価を行い、GAS APIにデータを送信します。

---

## 🚀 セットアップ

### 1. 前提条件

- Node.js 18以上
- GAS API がデプロイ済み
- Googleスプレッドシートが作成済み

### 2. 環境変数の設定

`.env` ファイルを作成：

```bash
cp .env.example .env
```

編集して以下を設定：

```env
TRINITY_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
USER_ID=uuid-001
WORKSPACE=/root/clawd
```

### 3. テスト実行

```bash
npm run test
```

サンプルデータが作成され、各エージェントの動作確認ができます。

---

## 🤖 各エージェントの詳細

### Observer（observer.js）

**役割:** 現実をありのまま見る力を測定

**観察対象:**
- 日記の質（事実と解釈の分離度）
- 認知バイアスの検出
- 自己認識の精度

**実行タイミング:** 毎日朝6時

**実行方法:**
```bash
npm run observer
```

---

### Judge（judge.js）

**役割:** 本質を掴み、優先順位を正しくつける力を測定

**観察対象:**
- 意思決定の論理性
- 優先順位の一貫性
- 根本原因思考

**実行タイミング:** 毎週日曜日21時

**実行方法:**
```bash
npm run judge
```

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

**実行方法:**
```bash
npm run executor
```

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

**評価基準:**
- 事実と解釈の分離度
- 認知バイアスの有無
- 予測精度

---

### 判断力（Judgment）
```
スコア = 論理性 × 0.6 + 優先順位の一貫性 × 0.4
```

**評価基準:**
- 判断の論理的整合性
- 「なぜ」を繰り返せるか
- 優先順位のブレの少なさ

---

### 実行力（Execution）
```
スコア = 完遂率 × 0.4 + 即行動 × 0.3 + 継続力 × 0.3
```

**評価基準:**
- タスク完遂率
- 判断から実行までの速度
- 習慣の継続日数

---

### 総合スコア
```
total_score = min(perception, judgment, execution) × growth_coefficient
```

**Trinity の哲学:**
3つの力のうち、最も低い力がボトルネックになる。
すべてをバランスよく鍛える必要がある。

---

## 🔄 データフロー

```
社長の行動・思考
    ↓
日記・タスク・判断を記録
    ↓
3体のエージェントが観察
    ↓
各エージェントがスコア評価
    ↓
GAS API にデータ送信
    ↓
Googleスプレッドシートに蓄積
    ↓
成長曲線を可視化
```

---

## 📅 Cron設定

詳細は `CRON.md` を参照。

**基本設定:**
- Observer: 毎日 6:00
- Judge: 毎週日曜 21:00
- Executor: 毎日 22:00

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

### サンプルデータ生成
```bash
npm run test
```

---

## 📁 ファイル構造

```
agents/
├── observer.js        # 観察者エージェント
├── judge.js           # 審判者エージェント
├── executor.js        # 執行者エージェント
├── package.json       # npm設定
├── .env.example       # 環境変数サンプル
├── README.md          # このファイル
├── AGENTS.md          # エージェント設計書
├── CRON.md            # Cron設定ガイド
└── test.js            # テストスクリプト
```

---

## 🔧 トラブルシューティング

### エラー: API call failed
- GAS API URLが正しいか確認
- Web Appが正しくデプロイされているか確認
- アクセス権限が「全員」になっているか確認

### エラー: ファイルが見つかりません
- `WORKSPACE` 環境変数が正しいか確認
- ワークスペースディレクトリが存在するか確認

### スコアが記録されない
- スプレッドシートIDが正しいか確認（GAS側）
- シート名が一致しているか確認
- ログを確認: `console.log` の出力を見る

---

## 📈 次のステップ

1. ✅ GAS API デプロイ完了
2. ✅ エージェント実装完了
3. ⬜ Cron設定
4. ⬜ 初回実行テスト
5. ⬜ 1週間の試験運用
6. ⬜ スコアリングロジックの調整
7. ⬜ 可視化ダッシュボード作成

---

## 📝 ログ

各エージェントの実行ログは以下に出力：
- `/var/log/trinity-observer.log`
- `/var/log/trinity-judge.log`
- `/var/log/trinity-executor.log`

---

**完璧に動作確認してから本格運用を開始してください。**
