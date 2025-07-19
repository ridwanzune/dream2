import React, { useState, useEffect, useRef } from 'react';
import { ALL_IMAGE_URLS, LAYER_IMAGES, HOVER_SOUND_URL } from './constants';
import Map from './components/Map';

// --- Helper Components defined in the same file to reduce file count ---

// 1. Upgraded Loading Spinner Component with Progress
const LoadingSpinner: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-[#177b61] text-white font-sans">
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    className="text-teal-800/50"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                />
                {/* Progress circle */}
                <circle
                    className="text-teal-300"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={`calc(251.2 - (251.2 * ${progress}) / 100)`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-teal-100">
                {progress}%
            </span>
        </div>
        <p className="mt-4 text-lg">Loading Resort Map...</p>
    </div>
);

// 2. Toggle Switch Component
interface ToggleSwitchProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange }) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-200">{label}</span>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 ${enabled ? 'bg-teal-500' : 'bg-gray-600'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

// --- Custom Hook for preloading IMAGES ONLY ---
const useAssetPreloader = (assetUrls: string[]) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let isCancelled = false;
        let loadedCount = 0;
        const totalAssets = assetUrls.length;

        if (totalAssets === 0) {
            setLoading(false);
            setProgress(100);
            return;
        }
        
        const updateProgress = () => {
            if (!isCancelled) {
                loadedCount++;
                setProgress(Math.round((loadedCount / totalAssets) * 100));
            }
        };

        const promises = assetUrls.map(url => {
            return new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Timeout loading asset: ${url.split('/').pop()}`));
                }, 20000); // 20-second timeout for each image

                const img = new Image();
                img.src = url;
                img.onload = () => {
                    clearTimeout(timeoutId);
                    updateProgress();
                    resolve();
                };
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${url.split('/').pop()}`));
                };
            });
        });

        Promise.all(promises)
            .then(() => {
                if (!isCancelled) {
                    // Short delay to let the 100% appear before hiding the loader
                    setTimeout(() => setLoading(false), 300);
                }
            })
            .catch(err => {
                if (!isCancelled) {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally run only once

    return { loading, error, progress };
};


// --- Main App Component ---
const App: React.FC = () => {
    // The preloader now ONLY handles images. The audio is handled by the <audio> tag itself.
    const { loading, error, progress } = useAssetPreloader(ALL_IMAGE_URLS);
    const [showWalkways, setShowWalkways] = useState(true);
    const [showRoads, setShowRoads] = useState(true);
    const [showBuildings, setShowBuildings] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    // Effect to detect the first user interaction to unlock audio context.
    useEffect(() => {
        const handleFirstInteraction = () => {
            setHasInteracted(true);
            // These listeners are now one-time use, so we remove them after firing.
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };

        window.addEventListener('mousedown', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
        window.addEventListener('touchstart', handleFirstInteraction);

        return () => {
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount.


    if (loading) {
        return <LoadingSpinner progress={progress} />;
    }

    if (error) {
        return <div className="flex flex-col items-center justify-center h-screen bg-red-900 text-white font-sans text-center p-4">
            <h2 className="text-2xl font-bold mb-2">Error Loading Resort Map</h2>
            <p className="text-lg">Could not load all required assets.</p>
            <p className="mt-2 text-sm bg-red-800 px-2 py-1 rounded">{error}</p>
        </div>;
    }

    return (
        <div className="flex h-screen w-screen font-sans bg-[#177b61] overflow-hidden">
            <aside className="w-[350px] flex-shrink-0 bg-black/20 text-white shadow-2xl flex flex-col p-6 space-y-6">
                <a href="https://dreamsquareresort.com/" target="_blank" rel="noopener noreferrer" className="block w-full transition-transform hover:scale-105 duration-300">
                    <img src={LAYER_IMAGES.logo} alt="Dream Square Resort Logo" className="w-full h-auto object-contain" />
                </a>
                
                <div className="w-full">
                     <img src={LAYER_IMAGES.legend} alt="Map Legend" className="w-full h-auto object-contain rounded-lg shadow-md" />
                </div>
               
                <div className="flex-grow flex flex-col space-y-4 pt-4 border-t border-gray-500/50">
                    <ToggleSwitch label="Buildings" enabled={showBuildings} onChange={setShowBuildings} />
                    <ToggleSwitch label="Pathways" enabled={showWalkways} onChange={setShowWalkways} />
                    <ToggleSwitch label="Roads" enabled={showRoads} onChange={setShowRoads} />
                </div>
                
                <footer className="text-center text-xs text-gray-400">
                    <p>&copy; 2024 Dream Square Resort. All rights reserved.</p>
                    <p>Hover on buildings for details.</p>
                </footer>
            </aside>
            
            <main className="flex-1 relative flex items-center justify-center overflow-auto p-4 bg-black/10">
                <Map 
                    showWalkways={showWalkways}
                    showRoads={showRoads}
                    showBuildings={showBuildings}
                    hasInteracted={hasInteracted}
                    audioRef={audioRef}
                />
            </main>

            {/* This audio tag will preload the sound in the background without blocking the app */}
            <audio ref={audioRef} src={HOVER_SOUND_URL} preload="auto" />
        </div>
    );
};

export default App;
