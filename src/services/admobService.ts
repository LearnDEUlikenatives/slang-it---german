/**
 * Google AdMob Integration Service
 * Configured with official AdMob App ID & Ad Unit IDs.
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  APP_OPEN_AD_UNIT_ID: 'ca-app-pub-4045089359333252/8011089596',
  // Standard Google AdMob test IDs for sandbox debugging
  TEST_INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
  TEST_APP_OPEN_ID: 'ca-app-pub-3940256099942544/9257395921',
};

let isInitialized = false;

/**
 * Initializes AdMob SDK if running in a native wrapper (Capacitor / Cordova / Android Webview bridge).
 */
export async function initializeAdMob(isTesting = false): Promise<void> {
  if (isInitialized) return;

  try {
    // Check for Capacitor AdMob plugin
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable?.('AdMob')) {
      const { AdMob } = (window as any).Capacitor.Plugins;
      await AdMob.initialize({
        initializeForTesting: isTesting,
      });
      isInitialized = true;
      console.log('✅ Google AdMob Native Plugin initialized successfully.');
      return;
    }

    // Check for Cordova / Phonegap AdMob plugin (window.admob)
    if (typeof window !== 'undefined' && (window as any).admob) {
      isInitialized = true;
      console.log('✅ Google AdMob Cordova Plugin detected.');
      return;
    }

    console.info(
      `ℹ️ Google AdMob running in web/hybrid mode. Ready with App ID: ${ADMOB_CONFIG.APP_ID}`
    );
    isInitialized = true;
  } catch (error) {
    console.warn('Google AdMob initialization error:', error);
  }
}

/**
 * Shows Google Interstitial Ad.
 * Returns true if an ad was displayed and closed, or false if falling back to custom web modal.
 */
export async function showGoogleInterstitialAd(isTesting = false): Promise<boolean> {
  try {
    const adUnitId = isTesting
      ? ADMOB_CONFIG.TEST_INTERSTITIAL_ID
      : ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID;

    // 1. Capacitor AdMob integration
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable?.('AdMob')) {
      const { AdMob } = (window as any).Capacitor.Plugins;
      await AdMob.prepareInterstitial({
        adId: adUnitId,
        isTesting,
      });
      await AdMob.showInterstitial();
      return true;
    }

    // 2. Cordova / standard native bridge
    if (typeof window !== 'undefined' && (window as any).admob?.interstitial) {
      await new Promise<void>((resolve, reject) => {
        (window as any).admob.interstitial.load({ id: adUnitId });
        (window as any).admob.interstitial.show();
        resolve();
      });
      return true;
    }

    // 3. Web / Dev fallback: return false so the UI shows the visual AdMob interstitial container
    return false;
  } catch (error) {
    console.error('Error invoking Google AdMob Interstitial:', error);
    return false;
  }
}

/**
 * Shows Google App Open Ad (e.g. on cold start or app launch).
 */
export async function showGoogleAppOpenAd(isTesting = false): Promise<boolean> {
  try {
    const adUnitId = isTesting
      ? ADMOB_CONFIG.TEST_APP_OPEN_ID
      : ADMOB_CONFIG.APP_OPEN_AD_UNIT_ID;

    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable?.('AdMob')) {
      const { AdMob } = (window as any).Capacitor.Plugins;
      if (AdMob.showAppOpenAd) {
        await AdMob.showAppOpenAd({ adId: adUnitId, isTesting });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn('App Open Ad not supported or failed:', error);
    return false;
  }
}
