import { useState, useCallback, useRef } from 'react';

interface ExecutionResult {
  output: string;
  error: string | null;
  executionTime: number;
  logs: string[];
  language: 'javascript' | 'typescript' | 'python';
}

interface OfflineCodeExecutionState {
  isExecuting: boolean;
  lastResult: ExecutionResult | null;
  history: ExecutionResult[];
  isPyodideReady: boolean;
  isPyodideLoading: boolean;
}

export const useOfflineCodeExecution = () => {
  const [state, setState] = useState<OfflineCodeExecutionState>({
    isExecuting: false,
    lastResult: null,
    history: [],
    isPyodideReady: false,
    isPyodideLoading: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pyodideRef = useRef<any>(null);

  // Load Pyodide for Python execution
  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || state.isPyodideLoading) return;
    setState(prev => ({ ...prev, isPyodideLoading: true }));
    try {
      // Dynamic import of Pyodide
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
      document.head.appendChild(script);
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide'));
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pyodideRef.current = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      });
      setState(prev => ({ ...prev, isPyodideReady: true, isPyodideLoading: false }));
    } catch (e) {
      console.error('Failed to load Pyodide:', e);
      setState(prev => ({ ...prev, isPyodideLoading: false }));
    }
  }, [state.isPyodideLoading]);

  const executeJavaScript = useCallback(async (code: string): Promise<ExecutionResult> => {
    setState(prev => ({ ...prev, isExecuting: true }));
    const startTime = performance.now();
    const logs: string[] = [];
    let output = '';
    let error: string | null = null;

    try {
      const sandboxConsole = {
        log: (...args: unknown[]) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
        },
        error: (...args: unknown[]) => { logs.push(`[ERROR] ${args.map(String).join(' ')}`); },
        warn: (...args: unknown[]) => { logs.push(`[WARN] ${args.map(String).join(' ')}`); },
        info: (...args: unknown[]) => { logs.push(`[INFO] ${args.map(String).join(' ')}`); },
        table: (data: unknown) => { logs.push(JSON.stringify(data, null, 2)); },
        clear: () => { logs.length = 0; },
      };

      const sandboxGlobals = {
        console: sandboxConsole,
        Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, WeakMap, WeakSet,
        Promise, Symbol, Proxy, Reflect,
        parseInt, parseFloat, isNaN, isFinite,
        encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
        atob, btoa,
        structuredClone: structuredClone,
        crypto: { randomUUID: () => crypto.randomUUID(), getRandomValues: (arr: Uint8Array) => crypto.getRandomValues(arr) },
        TextEncoder, TextDecoder,
        URL, URLSearchParams,
        setTimeout: (fn: () => void, ms: number) => {
          if (ms > 5000) throw new Error('Timeout max 5s');
          return setTimeout(fn, ms);
        },
        setInterval: () => { throw new Error('setInterval disabled in sandbox'); },
        fetch: () => { throw new Error('fetch disabled in offline sandbox'); },
        performance: { now: () => performance.now() },
      };

      const sandboxedCode = `"use strict"; return (async function() { ${code} })();`;
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const sandboxFn = new AsyncFunction(...Object.keys(sandboxGlobals), sandboxedCode);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout (10s)')), 10000);
      });

      const result = await Promise.race([
        sandboxFn(...Object.values(sandboxGlobals)),
        timeoutPromise,
      ]);

      if (result !== undefined) {
        output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const executionResult: ExecutionResult = {
      output,
      error,
      executionTime: performance.now() - startTime,
      logs,
      language: 'javascript',
    };

    setState(prev => ({
      isExecuting: false,
      lastResult: executionResult,
      history: [...prev.history.slice(-19), executionResult],
      isPyodideReady: prev.isPyodideReady,
      isPyodideLoading: prev.isPyodideLoading,
    }));

    return executionResult;
  }, []);

  const executeTypeScript = useCallback(async (code: string): Promise<ExecutionResult> => {
    const jsCode = code
      .replace(/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null|\w+\[\]|\w+<.*?>)\s*(?=[,\)=;\n{])/g, '')
      .replace(/interface\s+\w+\s*(?:extends\s+\w+\s*)?\{[^}]*\}/gs, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
      .replace(/<\w+(?:,\s*\w+)*>/g, '')
      .replace(/\bas\s+\w+/g, '')
      .replace(/!\./g, '.')
      .replace(/enum\s+\w+\s*\{[^}]*\}/gs, '');

    const result = await executeJavaScript(jsCode);
    return { ...result, language: 'typescript' };
  }, [executeJavaScript]);

  const executePython = useCallback(async (code: string): Promise<ExecutionResult> => {
    setState(prev => ({ ...prev, isExecuting: true }));
    const startTime = performance.now();
    const logs: string[] = [];
    let output = '';
    let error: string | null = null;

    try {
      if (!pyodideRef.current) {
        await loadPyodide();
        if (!pyodideRef.current) throw new Error('Python runtime not available. Loading Pyodide...');
      }

      // Capture stdout
      pyodideRef.current.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      const result = await pyodideRef.current.runPythonAsync(code);

      const stdout = pyodideRef.current.runPython('sys.stdout.getvalue()');
      const stderr = pyodideRef.current.runPython('sys.stderr.getvalue()');

      if (stdout) logs.push(stdout);
      if (stderr) logs.push(`[STDERR] ${stderr}`);
      if (result !== undefined && result !== null) {
        output = String(result);
      }

      // Reset stdout
      pyodideRef.current.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Python execution error';
    }

    const executionResult: ExecutionResult = {
      output,
      error,
      executionTime: performance.now() - startTime,
      logs,
      language: 'python',
    };

    setState(prev => ({
      isExecuting: false,
      lastResult: executionResult,
      history: [...prev.history.slice(-19), executionResult],
      isPyodideReady: prev.isPyodideReady,
      isPyodideLoading: prev.isPyodideLoading,
    }));

    return executionResult;
  }, [loadPyodide]);

  // Auto-detect language and execute
  const execute = useCallback(async (code: string, language?: string): Promise<ExecutionResult> => {
    const lang = language?.toLowerCase() || detectLanguage(code);
    switch (lang) {
      case 'python': return executePython(code);
      case 'typescript': return executeTypeScript(code);
      default: return executeJavaScript(code);
    }
  }, [executeJavaScript, executeTypeScript, executePython]);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [], lastResult: null }));
  }, []);

  return {
    ...state,
    executeJavaScript,
    executeTypeScript,
    executePython,
    execute,
    loadPyodide,
    clearHistory,
  };
};

function detectLanguage(code: string): string {
  if (code.match(/^\s*(import\s+\w+|from\s+\w+\s+import|def\s+\w+|class\s+\w+:|print\s*\()/m)) return 'python';
  if (code.match(/:\s*(string|number|boolean|void)\b|interface\s+\w+/)) return 'typescript';
  return 'javascript';
}
