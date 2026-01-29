#!/usr/bin/env node
/**
 * The Observer v2 - 認識力を評価するエージェント
 * 
 * 役割: 現実をありのまま見る力を測定し、認知バイアスを検出する
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  API_URL: process.env.TRINITY_API_URL || 'YOUR_API_URL_HERE',
  USER_ID: process.env.USER_ID || 'uuid-001',
  WORKSPACE: process.env.WORKSPACE || '/root/clawd',
  MEMORY_DIR: 'memory'
};

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

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
    console.error(`[Observer] API call failed:`, error.message);
    return null;
  }
}

// イベント記録
async function recordEvent(type, dim, val, eventData) {
  return await callAPI('POST', 'event', {
    user_id: CONFIG.USER_ID,
    type: type,
    agent: 'observer',
    dim: dim,
    val: val,
    data: eventData
  });
}

// メモリーファイル読み込み
function readMemoryFile(filename) {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.MEMORY_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

// 日記分析
function analyzeDiary(content) {
  if (!content) return { score: 0, notes: '日記なし' };
  
  const lines = content.split('\n').filter(l => l.trim());
  
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

// 認知バイアス検出
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
  
  const today = getToday();
  const diaryContent = readMemoryFile(`${today}.md`);
  
  if (!diaryContent) {
    console.log('[Observer] 今日の日記が見つかりません。スキップします。');
    return;
  }
  
  // 日記分析
  const diaryAnalysis = analyzeDiary(diaryContent);
  const biasCheck = detectBias(diaryContent);
  
  // 観察記録（obs）
  const obsResult = await recordEvent('obs', 'perception', diaryAnalysis.score, {
    obs_type: 'diary_analysis',
    content: `事実と解釈の分離度: ${diaryAnalysis.score}点`,
    bias: biasCheck.detected,
    accuracy: diaryAnalysis.score,
    fact_count: diaryAnalysis.factCount,
    interpretation_count: diaryAnalysis.interpretationCount,
    emotion_count: diaryAnalysis.emotionCount
  });
  
  if (obsResult && obsResult.success) {
    console.log(`[Observer] 観察記録完了 (ID: ${obsResult.id})`);
  }
  
  // スコア更新（score）
  const biasScore = biasCheck.detected === 'none' ? 100 : 70;
  const perceptionScore = Math.round(diaryAnalysis.score * 0.7 + biasScore * 0.3);
  
  const scoreResult = await recordEvent('score', 'perception', perceptionScore, {
    method: 'diary_analysis',
    diary_score: diaryAnalysis.score,
    bias_score: biasScore,
    formula: 'diary_score * 0.7 + bias_score * 0.3'
  });
  
  if (scoreResult && scoreResult.success) {
    console.log(`[Observer] 認識力スコア更新: ${perceptionScore}点`);
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
