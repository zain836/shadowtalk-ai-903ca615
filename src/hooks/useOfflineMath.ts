import { useState, useCallback } from 'react';

interface MathResult {
  expression: string;
  result: string;
  steps?: string[];
  error: string | null;
}

interface OfflineMathState {
  history: MathResult[];
  lastResult: MathResult | null;
}

export const useOfflineMath = () => {
  const [state, setState] = useState<OfflineMathState>({
    history: [],
    lastResult: null,
  });

  // Tokenize expression
  const tokenize = (expr: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      
      if (char === ' ') {
        if (current) tokens.push(current);
        current = '';
      } else if ('+-*/^()%'.includes(char)) {
        if (current) tokens.push(current);
        tokens.push(char);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) tokens.push(current);
    return tokens;
  };

  // Simple expression evaluator with operator precedence
  const evaluate = useCallback((expression: string): MathResult => {
    const steps: string[] = [];
    let expr = expression.trim().toLowerCase();
    
    try {
      // Handle common math functions
      expr = expr
        .replace(/\bsqrt\(([^)]+)\)/g, (_, n) => String(Math.sqrt(parseFloat(n))))
        .replace(/\babs\(([^)]+)\)/g, (_, n) => String(Math.abs(parseFloat(n))))
        .replace(/\bsin\(([^)]+)\)/g, (_, n) => String(Math.sin(parseFloat(n) * Math.PI / 180)))
        .replace(/\bcos\(([^)]+)\)/g, (_, n) => String(Math.cos(parseFloat(n) * Math.PI / 180)))
        .replace(/\btan\(([^)]+)\)/g, (_, n) => String(Math.tan(parseFloat(n) * Math.PI / 180)))
        .replace(/\blog\(([^)]+)\)/g, (_, n) => String(Math.log10(parseFloat(n))))
        .replace(/\bln\(([^)]+)\)/g, (_, n) => String(Math.log(parseFloat(n))))
        .replace(/\bexp\(([^)]+)\)/g, (_, n) => String(Math.exp(parseFloat(n))))
        .replace(/\bfloor\(([^)]+)\)/g, (_, n) => String(Math.floor(parseFloat(n))))
        .replace(/\bceil\(([^)]+)\)/g, (_, n) => String(Math.ceil(parseFloat(n))))
        .replace(/\bround\(([^)]+)\)/g, (_, n) => String(Math.round(parseFloat(n))))
        .replace(/\bpi\b/g, String(Math.PI))
        .replace(/\be\b/g, String(Math.E));

      steps.push(`Parsed: ${expr}`);

      // Handle power operator
      expr = expr.replace(/(\d+\.?\d*)\s*\^\s*(\d+\.?\d*)/g, (_, base, exp) => {
        const result = Math.pow(parseFloat(base), parseFloat(exp));
        steps.push(`${base}^${exp} = ${result}`);
        return String(result);
      });

      // Handle factorial
      expr = expr.replace(/(\d+)!/g, (_, n) => {
        const num = parseInt(n);
        let factorial = 1;
        for (let i = 2; i <= num; i++) factorial *= i;
        steps.push(`${n}! = ${factorial}`);
        return String(factorial);
      });

      // Handle percentage
      expr = expr.replace(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/gi, (_, percent, value) => {
        const result = (parseFloat(percent) / 100) * parseFloat(value);
        steps.push(`${percent}% of ${value} = ${result}`);
        return String(result);
      });

      expr = expr.replace(/(\d+\.?\d*)%/g, (_, n) => {
        const result = parseFloat(n) / 100;
        steps.push(`${n}% = ${result}`);
        return String(result);
      });

      // Validate expression contains only allowed characters
      if (!/^[\d\s+\-*/().]+$/.test(expr)) {
        throw new Error('Invalid characters in expression');
      }

      // Safely evaluate using Function constructor
      const result = new Function(`"use strict"; return (${expr})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid result');
      }

      steps.push(`Result: ${result}`);

      const mathResult: MathResult = {
        expression,
        result: result.toString(),
        steps,
        error: null,
      };

      setState(prev => ({
        history: [...prev.history.slice(-19), mathResult],
        lastResult: mathResult,
      }));

      return mathResult;
    } catch (err) {
      const mathResult: MathResult = {
        expression,
        result: '',
        error: err instanceof Error ? err.message : 'Calculation error',
      };

      setState(prev => ({ ...prev, lastResult: mathResult }));
      return mathResult;
    }
  }, []);

  // Unit conversions
  const convert = useCallback((value: number, from: string, to: string): MathResult => {
    const conversions: Record<string, Record<string, number>> = {
      // Length (to meters)
      length: {
        m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144,
      },
      // Weight (to grams)
      weight: {
        g: 1, kg: 1000, mg: 0.001, lb: 453.592, oz: 28.3495, ton: 907185,
      },
      // Temperature (special handling)
      temperature: { c: 1, f: 1, k: 1 },
      // Volume (to liters)
      volume: {
        l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588,
      },
      // Time (to seconds)
      time: {
        s: 1, ms: 0.001, min: 60, h: 3600, d: 86400, wk: 604800, yr: 31536000,
      },
    };

    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    try {
      // Find the category
      let category: string | null = null;
      for (const [cat, units] of Object.entries(conversions)) {
        if (fromLower in units && toLower in units) {
          category = cat;
          break;
        }
      }

      if (!category) {
        throw new Error(`Cannot convert between ${from} and ${to}`);
      }

      let result: number;

      if (category === 'temperature') {
        // Special temperature handling
        if (fromLower === 'c' && toLower === 'f') {
          result = (value * 9/5) + 32;
        } else if (fromLower === 'f' && toLower === 'c') {
          result = (value - 32) * 5/9;
        } else if (fromLower === 'c' && toLower === 'k') {
          result = value + 273.15;
        } else if (fromLower === 'k' && toLower === 'c') {
          result = value - 273.15;
        } else if (fromLower === 'f' && toLower === 'k') {
          result = (value - 32) * 5/9 + 273.15;
        } else if (fromLower === 'k' && toLower === 'f') {
          result = (value - 273.15) * 9/5 + 32;
        } else {
          result = value;
        }
      } else {
        const units = conversions[category];
        const baseValue = value * units[fromLower];
        result = baseValue / units[toLower];
      }

      const mathResult: MathResult = {
        expression: `${value} ${from} to ${to}`,
        result: `${result.toFixed(6).replace(/\.?0+$/, '')} ${to}`,
        steps: [`${value} ${from} = ${result.toFixed(6).replace(/\.?0+$/, '')} ${to}`],
        error: null,
      };

      setState(prev => ({
        history: [...prev.history.slice(-19), mathResult],
        lastResult: mathResult,
      }));

      return mathResult;
    } catch (err) {
      const mathResult: MathResult = {
        expression: `${value} ${from} to ${to}`,
        result: '',
        error: err instanceof Error ? err.message : 'Conversion error',
      };

      setState(prev => ({ ...prev, lastResult: mathResult }));
      return mathResult;
    }
  }, []);

  // Solve simple equations
  const solveEquation = useCallback((equation: string): MathResult => {
    try {
      // Simple linear equation solver: ax + b = c
      const match = equation.match(/([+-]?\d*\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)?\s*=\s*([+-]?\d+\.?\d*)/i);
      
      if (!match) {
        throw new Error('Cannot parse equation. Use format: ax + b = c');
      }

      const a = parseFloat(match[1] || '1') || 1;
      const b = parseFloat(match[2]?.replace(/\s/g, '') || '0');
      const c = parseFloat(match[3]);

      if (a === 0) {
        throw new Error('Coefficient of x cannot be zero');
      }

      const x = (c - b) / a;

      const mathResult: MathResult = {
        expression: equation,
        result: `x = ${x}`,
        steps: [
          `Original: ${a}x + ${b} = ${c}`,
          `${a}x = ${c} - ${b}`,
          `${a}x = ${c - b}`,
          `x = ${c - b} / ${a}`,
          `x = ${x}`,
        ],
        error: null,
      };

      setState(prev => ({
        history: [...prev.history.slice(-19), mathResult],
        lastResult: mathResult,
      }));

      return mathResult;
    } catch (err) {
      const mathResult: MathResult = {
        expression: equation,
        result: '',
        error: err instanceof Error ? err.message : 'Cannot solve equation',
      };

      setState(prev => ({ ...prev, lastResult: mathResult }));
      return mathResult;
    }
  }, []);

  const clearHistory = useCallback(() => {
    setState({ history: [], lastResult: null });
  }, []);

  return {
    ...state,
    evaluate,
    convert,
    solveEquation,
    clearHistory,
  };
};
