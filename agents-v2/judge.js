#!/usr/bin/env node
/**
 * The Judge v2 - 判断力を評価するエージェント
 * 
 * 役割: 本質を掴み、優先順位を正しくつける力を測定する
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  API_URL: process.env.TRINITY_API_URL || 'YOUR_API_URL_HERE',
  USER_ID: process.env.USER_ID || 'uuid-001',
  WORKSPACE: process.env.WORKSPACE || '/root/clawd',
  DECISIONS_FILE: 'decisions.json'
};

function getTimestamp() {
  return new Date().toISOString();
}

// API呼び出し
async function callAPI(method, path, data = null) {
  const url = method === 'GET' && data
    ? `${CONFIG.API_URL}?path=${path}&${new URLSearchParams(data).toString()}`
    : `${CONFIG.API_URL}?path=${path}`;
  
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' }
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

// イベント記録
async function recordEvent(type, dim, val, eventData) {
  return await callAPI('POST', 'event', {
    user_id: CONFIG.USER_ID,
    type: type,
    agent: 'judge',
    dim: dim,
    val: val,
    data: eventData
  });
}

// 判断記録ファイルの読み込み
function loadDecisions() {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.DECISIONS_FILE);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// 判断記録ファイルの保存
function saveDecisions(decisions) {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.DECISIONS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(decisions, null, 2), 'utf-8');
}

// 判断の論理性を評価
function evaluateLogic(decision) {
  const { content, reasoning, options_considered } = decision;
  
  let logicScore = 50;
  
  if (reasoning && reasoning.length > 20) logicScore += 20;
  if (options_considered && options_considered.length > 1) logicScore += 15;
  if (reasoning && reasoning.includes('なぜ')) logicScore += 15;
  
  const emotionalWords = ['嫌', '好き', '怖い', '不安'];
  const hasEmotion = emotionalWords.some(word => 
    content.includes(word) || (reasoning && reasoning.includes(word))
  );
  if (!hasEmotion) logicScore += 10;
  
  return Math.min(100, logicScore);
}

// 優先順位の一貫性を評価
function evaluatePriority(decisions) {
  if (decisions.length < 2) return 80;
  
  const recent = decisions.slice(-10);
  const priorities = recent.map(d => d.priority || 50);
  const avgPriority = priorities.reduce((a, b) => a + b, 0) / priorities.length;
  
  const variance = priorities.reduce((sum, p) => sum + Math.pow(p - avgPriority, 2), 0) / priorities.length;
  const stdDev = Math.sqrt(variance);
  
  const consistencyScore = Math.max(0, 100 - stdDev * 2);
  return Math.round(consistencyScore);
}

// 判断力評価
async function judge() {
  console.log('[Judge] 判断力の評価を開始...');
  
  const decisions = loadDecisions();
  
  if (decisions.length === 0) {
    console.log('[Judge] 判断記録が見つかりません。スキップします。');
    return;
  }
  
  const latestDecision = decisions[decisions.length - 1];
  const logicScore = evaluateLogic(latestDecision);
  const priorityScore = evaluatePriority(decisions);
  
  // 判断記録（jdg）
  const jdgResult = await recordEvent('jdg', 'judgment', logicScore, {
    decision_id: latestDecision.id || `dec-${Date.now()}`,
    content: latestDecision.content,
    priority: priorityScore,
    logic: logicScore,
    outcome: latestDecision.outcome || 'pending',
    reasoning: latestDecision.reasoning || '',
    options_count: (latestDecision.options_considered || []).length
  });
  
  if (jdgResult && jdgResult.success) {
    console.log(`[Judge] 判断記録完了 (ID: ${jdgResult.id})`);
  }
  
  // スコア更新（score）
  const judgmentScore = Math.round(logicScore * 0.6 + priorityScore * 0.4);
  
  const scoreResult = await recordEvent('score', 'judgment', judgmentScore, {
    method: 'logic_and_priority',
    logic_score: logicScore,
    priority_score: priorityScore,
    formula: 'logic * 0.6 + priority * 0.4'
  });
  
  if (scoreResult && scoreResult.success) {
    console.log(`[Judge] 判断力スコア更新: ${judgmentScore}点`);
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
