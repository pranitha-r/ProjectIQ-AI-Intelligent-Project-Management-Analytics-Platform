// ============================================================
//  dashboard.js  –  Overview / home page
// ============================================================

const Dashboard = (() => {

  function render() {
    const { projects, tasks, members, sprints, riskEvents } = APP_DATA;
    const activeTasks   = tasks.filter(t => t.status !== 'done');
    const blockedTasks  = tasks.filter(t => t.status === 'blocked');
    const doneTasks     = tasks.filter(t => t.status === 'done');
    const activeProjs   = projects.filter(p => p.status === 'active');

    // Stat cards
    document.getElementById('dash-stat-projects').textContent   = activeProjs.length;
    document.getElementById('dash-stat-tasks').textContent      = activeTasks.length;
    document.getElementById('dash-stat-blocked').textContent    = blockedTasks.length;
    document.getElementById('dash-stat-members').textContent    = members.length;

    // Project health list
    const projList = document.getElementById('dash-project-list');
    projList.innerHTML = '';
    activeProjs.forEach(p => {
      const risk = MLEngine.projectRiskScore(p.id);
      const riskClass = risk.total < 30 ? 'success' : risk.total < 60 ? 'warning' : 'danger';
      const riskLabel = risk.total < 30 ? 'Healthy' : risk.total < 60 ? 'At Risk' : 'Critical';
      const badgeClass = risk.total < 30 ? 'badge-green' : risk.total < 60 ? 'badge-amber' : 'badge-red';
      projList.innerHTML += `
        <div class="member-row">
          <div class="member-info">
            <div class="member-name">${p.name}</div>
            <div class="member-role">${p.description}</div>
          </div>
          <div style="text-align:right;min-width:120px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${p.progress}% complete</div>
            <div class="progress-bar" style="width:120px;">
              <div class="progress-fill ${riskClass}" style="width:${p.progress}%"></div>
            </div>
          </div>
          <span class="badge ${badgeClass}">${riskLabel}</span>
        </div>`;
    });

    // Recent risk events
    const evtList = document.getElementById('dash-risk-events');
    evtList.innerHTML = '';
    const recent = [...riskEvents].reverse().slice(0, 5);
    recent.forEach(e => {
      const icon = { scope_creep:'📈', resource_loss:'👤', technical_debt:'🔧', external_dependency:'🔗', bug_surge:'🐛', blocked_task:'🚫' }[e.type] || '⚠️';
      const bClass = e.impact === 'high' ? 'badge-red' : e.impact === 'medium' ? 'badge-amber' : 'badge-green';
      evtList.innerHTML += `
        <div class="member-row" style="gap:10px;">
          <span style="font-size:18px;">${icon}</span>
          <div class="member-info">
            <div class="member-name" style="font-size:13px;">${e.description}</div>
            <div class="member-role">${e.date} · ${APP_DATA.projects.find(p=>p.id===e.project)?.name}</div>
          </div>
          <span class="badge ${bClass}">${e.impact}</span>
        </div>`;
    });

    // Sprint velocity mini chart
    renderVelocityMini();
  }

  function renderVelocityMini() {
    const ctx = document.getElementById('dash-velocity-chart');
    if (!ctx) return;
    const sp = APP_DATA.sprints.filter(s => s.velocity !== null);
    if (window._dashVelocityChart) window._dashVelocityChart.destroy();
    window._dashVelocityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sp.map(s => s.name.replace('Sprint ','')),
        datasets: [{
          label: 'Velocity',
          data: sp.map(s => s.velocity),
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
        }, {
          label: 'Planned',
          data: sp.map(s => s.planned),
          borderColor: '#06b6d4',
          borderDash: [6,3],
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8', font:{size:11} } } },
        scales: {
          x: { ticks: { color:'#475569' }, grid: { color:'rgba(255,255,255,0.04)' } },
          y: { ticks: { color:'#475569' }, grid: { color:'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  return { render };
})();
