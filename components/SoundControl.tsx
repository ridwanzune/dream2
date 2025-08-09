
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);


const SoundControl: React.FC<SoundControlProps> = ({ isMuted, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
      className="absolute top-4 left-4 md:top-auto md:left-auto md:bottom-20 md:right-4 z-[2000] p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
    >
      {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
    </button>
  );
};

export default SoundControl;
