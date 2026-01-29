/**
 * Trinity System v2 - GAS API (最適化版)
 * イケメンの構造化 - 内面スコアリングシステム
 * 
 * 2シート構成:
 * - users: 現在の状態
 * - events: 全イベント履歴
 */

// スプレッドシートID（インポート後に設定）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// シート名
const SHEET_USERS = 'users';
const SHEET_EVENTS = 'events';

// ユーティリティ: スプレッドシート取得
function getSheet(sheetName) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
}

// ユーティリティ: タイムスタンプ生成
function getTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd\'T\'HH:mm:ss');
}

// ユーティリティ: 次のID取得
function getNextId() {
  const sheet = getSheet(SHEET_EVENTS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return (typeof lastId === 'number') ? lastId + 1 : 1;
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
 * Web App エントリーポイント（GET）
 */
function doGet(e) {
  const path = e.parameter.path || '';
  const userId = e.parameter.user_id || 'uuid-001';
  
  try {
    switch(path) {
      case 'user':
        return handleGetUser(userId);
      case 'events':
        return handleGetEvents(userId, e.parameter);
      default:
        return createResponse({ error: 'Invalid path. Use: user or events' }, 400);
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
      case 'event':
        return handlePostEvent(data);
      default:
        return createResponse({ error: 'Invalid path. Use: event' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * GET /user - ユーザー情報取得
 */
function handleGetUser(userId) {
  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  
  // ヘッダーを除外してユーザーを検索
  const userRow = data.slice(1).find(row => row[0] === userId);
  
  if (!userRow) {
    return createResponse({ error: 'User not found' }, 404);
  }
  
  // metaをパース
  let meta = {};
  try {
    meta = JSON.parse(userRow[9]);
  } catch (e) {
    meta = {};
  }
  
  const user = {
    user_id: userRow[0],
    name: userRow[1],
    created_at: userRow[2],
    scores: {
      perception: userRow[3],
      judgment: userRow[4],
      execution: userRow[5],
      total: userRow[6]
    },
    growth_coefficient: userRow[7],
    last_updated: userRow[8],
    meta: meta
  };
  
  return createResponse(user);
}

/**
 * GET /events - イベント履歴取得
 */
function handleGetEvents(userId, params) {
  const type = params.type || 'all';
  const agent = params.agent || 'all';
  const dim = params.dim || 'all';
  const from = params.from || '';
  const to = params.to || '';
  const limit = parseInt(params.limit) || 100;
  
  const sheet = getSheet(SHEET_EVENTS);
  const data = sheet.getDataRange().getValues();
  
  // ヘッダーを除外してフィルタリング
  let events = data.slice(1)
    .filter(row => row[1] === userId)
    .map(row => ({
      id: row[0],
      user_id: row[1],
      ts: row[2],
      type: row[3],
      agent: row[4],
      dim: row[5],
      val: row[6],
      data: parseJSON(row[7])
    }));
  
  // フィルタリング
  if (type !== 'all') {
    events = events.filter(e => e.type === type);
  }
  if (agent !== 'all') {
    events = events.filter(e => e.agent === agent);
  }
  if (dim !== 'all') {
    events = events.filter(e => e.dim === dim);
  }
  if (from) {
    events = events.filter(e => e.ts >= from);
  }
  if (to) {
    events = events.filter(e => e.ts <= to);
  }
  
  // 最新順にソート
  events.sort((a, b) => {
    const aTime = new Date(a.ts).getTime();
    const bTime = new Date(b.ts).getTime();
    return bTime - aTime;
  });
  
  return createResponse({
    user_id: userId,
    filters: { type, agent, dim, from, to },
    count: events.length,
    events: events.slice(0, limit)
  });
}

/**
 * POST /event - イベント記録
 */
function handlePostEvent(data) {
  const { user_id, type, agent, dim, val, data: eventData } = data;
  
  // バリデーション
  if (!user_id || !type || !agent || !dim || val === undefined) {
    return createResponse({ error: 'Missing required fields: user_id, type, agent, dim, val' }, 400);
  }
  
  // イベントタイプの検証
  const validTypes = ['obs', 'jdg', 'exec', 'score', 'growth'];
  if (!validTypes.includes(type)) {
    return createResponse({ error: 'Invalid type. Use: obs, jdg, exec, score, growth' }, 400);
  }
  
  // eventsシートに記録
  const eventsSheet = getSheet(SHEET_EVENTS);
  const id = getNextId();
  const ts = getTimestamp();
  
  eventsSheet.appendRow([
    id,
    user_id,
    ts,
    type,
    agent,
    dim,
    val,
    JSON.stringify(eventData || {})
  ]);
  
  // スコア更新の場合、usersシートを更新
  if (type === 'score') {
    updateUserScore(user_id, dim, val);
  }
  
  // 成長係数更新の場合、usersシートを更新
  if (type === 'growth') {
    updateUserGrowth(user_id, val);
  }
  
  return createResponse({
    success: true,
    id: id,
    ts: ts
  });
}

/**
 * ユーザースコアを更新
 */
function updateUserScore(userId, dim, score) {
  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === userId);
  
  if (rowIndex <= 0) return; // ユーザーが見つからない
  
  const row = rowIndex + 1;
  
  // 次元ごとにカラムを更新
  const dimColumns = {
    'perception': 4,  // D列
    'judgment': 5,    // E列
    'execution': 6    // F列
  };
  
  if (dimColumns[dim]) {
    sheet.getRange(row, dimColumns[dim]).setValue(score);
  }
  
  // 総合スコアを再計算
  const perception = sheet.getRange(row, 4).getValue();
  const judgment = sheet.getRange(row, 5).getValue();
  const execution = sheet.getRange(row, 6).getValue();
  const growthCoef = sheet.getRange(row, 8).getValue();
  
  const minScore = Math.min(perception, judgment, execution);
  const totalScore = Math.round(minScore * growthCoef);
  
  sheet.getRange(row, 7).setValue(totalScore); // 総合スコア
  sheet.getRange(row, 9).setValue(getTimestamp()); // 最終更新日時
  
  // metaを更新（last_observation等）
  updateUserMeta(userId, dim);
}

/**
 * ユーザーの成長係数を更新
 */
function updateUserGrowth(userId, coefficient) {
  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === userId);
  
  if (rowIndex <= 0) return;
  
  const row = rowIndex + 1;
  sheet.getRange(row, 8).setValue(coefficient); // 成長係数
  
  // 総合スコアを再計算
  const perception = sheet.getRange(row, 4).getValue();
  const judgment = sheet.getRange(row, 5).getValue();
  const execution = sheet.getRange(row, 6).getValue();
  
  const minScore = Math.min(perception, judgment, execution);
  const totalScore = Math.round(minScore * coefficient);
  
  sheet.getRange(row, 7).setValue(totalScore);
  sheet.getRange(row, 9).setValue(getTimestamp());
}

/**
 * ユーザーのmetaを更新
 */
function updateUserMeta(userId, dim) {
  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === userId);
  
  if (rowIndex <= 0) return;
  
  const row = rowIndex + 1;
  const metaStr = sheet.getRange(row, 10).getValue();
  
  let meta = {};
  try {
    meta = JSON.parse(metaStr);
  } catch (e) {
    meta = {};
  }
  
  // last_observation等を更新
  const ts = getTimestamp();
  if (dim === 'perception') {
    meta.last_observation = ts;
  } else if (dim === 'judgment') {
    meta.last_judgment = ts;
  } else if (dim === 'execution') {
    meta.last_execution = ts;
  }
  
  sheet.getRange(row, 10).setValue(JSON.stringify(meta));
}

/**
 * JSONパースのヘルパー
 */
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}
