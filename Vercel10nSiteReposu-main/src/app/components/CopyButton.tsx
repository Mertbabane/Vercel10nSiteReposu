import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 btn-press ${
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'glass-light text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Kopyalandi!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Kopyala
        </>
      )}
    </button>
  );
}
