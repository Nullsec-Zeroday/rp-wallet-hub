export const walletHosts = {
  phantom: "app1.larperwallet.com",
  trust: "app2.larperwallet.com",
} as const;

export const apiDefaults = {
  localBaseUrl: "http://localhost:8787",
} satisfies {
  localBaseUrl: string;
};
