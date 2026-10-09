import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      // Configure marked options
      return marked.parse(content, {
        async: false,
        breaks: true,
        gfm: true,
      }) as string;
    } catch (err) {
      console.error('Error parsing markdown:', err);
      return `<p>${content}</p>`;
    }
  }, [content]);

  return (
    <div
      className={`kno-markdown text-slate-300 text-xs sm:text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
