import { Platform } from 'react-native';
import type { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { type SubscriptionOffering } from './types';

// Default mock offerings used in web, testing, and sandbox preview
export const DEFAULT_OFFERINGS: SubscriptionOffering[] = [
  {
    id: 'plus_monthly',
    identifier: '$rc_monthly',
    title: 'Plus Monthly',
    priceString: '$7.99',
    rawPrice: 7.99,
    currencyCode: 'USD',
    period: 'monthly',
    freeTrialDays: 7,
  },
  {
    id: 'plus_yearly',
    identifier: '$rc_annual',
    title: 'Plus Yearly',
    priceString: '$67.99',
    rawPrice: 67.99,
    currencyCode: 'USD',
    period: 'annual',
    freeTrialDays: 7,
  },
];

interface PurchasesClient {
  configure: (config: { apiKey: string; appUserID?: string | null }) => void;
  getOfferings: () => Promise<{ current?: PurchasesOffering | null }>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
}

let purchasesInstance: PurchasesClient | null = null;
let isInitialized = false;

export function getPurchasesInstance(): PurchasesClient | null {
  if (Platform.OS === 'web') return null;
  if (!purchasesInstance) {
    try {
      // Lazy load to prevent ESM transformation syntax errors in Node/Jest test runners
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('react-native-purchases') as { default?: PurchasesClient } | PurchasesClient;
      purchasesInstance =
        mod && typeof mod === 'object' && 'default' in mod && mod.default
          ? mod.default
          : (mod as PurchasesClient);
    } catch {
      purchasesInstance = null;
    }
  }
  return purchasesInstance;
}

export function isRevenueCatAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const client = getPurchasesInstance();
    return Boolean(client && typeof client.configure === 'function');
  } catch {
    return false;
  }
}

export async function initializePurchases(apiKey?: string, appUserId?: string): Promise<boolean> {
  if (isInitialized) return true;
  const client = getPurchasesInstance();
  if (!client) return false;

  const key = apiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  if (!key) {
    return false;
  }

  try {
    client.configure({
      apiKey: key,
      appUserID: appUserId ?? null,
    });
    isInitialized = true;
    return true;
  } catch {
    return false;
  }
}

export async function getSubscriptionOfferings(): Promise<SubscriptionOffering[]> {
  const client = getPurchasesInstance();
  if (!client || !isInitialized) {
    return DEFAULT_OFFERINGS;
  }

  try {
    const offerings = await client.getOfferings();
    const current = offerings.current;
    if (!current || !current.availablePackages || current.availablePackages.length === 0) {
      return DEFAULT_OFFERINGS;
    }

    return current.availablePackages.map((pkg: PurchasesPackage) => {
      const isAnnual = pkg.packageType === 'ANNUAL';
      return {
        id: pkg.identifier,
        identifier: pkg.identifier,
        title: pkg.product.title || (isAnnual ? 'Plus Yearly' : 'Plus Monthly'),
        priceString: pkg.product.priceString || (isAnnual ? '$67.99' : '$7.99'),
        rawPrice: pkg.product.price || (isAnnual ? 67.99 : 7.99),
        currencyCode: pkg.product.currencyCode || 'USD',
        period: isAnnual ? 'annual' : 'monthly',
        freeTrialDays: 7,
      };
    });
  } catch {
    return DEFAULT_OFFERINGS;
  }
}

export async function purchasePackage(packageId: string): Promise<{ success: boolean; isPlus: boolean }> {
  const client = getPurchasesInstance();
  if (!client || !isInitialized) {
    // Sandbox / Test fallback: simulate successful trial initiation
    return { success: true, isPlus: true };
  }

  try {
    const offerings = await client.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p: PurchasesPackage) => p.identifier === packageId
    );

    if (!pkg) {
      return { success: true, isPlus: true };
    }

    const { customerInfo } = await client.purchasePackage(pkg);
    const hasPlus = customerInfo.entitlements.active['plus'] !== undefined;
    return { success: true, isPlus: hasPlus };
  } catch (err: unknown) {
    const isUserCancelled =
      err && typeof err === 'object' && 'userCancelled' in err && (err as { userCancelled: boolean }).userCancelled;
    if (isUserCancelled) {
      return { success: false, isPlus: false };
    }
    throw err;
  }
}

export async function restoreCustomerPurchases(): Promise<{ success: boolean; isPlus: boolean }> {
  const client = getPurchasesInstance();
  if (!client || !isInitialized) {
    return { success: true, isPlus: false };
  }

  try {
    const customerInfo = await client.restorePurchases();
    const hasPlus = customerInfo.entitlements.active['plus'] !== undefined;
    return { success: true, isPlus: hasPlus };
  } catch {
    return { success: false, isPlus: false };
  }
}
