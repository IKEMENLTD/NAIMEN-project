# Trinity System - GAS API

## 🚀 デプロイ手順

### 1. スプレッドシートIDの設定

`Code.gs` の2行目を編集：
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

スプレッドシートのURLから ID を取得：
```
https://docs.google.com/spreadsheets/d/【ここがID】/edit
```

### 2. Google Apps Scriptプロジェクト作成

1. Googleスプレッドシートを開く
2. 「拡張機能」→「Apps Script」
3. `Code.gs` の内容を貼り付け
4. 保存

### 3. Web Appとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」
2. 種類: **ウェブアプリ**
3. 説明: `Trinity System API v1`
4. 次のユーザーとして実行: **自分**
5. アクセスできるユーザー: **全員**
6. 「デプロイ」をクリック
7. **ウェブアプリのURL** をコピー（後で使用）

---

## 📡 API エンドポイント

ベースURL: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

### GET エンドポイント

#### 1. 現在のスコア取得
```
GET /?path=score&user_id=uuid-001
```

**レスポンス:**
```json
{
  "user_id": "uuid-001",
  "name": "社長",
  "perception_score": 75,
  "judgment_score": 80,
  "execution_score": 85,
  "total_score": 75,
  "last_updated": "2026-01-28T22:00:00"
}
```

#### 2. スコア履歴取得
```
GET /?path=history&user_id=uuid-001&dimension=perception&limit=50
```

**パラメータ:**
- `dimension`: `perception` | `judgment` | `execution` | `all`
- `limit`: 取得件数（デフォルト: 100）

#### 3. エージェント状態取得
```
GET /?path=agents
```

---

### POST エンドポイント

#### 1. スコア評価記録
```
POST /?path=evaluate
Content-Type: application/json

{
  "user_id": "uuid-001",
  "dimension": "perception",
  "score": 75,
  "agent_id": "observer",
  "evaluation_data": {
    "method": "diary_analysis",
    "confidence": 0.85
  },
  "notes": "自己認識が向上"
}
```

#### 2. Observer記録
```
POST /?path=observe
Content-Type: application/json

{
  "user_id": "uuid-001",
  "observation_type": "diary_analysis",
  "content": "事実と解釈が明確に分離されている",
  "bias_detected": "none",
  "accuracy_score": 85
}
```

#### 3. Judge記録
```
POST /?path=judge
Content-Type: application/json

{
  "user_id": "uuid-001",
  "decision_content": "プロジェクトXを優先",
  "priority_score": 90,
  "logic_quality": 85,
  "outcome": "pending"
}
```

#### 4. Executor記録
```
POST /?path=execute
Content-Type: application/json

{
  "user_id": "uuid-001",
  "task_content": "朝のルーティン完遂",
  "declared_at": "2026-01-28T06:00:00",
  "completed_at": "2026-01-28T07:00:00",
  "completion_rate": 100,
  "difficulty": 50
}
```

---

## 🧪 テスト方法

### curlでテスト

```bash
# スコア取得
curl "https://script.google.com/macros/s/YOUR_ID/exec?path=score&user_id=uuid-001"

# スコア記録
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec?path=evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid-001",
    "dimension": "perception",
    "score": 75,
    "agent_id": "observer",
    "notes": "テスト記録"
  }'
```

---

## 🔒 セキュリティ注意事項

**現在の設定: アクセスできるユーザー = 全員**

本番運用時は以下を検討：
1. APIキー認証を追加
2. アクセス制限（特定のドメインのみ）
3. レート制限

---

## 📊 スコア計算ロジック

### 総合スコア
```
total_score = min(perception, judgment, execution) × growth_coefficient
```

**成長係数（growth_coefficient）:**
- 初月: 1.0
- 成長中: 1.0 ~ 1.2
- 停滞: 0.9

### Trinity の哲学
3つの力のうち、**最も低い力が全体のボトルネック**になる。
すべてをバランスよく鍛える必要がある。

---

## ✅ デプロイ完了チェックリスト

- [ ] スプレッドシートにCSVをインポート
- [ ] `SPREADSHEET_ID` を設定
- [ ] Apps Scriptプロジェクト作成
- [ ] Web Appとしてデプロイ
- [ ] デプロイURLを取得
- [ ] curlでテスト実行
- [ ] エージェント実装に進む

**次: Phase 3 - 3体のエージェント実装**
