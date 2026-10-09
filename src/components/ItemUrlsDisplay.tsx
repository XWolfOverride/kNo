import React, { useState } from 'react';
import { ExternalLink, Link2, Copy, Check, Globe } from 'lucide-react';
import { ItemUrl } from '../types';

interface ItemUrlsDisplayProps {
  urls: ItemUrl[];
  className?: string;
}

export const ItemUrlsDisplay: React.FC<ItemUrlsDisplayProps> = ({ urls, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!urls || urls.length === 0) return null;

  const getDomain = (rawUrl: string) => {
    try {
      const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  const ensureHttp = (rawUrl: string) => {
    if (!rawUrl) return '#';
    return rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;
  };

  const handleCopy = (url: string, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#78816c]">
        <Link2 className="w-3 h-3 text-[#c85718]" />
        <span>Enlaces ({urls.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {urls.map((item, idx) => {
          const domain = getDomain(item.url);
          const fullHref = ensureHttp(item.url);
          const isCopied = copiedIndex === idx;

          return (
            <a
              key={idx}
              href={fullHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2 rounded-xl bg-[#13160e] hover:bg-[#1f2418] transition-all text-xs shadow-xs"
            >
              <div className="min-w-0 flex-1 pr-1.5">
                {/* Title */}
                <div className="font-medium text-[#f5f6f0] group-hover:text-[#f59e64] transition-colors truncate text-xs">
                  {item.description || item.url}
                </div>

                {/* Domain */}
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#78816c] font-mono">
                  <Globe className="w-2.5 h-2.5 text-[#555d4b] shrink-0" />
                  <span className="truncate text-[#9fa691]">
                    {domain || item.url}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopy(item.url, idx, e)}
                  title="Copiar enlace"
                  className="p-1 rounded-lg text-[#78816c] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-[#a8d672]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <div className="p-1 text-[#78816c] group-hover:text-[#c85718] transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
