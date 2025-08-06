
import React, { useMemo, CSSProperties } from 'react';
import { Layer } from '../types';
import { NON_INTERACTIVE_LAYER_NAMES } from '../constants';
import { capitalizeWords } from '../utils';

interface MapLayerProps {
  layer: Layer;
  isHovered: boolean;
  onEnter: (name: string) => void;
  onLeave: () => void;
}

const Tooltip: React.FC<{ name: string }> = ({ name }) => (
  <div 
    className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full px-8 py-4 bg-black/75 text-white text-4xl rounded-xl shadow-lg whitespace-nowrap pointer-events-none z-[101]"
    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
  >
    {name}
  </div>
);

const PermanentLabel: React.FC<{ name: string }> = ({ name }) => (
  <div 
    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-5 py-2 bg-black/75 text-white text-3xl rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
  >
    {name}
  </div>
);


const MapLayer: React.FC<MapLayerProps> = ({ layer, isHovered, onEnter, onLeave }) => {
  const isInteractive = !NON_INTERACTIVE_LAYER_NAMES.includes(layer.name);

  const displayName = useMemo(() => {
    if (layer.name === 'Parking 1' || layer.name === 'Parking 2') {
        return 'Parking';
    }
    return layer.name;
  }, [layer.name]);

  const handleMouseEnter = () => {
    if (isInteractive) {
      onEnter(layer.name);
    }
  };
  
  const handleMouseLeave = () => {
    if (isInteractive) {
      onLeave();
    }
  };

  const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
    if (isInteractive) {
      // Stop the event from bubbling up to the map's pan/drag handlers
      e.stopPropagation();
      onEnter(layer.name);
    }
  };

  const style: CSSProperties = useMemo(() => ({
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    zIndex: isInteractive ? (isHovered ? 100 : layer.index) : layer.index,
    pointerEvents: isInteractive ? 'auto' : 'none',
    userSelect: 'none',
  }), [layer, isHovered, isInteractive]);

  return (
    <div
      style={style}
      className="absolute"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handlePress}
      onTouchStart={handlePress}
    >
      <img
        src={layer.url}
        alt={layer.name}
        className={`w-full h-full object-contain transition-transform duration-200 ease-in-out ${isInteractive ? 'cursor-pointer' : ''} ${isHovered ? 'scale-110' : 'scale-100'}`}
        style={{ transformOrigin: 'center center' }}
        draggable="false"
      />
      {isHovered && <Tooltip name={capitalizeWords(displayName)} />}
      {layer.name === 'Entrance' && <PermanentLabel name={capitalizeWords(layer.name)} />}
    </div>
  );
};

export default React.memo(MapLayer);
