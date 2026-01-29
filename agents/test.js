#!/usr/bin/env node
/**
 * Trinity System - テストスクリプト
 * 各エージェントの動作確認とサンプルデータ生成
 */

const fs = require('fs');
const path = require('path');
const { declareTask, startTask, completeTask } = require('./executor');
const { recordDecision } = require('./judge');

console.log('=== Trinity System テスト開始 ===\n');

// テストデータディレクトリ作成
const testDir = path.join(__dirname, '../test-data');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. サンプル日記を作成
console.log('1. サンプル日記を作成...');
const today = new Date().toISOString().split('T')[0];
const diaryPath = path.join(testDir, 'memory', `${today}.md`);

if (!fs.existsSync(path.dirname(diaryPath))) {
  fs.mkdirSync(path.dirname(diaryPath), { recursive: true });
}

const sampleDiary = `# ${today}

## 朝
- 06:00に起床した
- 瞑想を15分間行った
- 朝食を取った（卵、納豆、味噌汁）

## 午前
- プロジェクトXのミーティングを実施した
- タスクAを完了した
- 新しいアイデアが浮かんだ

## 午後
- 運動（ジョギング30分）
- 読書（ビジネス書を50ページ）

## 夜
- 夕食後、家族と会話
- 日記を書く

## 振り返り
今日は計画通りに進んだ。朝のルーティンが定着してきた気がする。
ただし、午後の集中力が途切れがちだったので、改善の余地がある。
`;

fs.writeFileSync(diaryPath, sampleDiary, 'utf-8');
console.log(`✓ サンプル日記を作成しました: ${diaryPath}\n`);

// 2. サンプルタスクを作成
console.log('2. サンプルタスクを作成...');

const task1 = declareTask('朝のルーティン（瞑想+運動）', 50, true);
startTask(task1);
completeTask(task1);

const task2 = declareTask('プロジェクトXのドキュメント作成', 70, false);
startTask(task2);
completeTask(task2);

const task3 = declareTask('週次レビュー', 60, true);
// 未完了のタスクとして残す

console.log('✓ サンプルタスクを作成しました\n');

// 3. サンプル判断を記録
console.log('3. サンプル判断を記録...');

recordDecision(
  'プロジェクトXを最優先に進める',
  'なぜなら、期限が迫っており、他のタスクより重要度が高いため。また、プロジェクトXが完了すれば、他のタスクにも良い影響を与える。',
  90,
  ['プロジェクトX優先', 'タスクA優先', '両方並行']
);

recordDecision(
  '運動習慣を毎日継続する',
  'なぜなら、健康は全ての基盤であり、運動により集中力も向上するため。',
  85,
  ['毎日継続', '週3回', '気が向いたら']
);

console.log('✓ サンプル判断を記録しました\n');

// 4. 環境変数チェック
console.log('4. 環境変数チェック...');

const requiredEnvVars = ['TRINITY_API_URL', 'USER_ID', 'WORKSPACE'];
const missingVars = requiredEnvVars.filter(v => !process.env[v] || process.env[v].includes('YOUR_'));

if (missingVars.length > 0) {
  console.warn(`⚠️  未設定の環境変数: ${missingVars.join(', ')}`);
  console.warn('   .env ファイルを作成して設定してください。\n');
} else {
  console.log('✓ すべての環境変数が設定されています\n');
}

// 5. GAS API接続テスト
console.log('5. GAS API接続テスト...');

if (process.env.TRINITY_API_URL && !process.env.TRINITY_API_URL.includes('YOUR_')) {
  console.log('   API URL:', process.env.TRINITY_API_URL);
  console.log('   ※ 実際の接続テストはエージェント実行時に行われます\n');
} else {
  console.warn('⚠️  GAS API URLが未設定です。デプロイ後に設定してください。\n');
}

console.log('=== テスト完了 ===\n');
console.log('次のステップ:');
console.log('1. GAS API をデプロイ');
console.log('2. .env ファイルに TRINITY_API_URL を設定');
console.log('3. エージェントを実行: npm run observer / npm run judge / npm run executor');
console.log('4. Cronジョブを設定して自動実行');
