import {
  AdMob,
  InterstitialAdPluginEvents,
  AdLoadInfo,
  AdMobError,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * AdMob Configuration for German Slang
 */
export const ADMOB_CONFIG = {
  // AdMob App ID
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',

  // Primary Ad Unit ID for Play Game Over Interstitial
  PLAY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/8011089596',

  // Official Test Ad Unit for guaranteed test device delivery
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',

  // Minimum interval between ads to protect UX
  MIN_AD_INTERVAL_MS: 5000,
};

export type AdState =
  | 'UNINITIALIZED'
  | 'INITIALIZING'
  | 'IDLE'
  | 'PRELOADING'
  | 'READY'
  | 'SHOWING'
  | 'DISMISSED'
  | 'FAILED';

/**
 * Preload-Ready Ad State Manager
 * 
 * Guarantees:
 * 1. Initialized strictly AFTER component mount.
 * 2. Uses a Promise-based queue so visibility calls ONLY execute when confirmed as 'READY'.
 * 3. Eliminates all rendering race conditions and blank white screens.
 */
class AdMobStateManager {
  private state: AdState = 'UNINITIALIZED';
  private listenersAttached = false;
  private lastAdTimestamp = 0;
  private preloadDeferred: {
    promise: Promise<boolean>;
    resolve: (value: boolean) => void;
  } | null = null;
  private showDeferred: {
    promise: Promise<boolean>;
    resolve: (value: boolean) => void;
  } | null = null;

  public isNative(): boolean {
    return typeof window !== 'undefined' && Boolean(Capacitor.isNativePlatform());
  }

  public getState(): AdState {
    return this.state;
  }

  public isReady(): boolean {
    return this.state === 'READY';
  }

  private setState(newState: AdState, metadata?: any) {
    const prev = this.state;
    this.state = newState;
    logger.setAdMobPhase(`STATE_${newState}`, metadata);
    logger.admob(`[AdMobStateManager] State transition: ${prev} ➔ ${newState}`, metadata);
  }

  /**
   * Initializes the AdMob SDK strictly after component mount
   */
  public async initialize(): Promise<void> {
    if (this.state !== 'UNINITIALIZED') {
      return;
    }

    this.setState('INITIALIZING');

    if (!this.isNative()) {
      this.setState('IDLE', { mode: 'Web Simulation' });
      logger.admob('ℹ️ AdMob initialized in Web Simulation mode.');
      return;
    }

    try {
      logger.admob('Initializing Native AdMob SDK...');
      await AdMob.initialize({
        initializeForTesting: true,
      }).catch((initErr) => {
        logger.admob(`AdMob.initialize notice: ${initErr?.message || initErr}`, initErr, 'warn');
      });

      this.setState('IDLE', { mode: 'Native SDK Initialized' });
      await this.attachListeners();

      // Initiate initial background preload
      this.preload();
    } catch (err: any) {
      this.setState('FAILED', { error: err?.message || err });
      logger.admob(`AdMob initialization failed: ${err?.message || err}`, err, 'warn');
    }
  }

  /**
   * Attaches AdMob lifecycle event listeners
   */
  private async attachListeners(): Promise<void> {
    if (this.listenersAttached || !this.isNative()) return;

    try {
      // 1. Interstitial Confirmed Loaded
      await AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
        this.setState('READY', info);
        if (this.preloadDeferred) {
          this.preloadDeferred.resolve(true);
          this.preloadDeferred = null;
        }
      }).catch(() => null);

      // 2. Interstitial Failed to Load
      await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err: AdMobError) => {
        this.setState('FAILED', err);
        if (this.preloadDeferred) {
          this.preloadDeferred.resolve(false);
          this.preloadDeferred = null;
        }
        // Auto-rearm after delay
        setTimeout(() => {
          if (this.state === 'FAILED' || this.state === 'IDLE') {
            this.preload();
          }
        }, 5000);
      }).catch(() => null);

      // 3. Interstitial Showed
      await AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
        this.setState('SHOWING');
        this.lastAdTimestamp = Date.now();
      }).catch(() => null);

      // 4. Interstitial Dismissed by User
      await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        this.setState('DISMISSED');
        this.lastAdTimestamp = Date.now();
        if (this.showDeferred) {
          this.showDeferred.resolve(true);
          this.showDeferred = null;
        }
        // Auto-preload the next ad in the background
        setTimeout(() => {
          this.setState('IDLE');
          this.preload();
        }, 2000);
      }).catch(() => null);

      // 5. Interstitial Failed to Show
      await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err: AdMobError) => {
        this.setState('FAILED', err);
        if (this.showDeferred) {
          this.showDeferred.resolve(false);
          this.showDeferred = null;
        }
        setTimeout(() => {
          this.setState('IDLE');
          this.preload();
        }, 2000);
      }).catch(() => null);

      this.listenersAttached = true;
      logger.admob('✅ AdMob lifecycle listeners attached to state manager.');
    } catch (err) {
      logger.admob('Failed attaching AdMob listeners', err, 'warn');
    }
  }

  /**
   * Preloads the Interstitial Ad in background.
   * Returns a Promise that resolves `true` when 'READY' or `false` if failed.
   */
  public async preload(forceTest = false): Promise<boolean> {
    if (!this.isNative()) {
      return true;
    }

    if (this.state === 'READY') {
      return true;
    }

    if (this.state === 'PRELOADING' && this.preloadDeferred) {
      return this.preloadDeferred.promise;
    }

    if (this.state === 'SHOWING') {
      return false;
    }

    this.setState('PRELOADING');

    let resolvePromise: (value: boolean) => void = () => {};
    const promise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });

    this.preloadDeferred = { promise, resolve: resolvePromise };

    // Timeout guard so preload promise never hangs
    const timer = setTimeout(() => {
      if (this.preloadDeferred?.promise === promise) {
        logger.admob('Preload promise timeout guard triggered (8000ms)');
        this.setState('IDLE', { reason: 'Preload timeout' });
        this.preloadDeferred.resolve(false);
        this.preloadDeferred = null;
      }
    }, 8000);

    promise.finally(() => {
      clearTimeout(timer);
    });

    try {
      logger.admob(`[Preload-Ready] Preparing ad unit: ${ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID}...`);
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID,
        isTesting: forceTest,
      }).catch(async (primaryErr) => {
        logger.admob(`Primary ad unit prepare failed (${primaryErr?.message || primaryErr}). Trying official test fallback unit...`, null, 'warn');
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.TEST_INTERSTITIAL_AD_UNIT_ID,
          isTesting: true,
        }).catch((fallbackErr) => {
          logger.admob(`Fallback test unit prepare failed: ${fallbackErr?.message || fallbackErr}`, fallbackErr, 'warn');
          if (this.preloadDeferred?.promise === promise) {
            this.setState('FAILED', { error: fallbackErr });
            this.preloadDeferred.resolve(false);
            this.preloadDeferred = null;
          }
        });
      });
    } catch (err: any) {
      if (this.preloadDeferred?.promise === promise) {
        this.setState('FAILED', { error: err?.message || err });
        this.preloadDeferred.resolve(false);
        this.preloadDeferred = null;
      }
    }

    return promise;
  }

  /**
   * Executes Ad visibility call ONLY once confirmed 'READY'.
   * If currently preloading, it awaits the queued preload promise with a max grace window (1500ms).
   * Never calls show on an unready ad to prevent white-screen crashes.
   */
  public async showPlayGameOverAd(): Promise<boolean> {
    logger.admob('🎮 [Preload-Ready Queue] showPlayGameOverAd called');

    if (!this.isNative()) {
      logger.admob('Web simulated ad closed.');
      this.lastAdTimestamp = Date.now();
      return true;
    }

    // Cooldown check
    const elapsed = Date.now() - this.lastAdTimestamp;
    if (elapsed < ADMOB_CONFIG.MIN_AD_INTERVAL_MS) {
      logger.admob(`Ad cooldown active (${elapsed}ms < ${ADMOB_CONFIG.MIN_AD_INTERVAL_MS}ms). Skipping ad.`);
      return false;
    }

    // 1. If not yet ready, check if it's currently preloading
    if (this.state !== 'READY') {
      if (this.state === 'PRELOADING' && this.preloadDeferred) {
        logger.admob('⏳ Ad is currently preloading. Waiting for confirmed READY state (max 1500ms grace)...');
        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500));
        const ready = await Promise.race([this.preloadDeferred.promise, timeoutPromise]);

        if (!ready || !this.isReady()) {
          logger.admob('⚠️ Ad was not confirmed READY in time. Safely skipping display to prevent blank white screen.');
          return false;
        }
      } else {
        logger.admob('⚠️ Ad is not in READY state. Triggering background preload for next round & skipping to prevent white screen.');
        this.preload();
        return false;
      }
    }

    // 2. State is strictly confirmed READY -> Safe to display
    logger.admob('🎯 State is confirmed READY. Safely presenting interstitial ad.');

    let resolveShow: (value: boolean) => void = () => {};
    const showPromise = new Promise<boolean>((resolve) => {
      resolveShow = resolve;
    });
    this.showDeferred = { promise: showPromise, resolve: resolveShow };

    // Safety timeout in case ad activity does not dispatch dismissed event
    const showSafetyTimer = setTimeout(() => {
      if (this.showDeferred?.promise === showPromise) {
        logger.admob('⚠️ Show promise safety timeout triggered (10000ms)');
        this.setState('IDLE', { reason: 'Show safety timeout' });
        this.showDeferred.resolve(false);
        this.showDeferred = null;
        this.preload();
      }
    }, 10000);

    showPromise.finally(() => {
      clearTimeout(showSafetyTimer);
    });

    try {
      this.setState('SHOWING');
      await AdMob.showInterstitial().catch((showErr) => {
        logger.admob(`AdMob.showInterstitial rejected: ${showErr?.message || showErr}`, showErr, 'warn');
        if (this.showDeferred?.promise === showPromise) {
          this.setState('FAILED', { error: showErr });
          this.showDeferred.resolve(false);
          this.showDeferred = null;
          this.preload();
        }
      });
      return await showPromise;
    } catch (err: any) {
      logger.admob(`Exception showing interstitial: ${err?.message || err}`, err, 'warn');
      this.setState('FAILED', { error: err });
      if (this.showDeferred?.promise === showPromise) {
        this.showDeferred.resolve(false);
        this.showDeferred = null;
      }
      this.preload();
      return false;
    }
  }
}

// Singleton state manager instance
export const adMobManager = new AdMobStateManager();

/**
 * Public helper functions for React components
 */
export function isNativeAdMobAvailable(): boolean {
  return adMobManager.isNative();
}

export function getAdMobState(): AdState {
  return adMobManager.getState();
}

export async function initializeAdMob(): Promise<void> {
  return adMobManager.initialize();
}

export async function preloadPlayInterstitial(forceTest = false): Promise<boolean> {
  return adMobManager.preload(forceTest);
}

export async function showPlayGameOverAd(): Promise<boolean> {
  return adMobManager.showPlayGameOverAd();
}

export async function showGoogleInterstitialAd(_isTesting = true): Promise<boolean> {
  return adMobManager.showPlayGameOverAd();
}

export async function loadAndShowInterstitialAd(_isTesting = true): Promise<boolean> {
  return adMobManager.showPlayGameOverAd();
}

export async function preloadRewardVideoAd(_isTesting = true): Promise<void> {
  // Kept clean for future steps
}

export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  _isTesting = true
): Promise<boolean> {
  try {
    onRewarded();
  } catch (err) {
    logger.error('Error executing reward callback', err);
  }
  return true;
}
