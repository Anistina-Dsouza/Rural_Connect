import { useEffect, useRef } from 'react';
import type { ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import type { ReactNode } from 'react';

interface AgoraVideoPlayerProps {
  track: ICameraVideoTrack | IRemoteVideoTrack | null;
  className: string;
  children?: ReactNode;
}

export function AgoraVideoPlayer({ track, className, children }: AgoraVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!track || !container) return;

    track.play(container);
    return () => track.stop();
  }, [track]);

  return (
    <div ref={containerRef} className={className}>
      {!track && children}
    </div>
  );
}
