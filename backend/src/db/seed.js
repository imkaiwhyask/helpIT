const bcrypt = require('bcryptjs');
const { initDb, getDb } = require('./index');

const SLA = {
  critical: { response: 1, resolution: 4 },
  high:     { response: 4, resolution: 8 },
  medium:   { response: 8, resolution: 24 },
  low:      { response: 24, resolution: 72 },
};

function addHours(date, h) {
  return new Date(new Date(date).getTime() + h * 3600000);
}

function dayAt(daysAgo, hour = 8) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed() {
  await initDb();
  const db = getDb();

  // Clear all tables
  db._db.run('PRAGMA foreign_keys = OFF');
  db._db.run('DELETE FROM ticket_comments');
  db._db.run('DELETE FROM tickets');
  db._db.run('DELETE FROM users');
  db._db.run("DELETE FROM sqlite_sequence WHERE name IN ('users','tickets','ticket_comments')");
  db._db.run('PRAGMA foreign_keys = ON');

  const rawUsers = [
    { name: 'Admin User',   email: 'admin@helpit.local',       pwd: 'admin123', role: 'admin',      dept: 'IT Management',  phone: '+1-555-0100' },
    { name: 'John Doe',     email: 'john.doe@helpit.local',    pwd: 'pass123',  role: 'technician', dept: 'IT Support',     phone: '+1-555-0101' },
    { name: 'Jane Smith',   email: 'jane.smith@helpit.local',  pwd: 'pass123',  role: 'technician', dept: 'Network',        phone: '+1-555-0102' },
    { name: 'Mark Wilson',  email: 'mark.wilson@helpit.local', pwd: 'pass123',  role: 'technician', dept: 'Infrastructure', phone: '+1-555-0103' },
    { name: 'Sarah Lee',    email: 'sarah.lee@helpit.local',   pwd: 'pass123',  role: 'admin',      dept: 'IT Management',  phone: '+1-555-0104' },
    // End users (self-service portal)
    { name: 'Alex Rivera',   email: 'user@helpit.local',          pwd: 'user123', role: 'user', dept: 'Finance',     phone: '+1-555-0200' },
    { name: 'Maya Chen',     email: 'maya.chen@helpit.local',     pwd: 'user123', role: 'user', dept: 'Engineering', phone: '+1-555-0201' },
  ];

  // Each entry: [title, desc, cat, sub, pri, daysAgo, resolvedHours|undefined, assigneeId|null, creatorId]
  // resolvedHours after creation; SLA breach determined automatically
  const ticketDefs = [
    // --- Day -6 | resolved: 3 on-time / 1 breached = 75% ---
    ['Laptop won\'t boot after Windows update',    'User reports BSOD after latest patch.',               'Hardware', 'Laptop/PC',      'high',   6,  6,   2, 1],
    ['Cannot access company email',               'Auth error logging into Outlook.',                    'Software', 'Email/Calendar', 'medium', 6,  8,   3, 1],
    ['Network drive mapping failed (Z:)',          'Error 0x80070035 mapping to file server.',            'Network',  'LAN',            'medium', 6, 30,   4, 1], // BREACH (30h > 24h)
    ['Printer offline in conference room 201',     'HP LaserJet shows offline.',                          'Hardware', 'Printer',        'low',    6, 14,   2, 1],

    // --- Day -5 | 5 resolved on-time = 100% ---
    ['VPN connection dropping every 30 min',       'Remote VPN disconnects; affects WFH users.',          'Network',  'VPN',            'high',   5,  5,   4, 1],
    ['Wireless mouse not responding',              'Tried new batteries, still unresponsive.',             'Hardware', 'Keyboard/Mouse', 'low',    5,  3,   2, 2],
    ['Adobe Acrobat license expired',              'Cannot edit PDFs; license shows expired.',             'Software', 'Other',          'medium', 5, 14,   3, 2],
    ['Cannot access shared folder \\\\srv\\Finance','Permission denied navigating to Finance share.',     'Access',   'Permissions',    'medium', 5, 18,   3, 1],
    ['Second monitor flickering',                  'External display flickers; tried different cables.',   'Hardware', 'Monitor',        'low',    5, 20,   2, 2],

    // --- Day -4 | 3 on-time / 1 breached = 75% ---
    ['CRITICAL: ERP system completely down',       'Production ERP inaccessible; 200+ users affected.',   'Software', 'ERP/CRM',        'critical',4,  3,   4, 1],
    ['Internet connectivity intermittent',         'Internet drops 5-10x/day in east wing.',              'Network',  'Internet',       'high',   4, 10,   4, 3], // BREACH (10h > 8h)
    ['Antivirus alerts on workstation PC-204',     'Repeated warnings about suspicious registry changes.','Software', 'Antivirus',      'high',   4,  7,   3, 2],
    ['Desk phone drops calls immediately',         'Phone rings but drops as soon as answered.',           'Hardware', 'Other',          'medium', 4, 22,   2, 3],

    // --- Day -3 | 4 on-time / 1 breached = 80% ---
    ['New laptop setup for department manager',    'HP EliteBook needs full OS + software setup.',         'Hardware', 'Laptop/PC',      'medium', 3, 20,   2, 1],
    ['User locked out – password reset needed',   'Account locked after 5 failed attempts.',              'Access',   'Password Reset',  'high',   3,  1,   3, 4],
    ['Email attachment limit too low',             'Cannot send emails with attachments > 10 MB.',         'Software', 'Email/Calendar', 'medium', 3, 16,   3, 2],
    ['WiFi authentication failing – 3rd floor',   'Corporate SSID rejects credentials on floor 3.',       'Network',  'WiFi',           'high',   3,  9,   4, 2], // BREACH (9h > 8h)
    ['Slow startup – workstation takes 12 min',    'Machine boots slowly; apps unresponsive at start.',    'Software', 'Windows/macOS',  'low',    3, 28,   2, 3],
    ['Projector HDMI not displaying in Room A',    'Laptop connects but projector shows no signal.',       'Hardware', 'Monitor',        'medium', 3, undefined, 2, 4],

    // --- Day -2 | 4 resolved on-time = 100% ---
    ['Database backup failure – error DB-504',     'Automated nightly backup failed.',                     'Software', 'ERP/CRM',        'critical',2,  2,   4, 1],
    ['Several keyboard keys unresponsive (T,Y,H)', 'Keys stopped working; no liquid damage.',              'Hardware', 'Keyboard/Mouse', 'low',    2, 10,   2, 3],
    ['Remote desktop connection refused',          'RDP from home to office PC returns error 0x204.',      'Network',  'VPN',            'medium', 2, 15,   3, 2],
    ['Visio license request',                      'Engineering needs Visio for project diagrams.',         'Software', 'Other',          'low',    2, 12,   undefined, 5],

    // --- Day -1 | 2 on-time / 1 breached = 67% ---
    ['Teams camera and audio not working',         'Camera disabled in Teams; audio device missing.',      'Software', 'Other',          'high',   1,  5,   3, 2],
    ['Server room temperature alert',              'Monitoring shows 26°C; threshold is 25°C.',            'Hardware', 'Server',         'critical',1,  1.5, 4, 1],
    ['Malware detected on laptop TK-2248',         'Antivirus quarantined 3 files; unusual behavior.',     'Software', 'Antivirus',      'critical',1,  5,   4, 3], // BREACH (5h > 4h)
    ['Outlook calendar not syncing with mobile',   'iOS Calendar shows events 2 days behind Outlook.',    'Software', 'Email/Calendar', 'medium', 1, undefined, 3, 2],
    ['New employee onboarding – 3 accounts',      '3 new starters on Monday need full IT setup.',          'Access',   'User Account',   'medium', 1, undefined, 2, 1],

    // --- Day 0 (Today) | all open ---
    ['Email server not sending outbound mail',     'All outbound email failing; all users affected.',      'Network',  'DNS',            'critical',0, undefined, 4, 1],
    ['Cannot print to floor 3 network printer',   'Jobs sent but nothing prints.',                         'Hardware', 'Printer',        'medium', 0, undefined, undefined, 2],
    ['VPN client setup on new laptop',             'Corporate VPN not installed on replacement machine.',  'Network',  'VPN',            'medium', 0, undefined, 3, 3],
    ['AutoCAD crashes opening files > 50 MB',      'Application freezes then crashes on large files.',     'Software', 'Other',          'high',   0, undefined, undefined, 2],
    ['Access card not opening secured doors',      'New replacement card not activating badge readers.',    'Access',   'Badge/Physical', 'high',   0, undefined, 2, 4],
    ['RAM upgrade request – engineering WS',      'Request to upgrade from 8 GB to 16 GB.',                'Hardware', 'Laptop/PC',      'low',    0, undefined, undefined, 3],
  ];

  db.withTransaction(() => {
    // Insert users
    for (const u of rawUsers) {
      db._db.run(
        'INSERT INTO users (name,email,password_hash,role,department,phone) VALUES (?,?,?,?,?,?)',
        [u.name, u.email, bcrypt.hashSync(u.pwd, 10), u.role, u.dept, u.phone]
      );
    }

    // Insert tickets
    for (const [title, desc, cat, sub, pri, daysAgo, resolvedHours, assignee, creator] of ticketDefs) {
      const hourOffset = 7 + Math.floor(Math.random() * 3);
      const createdAt = daysAgo === 0
        ? addHours(new Date(), -(resolvedHours != null ? resolvedHours + 1 : Math.random() * 5 + 1))
        : dayAt(daysAgo, hourOffset);

      const responseDue  = addHours(createdAt, SLA[pri].response);
      const resolutionDue = addHours(createdAt, SLA[pri].resolution);

      let resolvedAt = null;
      let slaResBreached = 0;
      let status = 'open';

      if (resolvedHours != null) {
        resolvedAt = addHours(createdAt, resolvedHours).toISOString();
        slaResBreached = resolvedAt > resolutionDue.toISOString() ? 1 : 0;
        status = Math.random() > 0.15 ? 'resolved' : 'closed';
      } else if (daysAgo > 0) {
        status = ['in_progress', 'on_hold'][Math.floor(Math.random() * 2)];
      }

      const updatedAt = resolvedAt || addHours(createdAt, 1).toISOString();

      db._db.run(
        `INSERT INTO tickets
          (title,description,category,subcategory,priority,status,assigned_to,created_by,
           created_at,updated_at,resolved_at,response_due,resolution_due,
           sla_response_breached,sla_resolution_breached)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          title, desc, cat, sub, pri, status,
          assignee || null, creator,
          createdAt.toISOString(), updatedAt, resolvedAt,
          responseDue.toISOString(), resolutionDue.toISOString(),
          0, slaResBreached,
        ]
      );

      const res = db._db.exec('SELECT last_insert_rowid()');
      const ticketId = res[0]?.values[0]?.[0];

      if (resolvedHours != null && assignee) {
        const firstReplyAt = addHours(createdAt, Math.min(SLA[pri].response * 0.5, resolvedHours * 0.3));
        db._db.run(
          'INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal,created_at) VALUES (?,?,?,?,?)',
          [ticketId, assignee, 'Acknowledged. Looking into this now.', 0, firstReplyAt.toISOString()]
        );
        db._db.run(
          'INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal,created_at) VALUES (?,?,?,?,?)',
          [ticketId, assignee, 'Issue resolved. Please confirm.', 0, addHours(createdAt, resolvedHours - 0.25).toISOString()]
        );
        db._db.run(
          'INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal,created_at) VALUES (?,?,?,?,?)',
          [ticketId, assignee, `Status changed from "open" to "${status}"`, 1, resolvedAt]
        );
      } else if (daysAgo > 0 && assignee) {
        db._db.run(
          'INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal,created_at) VALUES (?,?,?,?,?)',
          [ticketId, assignee, 'Picked up. Investigating the issue.', 0, addHours(createdAt, 0.5).toISOString()]
        );
      }
    }
  });

  console.log('✓ Database seeded successfully');
  console.log('  Login: admin@helpit.local / admin123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
