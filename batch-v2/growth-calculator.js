#!/usr/bin/env node
/**
 * Growth Calculator v2 - 成長係数の計算
 * 
 * 役割: 月次で成長率を計算し、成長係数を更新する
 */

const CONFIG = {
  API_URL: process.env.TRINITY_API_URL || 'YOUR_API_URL_HERE',
  USER_ID: process.env.USER_ID || 'uuid-001',
  WORKSPACE: process.env.WORKSPACE || '/root/clawd'
};

const fs = require('fs');
const path = require('path');

function getTimestamp() {
  return new Date().toISOString();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonth() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
    console.error(`[Growth Calculator] API call failed:`, error.message);
    return null;
  }
}

// 月次の平均スコアを取得
async function getMonthlyAverageScores(userId, month) {
  const result = await callAPI('GET', 'events', {
    user_id: userId,
    type: 'score',
    limit: 10000
  });
  
  if (!result || !result.events) return null;
  
  // 指定月のスコアをフィルタリング
  const monthScores = result.events.filter(event => {
    const eventMonth = event.ts.substring(0, 7); // YYYY-MM
    return eventMonth === month;
  });
  
  if (monthScores.length === 0) return null;
  
  // 各次元ごとに平均を計算
  const dimensions = ['perception', 'judgment', 'execution'];
  const averages = {};
  
  dimensions.forEach(dim => {
    const dimScores = monthScores
      .filter(e => e.dim === dim)
      .map(e => e.val);
    
    if (dimScores.length > 0) {
      averages[dim] = dimScores.reduce((a, b) => a + b, 0) / dimScores.length;
    } else {
      averages[dim] = 0;
    }
  });
  
  return averages;
}

// 成長率を計算
function calculateGrowthRate(currentAvg, previousAvg) {
  if (!previousAvg || previousAvg === 0) return 0;
  return ((currentAvg - previousAvg) / previousAvg) * 100;
}

// 成長係数を計算
function calculateGrowthCoefficient(growthRates) {
  const avgGrowth = (
    growthRates.perception +
    growthRates.judgment +
    growthRates.execution
  ) / 3;
  
  let coefficient = 1.0;
  
  if (avgGrowth >= 10) {
    coefficient = 1.2;
  } else if (avgGrowth >= 5) {
    coefficient = 1.1;
  } else if (avgGrowth >= 0) {
    coefficient = 1.0;
  } else if (avgGrowth >= -5) {
    coefficient = 0.95;
  } else {
    coefficient = 0.9;
  }
  
  return {
    coefficient,
    avgGrowth: Math.round(avgGrowth * 100) / 100
  };
}

// 評価コメント
function getEvaluation(avgGrowth) {
  if (avgGrowth >= 10) return '🚀 素晴らしい成長！';
  if (avgGrowth >= 5) return '✨ 順調に成長中';
  if (avgGrowth >= 0) return '📈 緩やかに成長';
  if (avgGrowth >= -5) return '⚠️  やや停滞気味';
  return '🔻 改善が必要';
}

// イベント記録
async function recordGrowthEvent(coefficient, growthData) {
  return await callAPI('POST', 'event', {
    user_id: CONFIG.USER_ID,
    type: 'growth',
    agent: 'system',
    dim: 'all',
    val: coefficient,
    data: growthData
  });
}

// メイン処理
async function calculateGrowth() {
  console.log('[Growth Calculator] 成長係数の計算を開始...\n');
  
  const currentMonth = getCurrentMonth();
  const previousMonth = getPreviousMonth();
  
  console.log(`対象期間: ${previousMonth} → ${currentMonth}`);
  
  // 今月の平均スコアを取得
  const currentAvg = await getMonthlyAverageScores(CONFIG.USER_ID, currentMonth);
  
  if (!currentAvg) {
    console.log('⚠️  今月のデータが見つかりません。スキップします。');
    return;
  }
  
  console.log('\n今月の平均スコア:');
  console.log(`  認識力: ${Math.round(currentAvg.perception)}点`);
  console.log(`  判断力: ${Math.round(currentAvg.judgment)}点`);
  console.log(`  実行力: ${Math.round(currentAvg.execution)}点`);
  
  // 前月の平均スコアを取得
  const previousAvg = await getMonthlyAverageScores(CONFIG.USER_ID, previousMonth);
  
  if (!previousAvg) {
    console.log('\n⚠️  前月のデータが見つかりません。初月として処理します。');
    
    const growthData = {
      month: currentMonth,
      perception_growth: 0,
      judgment_growth: 0,
      execution_growth: 0,
      coefficient: 1.0,
      notes: '初月ベースライン'
    };
    
    await recordGrowthEvent(1.0, growthData);
    console.log('[Growth Calculator] 初月ベースライン記録完了\n');
    return;
  }
  
  console.log('\n前月の平均スコア:');
  console.log(`  認識力: ${Math.round(previousAvg.perception)}点`);
  console.log(`  判断力: ${Math.round(previousAvg.judgment)}点`);
  console.log(`  実行力: ${Math.round(previousAvg.execution)}点`);
  
  // 成長率を計算
  const growthRates = {
    perception: calculateGrowthRate(currentAvg.perception, previousAvg.perception),
    judgment: calculateGrowthRate(currentAvg.judgment, previousAvg.judgment),
    execution: calculateGrowthRate(currentAvg.execution, previousAvg.execution)
  };
  
  console.log('\n成長率:');
  console.log(`  認識力: ${growthRates.perception >= 0 ? '+' : ''}${Math.round(growthRates.perception * 100) / 100}%`);
  console.log(`  判断力: ${growthRates.judgment >= 0 ? '+' : ''}${Math.round(growthRates.judgment * 100) / 100}%`);
  console.log(`  実行力: ${growthRates.execution >= 0 ? '+' : ''}${Math.round(growthRates.execution * 100) / 100}%`);
  
  // 成長係数を計算
  const { coefficient, avgGrowth } = calculateGrowthCoefficient(growthRates);
  
  console.log(`\n平均成長率: ${avgGrowth >= 0 ? '+' : ''}${avgGrowth}%`);
  console.log(`成長係数: ${coefficient}倍`);
  
  const evaluation = getEvaluation(avgGrowth);
  console.log(`評価: ${evaluation}\n`);
  
  // 成長イベントを記録
  const growthData = {
    month: currentMonth,
    perception_growth: Math.round(growthRates.perception * 100) / 100,
    judgment_growth: Math.round(growthRates.judgment * 100) / 100,
    execution_growth: Math.round(growthRates.execution * 100) / 100,
    avg_growth: avgGrowth,
    coefficient: coefficient,
    eval: evaluation
  };
  
  const result = await recordGrowthEvent(coefficient, growthData);
  
  if (result && result.success) {
    console.log(`[Growth Calculator] 成長係数更新完了 (ID: ${result.id})\n`);
  }
  
  // ローカルにも保存
  const reportPath = path.join(CONFIG.WORKSPACE, `growth-report-${currentMonth}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    month: currentMonth,
    current_avg: currentAvg,
    previous_avg: previousAvg,
    growth_rates: growthRates,
    coefficient: coefficient,
    avg_growth: avgGrowth,
    evaluation: evaluation,
    timestamp: getTimestamp()
  }, null, 2), 'utf-8');
  
  console.log(`成長レポートを保存しました: ${reportPath}`);
}

// メイン実行
if (require.main === module) {
  calculateGrowth().catch(error => {
    console.error('[Growth Calculator] エラー:', error.message);
    process.exit(1);
  });
}

module.exports = { calculateGrowth };
