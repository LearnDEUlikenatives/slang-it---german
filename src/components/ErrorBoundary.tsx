import React from 'react';
import { logger, LogEntry } from '../utils/logger';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  copiedLogs: boolean;
  recentLogs: LogEntry[];
  admobSnapshot: { phase: string; elapsedMs: number } | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copiedLogs: false,
      recentLogs: [],
      admobSnapshot: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      admobSnapshot: logger.getAdMobPhase(),
      recentLogs: logger.getLogs().slice(-20),
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const admobState = logger.getAdMobPhase();
    const isDuringAdMob = admobState.phase !== 'IDLE';

    logger.error(`ErrorBoundary caught exception in <${this.props.componentName || 'App'}>`, error, {
      componentStack: errorInfo.componentStack,
      admobPhase: admobState.phase,
      admobElapsedMs: admobState.elapsedMs,
      isDuringAdMob,
    });

    logger.render(this.props.componentName || 'ErrorBoundary', 'CRASH', {
      errorMessage: error.message,
      admobPhase: admobState.phase,
    });

    this.setState({
      errorInfo,
      admobSnapshot: admobState,
      recentLogs: logger.getLogs().slice(-25),
    });
  }

  private handleReset = () => {
    logger.lifecycle('ErrorBoundary reset invoked by user');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copiedLogs: false,
    });
  };

  private handleReload = () => {
    logger.lifecycle('ErrorBoundary reload invoked by user');
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopyLogs = async () => {
    try {
      const dump = logger.exportLogsAsText();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(dump);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = dump;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.setState({ copiedLogs: true });
      setTimeout(() => this.setState({ copiedLogs: false }), 3000);
    } catch (err) {
      console.warn('Failed to copy logs:', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, copiedLogs, recentLogs, admobSnapshot } = this.state;
      const isDuringAdmob = admobSnapshot && admobSnapshot.phase !== 'IDLE';

      return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto my-6 bg-[#FFFB96] border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000000] text-center font-cartoon text-black">
          <div className="text-4xl sm:text-5xl mb-3 animate-bounce">⚠️</div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-black mb-2 italic">
            {this.props.fallbackTitle || 'Hoppla! Etwas ist schiefgelaufen.'}
          </h2>

          <p className="text-xs sm:text-sm text-black/80 mb-4 font-sans font-bold">
            Ein unerwarteter Render- oder State-Fehler ist aufgetreten.
          </p>

          {/* AdMob Lifecycle Correlation Banner */}
          {isDuringAdmob && (
            <div className="mb-4 p-3 bg-[#FF71CE] border-3 border-black rounded-2xl text-left shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                <span>⚡ AdMob Lifecycle Event In Progress</span>
              </div>
              <p className="text-[11px] font-sans font-bold text-black mt-1">
                Dieser Fehler trat während der AdMob-Phase <strong>"{admobSnapshot.phase}"</strong> auf ({admobSnapshot.elapsedMs}ms nach Phasenstart).
              </p>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-[#05FFA1] hover:bg-[#05FFA1]/80 border-3 border-black rounded-2xl font-black text-black text-xs sm:text-sm shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            >
              🔄 Ansicht zurücksetzen
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 border-3 border-black rounded-2xl font-black text-black text-xs sm:text-sm shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            >
              🏠 App neu laden
            </button>
            <button
              onClick={this.handleCopyLogs}
              className="px-4 py-2.5 bg-[#01CDFE] hover:bg-[#01CDFE]/80 border-3 border-black rounded-2xl font-black text-black text-xs sm:text-sm shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            >
              {copiedLogs ? '✅ Logs kopiert!' : '📋 Diagnose-Logs kopieren'}
            </button>
          </div>

          {/* Toggle Diagnostics */}
          <div className="border-t-2 border-black/20 pt-3 text-left">
            <button
              type="button"
              onClick={() => this.setState({ showDetails: !showDetails })}
              className="text-xs font-black uppercase tracking-wider text-black/80 hover:text-black underline flex items-center gap-1 mx-auto"
            >
              <span>{showDetails ? '▼ Diagnose-Details verbergen' : '▶ Diagnose-Details & Stacktrace anzeigen'}</span>
            </button>

            {showDetails && (
              <div className="mt-3 p-3 bg-black text-[#05FFA1] rounded-2xl text-left font-mono text-[11px] leading-tight max-h-72 overflow-y-auto space-y-2 border-2 border-black">
                <div>
                  <div className="text-[#FF71CE] font-bold">ERROR:</div>
                  <div className="text-white">{error?.toString()}</div>
                </div>

                {error?.stack && (
                  <div>
                    <div className="text-[#FF71CE] font-bold">STACK:</div>
                    <pre className="text-white/80 whitespace-pre-wrap text-[10px]">{error.stack}</pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div>
                    <div className="text-[#FFFB96] font-bold">COMPONENT STACK:</div>
                    <pre className="text-white/80 whitespace-pre-wrap text-[10px]">{errorInfo.componentStack}</pre>
                  </div>
                )}

                <div>
                  <div className="text-[#01CDFE] font-bold">LETZTE 10 LOG-EVENTS:</div>
                  <div className="space-y-1 mt-1">
                    {recentLogs.slice(-10).map((log) => (
                      <div key={log.id} className="text-[10px] text-white/90">
                        <span className="text-[#05FFA1]">[{log.timeStr}]</span>{' '}
                        <span className="text-[#FF71CE]">[{log.category}]</span>{' '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
