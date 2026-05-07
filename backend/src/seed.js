const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Departments ───
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: 'IT' }, update: {}, create: { name: 'IT Department', code: 'IT' } }),
    prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR' } }),
    prisma.department.upsert({ where: { code: 'FIN' }, update: {}, create: { name: 'Finance', code: 'FIN' } }),
    prisma.department.upsert({ where: { code: 'MKT' }, update: {}, create: { name: 'Marketing', code: 'MKT' } }),
    prisma.department.upsert({ where: { code: 'OPS' }, update: {}, create: { name: 'Operations', code: 'OPS' } }),
    prisma.department.upsert({ where: { code: 'ENG' }, update: {}, create: { name: 'Engineering', code: 'ENG' } }),
  ]);
  console.log(`✅ ${departments.length} departments created`);

  // ─── Categories ───
  const categoryData = [
    { name: 'Network Issues', description: 'Network connectivity, WiFi, LAN problems', icon: '🌐' },
    { name: 'Printer Problems', description: 'Printer setup, errors, ink/toner issues', icon: '🖨️' },
    { name: 'Email Issues', description: 'Email access, configuration, delivery issues', icon: '📧' },
    { name: 'Hardware Failure', description: 'Physical device malfunctions', icon: '🖥️' },
    { name: 'Software Installation', description: 'Software install, update, licensing', icon: '💿' },
    { name: 'VPN Access', description: 'VPN setup, connection, authentication', icon: '🔒' },
    { name: 'Password Reset', description: 'Account lockout, password recovery', icon: '🔑' },
    { name: 'Server Issues', description: 'Server downtime, performance, maintenance', icon: '🗄️' },
    { name: 'Security Incident', description: 'Malware, phishing, unauthorized access', icon: '🛡️' },
    { name: 'Other', description: 'General IT support requests', icon: '📋' },
  ];

  const categories = [];
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat
    });
    categories.push(c);
  }
  console.log(`✅ ${categories.length} categories created`);

  // ─── SLA Rules ───
  const slaRules = [
    { name: 'Critical - Default', priority: 'CRITICAL', responseTimeMin: 15, resolveTimeMin: 120, escalateAfterMin: 60 },
    { name: 'High - Default', priority: 'HIGH', responseTimeMin: 30, resolveTimeMin: 480, escalateAfterMin: 240 },
    { name: 'Medium - Default', priority: 'MEDIUM', responseTimeMin: 120, resolveTimeMin: 1440, escalateAfterMin: 720 },
    { name: 'Low - Default', priority: 'LOW', responseTimeMin: 480, resolveTimeMin: 4320, escalateAfterMin: 2880 },
  ];

  for (const rule of slaRules) {
    await prisma.sLARule.upsert({
      where: { id: rule.name },
      update: {},
      create: rule
    }).catch(() => {
      // If upsert fails due to no unique field, try create
      return prisma.sLARule.create({ data: rule }).catch(() => {});
    });
  }
  console.log(`✅ ${slaRules.length} SLA rules created`);

  // ─── Users ───
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const hashedUserPass = await bcrypt.hash('user123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ticketing.com' },
    update: {},
    create: {
      email: 'admin@ticketing.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      departmentId: departments[0].id
    }
  });

  const teamLead = await prisma.user.upsert({
    where: { email: 'teamlead@ticketing.com' },
    update: {},
    create: {
      email: 'teamlead@ticketing.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'Leader',
      role: 'TEAM_LEADER',
      departmentId: departments[0].id
    }
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@ticketing.com' },
    update: {},
    create: {
      email: 'agent1@ticketing.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Agent',
      role: 'AGENT',
      departmentId: departments[0].id
    }
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@ticketing.com' },
    update: {},
    create: {
      email: 'agent2@ticketing.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Tech',
      role: 'AGENT',
      departmentId: departments[0].id
    }
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@ticketing.com' },
    update: {},
    create: {
      email: 'employee@ticketing.com',
      password: hashedUserPass,
      firstName: 'Jane',
      lastName: 'Employee',
      role: 'EMPLOYEE',
      departmentId: departments[1].id
    }
  });

  console.log('✅ 5 users created');
  console.log('   📧 admin@ticketing.com / admin123 (Admin)');
  console.log('   📧 teamlead@ticketing.com / admin123 (Team Leader)');
  console.log('   📧 agent1@ticketing.com / admin123 (Agent)');
  console.log('   📧 agent2@ticketing.com / admin123 (Agent)');
  console.log('   📧 employee@ticketing.com / user123 (Employee)');

  // ─── Sample Tickets ───
  const sampleTickets = [
    { title: 'Cannot connect to WiFi', description: 'My laptop cannot detect the office WiFi network since this morning.', priority: 'HIGH', categoryId: categories[0].id, creatorId: employee.id, assigneeId: agent1.id, status: 'IN_PROGRESS', departmentId: departments[1].id },
    { title: 'Printer not printing', description: 'The printer on 3rd floor is showing offline status and won\'t print.', priority: 'MEDIUM', categoryId: categories[1].id, creatorId: employee.id, status: 'OPEN', departmentId: departments[1].id },
    { title: 'Email sync issue on Outlook', description: 'Outlook is not syncing new emails. Keep getting "disconnected" error.', priority: 'HIGH', categoryId: categories[2].id, creatorId: employee.id, assigneeId: agent2.id, status: 'PENDING', departmentId: departments[1].id },
    { title: 'Need Adobe Photoshop installed', description: 'I need Adobe Photoshop installed for the design project. License is approved.', priority: 'LOW', categoryId: categories[4].id, creatorId: employee.id, status: 'OPEN', departmentId: departments[3].id },
    { title: 'VPN connection drops frequently', description: 'VPN disconnects every 10 minutes when working from home.', priority: 'CRITICAL', categoryId: categories[5].id, creatorId: employee.id, assigneeId: agent1.id, status: 'IN_PROGRESS', departmentId: departments[1].id },
    { title: 'Server response time degradation', description: 'Production server response time has increased to 5+ seconds.', priority: 'CRITICAL', categoryId: categories[7].id, creatorId: teamLead.id, assigneeId: agent1.id, status: 'IN_PROGRESS', departmentId: departments[0].id },
  ];

  let ticketNum = 1;
  for (const ticketData of sampleTickets) {
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + (ticketData.priority === 'CRITICAL' ? 2 : ticketData.priority === 'HIGH' ? 8 : 24));

    await prisma.ticket.create({
      data: {
        ...ticketData,
        ticketNumber: `TKT-${String(ticketNum++).padStart(5, '0')}`,
        slaDeadline
      }
    });
  }
  console.log(`✅ ${sampleTickets.length} sample tickets created`);

  // ─── Sample KB Articles ───
  await prisma.kBArticle.create({
    data: {
      title: 'How to Reset Your VPN Password',
      content: '# VPN Password Reset Guide\n\n1. Go to vpn.company.com/reset\n2. Enter your email address\n3. Click "Send Reset Link"\n4. Check your email and follow the link\n5. Enter your new password\n6. Log in with the new credentials\n\n**Note:** Passwords must be at least 12 characters with uppercase, lowercase, and numbers.',
      categoryTag: 'VPN',
      tags: ['vpn', 'password', 'reset', 'access'],
      authorId: admin.id,
      isPublished: true
    }
  });

  await prisma.kBArticle.create({
    data: {
      title: 'Troubleshooting WiFi Connection Issues',
      content: '# WiFi Troubleshooting\n\n## Quick Fixes\n1. Toggle WiFi off and on\n2. Restart your laptop\n3. Forget the network and reconnect\n4. Check if other devices can connect\n\n## Advanced Steps\n- Run network diagnostics\n- Update WiFi driver\n- Reset network settings\n\nIf none of these work, please submit a ticket.',
      categoryTag: 'Network',
      tags: ['wifi', 'network', 'connectivity', 'troubleshooting'],
      authorId: agent1.id,
      isPublished: true
    }
  });

  console.log('✅ 2 knowledge base articles created');

  // ─── Sample Assets ───
  await prisma.asset.createMany({
    data: [
      { assetTag: 'PC-001', name: 'Dell OptiPlex 7090', type: 'PC', serialNumber: 'DL7090-001', manufacturer: 'Dell', model: 'OptiPlex 7090', status: 'ASSIGNED', assignedToId: employee.id, purchaseDate: new Date('2024-01-15'), warrantyEnd: new Date('2027-01-15') },
      { assetTag: 'LT-001', name: 'ThinkPad X1 Carbon', type: 'Laptop', serialNumber: 'LN-X1C-001', manufacturer: 'Lenovo', model: 'X1 Carbon Gen 11', status: 'ASSIGNED', assignedToId: agent1.id, purchaseDate: new Date('2024-06-01'), warrantyEnd: new Date('2027-06-01') },
      { assetTag: 'PRT-001', name: 'HP LaserJet Pro', type: 'Printer', serialNumber: 'HP-LJ-001', manufacturer: 'HP', model: 'LaserJet Pro M404n', status: 'AVAILABLE', purchaseDate: new Date('2023-03-10'), warrantyEnd: new Date('2026-03-10') },
      { assetTag: 'RTR-001', name: 'Cisco Router 2911', type: 'Router', serialNumber: 'CS-2911-001', manufacturer: 'Cisco', model: '2911', status: 'AVAILABLE' },
      { assetTag: 'SW-001', name: 'Cisco Catalyst 2960', type: 'Switch', serialNumber: 'CS-2960-001', manufacturer: 'Cisco', model: 'Catalyst 2960-X', status: 'AVAILABLE' },
    ]
  });
  console.log('✅ 5 sample assets created');

  console.log('\n🎉 Seed complete!\n');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
