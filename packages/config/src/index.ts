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
