import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathRendererProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer = ({ math, displayMode = false, className = '' }: MathRendererProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#ef4444',
          trust: true,
          strict: false,
          macros: {
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}",
            "\\Q": "\\mathbb{Q}",
            "\\C": "\\mathbb{C}",
          }
        });
      } catch (error) {
        if (containerRef.current) {
          containerRef.current.textContent = math;
        }
      }
    }
  }, [math, displayMode]);

  return (
    <span 
      ref={containerRef} 
      className={`${displayMode ? 'block my-4 text-center overflow-x-auto' : 'inline'} ${className}`}
    />
  );
};

// Helper function to parse text and extract math blocks
export const parseMathContent = (content: string): Array<{ type: 'text' | 'math-inline' | 'math-display'; content: string }> => {
  const parts: Array<{ type: 'text' | 'math-inline' | 'math-display'; content: string }> = [];
  
  // Match display math ($$...$$) and inline math ($...$)
  const regex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    
    // Add the math content
    if (match[1] !== undefined) {
      // Display math ($$...$$)
      parts.push({ type: 'math-display', content: match[1].trim() });
    } else if (match[2] !== undefined) {
      // Inline math ($...$)
      parts.push({ type: 'math-inline', content: match[2].trim() });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }
  
  return parts;
};

export default MathRenderer;
