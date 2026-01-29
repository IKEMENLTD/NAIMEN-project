#!/usr/bin/env node
/**
 * The Executor v2 - 実行力を評価するエージェント
 * 
 * 役割: 選択を現実にする力を測定する
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  API_URL: process.env.TRINITY_API_URL || 'YOUR_API_URL_HERE',
  USER_ID: process.env.USER_ID || 'uuid-001',
  WORKSPACE: process.env.WORKSPACE || '/root/clawd',
  TASKS_FILE: 'tasks.json'
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
    console.error(`[Executor] API call failed:`, error.message);
    return null;
  }
}

// イベント記録
async function recordEvent(type, dim, val, eventData) {
  return await callAPI('POST', 'event', {
    user_id: CONFIG.USER_ID,
    type: type,
    agent: 'executor',
    dim: dim,
    val: val,
    data: eventData
  });
}

// タスク記録ファイルの読み込み
function loadTasks() {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.TASKS_FILE);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// タスク記録ファイルの保存
function saveTasks(tasks) {
  const filePath = path.join(CONFIG.WORKSPACE, CONFIG.TASKS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
}

// 完遂率を計算
function calculateCompletionRate(tasks) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

// 判断→実行のタイムラグを評価
function evaluateTimeLag(tasks) {
  const recentTasks = tasks.slice(-10);
  
  const lags = recentTasks
    .filter(t => t.declared_at && t.started_at)
    .map(t => {
      const declared = new Date(t.declared_at);
      const started = new Date(t.started_at);
      return (started - declared) / (1000 * 60 * 60); // 時間単位
    });
  
  if (lags.length === 0) return 50;
  
  const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length;
  let score = 100;
  if (avgLag > 1) {
    score = Math.max(0, 100 - (avgLag - 1) * 2);
  }
  
  return Math.round(score);
}

// 継続力を評価
function evaluateContinuity(tasks) {
  const habitTasks = tasks.filter(t => t.is_habit);
  if (habitTasks.length === 0) return 70;
  
  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate = null;
  
  habitTasks
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .forEach(task => {
      if (task.status !== 'completed') return;
      
      const taskDate = new Date(task.completed_at).toDateString();
      
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(lastDate);
        const currDate = new Date(taskDate);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      lastDate = taskDate;
    });
  
  maxStreak = Math.max(maxStreak, currentStreak);
  const score = Math.min(100, 50 + (maxStreak / 30) * 50);
  return Math.round(score);
}

// 実行力評価
async function execute() {
  console.log('[Executor] 実行力の評価を開始...');
  
  const tasks = loadTasks();
  
  if (tasks.length === 0) {
    console.log('[Executor] タスク記録が見つかりません。スキップします。');
    return;
  }
  
  const latestTask = tasks[tasks.length - 1];
  const completionRate = calculateCompletionRate(tasks);
  const timeLagScore = evaluateTimeLag(tasks);
  const continuityScore = evaluateContinuity(tasks);
  
  // 実行記録（exec）
  const execResult = await recordEvent('exec', 'execution', completionRate, {
    task_id: latestTask.id || `task-${Date.now()}`,
    content: latestTask.content,
    declared: latestTask.declared_at || getTimestamp(),
    completed: latestTask.completed_at || '',
    rate: completionRate,
    difficulty: latestTask.difficulty || 50,
    status: latestTask.status
  });
  
  if (execResult && execResult.success) {
    console.log(`[Executor] 実行記録完了 (ID: ${execResult.id})`);
  }
  
  // スコア更新（score）
  const executionScore = Math.round(
    completionRate * 0.4 +
    timeLagScore * 0.3 +
    continuityScore * 0.3
  );
  
  const scoreResult = await recordEvent('score', 'execution', executionScore, {
    method: 'completion_lag_continuity',
    completion_rate: completionRate,
    time_lag_score: timeLagScore,
    continuity_score: continuityScore,
    formula: 'completion * 0.4 + lag * 0.3 + continuity * 0.3'
  });
  
  if (scoreResult && scoreResult.success) {
    console.log(`[Executor] 実行力スコア更新: ${executionScore}点`);
  }
  
  console.log('[Executor] 評価完了');
}

// タスクを宣言する関数（外部から呼び出し可能）
function declareTask(content, difficulty = 50, isHabit = false) {
  const tasks = loadTasks();
  
  const newTask = {
    id: `task-${Date.now()}`,
    content,
    difficulty,
    is_habit: isHabit,
    declared_at: getTimestamp(),
    started_at: null,
    completed_at: null,
    status: 'declared'
  };
  
  tasks.push(newTask);
  saveTasks(tasks);
  
  console.log(`[Executor] タスクを宣言しました: ${content}`);
  return newTask.id;
}

// タスクを開始する関数
function startTask(taskId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.error(`[Executor] タスクが見つかりません: ${taskId}`);
    return false;
  }
  
  task.started_at = getTimestamp();
  task.status = 'in_progress';
  saveTasks(tasks);
  
  console.log(`[Executor] タスクを開始しました: ${task.content}`);
  return true;
}

// タスクを完了する関数
function completeTask(taskId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.error(`[Executor] タスクが見つかりません: ${taskId}`);
    return false;
  }
  
  task.completed_at = getTimestamp();
  task.status = 'completed';
  saveTasks(tasks);
  
  console.log(`[Executor] タスクを完了しました: ${task.content}`);
  return true;
}

// メイン実行
if (require.main === module) {
  execute().catch(error => {
    console.error('[Executor] エラー:', error.message);
    process.exit(1);
  });
}

module.exports = { execute, declareTask, startTask, completeTask };
