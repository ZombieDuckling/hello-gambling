import { PrismaClient, UserRole, ComplaintCategory, ComplaintStatus } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const operators = [
  {
    name: "Hollywood Bets",
    slug: "hollywoodbets",
    description: "South Africa's leading sports betting operator with over 50 years of experience.",
    licenseNumber: "NGB-LIC-001",
    website: "https://www.hollywoodbets.net",
    province: "KwaZulu-Natal",
  },
  {
    name: "Betway SA",
    slug: "betway-sa",
    description: "International sports betting brand operating in South Africa under NGB licence.",
    licenseNumber: "NGB-LIC-002",
    website: "https://www.betway.co.za",
    province: "Western Cape",
  },
  {
    name: "SunBet",
    slug: "sunbet",
    description: "Sun International's online betting platform, part of one of SA's largest casino groups.",
    licenseNumber: "NGB-LIC-003",
    website: "https://www.sunbet.co.za",
    province: "Gauteng",
  },
  {
    name: "Supabets",
    slug: "supabets",
    description: "Popular South African betting brand known for competitive odds.",
    licenseNumber: "NGB-LIC-004",
    website: "https://www.supabets.co.za",
    province: "Gauteng",
  },
  {
    name: "Playabets",
    slug: "playabets",
    description: "South African sports betting and casino operator.",
    licenseNumber: "NGB-LIC-005",
    website: "https://www.playabets.co.za",
    province: "Western Cape",
  },
  {
    name: "Sun International",
    slug: "sun-international",
    description: "One of South Africa's largest casino resort groups with properties nationwide.",
    licenseNumber: "GGB-LIC-001",
    website: "https://www.suninternational.com",
    province: "Gauteng",
  },
  {
    name: "Peermont",
    slug: "peermont",
    description: "Hospitality and gaming company operating casinos across southern Africa.",
    licenseNumber: "GGB-LIC-002",
    website: "https://www.peermont.com",
    province: "Gauteng",
  },
  {
    name: "Tsogo Sun Gaming",
    slug: "tsogo-sun",
    description: "South Africa's largest casino operator with over 15 casinos nationwide.",
    licenseNumber: "GGB-LIC-003",
    website: "https://www.tsogosun.com",
    province: "Gauteng",
  },
  {
    name: "10Bet SA",
    slug: "10bet-sa",
    description: "International online sports betting operator with South African licence.",
    licenseNumber: "NGB-LIC-006",
    website: "https://www.10bet.co.za",
    province: "Western Cape",
  },
  {
    name: "Interbet",
    slug: "interbet",
    description: "South African online betting platform focused on horse racing and sports.",
    licenseNumber: "NGB-LIC-007",
    website: "https://www.interbet.co.za",
    province: "Gauteng",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed operators
  const createdOperators: Record<string, string> = {};
  for (const op of operators) {
    const created = await prisma.operator.upsert({
      where: { slug: op.slug },
      update: {},
      create: op,
    });
    createdOperators[op.slug] = created.id;
    console.log(`  ✓ Operator: ${op.name}`);
  }

  // Seed test users
  const consumerPassword = await bcrypt.hash("consumer123", 12);
  const operatorPassword = await bcrypt.hash("operator123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);

  const consumer = await prisma.user.upsert({
    where: { email: "consumer@test.com" },
    update: {},
    create: {
      email: "consumer@test.com",
      name: "Thabo Mokoena",
      password: consumerPassword,
      role: UserRole.CONSUMER,
    },
  });
  console.log("  ✓ Consumer user: consumer@test.com / consumer123");

  const consumer2 = await prisma.user.upsert({
    where: { email: "sipho@test.com" },
    update: {},
    create: {
      email: "sipho@test.com",
      name: "Sipho Dlamini",
      password: consumerPassword,
      role: UserRole.CONSUMER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@hellogambling.co.za" },
    update: {},
    create: {
      email: "admin@hellogambling.co.za",
      name: "Admin User",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log("  ✓ Admin user: admin@hellogambling.co.za / admin123");

  const hwbOperator = await prisma.user.upsert({
    where: { email: "operator@hollywoodbets.com" },
    update: {},
    create: {
      email: "operator@hollywoodbets.com",
      name: "Hollywood Bets Support",
      password: operatorPassword,
      role: UserRole.OPERATOR,
      operatorId: createdOperators["hollywoodbets"],
    },
  });
  console.log("  ✓ Operator user: operator@hollywoodbets.com / operator123");

  await prisma.user.upsert({
    where: { email: "operator@betway.co.za" },
    update: {},
    create: {
      email: "operator@betway.co.za",
      name: "Betway SA Support",
      password: operatorPassword,
      role: UserRole.OPERATOR,
      operatorId: createdOperators["betway-sa"],
    },
  });

  // Seed sample complaints
  const sampleComplaints = [
    {
      title: "Withdrawal pending for 3 weeks - no response from support",
      description:
        "I requested a withdrawal of R5,500 on 2 March 2024. My account is fully FICA verified with all documents submitted. The withdrawal is still showing as 'pending' after 3 weeks. I have contacted support via email 5 times and on live chat twice. Each time I'm told it will be resolved within 24-48 hours but nothing happens. My account details are correct and verified.",
      category: ComplaintCategory.PAYMENT_ISSUES,
      rating: 1,
      status: ComplaintStatus.OPEN,
      userId: consumer.id,
      operatorId: createdOperators["hollywoodbets"],
    },
    {
      title: "Welcome bonus voided without explanation after meeting wagering requirements",
      description:
        "I deposited R1,000 to claim the welcome bonus of R1,000. I met all the wagering requirements (35x) as stated in the terms. When I tried to withdraw, my bonus balance was voided and my account balance showed only R200. The support team said I violated bonus terms but cannot specify which term I violated. I did not use any excluded games.",
      category: ComplaintCategory.BONUS_DISPUTES,
      rating: 1,
      status: ComplaintStatus.IN_PROGRESS,
      userId: consumer2.id,
      operatorId: createdOperators["betway-sa"],
    },
    {
      title: "Account suspended without reason - R12,000 balance locked",
      description:
        "My account was suddenly suspended on 15 March 2024. I have R12,000 in my account that I cannot access. I have been a loyal customer for 3 years with no previous issues. I submitted all FICA documents including ID, proof of address, and source of funds. The suspension email only says 'account under review' with no timeline or explanation.",
      category: ComplaintCategory.ACCOUNT_ISSUES,
      rating: 1,
      status: ComplaintStatus.ESCALATED,
      userId: consumer.id,
      operatorId: createdOperators["sunbet"],
    },
    {
      title: "Self-exclusion request ignored for 2 months",
      description:
        "I submitted a self-exclusion request on 1 February 2024 as I recognised I have a gambling problem. Two months later I can still access my account and continue gambling. I have emailed the responsible gambling team three times. This is a serious issue as I have lost R8,000 since my exclusion request that should have been processed.",
      category: ComplaintCategory.RESPONSIBLE_GAMBLING,
      rating: 1,
      status: ComplaintStatus.OPEN,
      userId: consumer2.id,
      operatorId: createdOperators["supabets"],
    },
    {
      title: "Live casino disconnected mid-game, bet not returned",
      description:
        "During a live blackjack session, the connection dropped during an active hand where I had bet R500. When I reconnected, the hand was marked as lost even though I had 20 points showing. The system should have voided the bet or completed it in my favour. This has happened twice this month totalling R900 in unresolved bets.",
      category: ComplaintCategory.TECHNICAL_ISSUES,
      rating: 2,
      status: ComplaintStatus.RESOLVED,
      userId: consumer.id,
      operatorId: createdOperators["tsogo-sun"],
    },
  ];

  for (const complaint of sampleComplaints) {
    await prisma.complaint.create({ data: complaint });
  }
  console.log(`  ✓ ${sampleComplaints.length} sample complaints created`);

  // Add a response to the in-progress complaint
  const inProgressComplaint = await prisma.complaint.findFirst({
    where: { status: ComplaintStatus.IN_PROGRESS },
  });

  if (inProgressComplaint) {
    await prisma.response.create({
      data: {
        content:
          "Dear Sipho, thank you for bringing this to our attention. We are investigating your account activity in relation to the bonus claim. Our team will review all your gameplay against the bonus terms and conditions. We will provide a full response within 5 business days. We apologise for the inconvenience caused.",
        userId: hwbOperator.id,
        complaintId: inProgressComplaint.id,
        isOfficial: true,
      },
    });
    console.log("  ✓ Sample operator response added");
  }

  // Add a dispute for the escalated complaint
  const escalatedComplaint = await prisma.complaint.findFirst({
    where: { status: ComplaintStatus.ESCALATED },
  });

  if (escalatedComplaint) {
    const year = new Date().getFullYear();
    const refNumber = `HG-${year}-0001`;
    const existing = await prisma.dispute.findUnique({ where: { referenceNumber: refNumber } });
    if (!existing) {
      const dispute = await prisma.dispute.create({
        data: {
          referenceNumber: refNumber,
          stage: "UNDER_REVIEW",
          summary:
            "Consumer's account has been suspended for over 3 weeks with R12,000 balance inaccessible. Operator has not provided reason or timeline for resolution despite multiple contact attempts. Consumer has submitted all required FICA documentation.",
          complaintId: escalatedComplaint.id,
          userId: consumer.id,
        },
      });
      await prisma.disputeUpdate.create({
        data: {
          content:
            "Dispute received and assigned reference number. The Hello, Gambling mediation team has contacted the operator and requested urgent feedback within 5 business days.",
          stage: "UNDER_REVIEW",
          userId: consumer.id,
          disputeId: dispute.id,
        },
      });
      console.log(`  ✓ Sample dispute created: ${refNumber}`);
    } else {
      console.log(`  ✓ Sample dispute already exists: ${refNumber}`);
    }
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest Accounts:");
  console.log("  Consumer:  consumer@test.com / consumer123");
  console.log("  Operator:  operator@hollywoodbets.com / operator123");
  console.log("  Admin:     admin@hellogambling.co.za / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
