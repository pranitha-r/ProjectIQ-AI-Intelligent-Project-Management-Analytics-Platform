// ============================================================
//  delay.js  –  Feature 2: Predict tasks likely to be delayed
// ============================================================

const DelayPredictor = (() => {

  let delayChart = null;
  let filterProject = 'all';

  function render() {
    renderFilters();
    renderDelayTable();
    renderDelayChart();
  }

  function renderFilters() {
    const sel = document.getElementById('delay-proj-filter');
    if (!sel) return;
    sel.innerHTML = '<option value="all">All Projects</option>';
    APP_DATA.projects.filter(p => p.status === 'active').forEach(p => {
      sel.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    sel.value = filterProject;
    sel.onchange = () => { filterProject = sel.value; render(); };
  }

  function getScoredTasks() {
    let tasks = APP_DATA.tasks.filter(t => t.status !== 'done');
    if (filterProject !== 'all') tasks = tasks.filter(t => t.project === filterProject);
    return tasks.map(t => ({
      ...t,
      score: MLEngine.delayScore(t, APP_DATA.memberHistory, APP_DATA.workload),
      member: APP_DATA.members.find(m => m.id === t.assignee),
      project: APP_DATA.projects.find(p => p.id === t.project),
    })).sort((a, b) => b.score - a.score);
  }

  function riskClass(score) {
    if (score >= 70) return { badge: 'badge-red',   label: 'High Risk',   bar: 'high' };
    if (score >= 40) return { badge: 'badge-amber',  label: 'Medium Risk', bar: 'medium' };
    return              { badge: 'badge-green', label: 'Low Risk',    bar: 'low' };
  }

  function renderDelayTable() {
    const tbody = document.getElementById('delay-table-body');
    if (!tbody) return;
    const scored = getScoredTasks();
    tbody.innerHTML = '';

    scored.forEach((t, idx) => {
      const rc  = riskClass(t.score);
      const slip = t.actualDays > t.estimatedDays
        ? `<span style="color:var(--accent-red);">+${t.actualDays - t.estimatedDays}d</span>`
        : `<span style="color:var(--accent-green);">On est.</span>`;
      const avIdx = APP_DATA.members.findIndex(m => m.id === t.assignee) % 8;
      const statusBadge = {
        in_progress: 'badge-cyan',
        blocked:     'badge-red',
        todo:        'badge-gray',
        done:        'badge-green',
      }[t.status] || 'badge-gray';

      tbody.innerHTML += `
        <tr style="--row-delay: ${idx * 40}ms; animation: fadeSlideIn 0.4s ease both; animation-delay: var(--row-delay);">
          <td>
            <div style="font-weight:600;font-size:13px;">${t.title}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${t.project?.name || ''}</div>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="avatar avatar-sm av-${avIdx}">${t.member?.avatar || '??'}</div>
              <span style="font-size:13px;">${t.member?.name || 'Unassigned'}</span>
            </div>
          </td>
          <td>
            <select class="status-select ${statusBadge}" onchange="DelayPredictor.updateStatus('${t.id}', this.value)">
              <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>todo</option>
              <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>in progress</option>
              <option value="blocked" ${t.status === 'blocked' ? 'selected' : ''}>blocked</option>
              <option value="done" ${t.status === 'done' ? 'selected' : ''}>done</option>
            </select>
          </td>
          <td>
            <div class="risk-meter">
              <div class="risk-bar"><div class="risk-fill ${rc.bar}" style="width:${t.score}%"></div></div>
              <span class="risk-label" style="color:${t.score>=70?'var(--accent-red)':t.score>=40?'var(--accent-amber)':'var(--accent-green)'}">${t.score}%</span>
            </div>
          </td>
          <td><span class="badge ${rc.badge}">${rc.label}</span></td>
          <td style="font-size:13px;">${t.dueDate || 'N/A'}</td>
          <td>${slip}</td>
          <td style="font-size:12px;color:var(--text-muted);">${t.storyPoints} SP</td>
          <td>
            ${t.dependencies.length ? `<span class="tag">${t.dependencies.length} dep</span>` : '<span style="color:var(--text-muted);font-size:12px;">None</span>'}
          </td>
        </tr>`;
    });
  }

  function renderDelayChart() {
    const ctx = document.getElementById('delay-dist-chart');
    if (!ctx) return;
    if (delayChart) delayChart.destroy();

    const scored = getScoredTasks();
    const buckets = [
      { label: 'Low (0–39%)',    count: 0, color: '#10b981' },
      { label: 'Medium (40–69%)', count: 0, color: '#f59e0b' },
      { label: 'High (70%+)',    count: 0, color: '#ef4444' },
    ];
    scored.forEach(t => {
      if (t.score >= 70) buckets[2].count++;
      else if (t.score >= 40) buckets[1].count++;
      else buckets[0].count++;
    });

    delayChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: buckets.map(b => b.label),
        datasets: [{
          data: buckets.map(b => b.count),
          backgroundColor: buckets.map(b => b.color + '33'),
          borderColor: buckets.map(b => b.color),
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { color:'#94a3b8', padding:16, font:{size:12} } }
        }
      }
    });

    // Top-risk summary
    const highRisk = scored.filter(t => t.score >= 70);
    const summaryEl = document.getElementById('delay-summary');
    if (summaryEl) {
      if (highRisk.length) {
        summaryEl.className = 'alert alert-red';
        summaryEl.innerHTML = `<span class="alert-icon">🚨</span>
          <span><strong>${highRisk.length} task(s)</strong> have a delay probability ≥ 70%. Immediate review recommended for: ${highRisk.slice(0,3).map(t => `<strong>${t.title}</strong>`).join(', ')}${highRisk.length > 3 ? ' and more.' : '.'}</span>`;
      } else {
        summaryEl.className = 'alert alert-green';
        summaryEl.innerHTML = `<span class="alert-icon">✅</span> <span>No tasks have critical delay risk. Continue monitoring medium-risk items.</span>`;
      }
    }
  }

  async function updateStatus(taskId, newStatus) {
    const task = APP_DATA.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    showLoader('Updating status...');
    try {
      const actualDays = newStatus === 'done' ? task.estimatedDays : 0;
      await API.updateTaskStatus(taskId, newStatus, actualDays);
      updateBadges();
      render();
      hideLoader();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Error updating status: ' + err.message);
      hideLoader();
    }
  }

  return { render, updateStatus };
})();
