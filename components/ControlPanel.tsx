import React from 'react';
import { TOGGLEABLE_LAYERS, BUILDING_LAYER_NAMES, OTHER_FEATURES_LAYER_NAMES } from '../constants';

interface ControlPanelProps {
  hiddenLayers: Set<string>;
  onToggle: (layerName: string) => void;
}

const Toggle: React.FC<{
  label: string;
  layerName: string;
  isChecked: boolean;
  onToggle: (layerName: string) => void;
}> = ({ label, layerName, isChecked, onToggle }) => {
  return (
    <label htmlFor={layerName} className="flex items-center cursor-pointer select-none flex-shrink-0">
      <div className="relative">
        <input
          type="checkbox"
          id={layerName}
          className="sr-only"
          checked={isChecked}
          onChange={() => onToggle(layerName)}
        />
        <div className={`block w-8 h-4 rounded-full transition-colors ${isChecked ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
        <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${isChecked ? 'transform translate-x-4' : ''}`}></div>
      </div>
      <div
        className="ml-1.5 text-white font-semibold text-xs"
        style={{ fontFamily: 'Orbitron, sans-serif' }}
      >
        {label}
      </div>
    </label>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ hiddenLayers, onToggle }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 py-1 bg-black/50 backdrop-blur-sm z-[1000]">
      <div className="container mx-auto flex justify-center items-center gap-x-3 px-2 sm:gap-x-4">
        {Object.entries(TOGGLEABLE_LAYERS).map(([label, layerIdentifier]) => {
          let isChecked;
          if (label === 'Buildings') {
            isChecked = BUILDING_LAYER_NAMES.every(name => !hiddenLayers.has(name));
          } else if (label === 'Features') {
            isChecked = OTHER_FEATURES_LAYER_NAMES.every(name => !hiddenLayers.has(name));
          } else {
            isChecked = !hiddenLayers.has(layerIdentifier);
          }

          return (
            <Toggle
              key={label}
              label={label}
              layerName={layerIdentifier}
              isChecked={isChecked}
              onToggle={onToggle}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ControlPanel;