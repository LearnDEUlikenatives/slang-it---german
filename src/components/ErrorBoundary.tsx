import React from 'react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-lg mx-auto my-8 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000000] text-center font-cartoon">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-black text-black mb-2 italic">
            {this.props.fallbackTitle || 'Hoppla! Etwas ist schiefgelaufen.'}
          </h2>
          <p className="text-xs sm:text-sm text-black/70 mb-5 font-sans font-bold">
            Ein unerwarteter Anzeigefehler ist aufgetreten. Du kannst die Ansicht zurücksetzen oder neu laden.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-[#05FFA1] border-2 border-black rounded-2xl font-black text-black text-xs sm:text-sm shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            >
              🔄 Erneut versuchen
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2.5 bg-[#FFFB96] border-2 border-black rounded-2xl font-black text-black text-xs sm:text-sm shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            >
              🏠 Neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
