import type { ReactNode } from 'react';
import { SdPic } from '@/components/sd/primitives';
import type { ArtName } from '@/components/sd/topics';

interface AppEmptyProps {
  art: ArtName;
  title: string;
  text?: string;
  tone?: 'sage' | 'sky' | 'butter' | 'rose' | 'lavender';
  children?: ReactNode;
}

/** Illustrated empty state for the agent app (presentation only). */
export function AppEmpty({ art, title, text, tone = 'sky', children }: AppEmptyProps) {
  return (
    <div className="app-empty" data-tone={tone}>
      <div className="app-empty-art" aria-hidden="true">
        <SdPic name={art} sizes="220px" />
      </div>
      <p className="app-empty-title">{title}</p>
      {text && <p className="app-empty-text">{text}</p>}
      {children}
    </div>
  );
}
