# Trinity System v2 - GAS API

## 📡 API仕様（3エンドポイント）

ベースURL: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

---

## GET /user

ユーザーの現在の状態を取得

### リクエスト
```
GET /?path=user&user_id=uuid-001
```

### レスポンス
```json
{
  "user_id": "uuid-001",
  "name": "社長",
  "scores": {
    "perception": 75,
    "judgment": 80,
    "execution": 85,
    "total": 75
  },
  "growth_coefficient": 1.0,
  "last_updated": "2026-01-29T10:00:00",
  "meta": {
    "target_score": 80,
    "timezone": "Asia/Tokyo",
    "last_observation": "2026-01-29T06:00:00",
    "last_judgment": "2026-01-28T21:00:00",
    "last_execution": "2026-01-29T22:00:00",
    "streak_days": 7
  }
}
```

---

## GET /events

イベント履歴を取得（フィルタリング可能）

### リクエスト
```
GET /?path=events&user_id=uuid-001&type=score&dim=perception&limit=50
```

### パラメータ
- `user_id` (必須): ユーザーID
- `type` (オプション): obs | jdg | exec | score | growth | all（デフォルト: all）
- `agent` (オプション): observer | judge | executor | system | all（デフォルト: all）
- `dim` (オプション): perception | judgment | execution | all（デフォルト: all）
- `from` (オプション): 開始日時（YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss）
- `to` (オプション): 終了日時
- `limit` (オプション): 取得件数（デフォルト: 100）

### レスポンス
```json
{
  "user_id": "uuid-001",
  "filters": {
    "type": "score",
    "agent": "all",
    "dim": "perception",
    "from": "",
    "to": ""
  },
  "count": 10,
  "events": [
    {
      "id": 1,
      "user_id": "uuid-001",
      "ts": "2026-01-29T06:00:00",
      "type": "score",
      "agent": "observer",
      "dim": "perception",
      "val": 75,
      "data": {
        "method": "diary_analysis",
        "diary_score": 78,
        "bias_score": 100,
        "formula": "diary_score * 0.7 + bias_score * 0.3"
      }
    }
  ]
}
```

---

## POST /event

イベントを記録

### リクエスト
```
POST /?path=event
Content-Type: application/json
```

### ボディ
```json
{
  "user_id": "uuid-001",
  "type": "score",
  "agent": "observer",
  "dim": "perception",
  "val": 75,
  "data": {
    "method": "diary_analysis",
    "diary_score": 78,
    "bias_score": 100
  }
}
```

### 必須フィールド
- `user_id`: ユーザーID
- `type`: イベントタイプ（obs | jdg | exec | score | growth）
- `agent`: エージェントID（observer | judge | executor | system）
- `dim`: 次元（perception | judgment | execution | all）
- `val`: 値（数値）

### オプション
- `data`: イベントの詳細データ（JSON object）

### レスポンス
```json
{
  "success": true,
  "id": 123,
  "ts": "2026-01-29T10:00:00"
}
```

---

## イベントタイプ詳細

### obs（observation）
観察記録

**data の例:**
```json
{
  "obs_type": "diary_analysis",
  "content": "事実と解釈が分離",
  "bias": "none",
  "accuracy": 85
}
```

---

### jdg（judgment）
判断記録

**data の例:**
```json
{
  "decision_id": "dec-001",
  "content": "プロジェクトX優先",
  "priority": 90,
  "logic": 85,
  "outcome": "pending"
}
```

---

### exec（execution）
実行記録

**data の例:**
```json
{
  "task_id": "task-001",
  "content": "朝のルーティン",
  "declared": "2026-01-29T06:00",
  "completed": "2026-01-29T07:00",
  "rate": 100,
  "difficulty": 50
}
```

---

### score（score_update）
スコア更新

**data の例:**
```json
{
  "method": "diary_analysis",
  "diary_score": 78,
  "bias_score": 100,
  "formula": "diary_score * 0.7 + bias_score * 0.3"
}
```

**重要:** `type=score` の場合、users シートの該当スコアが自動更新されます。

---

### growth（growth_calc）
成長係数計算

**data の例:**
```json
{
  "month": "2026-01",
  "perception_growth": 5.2,
  "judgment_growth": 3.8,
  "execution_growth": 7.1,
  "avg_growth": 5.4,
  "coefficient": 1.1,
  "eval": "順調に成長中"
}
```

**重要:** `type=growth` の場合、users シートの成長係数が自動更新されます。

---

## 🚀 デプロイ手順

### 1. スプレッドシートIDの設定

`Code.gs` の2行目を編集：
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

### 2. Apps Scriptプロジェクト作成

1. Googleスプレッドシートを開く
2. 「拡張機能」→「Apps Script」
3. `Code.gs` の内容を貼り付け
4. 保存

### 3. Web Appとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」
2. 種類: **ウェブアプリ**
3. 説明: `Trinity System v2 API`
4. 次のユーザーとして実行: **自分**
5. アクセスできるユーザー: **全員**
6. 「デプロイ」をクリック
7. **ウェブアプリのURL** をコピー

---

## 🧪 テスト

### curlでテスト

```bash
# ユーザー取得
curl "https://script.google.com/macros/s/YOUR_ID/exec?path=user&user_id=uuid-001"

# イベント取得
curl "https://script.google.com/macros/s/YOUR_ID/exec?path=events&user_id=uuid-001&type=score&limit=10"

# イベント記録
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec?path=event" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid-001",
    "type": "score",
    "agent": "observer",
    "dim": "perception",
    "val": 75,
    "data": {"method": "test"}
  }'
```

---

## 🔒 セキュリティ

**現在の設定:** アクセスできるユーザー = 全員

本番運用時は以下を検討：
1. APIキー認証を追加
2. アクセス制限（特定のドメインのみ）
3. レート制限

---

## ✅ デプロイ完了チェックリスト

- [ ] スプレッドシートにusers、eventsシートを作成
- [ ] `SPREADSHEET_ID` を設定
- [ ] Apps Scriptプロジェクト作成
- [ ] Web Appとしてデプロイ
- [ ] デプロイURLを取得
- [ ] curlでテスト実行（GET /user）
- [ ] curlでテスト実行（POST /event）
- [ ] エージェント側で環境変数を設定

---

**API仕様は完璧です。次はエージェント実装に進んでください。**
