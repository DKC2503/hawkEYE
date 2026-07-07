import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import { GlassSurface } from './ui/GlassSurface';
import { GlassButton } from './ui/GlassButton';

type GateState = 'idle' | 'checking' | 'connecting' | 'ready' | 'failed';

export const BackendGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GateState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Use a ref to ensure we don't start multiple loops in StrictMode
  const loopActiveRef = useRef(false);
  // Track the active abort controller so we can cancel on unmount
  const activeControllerRef = useRef<AbortController | null>(null);

  const startReadinessCheck = async (instanceId: number) => {
    console.log(`[Readiness] Starting loop for instance ${instanceId}`);
    setState('checking');
    setErrorMsg(null);

    const healthUrl = `${API_BASE_URL}/health`;
    console.log(`[Readiness] Health URL: ${healthUrl}`);

    const maxRetries = 5;

    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (!loopActiveRef.current) {
          console.log(`[Readiness] Loop ${instanceId} cancelled before attempt ${attempt + 1}`);
          break;
        }

        if (attempt > 0) {
          setState('connecting');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!loopActiveRef.current) break;

        console.log(`[Readiness] Attempt: ${attempt + 1} (Instance ${instanceId})`);

        const controller = new AbortController();
        activeControllerRef.current = controller;
        const timeoutId = setTimeout(() => {
          console.log(`[Readiness] Timeout triggered for instance ${instanceId}`);
          controller.abort();
        }, 10000);

        try {
          console.log(`[Readiness] Calling fetch for instance ${instanceId}`);
          const res = await fetch(healthUrl, {
            method: 'GET',
            signal: controller.signal,
          });

          console.log(`[Readiness] fetch resolved for instance ${instanceId}`);
          console.log(`[Readiness] response status:`, res.status);
          console.log(`[Readiness] response ok:`, res.ok);

          if (res.ok) {
            let data: any = {};
            try {
              data = await res.json();
              console.log("[Readiness] response body:", data);
              console.log("[Readiness] health status:", data.status);
            } catch (e) {
              console.log("[Readiness] Could not parse JSON response");
            }
            
            if (data.status === "healthy" || res.status === 200) {
              console.log(`[Readiness] HEALTHY — setting ready`);
              if (loopActiveRef.current) {
                setState('ready');
                setErrorMsg(null);
              }
              clearTimeout(timeoutId);
              return; 
            }
          }
        } catch (err: any) {
          console.log(`[Readiness] Fetch catch block entered for instance ${instanceId}. Error:`, err.message);
          if (err.name === 'AbortError') {
            console.log(`[Readiness] AbortError detected for instance ${instanceId}`);
            if (!loopActiveRef.current) break;
          }
          console.log(`[Readiness] Failed: ${err.message || 'Unknown error'}`);
        } finally {
          clearTimeout(timeoutId);
          if (activeControllerRef.current === controller) {
            activeControllerRef.current = null;
          }
        }
      }

      if (loopActiveRef.current && state !== 'ready') {
        setState('failed');
        setErrorMsg('Unable to connect to hawkEYE services.');
      }
    } catch (e: any) {
      if (loopActiveRef.current) {
        setState('failed');
        setErrorMsg(e.message || 'Connection failed.');
      }
    } finally {
      console.log(`[Readiness] Loop ${instanceId} exiting.`);
    }
  };

  useEffect(() => {
    // Unique ID for this effect execution to trace StrictMode
    const instanceId = Math.random();
    console.log(`[Readiness] useEffect mounted (Instance ${instanceId})`);
    
    loopActiveRef.current = true;
    startReadinessCheck(instanceId);

    return () => {
      console.log(`[Readiness] useEffect cleanup running (Instance ${instanceId})`);
      loopActiveRef.current = false;
      if (activeControllerRef.current) {
        console.log(`[Readiness] Aborting active fetch in cleanup (Instance ${instanceId})`);
        activeControllerRef.current.abort();
        activeControllerRef.current = null;
      }
    };
  }, []); 

  const handleRetry = () => {
    if (!loopActiveRef.current) {
      loopActiveRef.current = true;
      startReadinessCheck(Math.random());
    }
  };

  if (state === 'ready') {
    console.log("[Readiness] Rendering children");
    return <>{children}</>;
  }

  // Same UI style as the old ApiConnectionOverlay
  return (
    <div className="flex-1 w-full min-h-screen flex items-center justify-center bg-[#030810] p-4 font-sans animate-fade-in text-white relative z-50">
      <div className="absolute inset-0 z-0 bg-[url('/bg-dark-grid.svg')] bg-center opacity-30"></div>
      
      <GlassSurface 
        variant="surface" 
        rounded="3xl" 
        className="w-full max-w-md p-6 sm:p-8 text-center space-y-6 border-white/10 shadow-2xl relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(8, 14, 24, 0.95) 0%, rgba(3, 8, 16, 0.95) 100%)',
          color: '#f8fafc'
        }}
      >
        {(state === 'checking' || state === 'connecting' || state === 'idle') ? (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5 border border-amber-500/20 animate-pulse">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {state === 'checking' ? 'Checking Connection...' : 'Connecting to hawkEYE services...'}
              </h2>
              <p className="text-sm text-slate-400">
                Waking up the secure environment. This may take 15–30 seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/5 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Connection Failed</h2>
              <p className="text-sm text-slate-400">{errorMsg}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <GlassButton variant="primary" className="flex-1 justify-center py-3" onClick={handleRetry}>
                Retry Connection
              </GlassButton>
              <GlassButton variant="secondary" className="flex-1 justify-center py-3" onClick={() => setState('ready')}>
                Continue to Portal
              </GlassButton>
            </div>
          </div>
        )}
      </GlassSurface>
    </div>
  );
};
