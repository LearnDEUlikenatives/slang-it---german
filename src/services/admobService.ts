import { logger } from '../utils/logger';

/**
 * Ad Service - ADS TEMPORARILY DISABLED FOR TESTING
 * All native AdMob plugin calls and listeners are bypassed so you can test
 * the full application functionality without any ad interference, latency, or plugin rejections.
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',
  TEST_REWARDED_AD_UNIT_ID: 'ca-app-pub-3940256099942544/5224354917',
  MIN_AD_INTERVAL_MS: 5000,
  ADS_ENABLED: false, // Flag to easily re-enable ads one by one later
};

/**
 * Checks if AdMob is running (disabled during testing)
 */
export function isNativeAdMobAvailable(): boolean {
  return false;
}

/**
 * Check if cooldown window has passed
 */
export function canShowAd(): { allowed: boolean; reason?: string } {
  return { allowed: false, reason: 'Ads are currently disabled for testing.' };
}

/**
 * Initializes AdMob SDK (Safe No-Op during ad-free testing)
 */
export async function initializeAdMob(): Promise<void> {
  logger.setAdMobPhase('DISABLED_FOR_TESTING');
  logger.admob('ℹ️ AdMob is currently disabled for clean testing. No native ad plugins loaded.');
}

/**
 * Loads and shows the interstitial ad safely (bypassed)
 */
export async function loadAndShowInterstitialAd(_forceTesting = true): Promise<boolean> {
  logger.admob('loadAndShowInterstitialAd skipped (Ads disabled for testing).');
  return false;
}

/**
 * Wrapper for interstitial ads (bypassed)
 */
export async function showGoogleInterstitialAd(_isTesting = true): Promise<boolean> {
  return false;
}

/**
 * Preloads Rewarded Video Ad silently (bypassed)
 */
export async function preloadRewardVideoAd(_isTesting = true): Promise<void> {
  // No-op
}

/**
 * Displays a Rewarded Video Ad (Instantly grants reward during testing without ads)
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  _isTesting = true
): Promise<boolean> {
  logger.admob('Rewarded ad requested: Instantly granting reward for testing mode.');
  try {
    onRewarded();
  } catch (err) {
    logger.error('Error executing onRewarded callback', err);
  }
  return true;
}
