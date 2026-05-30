// ============================================================
//  ml-engine.js  –  Simulated ML / statistical models
// ============================================================

const MLEngine = (() => {

  /* ── PERT Estimation ──────────────────────────────────── */
  function pertEstimate(optimistic, mostLikely, pessimistic) {
    const expected = (optimistic + 4 * mostLikely + pessimistic) / 6;
    const stdDev   = (pessimistic - optimistic) / 6;
    return { expected: +expected.toFixed(1), stdDev: +stdDev.toFixed(2), optimistic, mostLikely, pessimistic };
  }

  /* ── Monte Carlo Simulation ───────────────────────────── */
  function monteCarloCompletion(remainingPoints, velocity, velocityStdDev, iterations = 1000) {
    const results = [];
    for (let i = 0; i < iterations; i++) {
      const v = Math.max(5, velocity + (Math.random() - 0.5) * 2 * velocityStdDev);
      const sprintsNeeded = Math.ceil(remainingPoints / v);
      results.push(sprintsNeeded);
    }
    results.sort((a, b) => a - b);
    return {
      p50: results[Math.floor(iterations * 0.50)],
      p75: results[Math.floor(iterations * 0.75)],
      p90: results[Math.floor(iterations * 0.90)],
      min: results[0],
      max: results[iterations - 1],
    };
  }

  /* ── Delay Probability Score ──────────────────────────── */
  function delayScore(task, memberHistory, workload) {
    const hist = memberHistory.find(h => h.memberId === task.assignee) || {};
    const load = workload.find(w => w.memberId === task.assignee) || {};
    const member = APP_DATA.members.find(m => m.id === task.assignee) || {};

    // Factor weights
    const complexityMap = { low: 0.1, medium: 0.25, high: 0.55, very_high: 0.85 };
    const complexityFactor  = complexityMap[task.complexity] || 0.3;
    const slipFactor        = Math.min((hist.avgSlip || 1) / 5, 1);
    const onTimeFactor      = 1 - (hist.onTimeRate || 0.8);
    const overloadFactor    = Math.min((load.assignedHours || 40) / (member.capacity || 40) - 1, 1);
    const overdueBoost      = (load.overdueCount || 0) * 0.08;
    const depFactor         = Math.min(task.dependencies.length * 0.07, 0.28);
    const progressFactor    = task.actualDays > task.estimatedDays
      ? Math.min((task.actualDays - task.estimatedDays) / task.estimatedDays * 0.4, 0.4) : 0;
    const blockedBoost      = task.status === 'blocked' ? 0.35 : 0;

    const raw = (
      complexityFactor * 0.25 +
      slipFactor       * 0.15 +
      onTimeFactor     * 0.15 +
      Math.max(overloadFactor, 0) * 0.20 +
      overdueBoost +
      depFactor +
      progressFactor +
      blockedBoost
    );

    return Math.min(Math.round(raw * 100), 99);
  }

  /* ── Workload Index ───────────────────────────────────── */
  function workloadIndex(memberId) {
    const load   = APP_DATA.workload.find(w => w.memberId === memberId);
    const member = APP_DATA.members.find(m => m.id === memberId);
    if (!load || !member) return 0;
    return +(load.assignedHours / member.capacity * 100).toFixed(1);
  }

  /* ── Risk Score (composite) ───────────────────────────── */
  function projectRiskScore(projectId) {
    const projectTasks = APP_DATA.tasks.filter(t => t.project === projectId);
    const project      = APP_DATA.projects.find(p => p.id === projectId);
    if (!project) return null;

    const total         = projectTasks.length;
    const blocked       = projectTasks.filter(t => t.status === 'blocked').length;
    const overdue       = projectTasks.filter(t => t.actualDays > t.estimatedDays).length;
    const highComplex   = projectTasks.filter(t => ['high','very_high'].includes(t.complexity)).length;
    const riskEvts      = APP_DATA.riskEvents.filter(r => r.project === projectId);
    const highImpact    = riskEvts.filter(r => r.impact === 'high').length;

    const blockedScore  = total ? (blocked  / total) * 30 : 0;
    const overdueScore  = total ? (overdue  / total) * 25 : 0;
    const complexScore  = total ? (highComplex / total) * 20 : 0;
    const riskEvtScore  = Math.min(highImpact * 8, 20);
    const budgetScore   = project.budget ? Math.min((project.spent / project.budget - 0.7) * 20, 5) : 0;

    const raw = blockedScore + overdueScore + complexScore + riskEvtScore + Math.max(budgetScore, 0);
    return {
      total:    Math.min(Math.round(raw), 100),
      breakdown: {
        blocked:   Math.round(blockedScore),
        overdue:   Math.round(overdueScore),
        complexity:Math.round(complexScore),
        riskEvents:Math.round(riskEvtScore),
        budget:    Math.max(Math.round(budgetScore), 0),
      }
    };
  }

  /* ── Velocity Stats ───────────────────────────────────── */
  function velocityStats(sprints) {
    const done = sprints.filter(s => s.velocity !== null);
    if (!done.length) return { avg: 0, stdDev: 0 };
    const avg = done.reduce((s, x) => s + x.velocity, 0) / done.length;
    const variance = done.reduce((s, x) => s + (x.velocity - avg) ** 2, 0) / done.length;
    return { avg: +avg.toFixed(1), stdDev: +Math.sqrt(variance).toFixed(2) };
  }

  /* ── Burndown projection ─────────────────────────────── */
  function burndownProjection(totalPoints, completedPoints, startDate, sprintLengthDays, avgVelocity, stdDev) {
    const remaining   = totalPoints - completedPoints;
    const monteCarlo  = monteCarloCompletion(remaining, avgVelocity, stdDev);
    const addDays     = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0,10); };

    return {
      remaining,
      monteCarlo,
      p50Date: addDays(startDate, monteCarlo.p50 * sprintLengthDays),
      p75Date: addDays(startDate, monteCarlo.p75 * sprintLengthDays),
      p90Date: addDays(startDate, monteCarlo.p90 * sprintLengthDays),
    };
  }

  /* ── Member Productivity Score ───────────────────────── */
  function memberProductivityScore(memberId) {
    const hist = APP_DATA.memberHistory.find(h => h.memberId === memberId);
    if (!hist) return 0;
    const onTime  = hist.onTimeRate  * 40;
    const vel     = Math.min(hist.avgVelocity / 15, 1) * 35;
    const slip    = Math.max(0, (1 - hist.avgSlip / 5)) * 25;
    return Math.min(Math.round(onTime + vel + slip), 100);
  }

  /* ── AI Report Generator ─────────────────────────────── */
  function generateHealthReport(projectId) {
    const project  = APP_DATA.projects.find(p => p.id === projectId);
    const risk     = projectRiskScore(projectId);
    const tasks    = APP_DATA.tasks.filter(t => t.project === projectId);
    const sprints  = APP_DATA.sprints.filter(s => s.project === projectId);
    const vs       = velocityStats(sprints);
    const blocked  = tasks.filter(t => t.status === 'blocked');
    const overdue  = tasks.filter(t => t.actualDays > t.estimatedDays && t.status !== 'done');

    const healthColor = risk.total < 30 ? 'green' : risk.total < 60 ? 'amber' : 'red';
    const healthLabel = risk.total < 30 ? 'Healthy'  : risk.total < 60 ? 'At Risk' : 'Critical';

    const sections = [];

    // Executive Summary
    sections.push({
      title: '📊 Executive Summary',
      content: `**${project.name}** is currently **${healthLabel}** with an overall risk score of **${risk.total}/100**. ` +
        `The project is ${project.progress}% complete against its planned timeline. ` +
        `${overdue.length > 0 ? `⚠️ ${overdue.length} task(s) are running over estimate. ` : '✅ All tasks are within estimate. '}` +
        `${blocked.length > 0 ? `🚫 ${blocked.length} task(s) are currently blocked. ` : ''}`
    });

    // Velocity Analysis
    sections.push({
      title: '🚀 Velocity & Delivery',
      content: `Average sprint velocity is **${vs.avg} story points** (σ = ${vs.stdDev}). ` +
        `${vs.avg > 50 ? 'The team is performing above the industry benchmark of 50 SP/sprint. ' : 'Velocity is below target. Consider reducing WIP or addressing blockers. '}` +
        `Current burn rate suggests the project will complete within the planned window with **75% confidence**.`
    });

    // Risk Analysis
    sections.push({
      title: '⚠️ Risk Analysis',
      content: `Risk breakdown — Blocked tasks: **${risk.breakdown.blocked}pts**, Overdue work: **${risk.breakdown.overdue}pts**, ` +
        `Complexity: **${risk.breakdown.complexity}pts**, Historical incidents: **${risk.breakdown.riskEvents}pts**, ` +
        `Budget pressure: **${risk.breakdown.budget}pts**. ` +
        `${risk.breakdown.blocked > 15 ? '🔴 Immediate attention needed on blocked tasks. ' : ''}` +
        `${risk.breakdown.riskEvents > 10 ? '🟡 Multiple high-impact risk events recorded — review mitigation plans. ' : ''}`
    });

    // Recommendations
    const recs = [];
    if (blocked.length)       recs.push(`Resolve ${blocked.length} blocked task(s) — escalate to stakeholders if needed.`);
    if (overdue.length > 2)   recs.push('Investigate root cause of estimation drift — consider re-calibrating story points.');
    if (vs.stdDev > 8)        recs.push('High velocity variance detected — stabilise sprint planning process.');
    if (risk.breakdown.budget > 2) recs.push('Budget consumption is ahead of schedule — review scope and resource allocation.');
    recs.push('Schedule a mid-sprint retrospective to surface impediments early.');
    recs.push('Ensure dependency tasks are unblocked before sprint end.');

    sections.push({
      title: '💡 AI Recommendations',
      content: recs.map((r, i) => `${i+1}. ${r}`).join('\n')
    });

    return { project, risk, healthColor, healthLabel, sections, generatedAt: new Date().toLocaleString() };
  }

  return {
    pertEstimate,
    monteCarloCompletion,
    delayScore,
    workloadIndex,
    projectRiskScore,
    velocityStats,
    burndownProjection,
    memberProductivityScore,
    generateHealthReport,
  };
})();
