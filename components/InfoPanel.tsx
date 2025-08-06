
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { BuildingDetails, Facility } from '../types';

interface InfoPanelProps {
    buildingData: BuildingDetails;
    isVisible: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClose: () => void;
    onTransitionEnd: () => void;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const FacilityCard: React.FC<{ facility: Facility }> = ({ facility }) => (
    <div className="mb-6 last:mb-0">
        <h4 className="text-xl font-bold text-emerald-300 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>{facility.name}</h4>
        <div className="grid grid-cols-1 gap-2">
            {facility.images.map((img, index) => (
                <div key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-md">
                    <img src={img} alt={`${facility.name} ${index + 1}`} className="w-full h-auto object-cover" loading="lazy" />
                </div>
            ))}
        </div>
    </div>
);

const InfoPanel: React.FC<InfoPanelProps> = ({ buildingData, isVisible, onMouseEnter, onMouseLeave, onClose, onTransitionEnd }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    const floors = useMemo(() => {
        const grouped: { [floor: string]: Facility[] } = {};
        buildingData.facilities.forEach(facility => {
            const floor = facility.floor || 'Facilities';
            if (!grouped[floor]) {
                grouped[floor] = [];
            }
            grouped[floor].push(facility);
        });
        
        const sortOrder = ['2nd Floor', '1st Floor', 'Ground Floor', 'Facilities'];
        return Object.entries(grouped).sort(([a], [b]) => {
            const indexA = sortOrder.indexOf(a);
            const indexB = sortOrder.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

    }, [buildingData]);

    const stopScrolling = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    useEffect(() => {
        const scrollElement = scrollContainerRef.current;
        if (!scrollElement) return;

        const handleUserInteraction = () => {
            stopScrolling();
        };

        if (isVisible) {
            const startScrolling = () => {
                scrollElement.scrollTop = 0;
                const totalScrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;
                if (totalScrollHeight <= 0) return;

                const scrollSpeed = 60; // pixels per second
                const duration = (totalScrollHeight / scrollSpeed) * 1000;
                let startTime: number | null = null;

                const animateScroll = (currentTime: number) => {
                    if (startTime === null) startTime = currentTime;
                    const elapsedTime = currentTime - startTime;
                    
                    if (elapsedTime >= duration) {
                        scrollElement.scrollTop = totalScrollHeight;
                        stopScrolling();
                        return;
                    }

                    const progress = elapsedTime / duration;
                    scrollElement.scrollTop = totalScrollHeight * progress;
                    animationFrameRef.current = requestAnimationFrame(animateScroll);
                };
                animationFrameRef.current = requestAnimationFrame(animateScroll);
            };

            // Wait for content to render and scrollHeight to be accurate
            const timerId = setTimeout(startScrolling, 100);

            scrollElement.addEventListener('wheel', handleUserInteraction, { passive: true });
            scrollElement.addEventListener('touchstart', handleUserInteraction, { passive: true });

            return () => {
                clearTimeout(timerId);
                stopScrolling();
                scrollElement.removeEventListener('wheel', handleUserInteraction);
                scrollElement.removeEventListener('touchstart', handleUserInteraction);
            };
        } else {
            stopScrolling();
        }
    }, [isVisible, buildingData, stopScrolling]);

    return (
        <aside
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTransitionEnd={onTransitionEnd}
            className={`absolute top-0 right-0 h-full w-full max-w-md bg-[#001e00] text-white z-[1500] shadow-2xl shadow-black/50 transform-gpu transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            aria-labelledby="info-panel-title"
            aria-hidden={!isVisible}
        >
            <div className="h-full flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-gray-700/50 flex-shrink-0">
                    <h2 id="info-panel-title" className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {buildingData.displayName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close panel"
                    >
                        <CloseIcon />
                    </button>
                </header>

                <div ref={scrollContainerRef} className="overflow-y-auto p-4 flex-grow">
                    {floors.map(([floor, facilities]) => (
                        <div key={floor} className="mb-6">
                             <h3 className="text-lg font-semibold text-gray-300 border-b-2 border-emerald-800/50 pb-2 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>{floor}</h3>
                            {facilities.map(facility => (
                                <FacilityCard key={facility.name} facility={facility} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default InfoPanel;
