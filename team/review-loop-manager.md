# REVIEW-LOOP-MANAGER.md - レビューループ管理

## レビューループの自動化

### 状態管理

各成果物に対してレビュー状態を記録：

```json
{
  "component": "architecture",
  "version": 2,
  "reviewRound": 2,
  "status": "in_review",
  "history": [
    {
      "round": 1,
      "reviewer": "reviewer",
      "score": 60,
      "status": "rejected",
      "criticalIssues": 4,
      "majorIssues": 6,
      "actionTaken": "researcher_deep_dive",
      "date": "2026-01-27T15:10:00Z"
    },
    {
      "round": 2,
      "reviewer": "reviewer",
      "score": null,
      "status": "in_progress",
      "date": "2026-01-27T15:45:00Z"
    }
  ]
}
```

### ワークフロー

```
┌─────────────────┐
│  成果物提出      │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Round 1 Review  │ ← 致命的問題の検出
└────────┬────────┘
         ↓
    P0あり？
    ├─ YES → 修正タスク発行 → 再提出 ──┐
    └─ NO                              │
         ↓                             │
┌─────────────────┐                   │
│ Round 2 Review  │ ← 深層的問題の検出│
└────────┬────────┘                   │
         ↓                             │
    P1あり？                           │
    ├─ YES → 再設計タスク → 再提出 ───┤
    └─ NO                              │
         ↓                             │
   スコア >= 80？                      │
    ├─ YES → 承認 ✅                  │
    └─ NO                              │
         ↓                             │
┌─────────────────┐                   │
│ Round 3 Review  │ ← 最終検証（opt） │
└────────┬────────┘                   │
         ↓                             │
   スコア >= 85？                      │
    ├─ YES → 承認 ✅                  │
    └─ NO → 微調整 ────────────────────┘
```

### CTOの判断フロー

```javascript
// 疑似コード
async function manageReviewLoop(component, artifact) {
  let round = 1;
  let approved = false;
  
  while (!approved && round <= 3) {
    console.log(`📋 Review Round ${round} starting...`);
    
    // レビュー実施
    const review = await spawnReviewer({
      component,
      artifact,
      round,
      depth: round === 1 ? 'critical' : round === 2 ? 'deep' : 'final'
    });
    
    // 判定
    if (review.criticalIssues > 0 && round === 1) {
      // P0問題あり → 即座に修正
      console.log(`🔴 ${review.criticalIssues} critical issues found`);
      await spawnFixer(review.criticalIssues);
      // 修正後に再提出 → 次のループ
      round = 1; // Round 1からやり直し
      
    } else if (review.score >= 85) {
      // 高品質 → 承認
      console.log(`✅ Approved with score ${review.score}`);
      approved = true;
      
    } else if (review.score >= 80 && round >= 2) {
      // 許容範囲 → 条件付き承認
      console.log(`✅ Conditionally approved (${review.score})`);
      approved = true;
      
    } else if (round < 3) {
      // まだ改善余地あり → 次のラウンド
      console.log(`🟡 Score ${review.score}, moving to Round ${round + 1}`);
      if (review.majorIssues > 0) {
        await spawnRedesigner(review.majorIssues);
      }
      round++;
      
    } else {
      // Round 3でも不合格 → エスカレーション
      console.log(`🔴 Failed after 3 rounds. Escalating to CTO.`);
      await escalateToCTO(review);
      break;
    }
  }
  
  return { approved, finalScore: review.score, rounds: round };
}
```

### 実装例

#### Round 1完了後（現在の状況）

```markdown
**Status:** Round 1 Review完了
**Score:** 60/100 (B+)
**Critical Issues (P0):** 4件
- 文化的妥当性の欠如
- ライセンス問題未解決
- 上位20%定義の恣意性
- MVP乖離

**Action:** Researcher深掘り調査を起動済み
**Next:** 調査完了後、修正版でRound 1再レビュー
```

#### Round 2以降の進め方

```markdown
**Researcher調査完了後:**
1. Architectが修正版設計を作成
2. PMが修正版計画を作成
3. Reviewerが Round 2レビュー実施
   - 本質的問題（P1）を検出
   - スコア 80点以上なら承認
   - 未達なら再設計 → Round 3へ

**Round 3（必要時のみ）:**
- エッジケース、パフォーマンス、セキュリティ詳細
- 85点以上で最終承認
- 未達ならCTOエスカレーション
```

## CTOの役割

### 各ラウンドでやること

**Round 1後:**
- [ ] レビュー結果を確認
- [ ] P0問題の修正タスクを発行（Researcherなど）
- [ ] 修正完了を監視

**Round 2後:**
- [ ] 改善度を評価（60→80点など）
- [ ] まだ問題があれば再設計指示
- [ ] 承認基準（80点）に達したら次フェーズへ

**Round 3後（必要時）:**
- [ ] 最終判断（承認 or エスカレーション）
- [ ] 承認なら実装開始を指示
- [ ] 不承認なら根本的な見直し

### 状態トラッキング

`ikemen-project/reviews/status.json` に記録：

```json
{
  "architecture": {
    "currentRound": 2,
    "status": "awaiting_fixes",
    "latestScore": 60,
    "targetScore": 80,
    "history": [...]
  },
  "research": {
    "currentRound": 2,
    "status": "in_progress",
    "assignedTo": "researcher-fix-p1",
    "dueDate": "2026-01-27T18:00:00Z"
  }
}
```

## ベストプラクティス

1. **妥協しない**: 80点未満は承認しない
2. **具体的に**: 「改善して」ではなく「P0-3を修正して」
3. **追跡する**: すべてのレビューを記録
4. **学習する**: 同じ問題を繰り返さない
5. **深く考える**: なぜこの問題が起きたか、構造的原因は何か

---

**上位20%のシステムは、上位1%のレビュープロセスから生まれる。**
