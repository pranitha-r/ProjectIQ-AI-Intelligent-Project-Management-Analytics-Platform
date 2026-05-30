// ============================================================
//  api.js  –  Frontend API client
//  Fetches all data from the Express/SQLite backend and
//  populates the global APP_DATA object so all existing
//  modules (completion.js, delay.js, etc.) continue to work.
// ============================================================

const API = (() => {

  const BASE = '';   // Same origin when served by Express

  async function get(path) {
    const res = await fetch(BASE + path);
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return res.json();
  }

  async function post(path, body) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`);
    return res.json();
  }

  async function put(path, body) {
    const res = await fetch(BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API PUT ${path} → ${res.status}`);
    return res.json();
  }

  // ── Load everything from backend ─────────────────────────
  async function loadAll() {
    const [
      projects, tasks, members, sprints,
      workload, weeklyMetrics, memberHistory, riskEvents
    ] = await Promise.all([
      get('/api/projects'),
      get('/api/tasks'),
      get('/api/members'),
      get('/api/sprints'),
      get('/api/workload'),
      get('/api/metrics'),
      get('/api/member-history'),
      get('/api/risk-events'),
    ]);

    // Populate global APP_DATA so all existing modules work unchanged
    Object.assign(APP_DATA, {
      projects,
      tasks,
      members,
      sprints,
      workload,
      weeklyMetrics,
      memberHistory,
      riskEvents,
    });

    console.log(`✅ Loaded from backend: ${projects.length} projects · ${tasks.length} tasks · ${members.length} members`);
  }

  // ── Task mutation helpers ────────────────────────────────
  async function updateTaskStatus(taskId, status, actualDays) {
    const updated = await put(`/api/tasks/${taskId}`, {
      status,
      actualDays,
      completedDate: status === 'done' ? new Date().toISOString().slice(0, 10) : null,
    });
    // Sync back into APP_DATA
    const idx = APP_DATA.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) APP_DATA.tasks[idx] = { ...APP_DATA.tasks[idx], ...updated };
    return updated;
  }

  async function createTask(task) {
    const created = await post('/api/tasks', task);
    APP_DATA.tasks.push({ ...created });
    return created;
  }

  async function createProject(project) {
    const created = await post('/api/projects', project);
    APP_DATA.projects.push(created);
    return created;
  }

  async function logRiskEvent(event) {
    const created = await post('/api/risk-events', event);
    APP_DATA.riskEvents.push(created);
    return created;
  }

  // ── Analytics endpoints (server-computed) ───────────────
  async function getCompletionPrediction(projectId) { return get(`/api/analytics/completion/${projectId}`); }
  async function getDelayScores(projectId)          { return get(`/api/analytics/delay?project=${projectId||'all'}`); }
  async function getOverloadData()                  { return get('/api/analytics/overload'); }
  async function getProductivityData()              { return get('/api/analytics/productivity'); }
  async function getRiskScore(projectId)            { return get(`/api/analytics/risk/${projectId}`); }
  async function getHealthReport(projectId)         { return get(`/api/analytics/report/${projectId}`); }

  return {
    loadAll,
    updateTaskStatus, createTask, createProject, logRiskEvent,
    getCompletionPrediction, getDelayScores, getOverloadData,
    getProductivityData, getRiskScore, getHealthReport,
  };
})();
