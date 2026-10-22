import { hexToRgb, rgbToHex } from '@/app/lib/theme';

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
};

/** Hazır renkler + renk seçici + hex kutusu + R/G/B kaydırıcıları */
export function ColorPicker({ label, hint, value, onChange, presets = [] }: Props) {
  const [r, g, b] = hexToRgb(value);
  const setChannel = (idx: 0 | 1 | 2, v: number) => {
    const rgb: [number, number, number] = [r, g, b];
    rgb[idx] = v;
    onChange(rgbToHex(rgb[0], rgb[1], rgb[2]));
  };

  const channels: { name: string; idx: 0 | 1 | 2; val: number; color: string }[] = [
    { name: 'R', idx: 0, val: r, color: '#f87171' },
    { name: 'G', idx: 1, val: g, color: '#4ade80' },
    { name: 'B', idx: 2, val: b, color: '#60a5fa' },
  ];

  return (
    <div>
      <div className="text-sm font-medium text-white/80">{label}</div>
      {hint && <div className="text-xs text-white/40 mb-3">{hint}</div>}

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 mt-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              title={p}
              aria-label={`Renk ${p}`}
              className={`w-8 h-8 rounded-full border-2 transition-transform btn-press hover:scale-110 ${
                value.toLowerCase() === p.toLowerCase() ? 'border-white scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: p }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-white/10 p-0"
          aria-label={`${label} renk seçici`}
        />
        <input
          type="text"
          value={value}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            onChange(v);
          }}
          className="w-28 px-3 py-2.5 rounded-xl glass-light text-white font-mono text-sm focus:outline-none"
          aria-label={`${label} hex kodu`}
        />
        <span className="text-xs text-white/40 font-mono">rgb({r}, {g}, {b})</span>
      </div>

      <div className="space-y-2">
        {channels.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="w-4 text-xs font-bold" style={{ color: c.color }}>{c.name}</span>
            <input
              type="range"
              min={0}
              max={255}
              value={c.val}
              onChange={(e) => setChannel(c.idx, Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: c.color }}
            />
            <input
              type="number"
              min={0}
              max={255}
              value={c.val}
              onChange={(e) => setChannel(c.idx, Math.max(0, Math.min(255, Number(e.target.value) || 0)))}
              className="w-16 px-2 py-1 rounded-lg glass-light text-white text-sm text-center focus:outline-none"
              aria-label={`${label} ${c.name}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
