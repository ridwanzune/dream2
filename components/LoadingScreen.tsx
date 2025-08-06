import React from 'react';

interface LoadingScreenProps {
  progress: number;
  logoUrl: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, logoUrl }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#177b61] z-50">
      <div className="w-full max-w-md text-center px-4">
        {logoUrl && <img src={logoUrl} alt="Dream Square Resort" className="w-48 h-auto mx-auto mb-8 animate-pulse" />}
        
        <>
          <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Preparing Your Virtual Tour
          </h1>
          <p className="text-lg text-gray-200 mb-6">Loading resort assets...</p>
          <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-teal-400 to-emerald-500 h-4 rounded-full transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-white mt-3 font-mono text-xl">{Math.round(progress)}%</p>
        </>
      </div>
    </div>
  );
};

export default LoadingScreen;