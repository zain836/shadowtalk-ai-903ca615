import { useState, useCallback } from 'react';

interface ExecutionResult {
  output: string;
  error: string | null;
  executionTime: number;
  logs: string[];
}

interface OfflineCodeExecutionState {
  isExecuting: boolean;
  lastResult: ExecutionResult | null;
  history: ExecutionResult[];
}

export const useOfflineCodeExecution = () => {
  const [state, setState] = useState<OfflineCodeExecutionState>({
    isExecuting: false,
    lastResult: null,
    history: [],
  });

  const executeJavaScript = useCallback(async (code: string): Promise<ExecutionResult> => {
    setState(prev => ({ ...prev, isExecuting: true }));
    
    const startTime = performance.now();
    const logs: string[] = [];
    let output = '';
    let error: string | null = null;

    try {
      // Create a sandboxed console
      const sandboxConsole = {
        log: (...args: unknown[]) => {
          const logStr = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          logs.push(logStr);
        },
        error: (...args: unknown[]) => {
          logs.push(`[ERROR] ${args.map(String).join(' ')}`);
        },
        warn: (...args: unknown[]) => {
          logs.push(`[WARN] ${args.map(String).join(' ')}`);
        },
        info: (...args: unknown[]) => {
          logs.push(`[INFO] ${args.map(String).join(' ')}`);
        },
        table: (data: unknown) => {
          logs.push(JSON.stringify(data, null, 2));
        },
        clear: () => {
          logs.length = 0;
        },
      };

      // Create sandboxed environment with limited globals
      const sandboxGlobals = {
        console: sandboxConsole,
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Map,
        Set,
        Promise,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURI,
        decodeURI,
        encodeURIComponent,
        decodeURIComponent,
        setTimeout: (fn: () => void, ms: number) => {
          if (ms > 5000) throw new Error('Timeout too long (max 5s)');
          return setTimeout(fn, ms);
        },
        setInterval: () => {
          throw new Error('setInterval is disabled in sandbox');
        },
        fetch: () => {
          throw new Error('fetch is disabled in offline sandbox');
        },
      };

      // Create the sandboxed function
      const sandboxedCode = `
        "use strict";
        return (async function() {
          ${code}
        })();
      `;

      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const sandboxFn = new AsyncFunction(
        ...Object.keys(sandboxGlobals),
        sandboxedCode
      );

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout (10s)')), 10000);
      });

      const result = await Promise.race([
        sandboxFn(...Object.values(sandboxGlobals)),
        timeoutPromise,
      ]);

      if (result !== undefined) {
        output = typeof result === 'object' 
          ? JSON.stringify(result, null, 2) 
          : String(result);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const executionTime = performance.now() - startTime;
    const executionResult: ExecutionResult = {
      output,
      error,
      executionTime,
      logs,
    };

    setState(prev => ({
      isExecuting: false,
      lastResult: executionResult,
      history: [...prev.history.slice(-9), executionResult],
    }));

    return executionResult;
  }, []);

  const executeTypeScript = useCallback(async (code: string): Promise<ExecutionResult> => {
    // Basic TypeScript to JavaScript transpilation (remove types)
    const jsCode = code
      .replace(/:\s*(string|number|boolean|any|void|never|unknown|object|\w+\[\]|\w+<.*?>)\s*(?=[,\)=;\n])/g, '')
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
      .replace(/<\w+(?:,\s*\w+)*>/g, '')
      .replace(/as\s+\w+/g, '')
      .replace(/!\./g, '.');

    return executeJavaScript(jsCode);
  }, [executeJavaScript]);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [], lastResult: null }));
  }, []);

  return {
    ...state,
    executeJavaScript,
    executeTypeScript,
    clearHistory,
  };
};
