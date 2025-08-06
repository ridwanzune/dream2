
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layer } from '../types';
import { MAP_DIMENSIONS } from '../constants';
import MapLayer from './MapLayer';
import Clouds from './Clouds';

interface InteractiveMapProps {
  layers: Layer[];
  playHoverSound: () => void;
  onBuildingEnter: (name: string) => void;
  onBuildingLeave: () => void;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const InteractiveMap: React.FC<InteractiveMapProps> = ({ layers, playHoverSound, onBuildingEnter, onBuildingLeave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLayerName, setHoveredLayerName] = useState<string | null>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pinchDist, setPinchDist] = useState(0);

  const handleHover = useCallback((name: string | null) => {
    setHoveredLayerName(name);
    if (name) {
        playHoverSound();
        onBuildingEnter(name);
    }
  }, [playHoverSound, onBuildingEnter]);

  const getClampedPosition = (pos: {x: number, y: number}, newScale: number) => {
    if (!containerRef.current) return pos;
    const { clientWidth, clientHeight } = containerRef.current;
    
    const worldWidth = MAP_DIMENSIONS.width * newScale;
    const worldHeight = MAP_DIMENSIONS.height * newScale;

    const minX = clientWidth - worldWidth;
    const minY = clientHeight - worldHeight;
    const maxX = 0;
    const maxY = 0;
    
    // If map is smaller than container, allow it to be centered
    const finalMinX = worldWidth < clientWidth ? (clientWidth - worldWidth) / 2 : minX;
    const finalMaxX = worldWidth < clientWidth ? (clientWidth - worldWidth) / 2 : maxX;
    const finalMinY = worldHeight < clientHeight ? (clientHeight - worldHeight) / 2 : minY;
    const finalMaxY = worldHeight < clientHeight ? (clientHeight - worldHeight) / 2 : maxY;

    return {
      x: clamp(pos.x, finalMinX, finalMaxX),
      y: clamp(pos.y, finalMinY, finalMaxY),
    };
  }

  const calculateInitialView = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = clientWidth / MAP_DIMENSIONS.width;
      const scaleY = clientHeight / MAP_DIMENSIONS.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      const clampedScale = clamp(initialScale, MIN_SCALE, MAX_SCALE);
      setScale(clampedScale);
      
      const initialPos = {
        x: (clientWidth - MAP_DIMENSIONS.width * clampedScale) / 2,
        y: (clientHeight - MAP_DIMENSIONS.height * clampedScale) / 2,
      };
      setPosition(getClampedPosition(initialPos, clampedScale));
    }
  }, []);

  useEffect(() => {
    calculateInitialView();
    window.addEventListener('resize', calculateInitialView);
    return () => window.removeEventListener('resize', calculateInitialView);
  }, [calculateInitialView]);

  const sortedLayers = [...layers].sort((a, b) => a.index - b.index);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

    const mapX = (mouseX - position.x) / scale;
    const mapY = (mouseY - position.y) / scale;

    const newPosition = {
      x: mouseX - mapX * clampedScale,
      y: mouseY - mapY * clampedScale,
    };
    
    setScale(clampedScale);
    setPosition(getClampedPosition(newPosition, clampedScale));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPosition(getClampedPosition(newPosition, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
        setIsDragging(true);
        setDragStart({
            x: e.touches[0].clientX - position.x,
            y: e.touches[0].clientY - position.y,
        });
    } else if (e.touches.length === 2) {
        setIsDragging(false);
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        setPinchDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
        const newPosition = {
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        };
        setPosition(getClampedPosition(newPosition, scale));
    } else if (e.touches.length === 2) {
        if (!containerRef.current) return;
        const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        
        if (pinchDist === 0) {
            setPinchDist(newDist);
            return;
        }

        const zoomFactor = newDist / pinchDist;
        const newScale = scale * zoomFactor;
        const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

        const rect = containerRef.current.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        const mapX = (midX - position.x) / scale;
        const mapY = (midY - position.y) / scale;

        const newPosition = {
          x: midX - mapX * clampedScale,
          y: midY - mapY * clampedScale,
        };

        setScale(clampedScale);
        setPosition(getClampedPosition(newPosition, clampedScale));
        setPinchDist(newDist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setPinchDist(0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredLayerName(null);
    onBuildingLeave();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          width: MAP_DIMENSIONS.width,
          height: MAP_DIMENSIONS.height,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
        onMouseLeave={() => setHoveredLayerName(null)}
      >
        <Clouds />
        {sortedLayers.map(layer => (
          <MapLayer
            key={layer.index}
            layer={layer}
            isHovered={hoveredLayerName === layer.name}
            onEnter={handleHover}
            onLeave={onBuildingLeave}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveMap;
