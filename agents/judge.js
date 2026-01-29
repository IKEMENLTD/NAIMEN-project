#!/usr/bin/env node
/**
 * The Judge - 判断力を評価するエージェント
 * 
 * 役割: 本質を掴み、優先順位を正しくつける力を測定する
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  GAS_API_URL: process.env.TRINITY_API_URL || 'YOUR_GAS_API_URL_HERE',
  USER_ID: process.env.USER_ID || 'uuid-001',
  WORKSPACE: process.env.WORKSPACE || '/root/clawd',
  MEMORY_DIR: 'memory',
  DECISIONS_FILE: 'decisions.json'
};

function getTimestamp() {
  return new Date().toISOString();
}

// ユーティリティ: GAS API呼び出し
async function callAPI(endpoint, method = 'GET', data = null) {
  const url = `${CONFIG.GAS_API_URL}?path=${endpoint}`;
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (method === 'POST' && data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error(`[Judge] API call failed:`, error.message);
    return null;
  }
}

// 判断記録ファイルの読み込み
function loadDecisions() {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.DECISIONS_FILE);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// 判断記録ファイルの保存
function saveDecisions(decisions) {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.DECISIONS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(decisions, null, 2), 'utf-8');
}

// 判断の論理性を評価
function evaluateLogic(decision) {
  const { content, reasoning, options_considered } = decision;
  
  let logicScore = 50; // ベース
  
  // 理由が明確か
  if (reasoning && reasoning.length > 20) {
    logicScore += 20;
  }
  
  // 複数の選択肢を検討したか
  if (options_considered && options_considered.length > 1) {
    logicScore += 15;
  }
  
  // 「なぜ」が含まれているか（根本原因思考）
  if (reasoning && reasoning.includes('なぜ')) {
    logicScore += 15;
  }
  
  // 感情的な言葉が少ないか
  const emotionalWords = ['嫌', '好き', '怖い', '不安'];
  const hasEmotion = emotionalWords.some(word => content.includes(word) || (reasoning && reasoning.includes(word)));
  if (!hasEmotion) {
    logicScore += 10;
  }
  
  return Math.min(100, logicScore);
}

// 優先順位の一貫性を評価
function evaluatePriority(decisions) {
  if (decisions.length < 2) return 80; // データ不足の場合はデフォルト
  
  // 最近の判断を取得（最大10件）
  const recent = decisions.slice(-10);
  
  // 優先順位の変動をチェック
  const priorities = recent.map(d => d.priority || 50);
  const avgPriority = priorities.reduce((a, b) => a + b, 0) / priorities.length;
  
  // 標準偏差を計算（変動が小さいほど一貫性が高い）
  const variance = priorities.reduce((sum, p) => sum + Math.pow(p - avgPriority, 2), 0) / priorities.length;
  const stdDev = Math.sqrt(variance);
  
  // 標準偏差が小さいほど高スコア
  const consistencyScore = Math.max(0, 100 - stdDev * 2);
  
  return Math.round(consistencyScore);
}

// 判断力評価
async function judge() {
  console.log('[Judge] 判断力の評価を開始...');
  
  // 判断記録を読み込み
  const decisions = loadDecisions();
  
  if (decisions.length === 0) {
    console.log('[Judge] 判断記録が見つかりません。スキップします。');
    return;
  }
  
  // 最新の判断を評価
  const latestDecision = decisions[decisions.length - 1];
  
  const logicScore = evaluateLogic(latestDecision);
  const priorityScore = evaluatePriority(decisions);
  
  // 判断記録を GAS API に送信
  const judgmentData = {
    user_id: CONFIG.USER_ID,
    decision_id: latestDecision.id || `dec-${Date.now()}`,
    decision_content: latestDecision.content,
    priority_score: priorityScore,
    logic_quality: logicScore,
    outcome: latestDecision.outcome || 'pending'
  };
  
  const judgeResult = await callAPI('judge', 'POST', judgmentData);
  
  if (judgeResult && judgeResult.success) {
    console.log(`[Judge] 判断記録完了 (ID: ${judgeResult.id})`);
  }
  
  // 判断力スコアを計算して送信
  // スコア = 論理性 × 0.6 + 優先順位の一貫性 × 0.4
  const judgmentScore = Math.round(logicScore * 0.6 + priorityScore * 0.4);
  
  const evaluationData = {
    user_id: CONFIG.USER_ID,
    dimension: 'judgment',
    score: judgmentScore,
    agent_id: 'judge',
    evaluation_data: {
      logic_score: logicScore,
      priority_score: priorityScore,
      decision_count: decisions.length,
      timestamp: getTimestamp()
    },
    notes: `論理性: ${logicScore}点, 優先順位: ${priorityScore}点`
  };
  
  const evalResult = await callAPI('evaluate', 'POST', evaluationData);
  
  if (evalResult && evalResult.success) {
    console.log(`[Judge] 判断力スコア記録完了: ${judgmentScore}点`);
  }
  
  console.log('[Judge] 評価完了');
}

// 判断を記録する関数（外部から呼び出し可能）
function recordDecision(content, reasoning = '', priority = 50, options = []) {
  const decisions = loadDecisions();
  
  const newDecision = {
    id: `dec-${Date.now()}`,
    timestamp: getTimestamp(),
    content,
    reasoning,
    priority,
    options_considered: options,
    outcome: 'pending'
  };
  
  decisions.push(newDecision);
  saveDecisions(decisions);
  
  console.log(`[Judge] 判断を記録しました: ${content}`);
  return newDecision.id;
}

// メイン実行
if (require.main === module) {
  judge().catch(error => {
    console.error('[Judge] エラー:', error.message);
    process.exit(1);
  });
}

module.exports = { judge, recordDecision };
