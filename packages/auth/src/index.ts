import type { WalletAppId } from "@rp-wallet/types";

export interface WalletLaunchRequest {
  walletAppId: WalletAppId;
  deviceId?: string;
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

export interface DemoActivationRequest {
  deviceId: string;
}

export interface DemoConfigResponse {
  enabled: boolean;
  durationMinutes: number;
}

export interface WalletBootstrapExchangeRequest {
  token: string;
  deviceId: string;
}
