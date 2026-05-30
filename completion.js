// ============================================================
//  completion.js  –  Feature 1: Predict project completion dates
// ============================================================

const CompletionPredictor = (() => {

  let selectedProject = 'p1';
  let burndownChart = null;
  let monteChart = null;

  function render() {
    renderProjectSelector();
    renderPrediction(selectedProject);
  }

  function renderProjectSelector() {
    const sel = document.getElementById('completion-proj-selector');
    if (!sel) return;
    sel.innerHTML = '';
    APP_DATA.projects.filter(p => p.status === 'active').forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'proj-btn' + (p.id === selectedProject ? ' active' : '');
      btn.textContent = p.name;
      btn.onclick = () => { selectedProject = p.id; render(); };
      sel.appendChild(btn);
    });
  }

  function renderPrediction(projectId) {
    const project  = APP_DATA.projects.find(p => p.id === projectId);
    const sprints  = APP_DATA.sprints.filter(s => s.project === projectId);
    const vs       = MLEngine.velocityStats(sprints);
    const tasks    = APP_DATA.tasks.filter(t => t.project === projectId);

    const totalSP      = tasks.reduce((s, t) => s + t.storyPoints, 0);
    const completedSP  = tasks.filter(t => t.status === 'done').reduce((s, t) => s + t.storyPoints, 0);
    const remainingSP  = totalSP - completedSP;

    const projection   = MLEngine.burndownProjection(
      totalSP, completedSP,
      new Date().toISOString().slice(0, 10),
      14, vs.avg || 50, vs.stdDev || 5
    );

    const pert = MLEngine.pertEstimate(
      Math.round(vs.avg * 1.1),
      Math.round(vs.avg),
      Math.round(vs.avg * 0.8)
    );

    // Stats
    document.getElementById('comp-total-sp').textContent     = totalSP;
    document.getElementById('comp-completed-sp').textContent = completedSP;
    document.getElementById('comp-remaining-sp').textContent = remainingSP;
    document.getElementById('comp-velocity').textContent     = vs.avg;

    // Confidence dates
    document.getElementById('comp-p50-date').textContent = formatDate(projection.p50Date);
    document.getElementById('comp-p75-date').textContent = formatDate(projection.p75Date);
    document.getElementById('comp-p90-date').textContent = formatDate(projection.p90Date);

    // Planned vs predicted
    const plannedEnd = project.plannedEnd;
    const onTrack    = projection.p75Date <= plannedEnd;
    const statusEl   = document.getElementById('comp-status-alert');
    if (statusEl) {
      if (onTrack) {
        statusEl.className = 'alert alert-green';
        statusEl.innerHTML = `<span class="alert-icon">✅</span> <span>On track — 75% confidence completion by <strong>${formatDate(projection.p75Date)}</strong>, before planned end of <strong>${formatDate(plannedEnd)}</strong>.</span>`;
      } else {
        statusEl.className = 'alert alert-red';
        statusEl.innerHTML = `<span class="alert-icon">⚠️</span> <span>At risk — 75% confidence completion by <strong>${formatDate(projection.p75Date)}</strong> is after planned end of <strong>${formatDate(plannedEnd)}</strong>. Consider scope reduction or velocity improvement.</span>`;
      }
    }

    // PERT card
    document.getElementById('comp-pert-expected').textContent  = pert.expected + ' SP/sprint';
    document.getElementById('comp-pert-optimistic').textContent = pert.optimistic + ' SP/sprint';
    document.getElementById('comp-pert-pessimistic').textContent = pert.pessimistic + ' SP/sprint';
    document.getElementById('comp-pert-stddev').textContent    = '±' + pert.stdDev;

    renderBurndownChart(sprints, totalSP, completedSP, vs.avg, projection);
    renderMonteCarloChart(projection.monteCarlo, plannedEnd, vs.avg, vs.stdDev);
  }

  function renderBurndownChart(sprints, totalSP, completedSP, avgVelocity, projection) {
    const ctx = document.getElementById('comp-burndown-chart');
    if (!ctx) return;
    if (burndownChart) burndownChart.destroy();

    // Ideal line
    const sprintCount = sprints.length;
    const ideal = sprints.map((_, i) => Math.max(0, totalSP - (totalSP / sprintCount) * (i + 1)));
    // Actual remaining
    let cumDone = 0;
    const actual = sprints.map(s => {
      cumDone += (s.completed || 0);
      return Math.max(0, totalSP - cumDone);
    });
    // Projection line (from current)
    const projLabels = ['Now', 'P50', 'P75', 'P90'];
    const projData   = [actual[actual.length - 1], 0, 0, 0];

    burndownChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...sprints.map(s => s.name), ...projLabels.slice(1)],
        datasets: [
          {
            label: 'Ideal Burndown',
            data: [...ideal, null, null, null],
            borderColor: '#06b6d4', borderDash: [6, 3],
            backgroundColor: 'transparent', tension: 0.1, pointRadius: 2,
          },
          {
            label: 'Actual Remaining',
            data: [...actual, null, null, null],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            fill: true, tension: 0.3, pointRadius: 4,
          },
          {
            label: 'Projected (P75)',
            data: [...Array(actual.length - 1).fill(null), actual[actual.length - 1], null, 0, null],
            borderColor: '#f59e0b', borderDash: [4, 4],
            backgroundColor: 'transparent', tension: 0.1,
            pointRadius: [0,0,5,0],
          },
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8', font:{size:11} } } },
        scales: {
          x: { ticks: { color:'#475569', font:{size:11} }, grid: { color:'rgba(255,255,255,0.04)' } },
          y: {
            title: { display: true, text: 'Story Points Remaining', color:'#475569' },
            ticks: { color:'#475569' }, grid: { color:'rgba(255,255,255,0.04)' }
          }
        }
      }
    });
  }

  function renderMonteCarloChart(mc, plannedEnd, avgVel, stdDev) {
    const ctx = document.getElementById('comp-monte-chart');
    if (!ctx) return;
    if (monteChart) monteChart.destroy();

    const labels  = ['Optimistic','P50','P75','P90','Pessimistic'];
    const sprints = [mc.min, mc.p50, mc.p75, mc.p90, mc.max];
    const colors  = ['#10b981','#06b6d4','#f59e0b','#ef4444','#be123c'];

    monteChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sprints to Completion',
          data: sprints,
          backgroundColor: colors.map(c => c + '33'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color:'#94a3b8' }, grid: { color:'rgba(255,255,255,0.04)' } },
          y: { title:{ display:true, text:'Sprints', color:'#475569' }, ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} }
        }
      }
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  return { render };
})();
