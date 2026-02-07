import { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// WEBCONTAINER CODE SANDBOX - Native Tool-Building
// =============================================================================
// Executes user-generated code in a secure browser sandbox
// Enables "infinite capability" through dynamic tool creation
// =============================================================================

export interface SandboxFile {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  files?: SandboxFile[];
}

export interface SandboxState {
  isReady: boolean;
  isLoading: boolean;
  isExecuting: boolean;
  loadProgress: string;
  error: string | null;
}

// Import WebContainer types
import type { WebContainer as WCType } from '@webcontainer/api';

// Detect if WebContainer is available
const isWebContainerSupported = (): boolean => {
  // WebContainer requires SharedArrayBuffer which needs COOP/COEP headers
  return typeof SharedArrayBuffer !== 'undefined';
};

export const useCodeSandbox = () => {
  const [state, setState] = useState<SandboxState>({
    isReady: false,
    isLoading: false,
    isExecuting: false,
    loadProgress: '',
    error: null,
  });

  const containerRef = useRef<WCType | null>(null);
  const bootFnRef = useRef<(() => Promise<WCType>) | null>(null);

  // Initialize WebContainer
  const initialize = useCallback(async (): Promise<boolean> => {
    if (containerRef.current) {
      return true; // Already initialized
    }

    if (!isWebContainerSupported()) {
      setState(prev => ({
        ...prev,
        error: 'WebContainer requires SharedArrayBuffer. Please enable COOP/COEP headers or use a supported browser.',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, loadProgress: 'Loading WebContainer...' }));

    try {
      // Dynamic import to avoid bundling issues
      setState(prev => ({ ...prev, loadProgress: 'Importing WebContainer API...' }));

      // Check if boot function is already loaded
      if (!bootFnRef.current) {
        const { WebContainer } = await import('@webcontainer/api');
        bootFnRef.current = () => WebContainer.boot();
      }

      setState(prev => ({ ...prev, loadProgress: 'Booting container...' }));
      containerRef.current = await bootFnRef.current();

      // Install basic dependencies
      setState(prev => ({ ...prev, loadProgress: 'Setting up environment...' }));

      // Create package.json
      await containerRef.current.mount({
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: 'shadowtalk-sandbox',
              type: 'module',
              dependencies: {},
            }),
          },
        },
      });

      setState({
        isReady: true,
        isLoading: false,
        isExecuting: false,
        loadProgress: 'Ready',
        error: null,
      });

      console.log('[CodeSandbox] WebContainer initialized');
      return true;

    } catch (e: any) {
      console.error('[CodeSandbox] Init error:', e);
      setState({
        isReady: false,
        isLoading: false,
        isExecuting: false,
        loadProgress: '',
        error: e.message || 'Failed to initialize sandbox',
      });
      return false;
    }
  }, []);

  // Execute JavaScript/TypeScript code
  const executeCode = useCallback(async (
    code: string,
    options?: {
      filename?: string;
      dependencies?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<ExecutionResult> => {
    const { filename = 'script.js', dependencies = {}, timeout = 30000 } = options || {};
    const startTime = Date.now();

    // Fallback execution using eval (for environments without WebContainer)
    if (!isWebContainerSupported() || !containerRef.current) {
      return executeFallback(code, timeout);
    }

    setState(prev => ({ ...prev, isExecuting: true }));

    try {
      // Update package.json with dependencies
      if (Object.keys(dependencies).length > 0) {
        await containerRef.current.mount({
          'package.json': {
            file: {
              contents: JSON.stringify({
                name: 'shadowtalk-sandbox',
                type: 'module',
                dependencies,
              }),
            },
          },
        });

        // Install dependencies
        const installProcess = await containerRef.current.spawn('npm', ['install']);
        await installProcess.exit;
      }

      // Write the code file
      await containerRef.current.fs.writeFile(filename, code);

      // Execute with timeout
      let output = '';
      const process = await containerRef.current.spawn('node', [filename]);

      // Read output stream
      const reader = process.output.getReader();
      (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          output += value;
        }
      })();

      // Race between execution and timeout
      const exitCode = await Promise.race([
        process.exit,
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout')), timeout)
        ),
      ]);

      setState(prev => ({ ...prev, isExecuting: false }));

      return {
        success: exitCode === 0,
        output: output.trim(),
        error: exitCode !== 0 ? `Process exited with code ${exitCode}` : undefined,
        duration: Date.now() - startTime,
      };

    } catch (e: any) {
      setState(prev => ({ ...prev, isExecuting: false }));
      return {
        success: false,
        output: '',
        error: e.message,
        duration: Date.now() - startTime,
      };
    }
  }, []);

  // Fallback execution using Function constructor (less secure but more compatible)
  const executeFallback = useCallback(async (
    code: string,
    timeout: number
  ): Promise<ExecutionResult> => {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const logs: string[] = [];

      // Create a safe console proxy
      const safeConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push(`[ERROR] ${args.map(String).join(' ')}`),
        warn: (...args: any[]) => logs.push(`[WARN] ${args.map(String).join(' ')}`),
        info: (...args: any[]) => logs.push(`[INFO] ${args.map(String).join(' ')}`),
      };

      // Timeout handler
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          output: logs.join('\n'),
          error: 'Execution timeout',
          duration: Date.now() - startTime,
        });
      }, timeout);

      try {
        // Create a sandboxed function
        // eslint-disable-next-line no-new-func
        const fn = new Function('console', 'setTimeout', 'setInterval', 'fetch', code);

        // Execute with limited globals
        const result = fn(safeConsole, undefined, undefined, undefined);

        // Handle async results
        if (result instanceof Promise) {
          result
            .then((value) => {
              clearTimeout(timeoutId);
              if (value !== undefined) logs.push(`Return: ${JSON.stringify(value)}`);
              resolve({
                success: true,
                output: logs.join('\n'),
                duration: Date.now() - startTime,
              });
            })
            .catch((err) => {
              clearTimeout(timeoutId);
              resolve({
                success: false,
                output: logs.join('\n'),
                error: err.message,
                duration: Date.now() - startTime,
              });
            });
        } else {
          clearTimeout(timeoutId);
          if (result !== undefined) logs.push(`Return: ${JSON.stringify(result)}`);
          resolve({
            success: true,
            output: logs.join('\n'),
            duration: Date.now() - startTime,
          });
        }
      } catch (e: any) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          output: logs.join('\n'),
          error: e.message,
          duration: Date.now() - startTime,
        });
      }
    });
  }, []);

  // Generate and execute a tool for a specific task
  const createAndExecuteTool = useCallback(async (
    taskDescription: string,
    inputData?: any
  ): Promise<ExecutionResult> => {
    // This would ideally use AI to generate the code
    // For now, provide a template-based approach

    const toolCode = `
// Auto-generated tool for: ${taskDescription}
const input = ${JSON.stringify(inputData || null)};

async function executeTool() {
  // Tool implementation would be generated by AI
  console.log('Executing tool for:', ${JSON.stringify(taskDescription)});
  console.log('Input data:', JSON.stringify(input, null, 2));
  
  // Example: Simple data processing
  if (input && typeof input === 'object') {
    const keys = Object.keys(input);
    console.log('Found', keys.length, 'properties');
    return { processed: true, properties: keys };
  }
  
  return { message: 'Tool executed successfully' };
}

executeTool().then(result => console.log('Result:', JSON.stringify(result)));
`;

    return executeCode(toolCode);
  }, [executeCode]);

  // Parse and execute code for unknown file formats
  const parseUnknownFormat = useCallback(async (
    content: string,
    filename: string
  ): Promise<ExecutionResult> => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Generate parser based on file extension
    const parserCode = `
// Auto-generated parser for .${ext} files
const content = ${JSON.stringify(content)};

function parse() {
  // Attempt to detect format
  const trimmed = content.trim();
  
  // JSON detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      console.log('Detected: JSON');
      console.log('Parsed:', JSON.stringify(parsed, null, 2));
      return { format: 'json', data: parsed };
    } catch {}
  }
  
  // CSV detection
  if (trimmed.includes(',') && trimmed.includes('\\n')) {
    const lines = trimmed.split('\\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, h, i) => ({ ...obj, [h.trim()]: values[i]?.trim() }), {});
    });
    console.log('Detected: CSV');
    console.log('Rows:', rows.length);
    console.log('Sample:', JSON.stringify(rows[0]));
    return { format: 'csv', headers, rows };
  }
  
  // XML/HTML detection
  if (trimmed.startsWith('<')) {
    console.log('Detected: XML/HTML');
    const tagMatches = trimmed.match(/<(\\w+)/g) || [];
    const tags = [...new Set(tagMatches.map(t => t.slice(1)))];
    console.log('Tags found:', tags.join(', '));
    return { format: 'xml', tags };
  }
  
  // INI/Properties detection
  if (trimmed.includes('=') && !trimmed.includes('{')) {
    console.log('Detected: INI/Properties');
    const pairs = trimmed.split('\\n')
      .filter(line => line.includes('='))
      .map(line => {
        const [key, ...rest] = line.split('=');
        return { key: key.trim(), value: rest.join('=').trim() };
      });
    console.log('Properties:', pairs.length);
    return { format: 'ini', properties: pairs };
  }
  
  // Plain text fallback
  console.log('Detected: Plain text');
  console.log('Lines:', trimmed.split('\\n').length);
  console.log('Words:', trimmed.split(/\\s+/).length);
  return { format: 'text', lines: trimmed.split('\\n').length };
}

const result = parse();
console.log('Parse complete:', JSON.stringify(result));
`;

    return executeCode(parserCode);
  }, [executeCode]);

  // Cleanup
  const teardown = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.teardown();
      containerRef.current = null;
    }
    setState({
      isReady: false,
      isLoading: false,
      isExecuting: false,
      loadProgress: '',
      error: null,
    });
  }, []);

  // Check support status
  const checkSupport = useCallback(() => {
    return {
      webContainerSupported: isWebContainerSupported(),
      fallbackAvailable: true,
      recommendation: isWebContainerSupported()
        ? 'Full WebContainer support available'
        : 'Using fallback execution (limited features)',
    };
  }, []);

  return {
    ...state,
    initialize,
    executeCode,
    executeFallback,
    createAndExecuteTool,
    parseUnknownFormat,
    teardown,
    checkSupport,
  };
};
