/**
 * Diagnostic & Lifecycle Logger for Slang It! German
 * Tracks navigation state transitions, component mounts/unmounts,
 * unhandled promise rejections, and AdMob lifecycle events.
 */

export type LogCategory = 'NAV' | 'ADMOB' | 'RENDER' | 'ERROR' | 'PROMISE' | 'LIFECYCLE' | 'STORAGE';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  admobPhase?: string;
}

export type LogListener = (entry: LogEntry) => void;

class DiagnosticLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 300;
  private listeners: Set<LogListener> = new Set();
  private currentAdmobPhase: string = 'IDLE';
  private lastAdmobPhaseTimestamp: number = Date.now();
  private storageKey = 'slang_it_diagnostic_crash_logs';

  constructor() {
    this.loadPersistedLogs();
    this.initGlobalErrorHandlers();
  }

  private loadPersistedLogs() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.logs = parsed.slice(-50); // Keep last 50 from previous runs
          }
        }
      }
    } catch {}
  }

  private persistCriticalLogs() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Persist recent error and warning logs
        const critical = this.logs.filter(l => l.level === 'error' || l.category === 'ADMOB' || l.category === 'PROMISE').slice(-60);
        localStorage.setItem(this.storageKey, JSON.stringify(critical));
      }
    } catch {}
  }

  private initGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // 1. Global Window Error Listener
    window.addEventListener('error', (event) => {
      const isDuringAdMob = this.currentAdmobPhase !== 'IDLE';
      const details = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorName: event.error?.name,
        errorStack: event.error?.stack,
        isDuringAdMob,
        admobPhase: this.currentAdmobPhase,
        timeSincePhaseChangeMs: Date.now() - this.lastAdmobPhaseTimestamp,
      };

      this.addEntry({
        level: 'error',
        category: isDuringAdMob ? 'ADMOB' : 'ERROR',
        message: `[WINDOW_ERROR] ${event.message || 'Unknown window error'}${isDuringAdMob ? ' (TRIGGERED DURING ADMOB ' + this.currentAdmobPhase + ')' : ''}`,
        details,
      });
    });

    // 2. Global Unhandled Promise Rejection Listener
    window.addEventListener('unhandledrejection', (event) => {
      const isDuringAdMob = this.currentAdmobPhase !== 'IDLE';
      const reason = event.reason;
      let reasonMessage = 'Unknown promise rejection';
      let stack: string | undefined = undefined;

      if (typeof reason === 'string') {
        reasonMessage = reason;
      } else if (reason instanceof Error) {
        reasonMessage = reason.message;
        stack = reason.stack;
      } else if (reason && typeof reason === 'object') {
        try {
          reasonMessage = JSON.stringify(reason);
        } catch {
          reasonMessage = String(reason);
        }
      }

      const details = {
        reason: reasonMessage,
        stack,
        isDuringAdMob,
        admobPhase: this.currentAdmobPhase,
        timeSincePhaseChangeMs: Date.now() - this.lastAdmobPhaseTimestamp,
      };

      this.addEntry({
        level: 'error',
        category: 'PROMISE',
        message: `[UNHANDLED_PROMISE_REJECTION] ${reasonMessage}${isDuringAdMob ? ' (DURING ADMOB: ' + this.currentAdmobPhase + ')' : ''}`,
        details,
      });
    });
  }

  public setAdMobPhase(phase: string, metadata?: any) {
    const prevPhase = this.currentAdmobPhase;
    this.currentAdmobPhase = phase;
    this.lastAdmobPhaseTimestamp = Date.now();

    this.addEntry({
      level: 'info',
      category: 'ADMOB',
      message: `[ADMOB_PHASE_CHANGE] ${prevPhase} ➔ ${phase}`,
      details: metadata,
      admobPhase: phase,
    });
  }

  public getAdMobPhase(): { phase: string; elapsedMs: number } {
    return {
      phase: this.currentAdmobPhase,
      elapsedMs: Date.now() - this.lastAdmobPhaseTimestamp,
    };
  }

  public nav(message: string, details?: any) {
    this.addEntry({
      level: 'info',
      category: 'NAV',
      message: `[NAV] ${message}`,
      details,
    });
  }

  public admob(message: string, details?: any, level: LogLevel = 'info') {
    this.addEntry({
      level,
      category: 'ADMOB',
      message: `[ADMOB] ${message}`,
      details,
      admobPhase: this.currentAdmobPhase,
    });
  }

  public render(component: string, action: 'MOUNT' | 'UNMOUNT' | 'UPDATE' | 'CRASH', details?: any) {
    this.addEntry({
      level: action === 'CRASH' ? 'error' : 'debug',
      category: 'RENDER',
      message: `[${action}] <${component} />`,
      details,
    });
  }

  public lifecycle(message: string, details?: any) {
    this.addEntry({
      level: 'info',
      category: 'LIFECYCLE',
      message: `[LIFECYCLE] ${message}`,
      details,
    });
  }

  public error(message: string, error?: any, details?: any) {
    const errorDetails = {
      message: error?.message || (typeof error === 'string' ? error : undefined),
      name: error?.name,
      stack: error?.stack,
      extra: details,
      admobPhase: this.currentAdmobPhase,
      isDuringAdMob: this.currentAdmobPhase !== 'IDLE',
    };

    this.addEntry({
      level: 'error',
      category: 'ERROR',
      message: `[ERROR] ${message}`,
      details: errorDetails,
    });
  }

  public warn(message: string, details?: any) {
    this.addEntry({
      level: 'warn',
      category: 'GENERAL' as any,
      message: `[WARN] ${message}`,
      details,
    });
  }

  public info(message: string, details?: any) {
    this.addEntry({
      level: 'info',
      category: 'GENERAL' as any,
      message: `[INFO] ${message}`,
      details,
    });
  }

  private addEntry(entry: Omit<LogEntry, 'id' | 'timestamp' | 'timeStr'> & { timestamp?: number }) {
    const timestamp = entry.timestamp || Date.now();
    const date = new Date(timestamp);
    const timeStr = `${date.toTimeString().split(' ')[0]}.${String(date.getMilliseconds()).padStart(3, '0')}`;

    const fullEntry: LogEntry = {
      ...entry,
      id: `log_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      timeStr,
      admobPhase: entry.admobPhase || this.currentAdmobPhase,
    };

    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console mirror with category color indicator
    const prefix = `[${fullEntry.timeStr}] [${fullEntry.category}]`;
    if (fullEntry.level === 'error') {
      console.error(prefix, fullEntry.message, fullEntry.details || '');
    } else if (fullEntry.level === 'warn') {
      console.warn(prefix, fullEntry.message, fullEntry.details || '');
    } else {
      console.log(prefix, fullEntry.message, fullEntry.details || '');
    }

    // Persist critical logs if error
    if (fullEntry.level === 'error' || fullEntry.category === 'PROMISE') {
      this.persistCriticalLogs();
    }

    // Notify active subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(fullEntry);
      } catch (err) {
        console.warn('Error in log listener:', err);
      }
    });
  }

  public getLogs(categoryFilter?: LogCategory): LogEntry[] {
    if (!categoryFilter) return [...this.logs];
    return this.logs.filter((l) => l.category === categoryFilter);
  }

  public clearLogs() {
    this.logs = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.storageKey);
      }
    } catch {}
    this.addEntry({
      level: 'info',
      category: 'GENERAL' as any,
      message: 'Logs cleared by user.',
    });
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public exportLogsAsText(): string {
    const lines = [
      `=== SLANG IT! DIAGNOSTIC DUMP ===`,
      `Generated: ${new Date().toISOString()}`,
      `Current AdMob Phase: ${this.currentAdmobPhase} (last changed ${Date.now() - this.lastAdmobPhaseTimestamp}ms ago)`,
      `Total Log Entries: ${this.logs.length}`,
      `==================================\n`,
    ];

    for (const log of this.logs) {
      lines.push(`[${log.timeStr}] [${log.level.toUpperCase()}] [${log.category}] (Phase: ${log.admobPhase || 'N/A'}) ${log.message}`);
      if (log.details) {
        try {
          lines.push(`  Details: ${JSON.stringify(log.details, null, 2)}`);
        } catch {
          lines.push(`  Details: ${String(log.details)}`);
        }
      }
    }

    return lines.join('\n');
  }
}

export const logger = new DiagnosticLogger();
