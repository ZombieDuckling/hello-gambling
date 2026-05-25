import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const logos: { slug: string; logoUrl: string }[] = [
  { slug: "hollywoodbets",     logoUrl: "/assets/logos/hollywoodbets.png" },
  { slug: "betway-sa",         logoUrl: "/assets/logos/betway.png" },
  { slug: "sunbet",            logoUrl: "/assets/logos/sunbet.svg" },
  { slug: "supabets",          logoUrl: "/assets/logos/supabets.webp" },
  { slug: "playabets",         logoUrl: "/assets/logos/playabets.webp" },
  { slug: "sun-international", logoUrl: "/assets/logos/suninternational.png" },
  { slug: "peermont",          logoUrl: "/assets/logos/peermont.png" },
  { slug: "tsogo-sun-gaming",  logoUrl: "/assets/logos/tsogosun.svg" },
  { slug: "10bet-sa",          logoUrl: "/assets/logos/10bet.svg" },
];

async function main() {
  for (const { slug, logoUrl } of logos) {
    await prisma.operator.update({ where: { slug }, data: { logoUrl } });
    console.log(`Updated ${slug}`);
  }
}

main().then(() => prisma.$disconnect()).catch(console.error);
