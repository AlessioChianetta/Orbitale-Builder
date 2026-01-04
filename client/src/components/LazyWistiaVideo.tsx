import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface LazyWistiaVideoProps {
  videoId: string;
  thumbnailUrl?: string;
  title?: string;
  className?: string;
}

export function LazyWistiaVideo({ videoId, thumbnailUrl, title, className }: LazyWistiaVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loaded) {
          setLoaded(true);
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    
    const script = document.createElement('script');
    script.src = `https://fast.wistia.com/embed/medias/${videoId}.jsonp`;
    script.async = true;
    document.body.appendChild(script);

    const script2 = document.createElement('script');
    script2.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(script2);
    };
  }, [loaded, videoId]);

  return (
    <div ref={containerRef} className={className}>
      {!loaded ? (
        <div className="relative bg-slate-900 rounded-lg overflow-hidden cursor-pointer" onClick={() => setLoaded(true)}>
          {thumbnailUrl && <img src={thumbnailUrl} alt={title} className="w-full" loading="lazy" />}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-4 hover:scale-110 transition">
              <Play className="w-12 h-12 text-slate-900" />
            </div>
          </div>
        </div>
      ) : (
        <div className={`wistia_embed wistia_async_${videoId}`} style={{height: '100%', width: '100%'}}>&nbsp;</div>
      )}
    </div>
  );
}
