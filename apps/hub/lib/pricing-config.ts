export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  duration: string;
  durationDays: number;
  allowedRedemptions: number;
  features: { text: string; included: boolean }[];
  buyUrl: string;
  badgeText: string;
  popular?: boolean;
  originalPrice?: string;
  sellauthProductId?: number;
  sellauthVariantId?: number;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: "$19",
    priceNum: 19,
    duration: "1 week access",
    durationDays: 7,
    allowedRedemptions: 1,
    features: [
      { text: "Full access on iOS or Android", included: true },
      { text: "Access to all wallets", included: true },
      { text: "Unlimited custom balances & tokens", included: true },
      { text: "1 active device", included: true },
      { text: "Priority Telegram support", included: false },
      { text: "Early access to new features", included: false },
    ],
    buyUrl: process.env.NEXT_PUBLIC_SELLAUTH_STARTER_URL || "https://larperwallet.mysellauth.com/product/7-days-access",
    badgeText: "STARTER",
    sellauthProductId: Number(process.env.NEXT_PUBLIC_SELLAUTH_STARTER_PRODUCT_ID || 0),
    sellauthVariantId: Number(process.env.NEXT_PUBLIC_SELLAUTH_STARTER_VARIANT_ID || 0),
  },
  popular: {
    id: "popular",
    name: "Most Popular",
    price: "$49",
    priceNum: 49,
    duration: "1 month access",
    durationDays: 30,
    allowedRedemptions: 1,
    features: [
      { text: "Full access on iOS or Android", included: true },
      { text: "Access to all wallets", included: true },
      { text: "Unlimited custom balances & tokens", included: true },
      { text: "1 active device", included: true },
      { text: "Priority Telegram support", included: true },
      { text: "Early access to new features", included: false },
    ],
    buyUrl: process.env.NEXT_PUBLIC_SELLAUTH_MONTHLY_URL || "https://larperwallet.mysellauth.com/product/1-month-access",
    badgeText: "MOST POPULAR",
    popular: true,
    originalPrice: "$69",
    sellauthProductId: Number(process.env.NEXT_PUBLIC_SELLAUTH_MONTHLY_PRODUCT_ID || 0),
    sellauthVariantId: Number(process.env.NEXT_PUBLIC_SELLAUTH_MONTHLY_VARIANT_ID || 0),
  },
  yearly: {
    id: "yearly",
    name: "Best Value",
    price: "$150",
    priceNum: 150,
    duration: "1 year access",
    durationDays: 365,
    allowedRedemptions: 2,
    features: [
      { text: "Full app access on iOS or Android", included: true },
      { text: "Access to all wallets", included: true },
      { text: "Unlimited custom balances & tokens", included: true },
      { text: "2 active devices", included: true },
      { text: "Priority Telegram support", included: true },
      { text: "Early access to new features", included: true },
    ],
    buyUrl: process.env.NEXT_PUBLIC_SELLAUTH_YEARLY_URL || "https://larperwallet.mysellauth.com/product/1-year-access",
    badgeText: "BEST VALUE",
    originalPrice: "$300",
    sellauthProductId: Number(process.env.NEXT_PUBLIC_SELLAUTH_YEARLY_PRODUCT_ID || 0),
    sellauthVariantId: Number(process.env.NEXT_PUBLIC_SELLAUTH_YEARLY_VARIANT_ID || 0),
  },
};
