// ============================================================
//  reports.js  –  Feature 6: AI-generated project health reports
// ============================================================

const ReportGenerator = (() => {

  let selectedProject = 'p1';
  let isGenerating    = false;

  function render() {
    renderProjectSelector();
    renderReport(selectedProject);
  }

  function renderProjectSelector() {
    const sel = document.getElementById('report-proj-selector');
    if (!sel) return;
    sel.innerHTML = '';
    APP_DATA.projects.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'proj-btn' + (p.id === selectedProject ? ' active' : '');
      btn.textContent = p.name;
      btn.onclick = () => { selectedProject = p.id; renderReport(p.id); };
      sel.appendChild(btn);
    });
  }

  function renderReport(projectId) {
    selectedProject = projectId;
    // Update selector
    document.querySelectorAll('#report-proj-selector .proj-btn').forEach(btn => btn.classList.remove('active'));
    const allBtns = document.querySelectorAll('#report-proj-selector .proj-btn');
    const projIdx = APP_DATA.projects.findIndex(p => p.id === projectId);
    if (allBtns[projIdx]) allBtns[projIdx].classList.add('active');

    const container = document.getElementById('report-container');
    if (!container) return;

    // Show generating animation
    container.innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--text-muted);">
        <div style="margin-bottom:20px;">
          <div class="spinner" style="width:36px;height:36px;margin:0 auto;border-width:3px;"></div>
        </div>
        <div style="font-size:15px;font-weight:600;margin-bottom:8px;">AI is analyzing project data…</div>
        <div style="font-size:13px;">Running ${(Math.random()*800+200).toFixed(0)} Monte Carlo simulations · Scoring ${APP_DATA.tasks.filter(t=>t.project===projectId).length} tasks · Evaluating ${APP_DATA.members.length} team members</div>
      </div>`;

    // Simulate AI generation delay
    setTimeout(() => {
      const report = MLEngine.generateHealthReport(projectId);
      renderReportCard(report, container);
    }, 1200);
  }

  function renderReportCard(report, container) {
    const p = report.project;
    const risk = report.risk;
    const budgetPct = p.budget ? Math.round(p.spent / p.budget * 100) : 0;
    const budgetColor = budgetPct > 90 ? '#ef4444' : budgetPct > 75 ? '#f59e0b' : '#10b981';

    container.innerHTML = `
      <div class="report-card" style="animation: fadeSlideIn 0.5s ease;">

        <!-- Header -->
        <div class="report-header">
          <div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">
              🤖 AI Health Report · Generated ${report.generatedAt}
            </div>
            <div style="font-size:24px;font-weight:800;margin-bottom:8px;">${p.name}</div>
            <div style="font-size:14px;color:var(--text-muted);">${p.description}</div>
            <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
              <span class="badge badge-cyan">📅 Started ${p.startDate}</span>
              <span class="badge badge-purple">🏁 Due ${p.plannedEnd}</span>
              <span class="badge ${p.priority==='critical'?'badge-red':p.priority==='high'?'badge-amber':'badge-gray'}">
                ${p.priority.toUpperCase()} Priority
              </span>
            </div>
          </div>
          <div style="text-align:center;padding:16px 24px;background:rgba(0,0,0,0.3);border-radius:16px;border:1px solid var(--border);min-width:160px;">
            <div style="font-size:64px;font-weight:900;line-height:1;color:${risk.total<30?'#10b981':risk.total<60?'#f59e0b':'#ef4444'};">${risk.total}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;font-weight:600;">RISK SCORE</div>
            <div style="margin-top:12px;">
              <span class="health-badge ${report.healthColor}">${report.healthColor==='green'?'🟢':report.healthColor==='amber'?'🟡':'🔴'} ${report.healthLabel}</span>
            </div>
          </div>
        </div>

        <!-- KPI Strip -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:var(--border);">
          ${[
            { label:'Progress',    value: p.progress+'%',        sub: 'Complete',      color: p.progress>75?'#10b981':p.progress>40?'#f59e0b':'#ef4444' },
            { label:'Budget',      value: budgetPct+'%',         sub: 'Spent',         color: budgetColor },
            { label:'Budget Spent',value: '$'+formatNum(p.spent),sub: 'of $'+formatNum(p.budget), color: '#94a3b8' },
            { label:'Risk Score',  value: risk.total,             sub: report.healthLabel, color: risk.total<30?'#10b981':risk.total<60?'#f59e0b':'#ef4444' },
          ].map(k => `
            <div style="background:rgba(0,0,0,0.25);padding:16px 20px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:${k.color};">${k.value}</div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px;">${k.label}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${k.sub}</div>
            </div>`).join('')}
        </div>

        <!-- Risk Breakdown Bar -->
        <div style="padding:20px 28px;border-bottom:1px solid var(--border);">
          <div style="font-size:12px;color:var(--text-muted);font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em;">Risk Factor Breakdown</div>
          <div style="display:flex;height:12px;border-radius:99px;overflow:hidden;gap:2px;">
            ${[
              { key:'blocked',    color:'#ef4444', label:'Blocked' },
              { key:'overdue',    color:'#f59e0b', label:'Overdue' },
              { key:'complexity', color:'#8b5cf6', label:'Complexity' },
              { key:'riskEvents', color:'#ec4899', label:'Incidents' },
              { key:'budget',     color:'#06b6d4', label:'Budget' },
            ].map(f => `<div style="flex:${risk.breakdown[f.key]+1};background:${f.color};border-radius:99px;" title="${f.label}: ${risk.breakdown[f.key]}pts"></div>`).join('')}
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;">
            ${[
              { key:'blocked', color:'#ef4444', label:'Blocked' },
              { key:'overdue', color:'#f59e0b', label:'Overdue' },
              { key:'complexity', color:'#8b5cf6', label:'Complexity' },
              { key:'riskEvents', color:'#ec4899', label:'Incidents' },
              { key:'budget', color:'#06b6d4', label:'Budget' },
            ].map(f => `<span style="font-size:11px;color:${f.color};"><span style="opacity:0.6;">●</span> ${f.label} (${risk.breakdown[f.key]})</span>`).join('')}
          </div>
        </div>

        <!-- AI Sections -->
        <div class="report-body">
          ${report.sections.map(sec => `
            <div class="report-section">
              <div class="report-section-title">${sec.title}</div>
              <div class="report-text">${markdownBold(sec.content)}</div>
            </div>`).join('')}

          <!-- Print note -->
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div style="font-size:12px;color:var(--text-muted);">
              📡 Analysis based on ${APP_DATA.tasks.filter(t=>t.project===p.id).length} tasks · ${APP_DATA.sprints.filter(s=>s.project===p.id).length} sprints · ${APP_DATA.riskEvents.filter(e=>e.project===p.id).length} risk events
            </div>
            <div style="display:flex;gap:8px;">
              <button class="topbar-btn" onclick="window.print()">🖨️ Print Report</button>
              <button class="topbar-btn primary" onclick="ReportGenerator.refresh()">🔄 Refresh Analysis</button>
            </div>
          </div>
        </div>
      </div>`;

    // Render summary donut
    setTimeout(() => renderSummaryDonut(risk), 100);
  }

  function renderSummaryDonut(risk) {
    // Already handled inline — can extend later
  }

  function markdownBold(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function formatNum(n) {
    if (!n) return '0';
    return n >= 1000 ? (n/1000).toFixed(0)+'K' : n.toString();
  }

  function refresh() {
    renderReport(selectedProject);
  }

  return { render, refresh };
})();
