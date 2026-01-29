# Trinity System Database - CSV Import

## 📦 ファイル一覧

1. **users.csv** - ユーザーマスター
2. **trinity_scores.csv** - 3つの力のスコア履歴
3. **observations.csv** - Observer（観察者）の記録
4. **judgments.csv** - Judge（審判者）の記録
5. **executions.csv** - Executor（執行者）の記録
6. **agents.csv** - エージェントマスター（3体）
7. **growth_tracking.csv** - 成長係数の追跡

---

## 🚀 インポート手順

### 1. Googleスプレッドシートを新規作成
- スプレッドシート名: `ikemen-trinity-system`

### 2. 各シートを作成してCSVをインポート

各CSVファイルに対応するシートを作成し、インポート：

1. **users** シート → `users.csv`
2. **trinity_scores** シート → `trinity_scores.csv`
3. **observations** シート → `observations.csv`
4. **judgments** シート → `judgments.csv`
5. **executions** シート → `executions.csv`
6. **agents** シート → `agents.csv`
7. **growth_tracking** シート → `growth_tracking.csv`

**インポート方法:**
- 各シートで「ファイル」→「インポート」→「アップロード」
- 区切り文字: カンマ
- 既存データ: 置き換え

---

## 📋 データ構造の説明

### users（ユーザーマスター）
- `user_id`: ユーザー識別子（UUID）
- `name`: ユーザー名
- `perception_score`: 認識力スコア（0-100）
- `judgment_score`: 判断力スコア（0-100）
- `execution_score`: 実行力スコア（0-100）
- `total_score`: 総合スコア = min(3つのスコア) × 成長係数
- `last_updated`: 最終更新日時

### trinity_scores（スコア履歴）
- `dimension`: perception | judgment | execution
- `score`: 0-100
- `agent_id`: 評価したエージェント
- `evaluation_data`: 評価の詳細（JSON形式）

### observations（観察記録）
- `observation_type`: 
  - `diary_analysis` - 日記分析
  - `prediction_check` - 予測精度チェック
  - `bias_test` - 認知バイアステスト
  - `self_assessment` - 自己評価
- `bias_detected`: 検出されたバイアス
- `accuracy_score`: 精度スコア

### judgments（判断記録）
- `decision_id`: 判断の識別子
- `priority_score`: 優先順位の正確さ（0-100）
- `logic_quality`: 論理の質（0-100）
- `outcome`: 結果（success | failure | pending）

### executions（実行記録）
- `task_id`: タスク識別子
- `declared_at`: タスク宣言日時
- `completed_at`: 完了日時
- `completion_rate`: 完遂率（0-100）
- `difficulty`: 難易度（0-100）

### agents（エージェントマスター）
- 3体のエージェント（observer, judge, executor）
- `status`: active | inactive
- `evaluation_count`: 評価実施回数

### growth_tracking（成長追跡）
- `month`: 月次（YYYY-MM形式）
- `*_growth`: 各次元の成長率（前月比）
- `growth_coefficient`: 成長係数（1.0がベース）

---

## ✅ インポート完了後

スプレッドシートのURLを取得して、GAS APIの実装に進みます。

**次のステップ:**
- Phase 2: GAS API実装
- Phase 3: 3体エージェント実装
