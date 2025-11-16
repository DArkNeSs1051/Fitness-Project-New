// ipaq.ts
export type IpaqCategory = "Beginner" | "Intermediate" | "Advanced";

export interface IpaqInput {
  walkingDays: number;            // 0–7
  walkingMinutesPerDay: number;   // 0–180, ตัดกิจกรรม <10 นาทีออก
  moderateDays: number;           // 0–7
  moderateMinutesPerDay: number;  // 0–180
  vigorousDays: number;           // 0–7
  vigorousMinutesPerDay: number;  // 0–180
  sittingMinutesPerDay?: number;  // optional
}

export interface IpaqResult {
  walkingMETmin: number;
  moderateMETmin: number;
  vigorousMETmin: number;
  totalMETmin: number;
  category: IpaqCategory;
  rationale: string[];
  cleaned: {
    walkingDays: number;
    walkingMinutesPerDay: number;
    moderateDays: number;
    moderateMinutesPerDay: number;
    vigorousDays: number;
    vigorousMinutesPerDay: number;
  };
}

const MET_WALK = 3.3;
const MET_MOD = 4.0;
const MET_VIG = 8.0;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export function scoreIPAQ(input: IpaqInput): IpaqResult {
  // 1) clean days (0–7)
  const wDays = clamp(input.walkingDays || 0, 0, 7);
  const mDays = clamp(input.moderateDays || 0, 0, 7);
  const vDays = clamp(input.vigorousDays || 0, 0, 7);

  // 2) clean minutes: 0–180, ตัด <10 นาทีออก (ตามคู่มือ IPAQ)
  const cleanMin = (x?: number) => {
    let n = Math.max(0, Math.min(x ?? 0, 180));
    if (n > 0 && n < 10) n = 0;
    return n;
  };
  const wMin = cleanMin(input.walkingMinutesPerDay);
  const mMin = cleanMin(input.moderateMinutesPerDay);
  const vMin = cleanMin(input.vigorousMinutesPerDay);

  // 3) คำนวณ MET-min/week
  const walkingMETmin = MET_WALK * wMin * wDays;
  const moderateMETmin = MET_MOD * mMin * mDays;
  const vigorousMETmin = MET_VIG * vMin * vDays;
  const totalMETmin = walkingMETmin + moderateMETmin + vigorousMETmin;

  // 4) จัดหมวดตามคู่มือ IPAQ
  const rationale: string[] = [];
  const totalDays = Math.min(wDays + mDays + vDays, 7);

  // HIGH:
  const highA = vDays >= 3 && totalMETmin >= 1500;
  const highB = totalDays >= 7 && totalMETmin >= 3000;

  if (highA) rationale.push("HIGH: ≥3 days vigorous & ≥1500 MET-min/week");
  if (highB) rationale.push("HIGH: ≥7 days any combination & ≥3000 MET-min/week");

  let category: IpaqCategory | null = null;
  if (highA || highB) category = "Advanced";

  // MODERATE:
  if (!category) {
    const moderateC = vDays >= 3 && vMin >= 20;                         // ≥3 วัน vigorous ≥20 นาที/วัน
    const moderateD = (mDays >= 5 && mMin >= 30) || (wDays >= 5 && wMin >= 30); // ≥5 วัน moderate/เดิน ≥30 นาที/วัน
    const moderateE = totalDays >= 5 && totalMETmin >= 600;             // ≥5 วันรวม & ≥600 MET-min/week

    if (moderateC) rationale.push("MODERATE: ≥3 days vigorous ≥20 min/day");
    if (moderateD) rationale.push("MODERATE: ≥5 days moderate or walking ≥30 min/day");
    if (moderateE) rationale.push("MODERATE: ≥5 days any combination & ≥600 MET-min/week");

    if (moderateC || moderateD || moderateE) category = "Intermediate";
  }

  if (!category) {
    category = "Beginner";
    rationale.push("LOW: does not meet Moderate or High criteria");
  }

  return {
    walkingMETmin,
    moderateMETmin,
    vigorousMETmin,
    totalMETmin,
    category,
    rationale,
    cleaned: {
      walkingDays: wDays,
      walkingMinutesPerDay: wMin,
      moderateDays: mDays,
      moderateMinutesPerDay: mMin,
      vigorousDays: vDays,
      vigorousMinutesPerDay: vMin,
    },
  };
}
