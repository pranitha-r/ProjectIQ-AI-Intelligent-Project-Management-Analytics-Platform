// ============================================================
//  database.js  –  SQLite setup, schema creation, and seeding
// ============================================================

const { DatabaseSync } = require('node:sqlite');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'project-iq.db');

function initDB() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  // ── Schema ────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      startDate TEXT,
      plannedEnd TEXT,
      progress INTEGER DEFAULT 0,
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      avatar TEXT,
      capacity INTEGER DEFAULT 40,
      skills TEXT
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start TEXT,
      end TEXT,
      planned INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      velocity REAL,
      project TEXT,
      FOREIGN KEY(project) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project TEXT,
      sprint TEXT,
      title TEXT NOT NULL,
      assignee TEXT,
      status TEXT DEFAULT 'todo',
      storyPoints INTEGER DEFAULT 1,
      estimatedDays INTEGER DEFAULT 1,
      actualDays INTEGER DEFAULT 0,
      complexity TEXT DEFAULT 'medium',
      dependencies TEXT DEFAULT '[]',
      dueDate TEXT,
      completedDate TEXT,
      tags TEXT DEFAULT '[]',
      FOREIGN KEY(project) REFERENCES projects(id),
      FOREIGN KEY(assignee) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS workload (
      memberId TEXT PRIMARY KEY,
      assignedHours INTEGER DEFAULT 0,
      tasks TEXT DEFAULT '[]',
      overdueCount INTEGER DEFAULT 0,
      FOREIGN KEY(memberId) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS member_history (
      memberId TEXT PRIMARY KEY,
      onTimeRate REAL DEFAULT 0,
      avgSlip REAL DEFAULT 0,
      totalCompleted INTEGER DEFAULT 0,
      avgVelocity REAL DEFAULT 0,
      FOREIGN KEY(memberId) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week TEXT,
      date TEXT,
      tasksCompleted INTEGER DEFAULT 0,
      cycleTime REAL DEFAULT 0,
      bugsOpened INTEGER DEFAULT 0,
      bugsClosed INTEGER DEFAULT 0,
      teamMoodScore REAL DEFAULT 3.5
    );

    CREATE TABLE IF NOT EXISTS risk_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      type TEXT,
      project TEXT,
      impact TEXT DEFAULT 'medium',
      description TEXT,
      FOREIGN KEY(project) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS seeded (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      done INTEGER DEFAULT 0
    );
  `);

  // ── Seed only once ────────────────────────────────────────
  const seeded = db.prepare('SELECT done FROM seeded WHERE id = 1').get();
  if (!seeded || !seeded.done) {
    seedData(db);
    db.prepare('INSERT OR REPLACE INTO seeded (id, done) VALUES (1, 1)').run();
    console.log('✅ Database seeded with initial data.');
  } else {
    console.log('ℹ️  Database already seeded, skipping.');
  }

  return db;
}

function seedData(db) {
  const insert = (table, cols, vals) => {
    const placeholders = cols.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`);
    for (const row of vals) stmt.run(...row);
  };

  insert('projects', ['id','name','status','startDate','plannedEnd','progress','budget','spent','priority','description'], [
    ['p1','Apollo Platform','active','2026-01-15','2026-07-31',62,480000,310000,'high','Enterprise SaaS platform modernisation'],
    ['p2','Nova Mobile App','active','2026-02-01','2026-06-30',78,220000,195000,'critical','iOS & Android consumer app rewrite'],
    ['p3','Data Warehouse v2','active','2026-03-01','2026-08-15',41,310000,140000,'medium','Next-gen analytics data warehouse'],
    ['p4','Security Hardening','completed','2025-10-01','2026-02-28',100,95000,91200,'high','SOC2 compliance & pen-testing remediation'],
  ]);

  insert('members', ['id','name','role','avatar','capacity','skills'], [
    ['m1','Anika Sharma','Frontend Dev','AS',40,'["React","CSS","Testing"]'],
    ['m2','Ben Carter','Backend Dev','BC',40,'["Node","Python","SQL"]'],
    ['m3','Chen Wei','Full-Stack Dev','CW',40,'["React","Node","Docker"]'],
    ['m4','Diana Flores','Data Engineer','DF',32,'["Python","Spark","SQL"]'],
    ['m5','Ethan Brooks','DevOps','EB',40,'["K8s","CI/CD","AWS"]'],
    ['m6','Fatima Al-Rashid','QA Engineer','FR',32,'["Selenium","Jest","Cypress"]'],
    ['m7','George Patel','Tech Lead','GP',24,'["Architecture","Review","Node"]'],
    ['m8','Hana Kim','UI/UX Designer','HK',40,'["Figma","CSS","Animation"]'],
  ]);

  insert('sprints', ['id','name','start','end','planned','completed','velocity','project'], [
    ['s1','Sprint 1','2026-01-15','2026-01-28',48,44,44,'p1'],
    ['s2','Sprint 2','2026-01-29','2026-02-11',50,47,47,'p1'],
    ['s3','Sprint 3','2026-02-12','2026-02-25',52,52,52,'p1'],
    ['s4','Sprint 4','2026-02-26','2026-03-11',55,49,49,'p1'],
    ['s5','Sprint 5','2026-03-12','2026-03-25',55,53,53,'p1'],
    ['s6','Sprint 6','2026-03-26','2026-04-08',58,55,55,'p1'],
    ['s7','Sprint 7','2026-04-09','2026-04-22',60,58,58,'p1'],
    ['s8','Sprint 8 (Active)','2026-04-23','2026-05-06',62,38,null,'p1'],
  ]);

  insert('tasks', ['id','project','sprint','title','assignee','status','storyPoints','estimatedDays','actualDays','complexity','dependencies','dueDate','completedDate','tags'], [
    ['t1','p1','s8','Auth service OAuth2 integration','m2','done',8,5,5,'medium','[]','2026-04-28','2026-04-27','["backend","security"]'],
    ['t2','p1','s8','Dashboard redesign – home screen','m1','done',5,3,4,'low','["t1"]','2026-04-30','2026-04-30','["frontend"]'],
    ['t3','p1','s8','API rate-limiting middleware','m7','done',3,2,2,'low','[]','2026-04-28','2026-04-28','["backend"]'],
    ['t4','p1','s8','Real-time notification engine','m3','in_progress',13,8,9,'high','["t1"]','2026-05-04',null,'["backend","infra"]'],
    ['t5','p1','s8','Analytics chart components','m1','in_progress',8,5,3,'medium','["t2"]','2026-05-05',null,'["frontend","ui"]'],
    ['t6','p1','s8','CI/CD pipeline for staging env','m5','in_progress',5,3,5,'medium','[]','2026-05-03',null,'["devops"]'],
    ['t7','p1','s8','Database sharding implementation','m2','blocked',21,13,17,'very_high','["t3","t4"]','2026-05-06',null,'["backend","database"]'],
    ['t8','p1','s8','Mobile responsive layout fixes','m8','in_progress',3,2,2,'low','["t2"]','2026-05-05',null,'["frontend","ux"]'],
    ['t9','p1','s8','Load testing & performance audit','m6','todo',8,4,0,'medium','["t7"]','2026-05-06',null,'["qa","performance"]'],
    ['t10','p1','s8','Kubernetes auto-scaling config','m5','todo',8,4,0,'high','["t6"]','2026-05-06',null,'["devops","infra"]'],
    ['t11','p2',null,'Push notification service','m3','in_progress',8,5,6,'high','[]','2026-05-10',null,'["mobile","backend"]'],
    ['t12','p2',null,'Offline-first data sync','m4','in_progress',13,8,10,'very_high','["t11"]','2026-05-15',null,'["mobile","data"]'],
    ['t13','p2',null,'App store submission prep','m6','todo',5,3,0,'medium','["t12"]','2026-05-20',null,'["qa","release"]'],
    ['t14','p2',null,'UI accessibility audit','m8','done',5,3,3,'medium','[]','2026-04-25','2026-04-25','["ux","accessibility"]'],
    ['t15','p3',null,'Spark ETL pipeline v2','m4','in_progress',21,12,14,'very_high','[]','2026-06-01',null,'["data","etl"]'],
    ['t16','p3',null,'Data lineage tracking','m2','todo',8,5,0,'high','["t15"]','2026-06-15',null,'["data"]'],
    ['t17','p3',null,'BI dashboard integration','m1','todo',8,5,0,'medium','["t16"]','2026-06-30',null,'["frontend","data"]'],
    ['t18','p3',null,'Data quality validation suite','m6','in_progress',8,5,4,'medium','["t15"]','2026-06-10',null,'["qa","data"]'],
  ]);

  insert('workload', ['memberId','assignedHours','tasks','overdueCount'], [
    ['m1',38,'["t2","t5","t17"]',0],
    ['m2',52,'["t1","t7","t16"]',2],
    ['m3',55,'["t4","t11"]',1],
    ['m4',46,'["t12","t15"]',1],
    ['m5',41,'["t6","t10"]',1],
    ['m6',30,'["t9","t13","t18"]',0],
    ['m7',22,'["t3"]',0],
    ['m8',36,'["t8","t14"]',0],
  ]);

  insert('member_history', ['memberId','onTimeRate','avgSlip','totalCompleted','avgVelocity'], [
    ['m1',0.87,0.5,62,8.2],
    ['m2',0.72,1.8,88,11.4],
    ['m3',0.81,1.1,74,10.1],
    ['m4',0.75,2.1,55,9.3],
    ['m5',0.83,0.9,61,7.8],
    ['m6',0.91,0.3,49,6.5],
    ['m7',0.93,0.2,38,5.1],
    ['m8',0.88,0.4,45,6.9],
  ]);

  const weeks = [];
  const baseDate = new Date('2026-03-02');
  const tasksCompleted = [12,15,11,18,14,16,13,17,15,19,14,16];
  const cycleTime      = [4.2,3.8,5.1,3.6,4.0,3.9,4.5,3.7,4.1,3.5,4.3,3.8];
  const bugsOpened     = [3,5,2,4,6,3,5,4,3,2,4,3];
  const bugsClosed     = [2,4,3,3,5,4,4,5,3,3,3,4];
  for (let i = 0; i < 12; i++) {
    const d = new Date(baseDate); d.setDate(d.getDate() + i * 7);
    weeks.push([
      `W${i+1}`,
      d.toISOString().slice(0,10),
      tasksCompleted[i], cycleTime[i], bugsOpened[i], bugsClosed[i],
      +(3.5 + Math.sin(i*0.8)*0.7).toFixed(1)
    ]);
  }
  insert('weekly_metrics', ['week','date','tasksCompleted','cycleTime','bugsOpened','bugsClosed','teamMoodScore'], weeks);

  insert('risk_events', ['date','type','project','impact','description'], [
    ['2026-02-10','scope_creep','p1','medium','3 new features added mid-sprint'],
    ['2026-02-25','resource_loss','p1','high','Key backend dev on leave 2 weeks'],
    ['2026-03-05','technical_debt','p2','medium','Legacy API refactor required'],
    ['2026-03-20','external_dependency','p3','high','Third-party data provider delayed'],
    ['2026-04-01','scope_creep','p2','low','Additional payment gateway integration'],
    ['2026-04-15','bug_surge','p1','medium','Critical security regression in auth'],
    ['2026-05-01','blocked_task','p1','high','DB sharding blocked by infra approval'],
  ]);
}

module.exports = { initDB };
