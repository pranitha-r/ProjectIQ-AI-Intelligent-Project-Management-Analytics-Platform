// ============================================================
//  risk.js  –  Feature 5: Risk scoring using historical data
// ============================================================

const RiskAnalyzer = (() => {

  let radarChart  = null;
  let trendChart  = null;
  let selectedProject = 'p1';

  function render() {
    renderProjectSelector();
    renderRiskCards();
    renderRadar();
    renderTrend();
    renderEventLog();
  }

  function renderProjectSelector() {
    const sel = document.getElementById('risk-proj-selector');
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

  function renderRiskCards() {
    const risk = MLEngine.projectRiskScore(selectedProject);
    const project = APP_DATA.projects.find(p => p.id === selectedProject);
    if (!risk || !project) return;

    // Overall score
    const el = document.getElementById('risk-score-display');
    if (el) {
      const color = risk.total < 30 ? '#10b981' : risk.total < 60 ? '#f59e0b' : '#ef4444';
      el.innerHTML = `
        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:72px;font-weight:900;line-height:1;color:${color};">${risk.total}</div>
          <div style="font-size:14px;color:var(--text-muted);margin-top:8px;">Risk Score / 100</div>
          <div style="margin-top:16px;">
            <span class="health-badge ${risk.total<30?'green':risk.total<60?'amber':'red'}">
              ${risk.total<30?'🟢 Low Risk':risk.total<60?'🟡 Medium Risk':'🔴 High Risk'}
            </span>
          </div>
        </div>`;
    }

    // Breakdown cards
    const breakdown = [
      { key:'blocked',    label:'Blocked Tasks',     icon:'🚫', color:'#ef4444' },
      { key:'overdue',    label:'Overdue Work',       icon:'⏰', color:'#f59e0b' },
      { key:'complexity', label:'Complexity Load',    icon:'🧩', color:'#8b5cf6' },
      { key:'riskEvents', label:'Risk Incidents',     icon:'⚠️', color:'#ec4899' },
      { key:'budget',     label:'Budget Pressure',    icon:'💰', color:'#06b6d4' },
    ];

    const grid = document.getElementById('risk-breakdown-grid');
    if (grid) {
      grid.innerHTML = '';
      breakdown.forEach(b => {
        const val = risk.breakdown[b.key];
        const pct = Math.min(val / 30 * 100, 100);
        grid.innerHTML += `
          <div class="card" style="text-align:center;padding:16px 12px;">
            <div style="font-size:24px;margin-bottom:6px;">${b.icon}</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">${b.label}</div>
            <div style="font-size:28px;font-weight:900;color:${b.color};">${val}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">pts</div>
            <div class="progress-bar" style="margin-top:10px;">
              <div class="progress-fill" style="width:${pct}%;background:${b.color};"></div>
            </div>
          </div>`;
      });
    }

    // Recommendations
    const recs = document.getElementById('risk-recommendations');
    if (recs) {
      const items = getRiskRecommendations(risk, selectedProject);
      recs.innerHTML = items.map(r => `
        <div class="alert ${r.cls}" style="margin-bottom:8px;">
          <span class="alert-icon">${r.icon}</span>
          <span>${r.text}</span>
        </div>`).join('');
    }
  }

  function getRiskRecommendations(risk, projectId) {
    const recs = [];
    const tasks = APP_DATA.tasks.filter(t => t.project === projectId);
    const blocked = tasks.filter(t => t.status === 'blocked');
    if (risk.breakdown.blocked > 10) {
      recs.push({ cls:'alert-red', icon:'🚫', text: `<strong>${blocked.length} blocked task(s)</strong> are the top risk driver. Escalate impediments to product owner immediately.` });
    }
    if (risk.breakdown.overdue > 10) {
      recs.push({ cls:'alert-amber', icon:'⏰', text: 'High overdue rate signals estimation drift. Re-calibrate story point sizing in next planning session.' });
    }
    if (risk.breakdown.complexity > 8) {
      recs.push({ cls:'alert-purple', icon:'🧩', text: 'Many high-complexity tasks in flight. Pair senior engineers with junior on complex items to reduce risk.' });
    }
    if (risk.breakdown.riskEvents > 10) {
      recs.push({ cls:'alert-red', icon:'⚠️', text: 'Multiple high-impact risk events logged. Review and update the risk register with current mitigation plans.' });
    }
    if (risk.total < 30) {
      recs.push({ cls:'alert-green', icon:'✅', text: 'Project is in good health. Maintain current cadence and continue weekly risk reviews.' });
    }
    recs.push({ cls:'alert-purple', icon:'💡', text: 'Schedule a risk retrospective at the end of the current sprint to reassess scores.' });
    return recs;
  }

  function renderRadar() {
    const ctx = document.getElementById('risk-radar-chart');
    if (!ctx) return;
    if (radarChart) radarChart.destroy();

    const risk = MLEngine.projectRiskScore(selectedProject);
    const allRisks = APP_DATA.projects.filter(p=>p.status==='active').map(p => ({
      p, r: MLEngine.projectRiskScore(p.id)
    }));

    const labels = ['Blocked','Overdue','Complexity','Risk Events','Budget'];
    const colors = ['#7c3aed','#06b6d4','#ec4899'];

    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: allRisks.map((item, i) => ({
          label: item.p.name,
          data: [
            item.r.breakdown.blocked,
            item.r.breakdown.overdue,
            item.r.breakdown.complexity,
            item.r.breakdown.riskEvents,
            item.r.breakdown.budget,
          ],
          borderColor: colors[i % colors.length],
          backgroundColor: colors[i % colors.length] + '22',
          pointBackgroundColor: colors[i % colors.length],
          pointRadius: 4,
        }))
      },
      options: {
        responsive: true,
        plugins: { legend:{ labels:{ color:'#94a3b8', font:{size:11} } } },
        scales: {
          r: {
            ticks:{ color:'#475569', backdropColor:'transparent', stepSize: 5 },
            grid:{ color:'rgba(255,255,255,0.08)' },
            pointLabels:{ color:'#94a3b8', font:{size:12} },
            min:0,
          }
        }
      }
    });
  }

  function renderTrend() {
    const ctx = document.getElementById('risk-trend-chart');
    if (!ctx) return;
    if (trendChart) trendChart.destroy();

    // Simulate historical risk scores over last 6 sprints
    const sprints = APP_DATA.sprints.slice(0, 7);
    const base = MLEngine.projectRiskScore(selectedProject)?.total || 40;
    const simScores = sprints.map((_, i) => Math.max(10, Math.min(90,
      base - (sprints.length - 1 - i) * 3 + (Math.random() - 0.5) * 8
    )));

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sprints.map(s => s.name.replace('Sprint', 'S')),
        datasets: [
          {
            label: 'Risk Score',
            data: simScores.map(v => +v.toFixed(0)),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#ef4444', pointRadius: 5,
          },
          {
            label: 'Threshold (60)',
            data: sprints.map(() => 60),
            borderColor: '#f59e0b', borderDash: [6,3],
            backgroundColor: 'transparent', pointRadius: 0,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend:{ labels:{ color:'#94a3b8', font:{size:11} } } },
        scales: {
          x: { ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.04)'} },
          y: { ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'}, min:0, max:100 }
        }
      }
    });
  }

  function renderEventLog() {
    const list = document.getElementById('risk-event-log');
    if (!list) return;
    const events = APP_DATA.riskEvents.filter(e => e.project === selectedProject);
    list.innerHTML = '';
    if (!events.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No risk events recorded for this project.</p></div>';
      return;
    }
    [...events].reverse().forEach(e => {
      const typeLabel = e.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      const bClass = e.impact==='high' ? 'badge-red' : e.impact==='medium' ? 'badge-amber' : 'badge-green';
      list.innerHTML += `
        <div class="member-row" style="gap:12px;">
          <div style="text-align:center;min-width:60px;">
            <div style="font-size:11px;color:var(--text-muted);">${e.date}</div>
          </div>
          <div class="member-info">
            <div class="member-name" style="font-size:13px;">${e.description}</div>
            <div class="member-role">${typeLabel}</div>
          </div>
          <span class="badge ${bClass}">${e.impact} impact</span>
        </div>`;
    });
  }

  return { render };
})();
