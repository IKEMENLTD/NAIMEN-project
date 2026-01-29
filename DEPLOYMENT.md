# Trinity System - 完全デプロイガイド

## 📋 目次

1. [前提条件](#前提条件)
2. [Phase 1: データベース構築](#phase-1-データベース構築)
3. [Phase 2: GAS APIデプロイ](#phase-2-gas-apiデプロイ)
4. [Phase 3: エージェント設定](#phase-3-エージェント設定)
5. [Phase 4: Cron設定](#phase-4-cron設定)
6. [Phase 5: 統合テスト](#phase-5-統合テスト)
7. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必要なもの
- [ ] Googleアカウント
- [ ] Node.js 18以上
- [ ] Clawdbot実行環境
- [ ] 基本的なターミナル操作スキル

### 推定所要時間
- 初回セットアップ: 30-45分
- テスト・調整: 1-2時間

---

## Phase 1: データベース構築

### 1-1. Googleスプレッドシート作成

1. Google Sheetsで新規スプレッドシート作成
2. 名前を `ikemen-trinity-system` に変更
3. URLからスプレッドシートIDをコピー
   ```
   https://docs.google.com/spreadsheets/d/【ここがID】/edit
   ```

### 1-2. CSVインポート

`trinity-db/` ディレクトリの7つのCSVファイルをインポート：

1. **users** シート作成 → `users.csv` をインポート
2. **trinity_scores** シート作成 → `trinity_scores.csv` をインポート
3. **observations** シート作成 → `observations.csv` をインポート
4. **judgments** シート作成 → `judgments.csv` をインポート
5. **executions** シート作成 → `executions.csv` をインポート
6. **agents** シート作成 → `agents.csv` をインポート
7. **growth_tracking** シート作成 → `growth_tracking.csv` をインポート

**インポート手順（各シート）:**
- ファイル → インポート → アップロード
- 区切り文字: カンマ
- 既存データ: 置き換え

### 1-3. 確認

- [ ] 7つのシートがすべて作成されている
- [ ] agentsシートに3体のエージェントが登録されている
- [ ] usersシートに初期ユーザーが登録されている

---

## Phase 2: GAS APIデプロイ

### 2-1. Apps Scriptプロジェクト作成

1. スプレッドシートを開く
2. 「拡張機能」→「Apps Script」
3. 新しいプロジェクトが開く

### 2-2. コードのコピー

1. `gas-api/Code.gs` の内容をすべてコピー
2. Apps Scriptエディタに貼り付け
3. **重要:** 2行目の `SPREADSHEET_ID` を実際のIDに置き換え

```javascript
const SPREADSHEET_ID = 'あなたのスプレッドシートID';
```

4. 保存（Ctrl+S / Cmd+S）

### 2-3. Web Appとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」
2. 種類: **ウェブアプリ**
3. 設定:
   - 説明: `Trinity System API v1`
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員**
4. 「デプロイ」をクリック
5. **ウェブアプリのURL** をコピー（必ず保存！）

### 2-4. 動作確認

ブラウザで以下にアクセス：
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?path=agents
```

エージェント情報が JSON で返ってくればOK。

---

## Phase 3: エージェント設定

### 3-1. 環境変数設定

`agents/` ディレクトリで `.env` ファイルを作成：

```bash
cd /root/clawd/agents
cp .env.example .env
```

編集：
```env
TRINITY_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
USER_ID=uuid-001
WORKSPACE=/root/clawd
```

### 3-2. テスト実行

```bash
npm run test
```

サンプルデータが作成されます。

### 3-3. 各エージェント手動実行

```bash
npm run observer
npm run judge
npm run executor
```

エラーが出ないことを確認。

### 3-4. 確認

スプレッドシートを開いて：
- [ ] `trinity_scores` シートにデータが追加されている
- [ ] `observations` シートにデータが追加されている
- [ ] `judgments` シートにデータが追加されている
- [ ] `executions` シートにデータが追加されている
- [ ] `users` シートのスコアが更新されている

---

## Phase 4: Cron設定

### 4-1. Clawdbot Cronで設定（推奨）

Clawdbotのチャットで以下を実行：

```
Cronジョブを3つ設定してください：

1. Trinity Observer
   - スケジュール: 毎日朝6時
   - タスク: cd /root/clawd/agents && node observer.js
   
2. Trinity Judge
   - スケジュール: 毎週日曜21時
   - タスク: cd /root/clawd/agents && node judge.js
   
3. Trinity Executor
   - スケジュール: 毎日夜22時
   - タスク: cd /root/clawd/agents && node executor.js
```

### 4-2. システムCronで設定（代替）

```bash
crontab -e
```

追加：
```cron
0 6 * * * cd /root/clawd/agents && /usr/bin/node observer.js >> /var/log/trinity-observer.log 2>&1
0 21 * * 0 cd /root/clawd/agents && /usr/bin/node judge.js >> /var/log/trinity-judge.log 2>&1
0 22 * * * cd /root/clawd/agents && /usr/bin/node executor.js >> /var/log/trinity-executor.log 2>&1
```

### 4-3. 月次バッチ（Growth Calculator）

```cron
0 0 1 * * cd /root/clawd/batch && /usr/bin/node growth-calculator.js >> /var/log/trinity-growth.log 2>&1
```

毎月1日の0時に成長係数を計算。

---

## Phase 5: 統合テスト

### 5-1. 1週間の試験運用

1. 毎日、日記を書く（`memory/YYYY-MM-DD.md`）
2. 判断を記録する（`decisions.json`）
3. タスクを記録する（`tasks.json`）
4. エージェントが自動実行されることを確認

### 5-2. スコアの確認

週末にスプレッドシートを開いて：
- スコアが正しく記録されているか
- 成長曲線が見えるか
- 異常値がないか

### 5-3. 調整

必要に応じて：
- スコアリングロジックの調整
- 評価基準の見直し
- 実行頻度の変更

---

## トラブルシューティング

### エラー: API call failed

**原因:**
- GAS API URLが間違っている
- スプレッドシートIDが間違っている
- デプロイが正しくされていない

**解決策:**
1. `.env` の `TRINITY_API_URL` を確認
2. GAS の `SPREADSHEET_ID` を確認
3. Web Appを再デプロイ

---

### エラー: ファイルが見つかりません

**原因:**
- `WORKSPACE` パスが間違っている
- 必要なディレクトリが作成されていない

**解決策:**
```bash
cd /root/clawd
mkdir -p memory
mkdir -p batch
```

---

### スコアが記録されない

**原因:**
- シート名が一致していない
- データ形式が間違っている

**解決策:**
1. スプレッドシートのシート名を確認（完全一致が必要）
2. GAS のログを確認（Apps Script → 実行数）

---

### Cronが実行されない

**原因:**
- Cronの設定が間違っている
- 環境変数が読み込まれていない
- Node.jsのパスが間違っている

**解決策:**
```bash
# Node.jsのパスを確認
which node

# Cronのログを確認
tail -f /var/log/cron.log

# 手動実行して動作確認
cd /root/clawd/agents && node observer.js
```

---

## ✅ デプロイ完了チェックリスト

- [ ] Googleスプレッドシート作成完了
- [ ] 7つのCSVをインポート完了
- [ ] GAS API デプロイ完了
- [ ] API動作確認完了（ブラウザでアクセス）
- [ ] `.env` ファイル作成・設定完了
- [ ] エージェント手動実行成功
- [ ] スプレッドシートにデータ記録確認
- [ ] Cronジョブ設定完了
- [ ] 月次バッチ設定完了
- [ ] 1週間の試験運用計画立案

---

## 🎯 次のステップ

1. **毎日の運用**
   - 日記を書く
   - タスクを記録する
   - 判断を記録する

2. **週次レビュー**
   - スコアの推移を確認
   - 改善点を発見

3. **月次レビュー**
   - 成長係数を確認
   - 目標スコア（80点以上）への進捗確認

4. **本格運用**
   - 外面スコアリングシステムの追加
   - 経済面スコアリングシステムの追加
   - 統合ダッシュボードの構築

---

**完璧に。止まらない。イケメンへの道を構造化する。**
