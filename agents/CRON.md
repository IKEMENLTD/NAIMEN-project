# Trinity System - Cron設定ガイド

## 📅 定期実行スケジュール

### Observer（観察者）
**役割:** 日記を分析し、認識力を評価
**実行タイミング:** 毎日朝6時（日記を書いた後）

```bash
0 6 * * * cd /root/clawd/agents && /usr/bin/node observer.js >> /var/log/trinity-observer.log 2>&1
```

---

### Judge（審判者）
**役割:** 判断記録を分析し、判断力を評価
**実行タイミング:** 毎週日曜日 21時（週次レビュー後）

```bash
0 21 * * 0 cd /root/clawd/agents && /usr/bin/node judge.js >> /var/log/trinity-judge.log 2>&1
```

---

### Executor（執行者）
**役割:** タスク完遂状況を分析し、実行力を評価
**実行タイミング:** 毎日夜22時（一日の終わり）

```bash
0 22 * * * cd /root/clawd/agents && /usr/bin/node executor.js >> /var/log/trinity-executor.log 2>&1
```

---

## 🤖 Clawdbot Cron で設定する場合

Clawdbot の `cron` ツールを使用して設定：

### 1. Observer の設定
```javascript
await cron({
  action: 'add',
  job: {
    name: 'Trinity Observer - 認識力評価',
    schedule: '0 6 * * *',
    text: '日記を分析して認識力スコアを記録してください。',
    enabled: true
  }
});
```

### 2. Judge の設定
```javascript
await cron({
  action: 'add',
  job: {
    name: 'Trinity Judge - 判断力評価',
    schedule: '0 21 * * 0',
    text: '今週の判断記録を分析して判断力スコアを記録してください。',
    enabled: true
  }
});
```

### 3. Executor の設定
```javascript
await cron({
  action: 'add',
  job: {
    name: 'Trinity Executor - 実行力評価',
    schedule: '0 22 * * *',
    text: '今日のタスク完遂状況を分析して実行力スコアを記録してください。',
    enabled: true
  }
});
```

---

## 📊 実行頻度の調整

### 初期フェーズ（テスト期間）
- Observer: 毎日1回
- Judge: 毎週1回
- Executor: 毎日1回

### 本格運用フェーズ
必要に応じて以下も検討：
- Observer: 1日2回（朝・夜）
- Judge: 週2回（水・日）
- Executor: リアルタイム評価（タスク完了時）

---

## 🔧 Cronジョブの管理

### 現在のジョブ確認
```bash
crontab -l
```

### ジョブの編集
```bash
crontab -e
```

### ログの確認
```bash
tail -f /var/log/trinity-observer.log
tail -f /var/log/trinity-judge.log
tail -f /var/log/trinity-executor.log
```

---

## ⚠️ 注意事項

1. **環境変数の設定**
   - Cronジョブ内で環境変数を読み込む場合、フルパスで `.env` を指定
   - または、crontab の先頭で環境変数を定義

2. **Node.js のパス**
   - `/usr/bin/node` が正しいパスか確認
   - `which node` で確認

3. **ログローテーション**
   - ログが肥大化しないよう、logrotate を設定

---

## ✅ 設定完了チェックリスト

- [ ] 環境変数（.env）が正しく設定されている
- [ ] GAS API が正常に動作している
- [ ] 各エージェントが手動実行できる
- [ ] Cronジョブが登録されている
- [ ] ログファイルが作成されている
- [ ] 初回実行が成功した

**設定が完了したら、手動で各エージェントを実行してテストしてください。**

```bash
cd /root/clawd/agents
node observer.js
node judge.js
node executor.js
```
