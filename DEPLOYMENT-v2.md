# Trinity System v2 - デプロイガイド（2シート構成）

## 📋 目次

1. [前提条件](#前提条件)
2. [Phase 1: データベース構築](#phase-1-データベース構築)
3. [Phase 2: GAS APIデプロイ](#phase-2-gas-apiデプロイ)
4. [Phase 3: エージェント設定](#phase-3-エージェント設定)
5. [Phase 4: 動作確認](#phase-4-動作確認)
6. [Phase 5: Cron設定](#phase-5-cron設定)

---

## 前提条件

### 必要なもの
- [ ] Googleアカウント
- [ ] Node.js 18以上
- [ ] 基本的なターミナル操作スキル

### 推定所要時間
- 初回セットアップ: **15-20分**（v1より大幅短縮）

---

## Phase 1: データベース構築

### 1-1. Googleスプレッドシート作成

1. Google Sheetsで新規スプレッドシート作成
2. 名前を `trinity-system-v2` に変更
3. URLからスプレッドシートIDをコピー
   ```
   https://docs.google.com/spreadsheets/d/【ここがID】/edit
   ```

### 1-2. CSVインポート（2シートのみ）

`trinity-db-v2/` ディレクトリの2つのCSVファイルをインポート：

1. **users** シート作成 → `users.csv` をインポート
2. **events** シート作成 → `events.csv` をインポート

**インポート手順（各シート）:**
- ファイル → インポート → アップロード
- 区切り文字: カンマ
- 既存データ: 置き換え

### 1-3. 確認

- [ ] 2つのシートが作成されている
- [ ] users シートに1行のデータがある
- [ ] events シートにヘッダー行がある

---

## Phase 2: GAS APIデプロイ

### 2-1. Apps Scriptプロジェクト作成

1. スプレッドシートを開く
2. 「拡張機能」→「Apps Script」
3. 新しいプロジェクトが開く

### 2-2. コードのコピー

1. `gas-api-v2/Code.gs` の内容をすべてコピー
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
   - 説明: `Trinity System v2 API`
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員**
4. 「デプロイ」をクリック
5. **ウェブアプリのURL** をコピー（必ず保存！）

### 2-4. 動作確認

ブラウザで以下にアクセス：
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?path=user&user_id=uuid-001
```

ユーザー情報がJSON形式で返ってくればOK。

---

## Phase 3: エージェント設定

### 3-1. 環境変数設定

`agents-v2/` ディレクトリで `.env` ファイルを作成：

```bash
cd agents-v2
```

`.env` ファイルの内容：
```env
TRINITY_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
USER_ID=uuid-001
WORKSPACE=/root/clawd
```

---

## Phase 4: 動作確認

### 4-1. サンプルデータ作成

日記を作成：
```bash
mkdir -p /root/clawd/memory
echo "# 2026-01-29

## 朝
- 06:00に起床した
- 瞑想を15分間行った

## 振り返り
今日は計画通りに進んだ。" > /root/clawd/memory/2026-01-29.md
```

### 4-2. エージェント手動実行

```bash
cd agents-v2

# Observer実行
node observer.js

# Judge実行（判断記録がある場合）
node judge.js

# Executor実行（タスク記録がある場合）
node executor.js
```

### 4-3. スプレッドシート確認

- [ ] `events` シートにイベントが記録されている
- [ ] `users` シートのスコアが更新されている

---

## Phase 5: Cron設定

### 5-1. Cron設定（システムcron）

```bash
crontab -e
```

追加：
```cron
# Trinity System v2 - Agents
0 6 * * * cd /root/clawd/agents-v2 && /usr/bin/node observer.js >> /var/log/trinity-observer.log 2>&1
0 21 * * 0 cd /root/clawd/agents-v2 && /usr/bin/node judge.js >> /var/log/trinity-judge.log 2>&1
0 22 * * * cd /root/clawd/agents-v2 && /usr/bin/node executor.js >> /var/log/trinity-executor.log 2>&1

# Growth Calculator (月次)
0 0 1 * * cd /root/clawd/batch-v2 && /usr/bin/node growth-calculator.js >> /var/log/trinity-growth.log 2>&1
```

---

## ✅ デプロイ完了チェックリスト

- [ ] Googleスプレッドシート作成完了
- [ ] 2つのCSVをインポート完了
- [ ] GAS API デプロイ完了
- [ ] API動作確認完了（ブラウザでアクセス）
- [ ] `.env` ファイル作成・設定完了
- [ ] エージェント手動実行成功
- [ ] スプレッドシートにデータ記録確認
- [ ] Cronジョブ設定完了

---

## 🎯 次のステップ

### 1. 毎日の運用
- 日記を書く（`memory/YYYY-MM-DD.md`）
- タスクを記録する
- 判断を記録する

### 2. 週次レビュー
- スプレッドシートでスコアの推移を確認
- events シートで詳細な履歴を分析

### 3. 月次レビュー
- 成長係数を確認
- 目標スコア（80点以上）への進捗確認

---

## 🔧 トラブルシューティング

### エラー: API call failed

**解決策:**
1. `.env` の `TRINITY_API_URL` を確認
2. GAS の `SPREADSHEET_ID` を確認
3. Web Appを再デプロイ

### スコアが更新されない

**解決策:**
1. events シートにデータが記録されているか確認
2. GAS のログを確認（Apps Script → 実行数）
3. API エンドポイントが正しいか確認

---

## 📊 v2の利点（再確認）

1. **シンプル:** 2シートのみ
2. **高速:** usersシートは1行のみ
3. **拡張性:** イベントタイプを追加するだけ
4. **デバッグ容易:** 全履歴がeventsシートに
5. **API統一:** 3エンドポイントのみ

---

**完璧に。シンプルに。イケメンへの道を構造化する。**
