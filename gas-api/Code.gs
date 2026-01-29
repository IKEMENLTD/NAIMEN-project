/**
 * Trinity System - GAS API
 * イケメンの構造化 - 内面スコアリングシステム
 */

// スプレッドシートID（インポート後に設定）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// シート名定数
const SHEETS = {
  USERS: 'users',
  TRINITY_SCORES: 'trinity_scores',
  OBSERVATIONS: 'observations',
  JUDGMENTS: 'judgments',
  EXECUTIONS: 'executions',
  AGENTS: 'agents',
  GROWTH_TRACKING: 'growth_tracking'
};

// ユーティリティ: スプレッドシート取得
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ユーティリティ: シート取得
function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

// ユーティリティ: タイムスタンプ生成
function getTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd\'T\'HH:mm:ss');
}

// ユーティリティ: UUID生成
function generateUUID() {
  return Utilities.getUuid();
}

// ユーティリティ: 次のID取得
function getNextId(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const numericIds = ids.filter(row => !isNaN(row[0])).map(row => Number(row[0]));
  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
}

/**
 * Web App エントリーポイント（GET）
 */
function doGet(e) {
  const path = e.parameter.path || '';
  const userId = e.parameter.user_id || 'uuid-001';
  
  try {
    switch(path) {
      case 'score':
        return handleGetScore(userId);
      case 'history':
        return handleGetHistory(userId, e.parameter);
      case 'agents':
        return handleGetAgents();
      default:
        return createResponse({ error: 'Invalid path' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Web App エントリーポイント（POST）
 */
function doPost(e) {
  const path = e.parameter.path || '';
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch(path) {
      case 'evaluate':
        return handleEvaluate(data);
      case 'observe':
        return handleObserve(data);
      case 'judge':
        return handleJudge(data);
      case 'execute':
        return handleExecute(data);
      default:
        return createResponse({ error: 'Invalid path' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * レスポンス生成
 */
function createResponse(data, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * GET /score - 現在のスコア取得
 */
function handleGetScore(userId) {
  const sheet = getSheet(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  
  // ヘッダーを除外
  const headers = data[0];
  const userRow = data.slice(1).find(row => row[0] === userId);
  
  if (!userRow) {
    return createResponse({ error: 'User not found' }, 404);
  }
  
  const user = {
    user_id: userRow[0],
    name: userRow[1],
    created_at: userRow[2],
    perception_score: userRow[3],
    judgment_score: userRow[4],
    execution_score: userRow[5],
    total_score: userRow[6],
    last_updated: userRow[7]
  };
  
  return createResponse(user);
}

/**
 * GET /history - 履歴取得
 */
function handleGetHistory(userId, params) {
  const dimension = params.dimension || 'all';
  const limit = parseInt(params.limit) || 100;
  
  const sheet = getSheet(SHEETS.TRINITY_SCORES);
  const data = sheet.getDataRange().getValues();
  
  // ヘッダーを除外してフィルタリング
  let history = data.slice(1)
    .filter(row => row[1] === userId)
    .map(row => ({
      id: row[0],
      user_id: row[1],
      timestamp: row[2],
      dimension: row[3],
      score: row[4],
      agent_id: row[5],
      evaluation_data: row[6],
      notes: row[7]
    }));
  
  if (dimension !== 'all') {
    history = history.filter(item => item.dimension === dimension);
  }
  
  // 最新順にソート
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return createResponse({
    user_id: userId,
    dimension: dimension,
    count: history.length,
    history: history.slice(0, limit)
  });
}

/**
 * GET /agents - エージェント状態取得
 */
function handleGetAgents() {
  const sheet = getSheet(SHEETS.AGENTS);
  const data = sheet.getDataRange().getValues();
  
  const agents = data.slice(1).map(row => ({
    agent_id: row[0],
    agent_name: row[1],
    role: row[2],
    status: row[3],
    last_active: row[4],
    evaluation_count: row[5],
    created_at: row[6]
  }));
  
  return createResponse({ agents });
}

/**
 * POST /evaluate - スコア評価記録
 */
function handleEvaluate(data) {
  const { user_id, dimension, score, agent_id, evaluation_data, notes } = data;
  
  // バリデーション
  if (!user_id || !dimension || score === undefined || !agent_id) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  if (!['perception', 'judgment', 'execution'].includes(dimension)) {
    return createResponse({ error: 'Invalid dimension' }, 400);
  }
  
  if (score < 0 || score > 100) {
    return createResponse({ error: 'Score must be between 0 and 100' }, 400);
  }
  
  // trinity_scoresに記録
  const scoresSheet = getSheet(SHEETS.TRINITY_SCORES);
  const id = getNextId(SHEETS.TRINITY_SCORES);
  const timestamp = getTimestamp();
  
  scoresSheet.appendRow([
    id,
    user_id,
    timestamp,
    dimension,
    score,
    agent_id,
    JSON.stringify(evaluation_data || {}),
    notes || ''
  ]);
  
  // usersテーブルのスコアを更新
  updateUserScore(user_id);
  
  // エージェントの評価カウントを更新
  updateAgentCount(agent_id);
  
  return createResponse({
    success: true,
    id: id,
    timestamp: timestamp
  });
}

/**
 * POST /observe - Observer記録
 */
function handleObserve(data) {
  const { user_id, observation_type, content, bias_detected, accuracy_score } = data;
  
  if (!user_id || !observation_type || !content) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(SHEETS.OBSERVATIONS);
  const id = getNextId(SHEETS.OBSERVATIONS);
  const timestamp = getTimestamp();
  
  sheet.appendRow([
    id,
    user_id,
    timestamp,
    observation_type,
    content,
    bias_detected || 'none',
    accuracy_score || 0,
    'observer'
  ]);
  
  return createResponse({
    success: true,
    id: id,
    timestamp: timestamp
  });
}

/**
 * POST /judge - Judge記録
 */
function handleJudge(data) {
  const { user_id, decision_id, decision_content, priority_score, logic_quality, outcome } = data;
  
  if (!user_id || !decision_content) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(SHEETS.JUDGMENTS);
  const id = getNextId(SHEETS.JUDGMENTS);
  const timestamp = getTimestamp();
  const decId = decision_id || `dec-${id}`;
  
  sheet.appendRow([
    id,
    user_id,
    timestamp,
    decId,
    decision_content,
    priority_score || 0,
    logic_quality || 0,
    outcome || 'pending',
    'judge'
  ]);
  
  return createResponse({
    success: true,
    id: id,
    decision_id: decId,
    timestamp: timestamp
  });
}

/**
 * POST /execute - Executor記録
 */
function handleExecute(data) {
  const { user_id, task_id, task_content, declared_at, completed_at, completion_rate, difficulty } = data;
  
  if (!user_id || !task_content) {
    return createResponse({ error: 'Missing required fields' }, 400);
  }
  
  const sheet = getSheet(SHEETS.EXECUTIONS);
  const id = getNextId(SHEETS.EXECUTIONS);
  const timestamp = getTimestamp();
  const tskId = task_id || `task-${id}`;
  
  sheet.appendRow([
    id,
    user_id,
    timestamp,
    tskId,
    task_content,
    declared_at || timestamp,
    completed_at || '',
    completion_rate || 0,
    difficulty || 50,
    'executor'
  ]);
  
  return createResponse({
    success: true,
    id: id,
    task_id: tskId,
    timestamp: timestamp
  });
}

/**
 * ユーザースコアの更新
 */
function updateUserScore(userId) {
  const scoresSheet = getSheet(SHEETS.TRINITY_SCORES);
  const usersSheet = getSheet(SHEETS.USERS);
  
  // 各次元の最新スコアを取得
  const data = scoresSheet.getDataRange().getValues();
  const userScores = data.slice(1).filter(row => row[1] === userId);
  
  // 各次元ごとに最新スコアを取得
  const latestScores = {
    perception: 0,
    judgment: 0,
    execution: 0
  };
  
  ['perception', 'judgment', 'execution'].forEach(dim => {
    const dimScores = userScores
      .filter(row => row[3] === dim)
      .sort((a, b) => new Date(b[2]) - new Date(a[2]));
    
    if (dimScores.length > 0) {
      latestScores[dim] = dimScores[0][4];
    }
  });
  
  // 総合スコア計算（min × 成長係数）
  const minScore = Math.min(latestScores.perception, latestScores.judgment, latestScores.execution);
  const growthCoefficient = getGrowthCoefficient(userId);
  const totalScore = Math.round(minScore * growthCoefficient);
  
  // usersテーブルを更新
  const userData = usersSheet.getDataRange().getValues();
  const rowIndex = userData.findIndex(row => row[0] === userId);
  
  if (rowIndex > 0) {
    usersSheet.getRange(rowIndex + 1, 4).setValue(latestScores.perception);
    usersSheet.getRange(rowIndex + 1, 5).setValue(latestScores.judgment);
    usersSheet.getRange(rowIndex + 1, 6).setValue(latestScores.execution);
    usersSheet.getRange(rowIndex + 1, 7).setValue(totalScore);
    usersSheet.getRange(rowIndex + 1, 8).setValue(getTimestamp());
  }
}

/**
 * 成長係数取得
 */
function getGrowthCoefficient(userId) {
  const sheet = getSheet(SHEETS.GROWTH_TRACKING);
  const data = sheet.getDataRange().getValues();
  
  const userGrowth = data.slice(1)
    .filter(row => row[1] === userId)
    .sort((a, b) => b[2].localeCompare(a[2])); // 月でソート
  
  if (userGrowth.length === 0) return 1.0;
  
  return userGrowth[0][6] || 1.0; // growth_coefficient
}

/**
 * エージェント評価カウント更新
 */
function updateAgentCount(agentId) {
  const sheet = getSheet(SHEETS.AGENTS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === agentId);
  
  if (rowIndex > 0) {
    const currentCount = data[rowIndex][5] || 0;
    sheet.getRange(rowIndex + 1, 6).setValue(currentCount + 1);
    sheet.getRange(rowIndex + 1, 5).setValue(getTimestamp()); // last_active
  }
}
