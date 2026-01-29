#!/usr/bin/env node
/**
 * The Observer - 認識力を評価するエージェント
 * 
 * 役割: 現実をありのまま見る力を測定し、認知バイアスを検出する
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  GAS_API_URL: process.env.TRINITY_API_URL || 'YOUR_GAS_API_URL_HERE',
  USER_ID: process.env.USER_ID || 'uuid-001',
  WORKSPACE: process.env.WORKSPACE || '/root/clawd',
  MEMORY_DIR: 'memory'
};

// ユーティリティ: 日付フォーマット
function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

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
    console.error(`[Observer] API call failed:`, error.message);
    return null;
  }
}

// メモリーファイル読み込み
function readMemoryFile(filename) {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.MEMORY_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return fs.readFileSync(filePath, 'utf-8');
}

// 日記分析: 事実と解釈の分離度をチェック
function analyzeDiary(content) {
  if (!content) return { score: 0, notes: '日記なし' };
  
  const lines = content.split('\n').filter(l => l.trim());
  
  // 簡易分析ロジック
  let factCount = 0;
  let interpretationCount = 0;
  let emotionCount = 0;
  
  const factKeywords = ['した', 'だった', '言った', '起きた', '見た', '聞いた'];
  const interpretationKeywords = ['思う', '感じる', '~だろう', 'かもしれない', '~べき'];
  const emotionKeywords = ['嬉しい', '悲しい', '怒り', '不安', '楽しい', '辛い'];
  
  lines.forEach(line => {
    if (factKeywords.some(kw => line.includes(kw))) factCount++;
    if (interpretationKeywords.some(kw => line.includes(kw))) interpretationCount++;
    if (emotionKeywords.some(kw => line.includes(kw))) emotionCount++;
  });
  
  // 事実が多いほど高スコア
  const totalLines = lines.length || 1;
  const factRatio = factCount / totalLines;
  const separationScore = Math.min(100, Math.round(factRatio * 100 * 1.5));
  
  return {
    score: separationScore,
    factCount,
    interpretationCount,
    emotionCount,
    notes: `事実: ${factCount}, 解釈: ${interpretationCount}, 感情: ${emotionCount}`
  };
}

// 認知バイアス検出（簡易版）
function detectBias(content) {
  if (!content) return { detected: 'none', notes: '分析対象なし' };
  
  const biasPatterns = [
    { name: 'confirmation_bias', pattern: /自分の考えが正しい|やっぱり|思った通り/, desc: '確証バイアス' },
    { name: 'normalcy_bias', pattern: /大丈夫|問題ない|きっと平気/, desc: '正常性バイアス' },
    { name: 'optimism_bias', pattern: /うまくいく|絶対|必ず成功/, desc: '楽観バイアス' },
    { name: 'negativity_bias', pattern: /ダメ|無理|できない|失敗/, desc: 'ネガティビティバイアス' }
  ];
  
  const detected = [];
  
  biasPatterns.forEach(bias => {
    if (bias.pattern.test(content)) {
      detected.push(bias.desc);
    }
  });
  
  return {
    detected: detected.length > 0 ? detected.join(', ') : 'none',
    notes: detected.length > 0 ? `検出: ${detected.join(', ')}` : 'バイアス未検出'
  };
}

// 観察実行
async function observe() {
  console.log('[Observer] 認識力の評価を開始...');
  
  // 今日の日記を読み込み
  const today = getToday();
  const diaryContent = readMemoryFile(`${today}.md`);
  
  if (!diaryContent) {
    console.log('[Observer] 今日の日記が見つかりません。スキップします。');
    return;
  }
  
  // 日記分析
  const diaryAnalysis = analyzeDiary(diaryContent);
  const biasCheck = detectBias(diaryContent);
  
  // 観察記録を GAS API に送信
  const observationData = {
    user_id: CONFIG.USER_ID,
    observation_type: 'diary_analysis',
    content: `事実と解釈の分離度: ${diaryAnalysis.score}点 | ${diaryAnalysis.notes}`,
    bias_detected: biasCheck.detected,
    accuracy_score: diaryAnalysis.score
  };
  
  const observeResult = await callAPI('observe', 'POST', observationData);
  
  if (observeResult && observeResult.success) {
    console.log(`[Observer] 観察記録完了 (ID: ${observeResult.id})`);
  }
  
  // 認識力スコアを計算して送信
  // スコア = 日記の質 × 0.7 + バイアス検出力 × 0.3
  const biasScore = biasCheck.detected === 'none' ? 100 : 70; // バイアスなし = 高スコア
  const perceptionScore = Math.round(diaryAnalysis.score * 0.7 + biasScore * 0.3);
  
  const evaluationData = {
    user_id: CONFIG.USER_ID,
    dimension: 'perception',
    score: perceptionScore,
    agent_id: 'observer',
    evaluation_data: {
      diary_analysis: diaryAnalysis,
      bias_check: biasCheck,
      timestamp: getTimestamp()
    },
    notes: `日記分析完了: ${diaryAnalysis.notes} | ${biasCheck.notes}`
  };
  
  const evalResult = await callAPI('evaluate', 'POST', evaluationData);
  
  if (evalResult && evalResult.success) {
    console.log(`[Observer] 認識力スコア記録完了: ${perceptionScore}点`);
  }
  
  console.log('[Observer] 評価完了');
}

// メイン実行
if (require.main === module) {
  observe().catch(error => {
    console.error('[Observer] エラー:', error.message);
    process.exit(1);
  });
}

module.exports = { observe };
