
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layer, BuildingDetails } from './types';
import { LAYER_DATA, IMAGE_URLS, BACKGROUND_COLOR, HOVER_SOUND_URL, BUILDING_LAYER_NAMES, OTHER_FEATURES_LAYER_NAMES, CLOUDS_CONFIG, BUILDING_INFO, BACKGROUND_MUSIC_URL } from './constants';
import LoadingScreen from './components/LoadingScreen';
import InteractiveMap from './components/InteractiveMap';
import ControlPanel from './components/ControlPanel';
import SoundControl from './components/SoundControl';
import InfoPanel from './components/InfoPanel';

const App: React.FC = () => {
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [isAlternateView, setIsAlternateView] = useState<boolean>(false);
  const appContainerRef = useRef<HTMLDivElement>(null);

  // Info Panel State
  const [infoPanelData, setInfoPanelData] = useState<BuildingDetails | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(false);
  const panelTimeoutRef = useRef<number | undefined>(undefined);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const layers: Layer[] = useMemo(() => {
    return LAYER_DATA
      .map(layer => { // Remap indices for alternate view for correct sorting
        if (layer.name === 'Surface 2') return { ...layer, index: 1 };
        // Per request, ensure Tree 2 is on top of all other layers.
        // A high z-index like 99 puts it above other layers but below the hover effect (100).
        if (layer.name === 'Tree 2') return { ...layer, index: 99 };
        return layer;
      })
      .filter(layer => { // Filter layers based on the selected view
        if (isAlternateView) {
          return layer.name !== 'Surface';
        }
        return layer.name !== 'Surface 2' && layer.name !== 'Tree 2';
      })
      .map(layerData => ({ // Map to full Layer object with URL
        ...layerData,
        url: IMAGE_URLS[layerData.name.replace(/ /g, '_')] || ''
      }))
      .filter(layer => layer.url && layer.name !== 'Map Ledgend' && !hiddenLayers.has(layer.name)); // Filter out layers that are explicitly hidden by the user
  }, [hiddenLayers, isAlternateView]);

  const handleToggleLayer = (layerIdentifier: string) => {
    setHiddenLayers(prev => {
      const next = new Set(prev);
      const toggleGroup = (group: string[]) => {
        const areAllShown = group.every(name => !prev.has(name));
        if (areAllShown) {
          group.forEach(name => next.add(name));
        } else {
          group.forEach(name => next.delete(name));
        }
      };

      if (layerIdentifier === 'Buildings') {
        toggleGroup(BUILDING_LAYER_NAMES);
      } else if (layerIdentifier === 'Features') {
        toggleGroup(OTHER_FEATURES_LAYER_NAMES);
      } else {
        if (next.has(layerIdentifier)) {
          next.delete(layerIdentifier);
        } else {
          next.add(layerIdentifier);
        }
      }
      return next;
    });
  };
  
  const handleToggleView = () => {
    setIsAlternateView(prev => !prev);
  };

  const unlockAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => {
        console.log("Could not resume audio context automatically, waiting for user interaction.");
      });
    }
     if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(e => {
            console.log("Could not play background music automatically.");
        });
    }
  }, []);

  useEffect(() => {
    if (backgroundMusicRef.current) {
        backgroundMusicRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }

    const layerImageUrls = LAYER_DATA.map(layerData => IMAGE_URLS[layerData.name.replace(/ /g, '_')] || '');
    const cloudImageUrls = CLOUDS_CONFIG.map(cloud => cloud.src);
    const panelImageUrls = Object.values(BUILDING_INFO).flatMap(
        building => building.facilities.flatMap(facility => facility.images)
    );
    
    const assetUrls = [...new Set(
        layerImageUrls
        .concat(IMAGE_URLS['Logo'])
        .concat(cloudImageUrls)
        .concat(panelImageUrls)
        .filter(url => !!url))];

    const totalAssets = assetUrls.length + 2; // +1 for the hover sound, +1 for background music
    let loadedCount = 0;

    const updateProgress = () => {
      loadedCount++;
      setLoadingProgress((loadedCount / totalAssets) * 100);
    };

    const preloadAudio = async () => {
      if (!audioContextRef.current) {
        console.warn("AudioContext not available, skipping audio preload.");
        updateProgress();
        return;
      }
      try {
        const response = await fetch(HOVER_SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        const decodedAudio = await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedAudio;
      } catch (error) {
        console.error("Failed to load and decode audio:", error);
      } finally {
        updateProgress();
      }
    };
    preloadAudio();

    const preloadBackgroundMusic = () => {
        if (!backgroundMusicRef.current) {
            const audio = new Audio(BACKGROUND_MUSIC_URL);
            audio.loop = true;
            audio.volume = 0.4;
            backgroundMusicRef.current = audio;

            const onCanPlayThrough = () => {
                updateProgress();
                audio.removeEventListener('canplaythrough', onCanPlayThrough);
                audio.removeEventListener('error', onError);
            };
            const onError = () => {
                console.error("Failed to load background music");
                updateProgress(); // still update progress to not block loading
                audio.removeEventListener('canplaythrough', onCanPlayThrough);
                audio.removeEventListener('error', onError);
            };
            audio.addEventListener('canplaythrough', onCanPlayThrough);
            audio.addEventListener('error', onError);
            audio.load();
        } else {
            updateProgress(); // already exists
        }
    };
    preloadBackgroundMusic();

    assetUrls.forEach(url => {
      const img = new Image();
      img.src = url;
      const onFinish = () => {
        updateProgress();
      };
      img.onload = onFinish;
      img.onerror = () => {
        console.error(`Failed to load image: ${url}`);
        onFinish(); 
      };
    });
  }, []);
  
  useEffect(() => {
    if (loadingProgress >= 100 && !assetsLoaded) {
      // This attempts to programmatically click the screen 1 second after
      // loading is complete to satisfy browser audio autoplay policies, which
      // require a user gesture. This is a more robust method than a direct .click() call.
      const clickTimer = setTimeout(() => {
        if (appContainerRef.current) {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          appContainerRef.current.dispatchEvent(clickEvent);
        }
      }, 1000);

      const transitionTimer = setTimeout(() => {
        setAssetsLoaded(true);
      }, 2000);

      return () => {
        clearTimeout(clickTimer);
        clearTimeout(transitionTimer);
      };
    }
  }, [loadingProgress, assetsLoaded]);

  const playHoverSound = useCallback(() => {
    if (isMuted || !audioContextRef.current || !audioBufferRef.current) return;
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') return;
    try {
      const source = audioContext.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }, [isMuted]);
  
  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    unlockAudioContext();
  };

  // --- Info Panel Logic ---
  const handleBuildingEnter = useCallback((name: string) => {
    if (BUILDING_INFO[name]) {
      clearTimeout(panelTimeoutRef.current);
      if (infoPanelData?.displayName !== BUILDING_INFO[name].displayName) {
        setInfoPanelData(BUILDING_INFO[name]);
      }
      setIsPanelVisible(true);
    }
  }, [infoPanelData]);

  const handlePanelEnter = useCallback(() => {
    clearTimeout(panelTimeoutRef.current);
  }, []);

  const handleBuildingLeave = useCallback(() => {
    clearTimeout(panelTimeoutRef.current);
    panelTimeoutRef.current = window.setTimeout(() => setIsPanelVisible(false), 300);
  }, []);

  const handlePanelClose = useCallback(() => {
    clearTimeout(panelTimeoutRef.current);
    setIsPanelVisible(false);
  }, []);

  const handlePanelTransitionEnd = useCallback(() => {
    if (!isPanelVisible) {
      setInfoPanelData(null);
    }
  }, [isPanelVisible]);

  return (
    <div 
      ref={appContainerRef}
      className="w-screen h-screen overflow-hidden relative flex flex-col md:block" 
      style={{ backgroundColor: BACKGROUND_COLOR }}
      onClick={unlockAudioContext}
      onTouchStart={unlockAudioContext}
    >
      {assetsLoaded && (
        <>
          <SoundControl isMuted={isMuted} onToggle={handleToggleMute} />
          <img src={IMAGE_URLS['Logo']} alt="Resort Logo" className="map-logo pointer-events-none hidden md:block" />
          <header className="md:hidden text-center py-2 bg-black/20 shrink-0">
              <img src={IMAGE_URLS['Logo']} alt="Resort Logo" className="h-10 w-auto inline-block" />
          </header>
        </>
      )}
      
      {!assetsLoaded && <LoadingScreen progress={loadingProgress} logoUrl={IMAGE_URLS['Logo']} />}

      <div className={`w-full transition-opacity duration-300 ${assetsLoaded ? 'opacity-100' : 'opacity-0'} flex-grow h-0 md:h-full`}>
        {assetsLoaded && (
          <InteractiveMap 
            layers={layers} 
            playHoverSound={playHoverSound} 
            onBuildingEnter={handleBuildingEnter}
            onBuildingLeave={handleBuildingLeave}
          />
        )}
      </div>

      {assetsLoaded && <ControlPanel hiddenLayers={hiddenLayers} onToggle={handleToggleLayer} isAlternateView={isAlternateView} onToggleView={handleToggleView} />}

      {assetsLoaded && infoPanelData && (
        <InfoPanel 
          buildingData={infoPanelData}
          isVisible={isPanelVisible}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handleBuildingLeave}
          onClose={handlePanelClose}
          onTransitionEnd={handlePanelTransitionEnd}
        />
      )}
    </div>
  );
};

export default App;
