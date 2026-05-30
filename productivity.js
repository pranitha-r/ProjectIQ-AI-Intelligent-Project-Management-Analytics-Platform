// ============================================================
//  productivity.js  –  Feature 4: Team productivity analytics
// ============================================================

const ProductivityAnalytics = (() => {

  let velocityChart = null;
  let cycleChart    = null;
  let throughChart  = null;
  let memberChart   = null;

  function render() {
    renderStats();
    renderVelocityChart();
    renderCycleTimeChart();
    renderThroughputChart();
    renderMemberProductivity();
  }

  function renderStats() {
    const wm   = APP_DATA.weeklyMetrics;
    const last  = wm[wm.length - 1];
    const prev  = wm[wm.length - 2];
    const sprints = APP_DATA.sprints.filter(s => s.velocity !== null);
    const vs    = MLEngine.velocityStats(sprints);

    document.getElementById('prod-avg-velocity').textContent  = vs.avg;
    document.getElementById('prod-avg-cycle').textContent     = (wm.reduce((s,w)=>s+w.cycleTime,0)/wm.length).toFixed(1) + 'd';
    document.getElementById('prod-throughput').textContent    = last.tasksCompleted;
    document.getElementById('prod-bug-ratio').textContent     = ((wm.reduce((s,w)=>s+w.bugsOpened,0)/wm.length)).toFixed(1);

    const tDelta = last.tasksCompleted - prev.tasksCompleted;
    document.getElementById('prod-throughput-delta').textContent = (tDelta >= 0 ? '▲ +' : '▼ ') + tDelta + ' vs last week';
    document.getElementById('prod-throughput-delta').className   = 'stat-delta ' + (tDelta >= 0 ? 'up' : 'down');
  }

  function renderVelocityChart() {
    const ctx = document.getElementById('prod-velocity-chart');
    if (!ctx) return;
    if (velocityChart) velocityChart.destroy();
    const sp = APP_DATA.sprints;

    velocityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sp.map(s => s.name.replace('Sprint ', 'S')),
        datasets: [
          {
            label: 'Planned SP',
            data: sp.map(s => s.planned),
            backgroundColor: 'rgba(6,182,212,0.15)',
            borderColor: '#06b6d4',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Completed SP',
            data: sp.map(s => s.completed),
            backgroundColor: 'rgba(124,58,237,0.3)',
            borderColor: '#7c3aed',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Velocity Trend',
            data: sp.map(s => s.velocity),
            type: 'line',
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#10b981',
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels:{ color:'#94a3b8', font:{size:11} } } },
        scales: {
          x: { ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.04)'} },
          y: { title:{ display:true, text:'Story Points', color:'#475569' }, ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} }
        }
      }
    });
  }

  function renderCycleTimeChart() {
    const ctx = document.getElementById('prod-cycle-chart');
    if (!ctx) return;
    if (cycleChart) cycleChart.destroy();
    const wm = APP_DATA.weeklyMetrics;

    cycleChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: wm.map(w => w.week),
        datasets: [
          {
            label: 'Cycle Time (days)',
            data: wm.map(w => w.cycleTime),
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236,72,153,0.1)',
            fill: true, tension: 0.4,
            pointRadius: 4, pointBackgroundColor: '#ec4899',
          },
          {
            label: 'Target (4d)',
            data: wm.map(() => 4),
            borderColor: '#10b981',
            borderDash: [6, 3],
            backgroundColor: 'transparent',
            pointRadius: 0,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels:{ color:'#94a3b8', font:{size:11} } } },
        scales: {
          x: { ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.04)'} },
          y: { title:{ display:true, text:'Days', color:'#475569' }, ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} }
        }
      }
    });
  }

  function renderThroughputChart() {
    const ctx = document.getElementById('prod-throughput-chart');
    if (!ctx) return;
    if (throughChart) throughChart.destroy();
    const wm = APP_DATA.weeklyMetrics;

    // Rolling 4-week average
    const rolling = wm.map((_, i) => {
      const slice = wm.slice(Math.max(0, i-3), i+1);
      return +(slice.reduce((s, w) => s + w.tasksCompleted, 0) / slice.length).toFixed(1);
    });

    throughChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: wm.map(w => w.week),
        datasets: [
          {
            label: 'Tasks Completed',
            data: wm.map(w => w.tasksCompleted),
            backgroundColor: 'rgba(139,92,246,0.25)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Bugs Opened',
            data: wm.map(w => w.bugsOpened),
            backgroundColor: 'rgba(239,68,68,0.2)',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: '4-wk Rolling Avg',
            data: rolling,
            type: 'line',
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 3,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels:{ color:'#94a3b8', font:{size:11} } } },
        scales: {
          x: { ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.04)'} },
          y: { ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} }
        }
      }
    });
  }

  function renderMemberProductivity() {
    const ctx = document.getElementById('prod-member-chart');
    if (!ctx) return;
    if (memberChart) memberChart.destroy();
    const members = APP_DATA.members;
    const colors = ['#7c3aed','#06b6d4','#ec4899','#f59e0b','#10b981','#8b5cf6','#14b8a6','#ef4444'];

    const scores     = members.map(m => MLEngine.memberProductivityScore(m.id));
    const onTimeRates = members.map(m => {
      const h = APP_DATA.memberHistory.find(hh => hh.memberId === m.id);
      return h ? +(h.onTimeRate * 100).toFixed(0) : 0;
    });
    const velocities = members.map(m => {
      const h = APP_DATA.memberHistory.find(hh => hh.memberId === m.id);
      return h ? h.avgVelocity : 0;
    });

    memberChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: members.map(m => m.name.split(' ')[0]),
        datasets: [
          {
            label: 'Productivity Score',
            data: scores,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.15)',
            pointBackgroundColor: '#8b5cf6',
            pointRadius: 4,
          },
          {
            label: 'On-time Rate %',
            data: onTimeRates,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6,182,212,0.1)',
            pointBackgroundColor: '#06b6d4',
            pointRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels:{ color:'#94a3b8', font:{size:11} } } },
        scales: {
          r: {
            ticks:{ color:'#475569', backdropColor:'transparent' },
            grid:{ color:'rgba(255,255,255,0.08)' },
            pointLabels:{ color:'#94a3b8', font:{size:11} },
            min: 0, max: 100,
          }
        }
      }
    });

    // Member leaderboard
    const board = document.getElementById('prod-leaderboard');
    if (!board) return;
    const ranked = members.map((m, i) => ({ m, score: scores[i], onTime: onTimeRates[i], vel: velocities[i] }))
                          .sort((a, b) => b.score - a.score);
    board.innerHTML = '';
    ranked.forEach((item, i) => {
      const avIdx = APP_DATA.members.indexOf(item.m) % 8;
      const medal = ['🥇','🥈','🥉'][i] || `${i+1}.`;
      board.innerHTML += `
        <div class="member-row">
          <span style="font-size:18px;min-width:28px;">${medal}</span>
          <div class="avatar av-${avIdx}">${item.m.avatar}</div>
          <div class="member-info">
            <div class="member-name">${item.m.name}</div>
            <div class="member-role">${item.m.role}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-size:18px;color:var(--accent-violet);">${item.score}</div>
            <div style="font-size:11px;color:var(--text-muted);">score</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;font-size:14px;">${item.onTime}%</div>
            <div style="font-size:11px;color:var(--text-muted);">on-time</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;font-size:14px;">${item.vel}</div>
            <div style="font-size:11px;color:var(--text-muted);">avg vel</div>
          </div>
        </div>`;
    });
  }

  return { render };
})();
