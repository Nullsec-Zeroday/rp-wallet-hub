import type { WalletAppId } from "@rp-wallet/types";

export interface WalletLaunchRequest {
  walletAppId: WalletAppId;
  returnTo?: string;
}

export interface WalletLaunchResponse {
  walletAppId: WalletAppId;
  launchUrl: string;
  expiresAt: string;
}

export interface LicenseActivationRequest {
  licenseKey: string;
  deviceId: string;
  email?: string;
}

export interface WalletBootstrapExchangeRequest {
  token: string;
  deviceId: string;
}
