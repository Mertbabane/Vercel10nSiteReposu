import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Pause, Play, Volume2, VolumeX, EyeOff, Eye } from 'lucide-react';
import { useSettings } from '@/app/context/SettingsContext';
import { shaderBackground } from '@/app/lib/theme';

// Small shared store so footer controls can drive the background video
type VState = { hasVideo: boolean; paused: boolean; muted: boolean; hidden: boolean };
let state: VState = { hasVideo: false, paused: false, muted: true, hidden: false };
let videoEl: HTMLVideoElement | null = null;
const subs = new Set<() => void>();
const set = (p: Partial<VState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
const SERVER: VState = state;

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { settings } = useSettings();
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);

  useEffect(() => {
    if (localStorage.getItem('bgVideoHidden') === '1') set({ hidden: true });
  }, []);

  useEffect(() => { videoEl = videoRef.current; });
  useEffect(() => { set({ hasVideo: !!settings.background_video_url }); }, [settings.background_video_url]);

  const videoUrl = settings.background_video_url;
  const rot = settings.video_rotation ?? 0;
  const sideways = rot === 90 || rot === 270;
  const transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${settings.video_flip_h ? -1 : 1}, ${settings.video_flip_v ? -1 : 1})`;
  const fit = settings.video_fit !== false;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {videoUrl && !s.hidden ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          key={videoUrl}
          src={videoUrl}
          className={`absolute left-1/2 top-1/2 ${fit ? 'object-cover' : 'object-contain'}`}
          style={{
            width: sideways ? '100vh' : '100vw',
            height: sideways ? '100vw' : '100vh',
            transform,
            filter: settings.video_blur ? `blur(${settings.video_blur}px)` : undefined,
          }}
        />
      ) : (
        <div className="absolute inset-0 grid-bg" />
      )}
      <div className="absolute inset-0" style={{ background: shaderBackground(settings) }} />
    </div>
  );
}

export function VideoControls() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);
  if (!s.hasVideo) return null;

  const togglePlay = () => {
    const v = videoEl; if (!v) return;
    if (v.paused) { v.play().catch(() => {}); set({ paused: false }); }
    else { v.pause(); set({ paused: true }); }
  };
  const toggleMute = () => {
    const v = videoEl; if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.paused) v.play().catch(() => {});
    set({ muted: v.muted, paused: v.paused });
  };
  const toggleHidden = () => {
    const hidden = !s.hidden;
    localStorage.setItem('bgVideoHidden', hidden ? '1' : '0');
    set({ hidden, paused: false, muted: true });
  };
  const btn = 'w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition-all btn-press disabled:opacity-30';

  return (
    <div className="flex items-center gap-2">
      <button onClick={togglePlay} disabled={s.hidden} className={btn} title={s.paused ? 'Oynat' : 'Duraklat'} aria-label={s.paused ? 'Videoyu oynat' : 'Videoyu duraklat'}>
        {s.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>
      <button onClick={toggleMute} disabled={s.hidden} className={btn} title={s.muted ? 'Sesi aç' : 'Sesi kapat'} aria-label={s.muted ? 'Sesi aç' : 'Sesi kapat'}>
        {s.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <button onClick={toggleHidden} className={btn} title={s.hidden ? 'Videoyu göster' : 'Videoyu kaldır'} aria-label={s.hidden ? 'Videoyu göster' : 'Videoyu kaldır'}>
        {s.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
}
