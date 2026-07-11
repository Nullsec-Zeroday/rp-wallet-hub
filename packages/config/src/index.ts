export const walletHosts = {
  phantom: "app1.rpwallet.us",
  trust: "app3.rpwallet.us",
} as const;

export const apiDefaults = {
  localBaseUrl: "http://localhost:8787",
  productionBaseUrl: "https://api.rpwallet.us",
} satisfies {
  localBaseUrl: string;
  productionBaseUrl: string;
};

export const referralBonusDays = {
  starter: 2,
  popular: 7,
  yearly: 30,
} as const;

export function getReferralBonusDays(planId: string) {
  return referralBonusDays[planId as keyof typeof referralBonusDays] || 0;
}
