
import React, { useState, useRef } from 'react';
import { LAYER_IMAGES, BUILDINGS_DATA } from '../constants';
import { BuildingData } from '../types';

// --- Reusable Components ---

// 1. Tooltip Component
interface TooltipProps {
    building: BuildingData | null;
    position: { x: number, y: number };
}

const Tooltip: React.FC<TooltipProps> = ({ building, position }) => {
    if (!building) return null;

    return (
        <div
            className="bg-black/80 backdrop-blur-sm text-white text-base font-bold px-4 py-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-fade-in"
            style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(15px, -30px)', // Position near cursor
                zIndex: 999, // Always on top
            }}
        >
            {building.name}
        </div>
    );
};


// 2. Non-interactive Map Layer
interface MapLayerProps {
    src: string;
    alt: string;
    zIndex: number;
    visible: boolean;
}

const MapLayer: React.FC<MapLayerProps> = React.memo(({ src, alt, zIndex, visible }) => (
    <img
        src={src}
        alt={alt}
        className={`absolute top-0 left-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex }}
        draggable="false"
    />
));


// 3. Building Item with CSS Masking for Pixel-Perfect Hit Detection
interface BuildingItemProps {
    data: BuildingData;
    isHovered: boolean;
    onHoverChange: (data: BuildingData | null) => void;
}

const BuildingItem: React.FC<BuildingItemProps> = React.memo(({ data, isHovered, onHoverChange }) => {
    // Style for the link to make its clickable area match the image's opaque pixels.
    const maskStyle: React.CSSProperties = {
        WebkitMaskImage: `url(${data.imageUrl})`,
        maskImage: `url(${data.imageUrl})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        zIndex: isHovered ? 60 : 40,
    };

    return (
        <a
            href={data.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => onHoverChange(data)}
            onMouseLeave={() => onHoverChange(null)}
            className="absolute top-0 left-0 w-full h-full"
            style={maskStyle}
            draggable="false"
            aria-label={data.name}
        >
            {/* This image is now purely for visual display and does not capture mouse events. */}
            <img
                src={data.imageUrl}
                alt="" // Alt text is on the parent link for accessibility
                className={`absolute top-0 left-0 w-full h-full object-contain transition-transform duration-300 ease-in-out pointer-events-none ${isHovered ? 'scale-[1.01]' : 'scale-100'}`}
                draggable="false"
                aria-hidden="true"
            />
        </a>
    );
});


// --- Main Map Component (with Centralized State) ---
interface MapProps {
    showWalkways: boolean;
    showRoads: boolean;
    showBuildings: boolean;
    hasInteracted: boolean;
    audioRef: React.RefObject<HTMLAudioElement>;
}

const Map: React.FC<MapProps> = ({ showWalkways, showRoads, showBuildings, hasInteracted, audioRef }) => {
    const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const mapRef = useRef<HTMLDivElement>(null);

    const handleHoverChange = (building: BuildingData | null) => {
        // Only play sound when hovering onto a new building
        if (building && building.name !== hoveredBuilding?.name) {
            if (hasInteracted && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(error => {
                    // This error is non-critical, so we log it but don't disrupt the user.
                    console.error("Audio play failed:", error);
                });
            }
        }
        setHoveredBuilding(building);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (mapRef.current) {
            const rect = mapRef.current.getBoundingClientRect();
            setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    return (
        <div
            ref={mapRef}
            className="relative w-[1920px] h-[1080px] flex-shrink-0"
            style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => handleHoverChange(null)} // Clear hover when leaving map area
        >
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.15s ease-out;
                }
                `}
            </style>

            <MapLayer src={LAYER_IMAGES.surface} alt="Resort Surface" zIndex={10} visible={true} />
            <MapLayer src={LAYER_IMAGES.walkway} alt="Walkways" zIndex={20} visible={showWalkways} />
            <MapLayer src={LAYER_IMAGES.roads} alt="Roads" zIndex={30} visible={showRoads} />

            {showBuildings && (
                 <div className="absolute top-0 left-0 w-full h-full transition-opacity duration-500">
                    {BUILDINGS_DATA.map((building) => (
                        <BuildingItem 
                            key={building.name} 
                            data={building} 
                            isHovered={hoveredBuilding?.name === building.name}
                            onHoverChange={handleHoverChange}
                        />
                    ))}
                </div>
            )}
            
            <MapLayer src={LAYER_IMAGES.trees} alt="Trees" zIndex={50} visible={true} />

            {/* A single, centralized tooltip for better performance */}
            <Tooltip building={hoveredBuilding} position={mousePosition} />
        </div>
    );
};

export default Map;
