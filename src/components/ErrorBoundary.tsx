import React, { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export function ErrorBoundary({ children, fallbackTitle }: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Captured runtime error:', event.error);
      setHasError(true);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Captured unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="p-6 max-w-lg mx-auto my-8 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000000] text-center font-cartoon">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-black text-black mb-2">
          {fallbackTitle || 'Hoppla! Etwas ist schiefgelaufen.'}
        </h2>
        <p className="text-xs text-black/70 mb-4 font-sans font-bold">
          Ein unerwarteter Fehler ist aufgetreten.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            window.location.reload();
          }}
          className="px-5 py-2.5 bg-[#FFFB96] border-2 border-black rounded-2xl font-black text-black text-sm shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
        >
          🔄 Neu laden
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
