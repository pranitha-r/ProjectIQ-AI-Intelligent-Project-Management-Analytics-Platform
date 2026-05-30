// ============================================================
//  data.js  –  Realistic mock dataset
// ============================================================

const APP_DATA = (() => {

  /* ── Team Members ─────────────────────────────────────── */
  const members = [
    { id: 'm1', name: 'Anika Sharma',    role: 'Frontend Dev',   avatar: 'AS', capacity: 40, skills: ['React','CSS','Testing'] },
    { id: 'm2', name: 'Ben Carter',      role: 'Backend Dev',    avatar: 'BC', capacity: 40, skills: ['Node','Python','SQL'] },
    { id: 'm3', name: 'Chen Wei',        role: 'Full-Stack Dev', avatar: 'CW', capacity: 40, skills: ['React','Node','Docker'] },
    { id: 'm4', name: 'Diana Flores',    role: 'Data Engineer',  avatar: 'DF', capacity: 32, skills: ['Python','Spark','SQL'] },
    { id: 'm5', name: 'Ethan Brooks',    role: 'DevOps',         avatar: 'EB', capacity: 40, skills: ['K8s','CI/CD','AWS'] },
    { id: 'm6', name: 'Fatima Al-Rashid',role: 'QA Engineer',    avatar: 'FR', capacity: 32, skills: ['Selenium','Jest','Cypress'] },
    { id: 'm7', name: 'George Patel',    role: 'Tech Lead',      avatar: 'GP', capacity: 24, skills: ['Architecture','Review','Node'] },
    { id: 'm8', name: 'Hana Kim',        role: 'UI/UX Designer', avatar: 'HK', capacity: 40, skills: ['Figma','CSS','Animation'] },
  ];

  /* ── Projects ─────────────────────────────────────────── */
  const projects = [
    {
      id: 'p1', name: 'Apollo Platform', status: 'active',
      startDate: '2026-01-15', plannedEnd: '2026-07-31', progress: 62,
      budget: 480000, spent: 310000, priority: 'high',
      description: 'Enterprise SaaS platform modernisation'
    },
    {
      id: 'p2', name: 'Nova Mobile App', status: 'active',
      startDate: '2026-02-01', plannedEnd: '2026-06-30', progress: 78,
      budget: 220000, spent: 195000, priority: 'critical',
      description: 'iOS & Android consumer app rewrite'
    },
    {
      id: 'p3', name: 'Data Warehouse v2', status: 'active',
      startDate: '2026-03-01', plannedEnd: '2026-08-15', progress: 41,
      budget: 310000, spent: 140000, priority: 'medium',
      description: 'Next-gen analytics data warehouse'
    },
    {
      id: 'p4', name: 'Security Hardening', status: 'completed',
      startDate: '2025-10-01', plannedEnd: '2026-02-28', progress: 100,
      budget: 95000, spent: 91200, priority: 'high',
      description: 'SOC2 compliance & pen-testing remediation'
    },
  ];

  /* ── Sprints (last 6 + current) ────────────────────────── */
  const sprints = [
    { id: 's1', name: 'Sprint 1', start: '2026-01-15', end: '2026-01-28', planned: 48, completed: 44, velocity: 44, project: 'p1' },
    { id: 's2', name: 'Sprint 2', start: '2026-01-29', end: '2026-02-11', planned: 50, completed: 47, velocity: 47, project: 'p1' },
    { id: 's3', name: 'Sprint 3', start: '2026-02-12', end: '2026-02-25', planned: 52, completed: 52, velocity: 52, project: 'p1' },
    { id: 's4', name: 'Sprint 4', start: '2026-02-26', end: '2026-03-11', planned: 55, completed: 49, velocity: 49, project: 'p1' },
    { id: 's5', name: 'Sprint 5', start: '2026-03-12', end: '2026-03-25', planned: 55, completed: 53, velocity: 53, project: 'p1' },
    { id: 's6', name: 'Sprint 6', start: '2026-03-26', end: '2026-04-08', planned: 58, completed: 55, velocity: 55, project: 'p1' },
    { id: 's7', name: 'Sprint 7', start: '2026-04-09', end: '2026-04-22', planned: 60, completed: 58, velocity: 58, project: 'p1' },
    { id: 's8', name: 'Sprint 8 (Active)', start: '2026-04-23', end: '2026-05-06', planned: 62, completed: 38, velocity: null, project: 'p1' },
  ];

  /* ── Tasks ────────────────────────────────────────────── */
  const tasks = [
    // Apollo Platform – completed
    { id: 't1',  project:'p1', sprint:'s8', title:'Auth service OAuth2 integration', assignee:'m2', status:'done',      storyPoints:8,  estimatedDays:5,  actualDays:5,  complexity:'medium', dependencies:[], dueDate:'2026-04-28', completedDate:'2026-04-27', tags:['backend','security'] },
    { id: 't2',  project:'p1', sprint:'s8', title:'Dashboard redesign – home screen', assignee:'m1', status:'done',      storyPoints:5,  estimatedDays:3,  actualDays:4,  complexity:'low',    dependencies:['t1'], dueDate:'2026-04-30', completedDate:'2026-04-30', tags:['frontend'] },
    { id: 't3',  project:'p1', sprint:'s8', title:'API rate-limiting middleware',     assignee:'m7', status:'done',      storyPoints:3,  estimatedDays:2,  actualDays:2,  complexity:'low',    dependencies:[], dueDate:'2026-04-28', completedDate:'2026-04-28', tags:['backend'] },
    // In Progress
    { id: 't4',  project:'p1', sprint:'s8', title:'Real-time notification engine',    assignee:'m3', status:'in_progress', storyPoints:13, estimatedDays:8,  actualDays:9,  complexity:'high',   dependencies:['t1'], dueDate:'2026-05-04', completedDate:null, tags:['backend','infra'] },
    { id: 't5',  project:'p1', sprint:'s8', title:'Analytics chart components',       assignee:'m1', status:'in_progress', storyPoints:8,  estimatedDays:5,  actualDays:3,  complexity:'medium', dependencies:['t2'], dueDate:'2026-05-05', completedDate:null, tags:['frontend','ui'] },
    { id: 't6',  project:'p1', sprint:'s8', title:'CI/CD pipeline for staging env',   assignee:'m5', status:'in_progress', storyPoints:5,  estimatedDays:3,  actualDays:5,  complexity:'medium', dependencies:[], dueDate:'2026-05-03', completedDate:null, tags:['devops'] },
    // Blocked / At Risk
    { id: 't7',  project:'p1', sprint:'s8', title:'Database sharding implementation', assignee:'m2', status:'blocked',     storyPoints:21, estimatedDays:13, actualDays:17, complexity:'very_high', dependencies:['t3','t4'], dueDate:'2026-05-06', completedDate:null, tags:['backend','database'] },
    { id: 't8',  project:'p1', sprint:'s8', title:'Mobile responsive layout fixes',   assignee:'m8', status:'in_progress', storyPoints:3,  estimatedDays:2,  actualDays:2,  complexity:'low',    dependencies:['t2'], dueDate:'2026-05-05', completedDate:null, tags:['frontend','ux'] },
    { id: 't9',  project:'p1', sprint:'s8', title:'Load testing & performance audit',  assignee:'m6', status:'todo',        storyPoints:8,  estimatedDays:4,  actualDays:0,  complexity:'medium', dependencies:['t7'], dueDate:'2026-05-06', completedDate:null, tags:['qa','performance'] },
    { id: 't10', project:'p1', sprint:'s8', title:'Kubernetes auto-scaling config',    assignee:'m5', status:'todo',        storyPoints:8,  estimatedDays:4,  actualDays:0,  complexity:'high',   dependencies:['t6'], dueDate:'2026-05-06', completedDate:null, tags:['devops','infra'] },
    // Nova Mobile
    { id: 't11', project:'p2', sprint:null, title:'Push notification service',        assignee:'m3', status:'in_progress', storyPoints:8,  estimatedDays:5,  actualDays:6,  complexity:'high',   dependencies:[], dueDate:'2026-05-10', completedDate:null, tags:['mobile','backend'] },
    { id: 't12', project:'p2', sprint:null, title:'Offline-first data sync',          assignee:'m4', status:'in_progress', storyPoints:13, estimatedDays:8,  actualDays:10, complexity:'very_high', dependencies:['t11'], dueDate:'2026-05-15', completedDate:null, tags:['mobile','data'] },
    { id: 't13', project:'p2', sprint:null, title:'App store submission prep',        assignee:'m6', status:'todo',        storyPoints:5,  estimatedDays:3,  actualDays:0,  complexity:'medium', dependencies:['t12'], dueDate:'2026-05-20', completedDate:null, tags:['qa','release'] },
    { id: 't14', project:'p2', sprint:null, title:'UI accessibility audit',           assignee:'m8', status:'done',        storyPoints:5,  estimatedDays:3,  actualDays:3,  complexity:'medium', dependencies:[], dueDate:'2026-04-25', completedDate:'2026-04-25', tags:['ux','accessibility'] },
    // Data Warehouse
    { id: 't15', project:'p3', sprint:null, title:'Spark ETL pipeline v2',            assignee:'m4', status:'in_progress', storyPoints:21, estimatedDays:12, actualDays:14, complexity:'very_high', dependencies:[], dueDate:'2026-06-01', completedDate:null, tags:['data','etl'] },
    { id: 't16', project:'p3', sprint:null, title:'Data lineage tracking',            assignee:'m2', status:'todo',        storyPoints:8,  estimatedDays:5,  actualDays:0,  complexity:'high',   dependencies:['t15'], dueDate:'2026-06-15', completedDate:null, tags:['data'] },
    { id: 't17', project:'p3', sprint:null, title:'BI dashboard integration',         assignee:'m1', status:'todo',        storyPoints:8,  estimatedDays:5,  actualDays:0,  complexity:'medium', dependencies:['t16'], dueDate:'2026-06-30', completedDate:null, tags:['frontend','data'] },
    { id: 't18', project:'p3', sprint:null, title:'Data quality validation suite',    assignee:'m6', status:'in_progress', storyPoints:8,  estimatedDays:5,  actualDays:4,  complexity:'medium', dependencies:['t15'], dueDate:'2026-06-10', completedDate:null, tags:['qa','data'] },
  ];

  /* ── Historical metrics (last 12 weeks) ────────────────── */
  const weeklyMetrics = (() => {
    const weeks = [];
    const base = new Date('2026-03-02');
    const tasksCompleted = [12,15,11,18,14,16,13,17,15,19,14,16];
    const cycleTime      = [4.2,3.8,5.1,3.6,4.0,3.9,4.5,3.7,4.1,3.5,4.3,3.8];
    const bugsOpened     = [3,5,2,4,6,3,5,4,3,2,4,3];
    const bugsClosed     = [2,4,3,3,5,4,4,5,3,3,3,4];
    for (let i = 0; i < 12; i++) {
      const d = new Date(base); d.setDate(d.getDate() + i * 7);
      weeks.push({
        week: `W${i+1}`,
        date: d.toISOString().slice(0,10),
        tasksCompleted: tasksCompleted[i],
        cycleTime: cycleTime[i],
        bugsOpened: bugsOpened[i],
        bugsClosed: bugsClosed[i],
        teamMoodScore: +(3.5 + Math.sin(i*0.8)*0.7 + Math.random()*0.3).toFixed(1),
      });
    }
    return weeks;
  })();

  /* ── Member workload (hours assigned this week) ──────── */
  const workload = [
    { memberId: 'm1', assignedHours: 38, tasks: ['t2','t5','t17'], overdueCount: 0 },
    { memberId: 'm2', assignedHours: 52, tasks: ['t1','t7','t16'], overdueCount: 2 },  // overloaded
    { memberId: 'm3', assignedHours: 55, tasks: ['t4','t11'], overdueCount: 1 },       // overloaded
    { memberId: 'm4', assignedHours: 46, tasks: ['t12','t15'], overdueCount: 1 },      // over capacity (32h)
    { memberId: 'm5', assignedHours: 41, tasks: ['t6','t10'], overdueCount: 1 },       // overloaded
    { memberId: 'm6', assignedHours: 30, tasks: ['t9','t13','t18'], overdueCount: 0 },
    { memberId: 'm7', assignedHours: 22, tasks: ['t3'], overdueCount: 0 },
    { memberId: 'm8', assignedHours: 36, tasks: ['t8','t14'], overdueCount: 0 },
  ];

  /* ── Historical completion stats per member ─────────────── */
  const memberHistory = [
    { memberId:'m1', onTimeRate:0.87, avgSlip:0.5,  totalCompleted:62, avgVelocity:8.2 },
    { memberId:'m2', onTimeRate:0.72, avgSlip:1.8,  totalCompleted:88, avgVelocity:11.4 },
    { memberId:'m3', onTimeRate:0.81, avgSlip:1.1,  totalCompleted:74, avgVelocity:10.1 },
    { memberId:'m4', onTimeRate:0.75, avgSlip:2.1,  totalCompleted:55, avgVelocity:9.3 },
    { memberId:'m5', onTimeRate:0.83, avgSlip:0.9,  totalCompleted:61, avgVelocity:7.8 },
    { memberId:'m6', onTimeRate:0.91, avgSlip:0.3,  totalCompleted:49, avgVelocity:6.5 },
    { memberId:'m7', onTimeRate:0.93, avgSlip:0.2,  totalCompleted:38, avgVelocity:5.1 },
    { memberId:'m8', onTimeRate:0.88, avgSlip:0.4,  totalCompleted:45, avgVelocity:6.9 },
  ];

  /* ── Risk events log ─────────────────────────────────── */
  const riskEvents = [
    { date:'2026-02-10', type:'scope_creep', project:'p1', impact:'medium', description:'3 new features added mid-sprint' },
    { date:'2026-02-25', type:'resource_loss', project:'p1', impact:'high', description:'Key backend dev on leave 2 weeks' },
    { date:'2026-03-05', type:'technical_debt', project:'p2', impact:'medium', description:'Legacy API refactor required' },
    { date:'2026-03-20', type:'external_dependency', project:'p3', impact:'high', description:'Third-party data provider delayed' },
    { date:'2026-04-01', type:'scope_creep', project:'p2', impact:'low', description:'Additional payment gateway integration' },
    { date:'2026-04-15', type:'bug_surge', project:'p1', impact:'medium', description:'Critical security regression in auth' },
    { date:'2026-05-01', type:'blocked_task', project:'p1', impact:'high', description:'DB sharding blocked by infra approval' },
  ];

  return { members, projects, sprints, tasks, weeklyMetrics, workload, memberHistory, riskEvents };
})();
