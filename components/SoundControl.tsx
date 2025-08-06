
import React from 'react';

interface SoundControlProps {
  isMuted: boolean;
  onToggle: () => void;
}

const SoundOnIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const SoundOffIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l-4 4m0 0l4-4m-4 4h14m-5-4v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4m-1 4h5m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4-4m0 0l-4 4m4-4v3.5C17 11.43 14.57 14 11.5 14H11" />
  </svg>
);


const SoundControl: React.FC<SoundControlProps> = ({ isMuted, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
      className="absolute top-4 right-4 md:top-auto md:bottom-20 md:right-4 z-[2000] p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
    >
      {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
    </button>
  );
};

export default SoundControl;
