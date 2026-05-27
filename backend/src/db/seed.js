require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('./index');

// Production guard — set SEED_FORCE=true to bypass (DATA WILL BE WIPED)
if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
  console.error('⛔  Refusing to seed in production.\n    Run with SEED_FORCE=true to override (all data will be destroyed).');
  process.exit(1);
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const dAt = (daysAgo, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
};
const hAgo  = h  => new Date(Date.now() - h  * 3_600_000);
const hFrom = h  => new Date(Date.now() + h  * 3_600_000);

// SLA windows by priority (hours)
const SLA = {
  critical: { response: 1,  resolution: 4  },
  high:     { response: 4,  resolution: 8  },
  medium:   { response: 8,  resolution: 24 },
  low:      { response: 24, resolution: 72 },
};

// Build a resolved/closed ticket object for bulk insert.
// breached=false → resolution_due is 2h AFTER resolved_at (on time)
// breached=true  → resolution_due is 2h BEFORE resolved_at (breached)
const resolvedTicket = ({ title, priority, category, creator, assignee, daysBack, hourOfDay = 10, breached = false }) => {
  const createdAt      = dAt(daysBack + 2, Math.max(6, hourOfDay - 3));
  const resolvedAt     = dAt(daysBack, hourOfDay);
  const responseDue    = new Date(createdAt.getTime()  + SLA[priority].response   * 3_600_000);
  const resolutionDue  = new Date(resolvedAt.getTime() + (breached ? -2 : +2)     * 3_600_000);
  const firstResponseAt = new Date(createdAt.getTime() + 20 * 60_000);
  return {
    title, priority, category,
    status: daysBack <= 1 ? 'resolved' : 'closed',
    created_by: creator, assigned_to: assignee,
    created_at: createdAt, updated_at: resolvedAt,
    resolved_at: resolvedAt,
    response_due: responseDue, resolution_due: resolutionDue,
    first_response_at: firstResponseAt,
    sla_response_breached: false, sla_resolution_breached: breached,
  };
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱  HelpIT demo seed starting…\n');

  // ── Clear ──────────────────────────────────────────────────────────────────
  await prisma.ticketComment.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.kbArticle.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE tickets_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE ticket_comments_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE ticket_attachments_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE kb_articles_id_seq RESTART WITH 1`;

  // ── Users (ids 1–8) ────────────────────────────────────────────────────────
  console.log('  Creating users…');
  const pw = {
    admin: bcrypt.hashSync('Admin@1234', 10),
    tech:  bcrypt.hashSync('Tech@1234',  10),
    user:  bcrypt.hashSync('User@1234',  10),
  };

  await prisma.user.createMany({
    data: [
      { name: 'Admin User',      email: 'admin@helpit.local',          password_hash: pw.admin, role: 'admin',      department: 'IT Management',  must_change_password: false },  // 1
      { name: 'Sarah Thompson',  email: 'sarah.thompson@helpit.local', password_hash: pw.tech,  role: 'technician', department: 'IT Support',      must_change_password: false },  // 2
      { name: 'James Kim',       email: 'james.kim@helpit.local',      password_hash: pw.tech,  role: 'technician', department: 'IT Support',      must_change_password: false },  // 3
      { name: 'Alice Morgan',    email: 'alice.morgan@helpit.local',   password_hash: pw.user,  role: 'user',       department: 'Human Resources', must_change_password: false },  // 4
      { name: 'Bob Johnson',     email: 'bob.johnson@helpit.local',    password_hash: pw.user,  role: 'user',       department: 'Finance',         must_change_password: false },  // 5
      { name: 'Carol White',     email: 'carol.white@helpit.local',    password_hash: pw.user,  role: 'user',       department: 'Sales',           must_change_password: false },  // 6
      { name: 'David Lee',       email: 'david.lee@helpit.local',      password_hash: pw.user,  role: 'user',       department: 'Marketing',       must_change_password: false },  // 7
      { name: 'Emma Rodriguez',  email: 'emma.rodriguez@helpit.local', password_hash: pw.user,  role: 'user',       department: 'Operations',      must_change_password: false },  // 8
    ],
  });

  // ── Tickets ────────────────────────────────────────────────────────────────
  // User IDs:  admin=1  sarah=2  james=3  alice=4  bob=5  carol=6  david=7  emma=8
  // Ticket IDs are sequential from 1 (sequences were just reset above)
  //
  // Dashboard targets after seeding:
  //   open=8  in_progress=4  on_hold=2  overdue=3  resolved_today=3
  //   SLA chart: 7-day compliance with realistic dips (75–100%)
  //   by_priority (active only): critical=2 high=4 medium=5 low=3
  //   by_status: open=8 in_progress=4 on_hold=2 resolved=8 closed=29

  console.log('  Creating tickets…');
  await prisma.ticket.createMany({ data: [

    // ── OPEN × 8  (ids 1–8) ──────────────────────────────────────────────────
    {
      title: 'Cannot access VPN from home',
      description: 'Getting "Authentication failed" when connecting with Cisco AnyConnect on Windows 11. Was working fine last week.',
      priority: 'high', category: 'Network', status: 'open',
      created_by: 5, assigned_to: 2,
      created_at: hAgo(52), updated_at: hAgo(50),
      response_due: hAgo(48), resolution_due: hFrom(4),
      first_response_at: hAgo(50), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Laptop display flickering intermittently',
      description: 'Screen flickers every few minutes, especially on battery. Happens on both internal and external display. Dell XPS 15.',
      priority: 'medium', category: 'Hardware', status: 'open',
      created_by: 8, assigned_to: 3,
      created_at: hAgo(26), updated_at: hAgo(25),
      response_due: hAgo(18), resolution_due: hFrom(22),
      first_response_at: hAgo(25), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Outlook crashing on startup',
      description: 'Outlook crashes immediately with "Cannot open the Outlook window." Started after last Tuesday\'s Windows update.',
      priority: 'high', category: 'Software', status: 'open',
      created_by: 6, assigned_to: 2,
      created_at: hAgo(76), updated_at: hAgo(70),
      response_due: hAgo(72), resolution_due: hFrom(8),
      first_response_at: hAgo(74), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Office printer not found on network',
      description: '2nd floor HP LaserJet Pro M404 not showing up when adding a printer. Other users on the same floor print fine.',
      priority: 'low', category: 'Hardware', status: 'open',
      created_by: 7, assigned_to: null,
      created_at: hAgo(100), updated_at: hAgo(100),
      response_due: hAgo(76), resolution_due: hFrom(44),
      first_response_at: null, sla_response_breached: true, sla_resolution_breached: false,
    },
    {
      title: 'New employee onboarding — account setup needed',
      description: 'New team member starting Monday (Michael Chen, Finance). Needs Microsoft 365, Slack, CRM access, and a provisioned laptop.',
      priority: 'medium', category: 'Account', status: 'open',
      created_by: 4, assigned_to: 3,
      created_at: hAgo(48), updated_at: hAgo(46),
      response_due: hAgo(40), resolution_due: hFrom(26),
      first_response_at: hAgo(47), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Slow internet in Conference Room B',
      description: 'Speed in Conference Room B has been around 2 Mbps for the past week vs the usual 100+ Mbps. Severely affecting video calls.',
      priority: 'medium', category: 'Network', status: 'open',
      created_by: 5, assigned_to: null,
      created_at: hAgo(130), updated_at: hAgo(130),
      response_due: hAgo(122), resolution_due: hAgo(106),           // OVERDUE
      first_response_at: null, sla_response_breached: true, sla_resolution_breached: false,
    },
    {
      title: 'Excel pivot tables not refreshing',
      description: '"Data connection cannot be refreshed" error on all Q4 budget workbooks connected to the SQL data source.',
      priority: 'low', category: 'Software', status: 'open',
      created_by: 6, assigned_to: null,
      created_at: hAgo(154), updated_at: hAgo(154),
      response_due: hAgo(130), resolution_due: hAgo(82),            // OVERDUE
      first_response_at: null, sla_response_breached: true, sla_resolution_breached: false,
    },
    {
      title: 'USB-C dock not charging laptop',
      description: 'Brand new CalDigit TS4 dock arrived. Video and data work fine but it is not charging. Tried different cables and outlets.',
      priority: 'critical', category: 'Hardware', status: 'open',
      created_by: 4, assigned_to: 2,
      created_at: hAgo(1), updated_at: hAgo(1),
      response_due: hFrom(0.5), resolution_due: hFrom(3),
      first_response_at: null, sla_response_breached: false, sla_resolution_breached: false,
    },

    // ── IN PROGRESS × 4  (ids 9–12) ──────────────────────────────────────────
    {
      title: 'SharePoint team folder — permission denied',
      description: 'Cannot access "Sales Q4 Reports" folder. Getting Access Denied even though I was added to the Sales team last month.',
      priority: 'high', category: 'Software', status: 'in_progress',
      created_by: 6, assigned_to: 2,
      created_at: hAgo(30), updated_at: hAgo(5),
      response_due: hAgo(26), resolution_due: hFrom(2),
      first_response_at: hAgo(29), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Keyboard replacement — keys sticking after spill',
      description: 'Laptop keyboard (W A S D keys) is sticky after a coffee spill. Replacement keyboard ordered.',
      priority: 'low', category: 'Hardware', status: 'in_progress',
      created_by: 8, assigned_to: 3,
      created_at: hAgo(20), updated_at: hAgo(3),
      response_due: hAgo(4), resolution_due: hFrom(52),
      first_response_at: hAgo(19), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Email signature not syncing on Outlook Mobile',
      description: 'Corporate signature (logo + legal text) shows on desktop but not on Outlook iOS. Signature is configured in Exchange admin.',
      priority: 'medium', category: 'Software', status: 'in_progress',
      created_by: 7, assigned_to: 2,
      created_at: hAgo(60), updated_at: hAgo(10),
      response_due: hAgo(52), resolution_due: hAgo(36),            // OVERDUE
      first_response_at: hAgo(59), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Network switch firmware update — security patch',
      description: 'CVE-2024-20397 affects the Cisco Catalyst 2960-X on Floor 3. Maintenance window scheduled tonight 23:00–01:00.',
      priority: 'critical', category: 'Network', status: 'in_progress',
      created_by: 1, assigned_to: 3,
      created_at: hAgo(10), updated_at: hAgo(2),
      response_due: hAgo(9), resolution_due: hFrom(6),
      first_response_at: hAgo(9.5), sla_response_breached: false, sla_resolution_breached: false,
    },

    // ── ON HOLD × 2  (ids 13–14) ─────────────────────────────────────────────
    {
      title: 'New monitors — awaiting hardware delivery',
      description: 'PO-2024-1128: 4× Dell 27" 4K monitors ordered. Tracking shows delivery expected Tuesday. On hold until hardware arrives.',
      priority: 'high', category: 'Hardware', status: 'on_hold',
      created_by: 4, assigned_to: 3,
      created_at: hAgo(72), updated_at: hAgo(48),
      response_due: hAgo(68), resolution_due: hFrom(48),
      first_response_at: hAgo(71), sla_response_breached: false, sla_resolution_breached: false,
      on_hold_since: hAgo(48),
    },
    {
      title: 'Adobe Creative Cloud licence — pending approval',
      description: 'Licence request submitted to department head for budget approval. On hold pending sign-off.',
      priority: 'medium', category: 'Software', status: 'on_hold',
      created_by: 7, assigned_to: 2,
      created_at: hAgo(30), updated_at: hAgo(24),
      response_due: hAgo(22), resolution_due: hFrom(18),
      first_response_at: hAgo(29), sla_response_breached: false, sla_resolution_breached: false,
      on_hold_since: hAgo(24),
    },

    // ── CLOSED — Day -6  (75% SLA: 4 tickets, 1 breached) ────────────────────
    resolvedTicket({ title: 'Office 365 password reset',              priority: 'low',    category: 'Account',  creator: 5, assignee: 2, daysBack: 6, hourOfDay: 9,  breached: false }),  // 15
    resolvedTicket({ title: 'Mouse double-clicking unintentionally',  priority: 'low',    category: 'Hardware', creator: 8, assignee: 3, daysBack: 6, hourOfDay: 11, breached: false }),  // 16
    resolvedTicket({ title: 'Wi-Fi dropping every 30 minutes',       priority: 'medium', category: 'Network',  creator: 6, assignee: 2, daysBack: 6, hourOfDay: 14, breached: false }),  // 17
    resolvedTicket({ title: 'VPN timeout errors during peak hours',   priority: 'medium', category: 'Network',  creator: 7, assignee: 3, daysBack: 6, hourOfDay: 16, breached: true  }),  // 18

    // ── CLOSED — Day -5  (80% SLA: 5 tickets, 1 breached) ────────────────────
    resolvedTicket({ title: 'Printer jam — 3rd floor HP LaserJet',               priority: 'low',    category: 'Hardware', creator: 5, assignee: 3, daysBack: 5, hourOfDay: 9,  breached: false }),  // 19
    resolvedTicket({ title: 'Teams video call echo and feedback loop',            priority: 'medium', category: 'Software', creator: 4, assignee: 2, daysBack: 5, hourOfDay: 11, breached: false }),  // 20
    resolvedTicket({ title: 'Active Directory account locked out',                priority: 'medium', category: 'Account',  creator: 8, assignee: 2, daysBack: 5, hourOfDay: 14, breached: false }),  // 21
    resolvedTicket({ title: 'BSOD on startup after Windows update KB5034441',     priority: 'high',   category: 'Software', creator: 6, assignee: 3, daysBack: 5, hourOfDay: 15, breached: true  }),  // 22
    resolvedTicket({ title: 'USB drive not visible in File Explorer',             priority: 'low',    category: 'Hardware', creator: 7, assignee: 2, daysBack: 5, hourOfDay: 16, breached: false }),  // 23

    // ── CLOSED — Day -4  (100% SLA: 6 tickets, 0 breached) ───────────────────
    resolvedTicket({ title: 'Password reset for HR portal',               priority: 'low',    category: 'Account',  creator: 4, assignee: 3, daysBack: 4, hourOfDay: 9,  breached: false }),  // 24
    resolvedTicket({ title: 'Monitor wrong resolution after docking',     priority: 'low',    category: 'Hardware', creator: 5, assignee: 2, daysBack: 4, hourOfDay: 10, breached: false }),  // 25
    resolvedTicket({ title: 'Slack notifications silent after update',    priority: 'medium', category: 'Software', creator: 7, assignee: 2, daysBack: 4, hourOfDay: 12, breached: false }),  // 26
    resolvedTicket({ title: 'Scanner not working after driver update',    priority: 'medium', category: 'Hardware', creator: 8, assignee: 3, daysBack: 4, hourOfDay: 13, breached: false }),  // 27
    resolvedTicket({ title: 'VPN throughput under 5 Mbps',               priority: 'medium', category: 'Network',  creator: 5, assignee: 2, daysBack: 4, hourOfDay: 15, breached: false }),  // 28
    resolvedTicket({ title: 'New user account — Sales intern',           priority: 'medium', category: 'Account',  creator: 1, assignee: 3, daysBack: 4, hourOfDay: 16, breached: false }),  // 29

    // ── CLOSED — Day -3  (75% SLA: 4 tickets, 1 breached) ────────────────────
    resolvedTicket({ title: 'Laptop overheating and shutting down',       priority: 'high',     category: 'Hardware', creator: 6, assignee: 3, daysBack: 3, hourOfDay: 10, breached: false }),  // 30
    resolvedTicket({ title: 'SQL Server connection refused — Finance DB', priority: 'critical', category: 'Software', creator: 5, assignee: 2, daysBack: 3, hourOfDay: 14, breached: true  }),  // 31
    resolvedTicket({ title: 'Cannot log in to CRM after password change', priority: 'high',     category: 'Software', creator: 8, assignee: 3, daysBack: 3, hourOfDay: 15, breached: false }),  // 32
    resolvedTicket({ title: 'Loose network cable — office 4B',           priority: 'low',      category: 'Network',  creator: 7, assignee: 2, daysBack: 3, hourOfDay: 16, breached: false }),  // 33

    // ── CLOSED — Day -2  (75% SLA: 8 tickets, 2 breached) ────────────────────
    resolvedTicket({ title: 'Email mailbox quota exceeded',                   priority: 'medium',   category: 'Software', creator: 4, assignee: 2, daysBack: 2, hourOfDay: 9,  breached: false }),  // 34
    resolvedTicket({ title: 'BIOS password forgotten — cannot boot',          priority: 'high',     category: 'Hardware', creator: 8, assignee: 3, daysBack: 2, hourOfDay: 10, breached: true  }),  // 35
    resolvedTicket({ title: 'Shared drive access — Project Apollo folder',    priority: 'low',      category: 'Account',  creator: 6, assignee: 2, daysBack: 2, hourOfDay: 11, breached: false }),  // 36
    resolvedTicket({ title: 'Boardroom AV system down — no display output',   priority: 'critical', category: 'Hardware', creator: 1, assignee: 3, daysBack: 2, hourOfDay: 13, breached: true  }),  // 37
    resolvedTicket({ title: 'Chrome extensions causing slowdowns',            priority: 'low',      category: 'Software', creator: 7, assignee: 2, daysBack: 2, hourOfDay: 14, breached: false }),  // 38
    resolvedTicket({ title: 'Antivirus definitions update failing silently',  priority: 'medium',   category: 'Software', creator: 5, assignee: 3, daysBack: 2, hourOfDay: 15, breached: false }),  // 39
    resolvedTicket({ title: 'VoIP desk phone — no dial tone',                priority: 'medium',   category: 'Network',  creator: 8, assignee: 2, daysBack: 2, hourOfDay: 16, breached: false }),  // 40
    resolvedTicket({ title: 'Excel macro blocked by security policy',         priority: 'low',      category: 'Software', creator: 6, assignee: 3, daysBack: 2, hourOfDay: 17, breached: false }),  // 41

    // ── RESOLVED — Day -1  (100% SLA: 5 tickets, 0 breached) ─────────────────
    resolvedTicket({ title: 'HDMI adapter not outputting audio',               priority: 'low',    category: 'Hardware', creator: 7, assignee: 2, daysBack: 1, hourOfDay: 9,  breached: false }),  // 42
    resolvedTicket({ title: 'Password change prompt looping at login',         priority: 'medium', category: 'Account',  creator: 5, assignee: 3, daysBack: 1, hourOfDay: 11, breached: false }),  // 43
    resolvedTicket({ title: 'Teams presence status stuck on Away',             priority: 'low',    category: 'Software', creator: 4, assignee: 2, daysBack: 1, hourOfDay: 13, breached: false }),  // 44
    resolvedTicket({ title: 'IE compatibility mode needed for legacy portal',  priority: 'low',    category: 'Software', creator: 8, assignee: 3, daysBack: 1, hourOfDay: 14, breached: false }),  // 45
    resolvedTicket({ title: 'Wireless keyboard intermittent disconnects',      priority: 'low',    category: 'Hardware', creator: 6, assignee: 2, daysBack: 1, hourOfDay: 16, breached: false }),  // 46

    // ── RESOLVED — Today  (100% SLA: 3 tickets — these count in resolved_today) ──
    resolvedTicket({ title: 'Email delivery delays — 2-hour lag',              priority: 'medium', category: 'Software', creator: 5, assignee: 2, daysBack: 0, hourOfDay: 9,  breached: false }),  // 47
    resolvedTicket({ title: 'MacBook cannot connect to office printer',        priority: 'medium', category: 'Hardware', creator: 4, assignee: 3, daysBack: 0, hourOfDay: 11, breached: false }),  // 48
    resolvedTicket({ title: 'VPN certificate expired — users locked out',      priority: 'high',   category: 'Network',  creator: 1, assignee: 2, daysBack: 0, hourOfDay: 13, breached: false }),  // 49

    // ── CLOSED — pre-window (older than 7 days, don't appear in SLA chart) ────
    {
      title: 'Old laptop data wipe and decommission',
      description: 'Former employee laptop needs secure wipe before redistribution.',
      priority: 'low', category: 'Hardware', status: 'closed',
      created_by: 1, assigned_to: 3,
      created_at: dAt(14), updated_at: dAt(10), resolved_at: dAt(10),
      response_due: dAt(13, 14), resolution_due: dAt(11, 14),
      first_response_at: dAt(14, 9), sla_response_breached: false, sla_resolution_breached: false,
    },
    {
      title: 'Server room network recabling — Cat6A upgrade',
      description: 'Replace aging Cat5e cabling with Cat6A. Scheduled maintenance.',
      priority: 'medium', category: 'Network', status: 'closed',
      created_by: 1, assigned_to: 2,
      created_at: dAt(20), updated_at: dAt(15), resolved_at: dAt(15),
      response_due: dAt(19, 14), resolution_due: dAt(16, 14),
      first_response_at: dAt(20, 10), sla_response_breached: false, sla_resolution_breached: false,
    },
  ]});

  // ── Comments ────────────────────────────────────────────────────────────────
  console.log('  Creating comments…');
  await prisma.ticketComment.createMany({ data: [

    // Ticket 1 — VPN (shows troubleshooting conversation)
    { ticket_id: 1, user_id: 2, content: 'Hi Bob, I\'ve checked the VPN logs. Are you seeing error code 2 or error code 29 in the AnyConnect window?', created_at: hAgo(50) },
    { ticket_id: 1, user_id: 5, content: 'It shows "Secure Gateway has rejected the connection attempt" with error code 2.', created_at: hAgo(49) },
    { ticket_id: 1, user_id: 2, content: 'That\'s a certificate issue. I\'ll push a new VPN profile to your machine — try reconnecting in about 10 minutes.', created_at: hAgo(48.5) },

    // Ticket 3 — Outlook crashing (full resolution thread)
    { ticket_id: 3, user_id: 2, content: 'Hi Carol, please try opening Outlook in safe mode: hold Ctrl when clicking the icon. Does it open?', created_at: hAgo(74) },
    { ticket_id: 3, user_id: 6, content: 'Yes, it opens fine in safe mode!', created_at: hAgo(73) },
    { ticket_id: 3, user_id: 2, content: 'Good — that confirms a faulty add-in. Disabling all add-ins via Group Policy now. Please try opening Outlook normally.', created_at: hAgo(72.5) },
    { ticket_id: 3, user_id: 6, content: 'It\'s open! Which add-in was the problem?', created_at: hAgo(71) },
    { ticket_id: 3, user_id: 2, content: 'The Teams Meeting add-in — known bug with last week\'s update. Fix has been pushed to all affected machines.', created_at: hAgo(70) },

    // Ticket 8 — Critical USB-C dock
    { ticket_id: 8, user_id: 2, content: 'On it. Is the dock\'s power LED lit? And which laptop model are you using?', created_at: hAgo(0.8) },

    // Ticket 9 — SharePoint permissions (investigation thread)
    { ticket_id: 9, user_id: 2, content: 'Hi Carol, your account was added to the wrong SharePoint group. I\'ve moved you to "Sales - Full Access". Please try again.', created_at: hAgo(29) },
    { ticket_id: 9, user_id: 6, content: 'Still getting access denied I\'m afraid.', created_at: hAgo(20) },
    { ticket_id: 9, user_id: 2, content: 'SharePoint permissions can take up to 24h to propagate. I\'ve forced a manual sync — should resolve within the hour.', created_at: hAgo(19) },
    { ticket_id: 9, user_id: 2, content: 'Found the root cause — the folder has unique permissions overriding the group. Fixing that now.', is_internal: true, created_at: hAgo(5) },

    // Ticket 11 — Email signature (overdue, escalating)
    { ticket_id: 11, user_id: 2, content: 'Hi David, Outlook Mobile uses the server-side signature set in Exchange, not the client-side one. I\'ll configure it there.', created_at: hAgo(59) },
    { ticket_id: 11, user_id: 7, content: 'Thanks Sarah. Any estimate? This is impacting client-facing emails.', created_at: hAgo(40) },
    { ticket_id: 11, user_id: 2, content: 'Apologies for the delay — the Exchange transport rule change needs a maintenance window. Scheduling for tonight 22:00.', created_at: hAgo(10) },

    // Ticket 12 — Critical network switch
    { ticket_id: 12, user_id: 3, content: 'Vulnerability confirmed. Maintenance window tonight 23:00–01:00. Floor 3 will have ~15 min network interruption. Notifying users now.', created_at: hAgo(9) },
    { ticket_id: 12, user_id: 1, content: 'Approved. Confirm when patching is complete.', is_internal: true, created_at: hAgo(8) },
    { ticket_id: 12, user_id: 3, content: 'Heads up: I\'ll also update the IOS config backup while in maintenance mode.', is_internal: true, created_at: hAgo(3) },

    // Ticket 13 — On hold: monitors
    { ticket_id: 13, user_id: 3, content: 'Order placed with our hardware supplier. Tracking number: DHL-7829461. Expected delivery Tuesday.', created_at: hAgo(70) },
    { ticket_id: 13, user_id: 4, content: 'Thanks James, I\'ll keep an eye out. The team is sharing one monitor in the meantime.', created_at: hAgo(68) },
  ]});

  // ── KB Articles ─────────────────────────────────────────────────────────────
  console.log('  Creating knowledge base articles…');
  await prisma.kbArticle.createMany({ data: [
    {
      title: 'How to Connect to the Company VPN',
      content: '<h2>Connecting to HelpIT VPN</h2><p>Follow these steps to connect using Cisco AnyConnect.</p><h3>Prerequisites</h3><ul><li>Cisco AnyConnect client installed</li><li>Active company account</li><li>MFA app configured</li></ul><h3>Steps</h3><ol><li>Open Cisco AnyConnect</li><li>Enter <strong>vpn.company.com</strong> as the server address</li><li>Click Connect and enter your company email and password</li><li>Approve the MFA push notification</li></ol><h3>Common Errors</h3><p><strong>Authentication failed (error 2):</strong> Your VPN certificate may have expired. Raise a ticket — IT will reissue it within 2 hours.</p><p><strong>Connection timeout:</strong> Check your home internet connection, then try again.</p>',
      category: 'Network', tags: 'vpn,remote work,cisco,anyconnect',
      author_id: 2, is_published: true, visibility: 'public', view_count: 142,
      created_at: dAt(30), updated_at: dAt(5),
    },
    {
      title: 'Setting Up Multi-Factor Authentication (MFA)',
      content: '<h2>MFA Setup Guide</h2><p>MFA is required for all company accounts. We use Microsoft Authenticator.</p><h3>Install the App</h3><p>Download <strong>Microsoft Authenticator</strong> from the App Store or Google Play.</p><h3>Link Your Account</h3><ol><li>Visit <strong>aka.ms/mfasetup</strong> and sign in</li><li>Click Add method → Authenticator app</li><li>Scan the QR code shown on screen</li><li>Enter the 6-digit code to confirm</li></ol><h3>Logging In with MFA</h3><p>You\'ll be prompted for MFA when logging in from a new device or after 90 days. Approve the push notification or type the code from the app.</p>',
      category: 'Account', tags: 'mfa,2fa,security,authenticator',
      author_id: 1, is_published: true, visibility: 'public', view_count: 89,
      created_at: dAt(45), updated_at: dAt(10),
    },
    {
      title: 'Troubleshooting Common Printer Problems',
      content: '<h2>Printer Troubleshooting</h2><h3>Printer Not Found on Network</h3><ol><li>Confirm the printer is powered on and the network light is solid (not blinking)</li><li>Print a configuration page directly from the printer to find its IP address</li><li>On Windows: Settings → Bluetooth &amp; devices → Printers &amp; scanners → Add device</li><li>If not found automatically, click "Add manually" and enter the IP address</li></ol><h3>Print Jobs Stuck in Queue</h3><ol><li>Open Services (Win+R → <code>services.msc</code>)</li><li>Find "Print Spooler" and click Restart</li><li>Navigate to <code>C:\\Windows\\System32\\spool\\PRINTERS</code> and delete all files</li><li>Start Print Spooler again</li></ol><h3>Still Not Working?</h3><p>Raise a ticket with the printer model, room number, and the exact error message shown.</p>',
      category: 'Hardware', tags: 'printer,hardware,troubleshooting,print queue',
      author_id: 3, is_published: true, visibility: 'public', view_count: 203,
      created_at: dAt(60), updated_at: dAt(20),
    },
    {
      title: 'Password Policy and How to Reset Your Password',
      content: '<h2>Password Requirements</h2><ul><li>Minimum 12 characters</li><li>At least one uppercase, one lowercase, one number, one symbol</li><li>Cannot reuse your last 10 passwords</li><li>Expires every 90 days</li></ul><h2>Resetting Your Password</h2><h3>You Know Your Current Password</h3><p>Press <strong>Ctrl+Alt+Del</strong> and choose "Change a password".</p><h3>You Are Locked Out</h3><p>Contact IT Support via the portal or call <strong>ext. 1001</strong>. Resets take under 30 minutes during business hours.</p><h2>Tip: Use a Password Manager</h2><p>We recommend Bitwarden (free) or 1Password to manage strong unique passwords.</p>',
      category: 'Account', tags: 'password,security,account,reset,lockout',
      author_id: 2, is_published: true, visibility: 'public', view_count: 317,
      created_at: dAt(90), updated_at: dAt(15),
    },
    {
      title: 'Microsoft Teams: Tips and Common Fixes',
      content: '<h2>Teams Quick Reference</h2><h3>Status Stuck on Away</h3><p>Right-click the Teams tray icon → Quit, then relaunch Teams.</p><h3>Echo During Calls</h3><p>Use headphones. Echo is caused by laptop speakers picking up your own audio.</p><h3>Camera Not Working</h3><ol><li>Ensure no other app is using the camera (Zoom, etc.)</li><li>Teams Settings → Devices → select the correct camera</li><li>Check Windows: Settings → Privacy → Camera → Allow apps to access your camera</li></ol><h3>Slow or Crashing</h3><p>Clear the cache: close Teams, delete everything in <code>%appdata%\\Microsoft\\Teams\\</code>, then relaunch.</p>',
      category: 'Software', tags: 'teams,microsoft,video calls,collaboration,status',
      author_id: 3, is_published: true, visibility: 'public', view_count: 178,
      created_at: dAt(25), updated_at: dAt(3),
    },
    {
      title: 'Requesting New Software or Hardware',
      content: '<h2>How to Request IT Purchases</h2><p>All software and hardware must be approved by IT before purchase. Do not buy independently.</p><h3>Software Requests</h3><ol><li>Check the approved software list on the intranet (IT → Approved Software)</li><li>If not listed, raise a ticket: software name, version, business justification, and cost</li><li>Your manager will be asked to approve</li><li>Approved software is deployed within 2 business days</li></ol><h3>Hardware Requests</h3><ol><li>Raise a ticket describing what you need and why</li><li>IT will confirm the spec and raise a purchase order</li><li>Delivery is typically 3–7 business days</li><li>IT configures and delivers to your desk</li></ol><h3>Urgent Requests</h3><p>If failed hardware is stopping you working, call IT on <strong>ext. 1001</strong> immediately.</p>',
      category: 'General', tags: 'procurement,hardware,software,request,purchasing',
      author_id: 1, is_published: true, visibility: 'public', view_count: 95,
      created_at: dAt(50), updated_at: dAt(8),
    },
  ]});

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!\n');
  console.log('  Accounts');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  ADMIN        admin@helpit.local              Admin@1234');
  console.log('  TECHNICIAN   sarah.thompson@helpit.local     Tech@1234');
  console.log('  TECHNICIAN   james.kim@helpit.local          Tech@1234');
  console.log('  USER         alice.morgan@helpit.local       User@1234');
  console.log('  USER         bob.johnson@helpit.local        User@1234');
  console.log('  USER         carol.white@helpit.local        User@1234');
  console.log('  USER         david.lee@helpit.local          User@1234');
  console.log('  USER         emma.rodriguez@helpit.local     User@1234');
  console.log('  ─────────────────────────────────────────────────────────\n');
  console.log('  Dashboard');
  console.log('  Open: 8  |  In Progress: 4  |  On Hold: 2  |  Overdue: 3');
  console.log('  Resolved today: 3  |  Total tickets: 51');
  console.log('  SLA chart: 7-day data — 75 / 80 / 100 / 75 / 75 / 100 / 100 %\n');

  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
