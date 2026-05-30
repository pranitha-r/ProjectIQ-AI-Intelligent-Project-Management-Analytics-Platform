// ============================================================
//  overload.js  –  Feature 3: Identify overloaded team members
// ============================================================

const OverloadDetector = (() => {

  let bubbleChart = null;
  let barChart    = null;

  function render() {
    renderStats();
    renderMemberCards();
    renderBubbleChart();
    renderWorkloadBar();
  }

  function getEnrichedWorkload() {
    return APP_DATA.workload.map(w => {
      const member  = APP_DATA.members.find(m => m.id === w.memberId);
      const hist    = APP_DATA.memberHistory.find(h => h.memberId === w.memberId);
      const idx     = MLEngine.workloadIndex(w.memberId);
      const status  = idx >= 120 ? 'critical' : idx >= 100 ? 'overloaded' : idx >= 85 ? 'high' : 'normal';
      return { ...w, member, hist, idx, status };
    }).sort((a, b) => b.idx - a.idx);
  }

  function renderStats() {
    const wl = getEnrichedWorkload();
    document.getElementById('ov-overloaded-count').textContent  = wl.filter(w => w.idx >= 100).length;
    document.getElementById('ov-at-risk-count').textContent     = wl.filter(w => w.idx >= 85 && w.idx < 100).length;
    document.getElementById('ov-normal-count').textContent      = wl.filter(w => w.idx < 85).length;
    const avgLoad = (wl.reduce((s, w) => s + w.idx, 0) / wl.length).toFixed(0);
    document.getElementById('ov-avg-load').textContent = avgLoad + '%';
  }

  function renderMemberCards() {
    const container = document.getElementById('ov-member-cards');
    if (!container) return;
    const wl = getEnrichedWorkload();
    container.innerHTML = '';

    wl.forEach((w, i) => {
      const avIdx    = i % 8;
      const pct      = Math.min(w.idx, 150);
      const fillClass = w.idx >= 120 ? 'danger' : w.idx >= 100 ? 'warning' : w.idx >= 85 ? 'warning' : 'success';
      const fillColor = w.idx >= 120 ? '#ef4444' : w.idx >= 100 ? '#f59e0b' : w.idx >= 85 ? '#f59e0b' : '#10b981';
      const statusBadge = {
        critical:  'badge-red',
        overloaded:'badge-red',
        high:      'badge-amber',
        normal:    'badge-green',
      }[w.status];
      const statusLabel = {
        critical:  '🔴 Critical',
        overloaded:'🟠 Overloaded',
        high:      '🟡 High Load',
        normal:    '🟢 Normal',
      }[w.status];

      const assignedTasks = w.tasks.map(tid => {
        const t = APP_DATA.tasks.find(tk => tk.id === tid);
        return t ? `<span class="tag">${t.title.slice(0,22)}${t.title.length>22?'…':''}</span>` : '';
      }).join('');

      const suggestion = w.idx >= 100
        ? getSuggestion(w, wl)
        : '';

      container.innerHTML += `
        <div class="card" style="animation: fadeSlideIn 0.4s ease ${i*60}ms both;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div class="avatar av-${avIdx}" style="width:44px;height:44px;font-size:15px;">${w.member?.avatar}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:15px;">${w.member?.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">${w.member?.role}</div>
            </div>
            <span class="badge ${statusBadge}">${statusLabel}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;color:var(--text-muted);">Workload Index</span>
            <span style="font-weight:800;font-size:20px;color:${fillColor}">${w.idx}%</span>
          </div>
          <div class="workload-track">
            <div class="workload-fill" style="width:${Math.min(pct/1.5,100)}%;background:${fillColor};"></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:16px 0;text-align:center;">
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;">
              <div style="font-size:20px;font-weight:800;">${w.assignedHours}h</div>
              <div style="font-size:10px;color:var(--text-muted);">Assigned</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;">
              <div style="font-size:20px;font-weight:800;">${w.member?.capacity}h</div>
              <div style="font-size:10px;color:var(--text-muted);">Capacity</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;">
              <div style="font-size:20px;font-weight:800;">${w.overdueCount}</div>
              <div style="font-size:10px;color:var(--text-muted);">Overdue</div>
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Current Tasks</div>
            <div>${assignedTasks || '<span style="color:var(--text-muted);font-size:12px;">No tasks assigned</span>'}</div>
          </div>

          ${suggestion ? `<div class="alert alert-amber" style="margin-top:8px;font-size:12px;"><span class="alert-icon">💡</span><span>${suggestion}</span></div>` : ''}
        </div>`;
    });
  }

  function getSuggestion(overloaded, all) {
    const underloaded = all.filter(w => w.idx < 80 && w.memberId !== overloaded.memberId);
    if (!underloaded.length) return 'Consider deferring low-priority tasks to next sprint.';
    const target = underloaded[0];
    return `Consider reassigning tasks to <strong>${target.member?.name}</strong> (${target.idx}% load).`;
  }

  function renderBubbleChart() {
    const ctx = document.getElementById('ov-bubble-chart');
    if (!ctx) return;
    if (bubbleChart) bubbleChart.destroy();
    const wl = getEnrichedWorkload();
    const colors = ['#7c3aed','#06b6d4','#ec4899','#f59e0b','#10b981','#8b5cf6','#14b8a6','#ef4444'];

    bubbleChart = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: wl.map((w, i) => ({
          label: w.member?.name,
          data: [{ x: w.assignedHours, y: w.tasks.length, r: Math.max(6, w.idx / 8) }],
          backgroundColor: colors[i % colors.length] + '44',
          borderColor: colors[i % colors.length],
          borderWidth: 2,
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position:'right', labels:{ color:'#94a3b8', font:{size:11}, padding:12 } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw.x}h assigned, ${ctx.raw.y} tasks`
            }
          }
        },
        scales: {
          x: { title:{ display:true, text:'Hours Assigned', color:'#475569' }, ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} },
          y: { title:{ display:true, text:'Task Count', color:'#475569' },     ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} }
        }
      }
    });
  }

  function renderWorkloadBar() {
    const ctx = document.getElementById('ov-bar-chart');
    if (!ctx) return;
    if (barChart) barChart.destroy();
    const wl = getEnrichedWorkload();

    const colors = wl.map(w =>
      w.idx >= 120 ? '#ef4444' : w.idx >= 100 ? '#f59e0b' : w.idx >= 85 ? '#f59e0b' : '#10b981'
    );

    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: wl.map(w => w.member?.name.split(' ')[0]),
        datasets: [
          {
            label: 'Load %',
            data: wl.map(w => w.idx),
            backgroundColor: colors.map(c => c + '44'),
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 8,
          },
          {
            label: 'Capacity (100%)',
            data: wl.map(() => 100),
            type: 'line',
            borderColor: '#06b6d4',
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
          y: {
            title:{ display:true, text:'Workload Index (%)', color:'#475569' },
            ticks:{ color:'#475569', callback: v => v+'%' },
            grid:{color:'rgba(255,255,255,0.04)'},
            max: 160,
          }
        }
      }
    });
  }

  return { render };
})();
