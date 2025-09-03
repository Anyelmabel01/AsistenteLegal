'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PaintBrushIcon, SwatchIcon } from '@heroicons/react/24/outline';

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'sharp' | 'rounded' | 'very-rounded';
}

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#004AAD',
  accentColor: '#D4AF37',
  backgroundColor: '#FFFFFF',
  textColor: '#1E2A38',
  fontSize: 'medium',
  borderRadius: 'rounded'
};

const colorPresets = [
  { name: 'Azul Legal', primary: '#004AAD', accent: '#D4AF37' },
  { name: 'Verde Profesional', primary: '#065F46', accent: '#10B981' },
  { name: 'Púrpura Corporativo', primary: '#7C3AED', accent: '#A78BFA' },
  { name: 'Rojo Elegante', primary: '#DC2626', accent: '#F87171' },
  { name: 'Gris Moderno', primary: '#374151', accent: '#9CA3AF' },
];

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('legal-assistant-theme');
    if (savedTheme) {
      setTheme(JSON.parse(savedTheme));
    }
  }, []);

  useEffect(() => {
    // Apply theme to CSS variables
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primaryColor);
      root.style.setProperty('--theme-accent', theme.accentColor);
      root.style.setProperty('--theme-background', theme.backgroundColor);
      root.style.setProperty('--theme-text', theme.textColor);
      
      // Font size
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      root.style.setProperty('--theme-font-size', fontSizeMap[theme.fontSize]);
      
      // Border radius
      const radiusMap = {
        sharp: '0px',
        rounded: '8px',
        'very-rounded': '16px'
      };
      root.style.setProperty('--theme-border-radius', radiusMap[theme.borderRadius]);
      
      // Save to localStorage
      localStorage.setItem('legal-assistant-theme', JSON.stringify(theme));
    }
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    updateTheme({
      primaryColor: preset.primary,
      accentColor: preset.accent
    });
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('legal-assistant-theme');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-steel-200">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="w-5 h-5 text-navy-600" />
            <h2 className="text-lg font-semibold text-navy">Personalizar Tema</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-steel-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-navy-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Color Presets */}
          <div>
            <h3 className="text-sm font-medium text-navy-700 mb-3">Temas Predefinidos</h3>
            <div className="grid grid-cols-1 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="flex items-center justify-between p-3 border border-steel-200 rounded-lg hover:border-royal transition-colors"
                >
                  <span className="text-sm font-medium text-navy-600">{preset.name}</span>
                  <div className="flex space-x-1">
                    <div
                      className="w-4 h-4 rounded-full border border-steel-300"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-steel-300"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <h3 className="text-sm font-medium text-navy-700 mb-3">Colores Personalizados</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1">
                  Color Principal
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-8 h-8 border border-steel-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-steel-200 rounded text-sm"
                    placeholder="#004AAD"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1">
                  Color de Acento
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-8 h-8 border border-steel-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-steel-200 rounded text-sm"
                    placeholder="#D4AF37"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="text-sm font-medium text-navy-700 mb-3">Tipografía</h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-navy-600 mb-1">
                Tamaño de Fuente
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateTheme({ fontSize: size })}
                    className={`
                      px-3 py-2 text-sm rounded-lg border transition-colors
                      ${theme.fontSize === size
                        ? 'border-royal bg-royal-50 text-royal'
                        : 'border-steel-200 text-navy-600 hover:border-royal'
                      }
                    `}
                  >
                    {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <h3 className="text-sm font-medium text-navy-700 mb-3">Estilo de Bordes</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['sharp', 'rounded', 'very-rounded'] as const).map((radius) => (
                <button
                  key={radius}
                  onClick={() => updateTheme({ borderRadius: radius })}
                  className={`
                    px-3 py-2 text-sm border transition-colors
                    ${radius === 'sharp' ? 'rounded-none' : 
                      radius === 'rounded' ? 'rounded-lg' : 'rounded-2xl'}
                    ${theme.borderRadius === radius
                      ? 'border-royal bg-royal-50 text-royal'
                      : 'border-steel-200 text-navy-600 hover:border-royal'
                    }
                  `}
                >
                  {radius === 'sharp' ? 'Recto' : 
                   radius === 'rounded' ? 'Redondeado' : 'Muy Redondeado'}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-navy-700 mb-3">Vista Previa</h3>
            <div className="border border-steel-200 rounded-lg p-4 space-y-3">
              <div 
                className="px-4 py-2 rounded text-white text-sm font-medium"
                style={{ 
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.borderRadius === 'sharp' ? '0px' : 
                               theme.borderRadius === 'rounded' ? '8px' : '16px',
                  fontSize: theme.fontSize === 'small' ? '14px' :
                          theme.fontSize === 'medium' ? '16px' : '18px'
                }}
              >
                Botón Principal
              </div>
              <div 
                className="px-4 py-2 border text-sm"
                style={{ 
                  borderColor: theme.accentColor,
                  color: theme.accentColor,
                  borderRadius: theme.borderRadius === 'sharp' ? '0px' : 
                               theme.borderRadius === 'rounded' ? '8px' : '16px',
                  fontSize: theme.fontSize === 'small' ? '14px' :
                          theme.fontSize === 'medium' ? '16px' : '18px'
                }}
              >
                Botón Secundario
              </div>
              <p 
                className="text-sm"
                style={{ 
                  color: theme.textColor,
                  fontSize: theme.fontSize === 'small' ? '14px' :
                          theme.fontSize === 'medium' ? '16px' : '18px'
                }}
              >
                Este es un texto de ejemplo que muestra cómo se verá con el tema seleccionado.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-steel-200">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 text-sm text-navy-600 hover:text-navy-700 transition-colors"
          >
            Restaurar Original
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-royal text-white rounded-lg hover:bg-royal-600 transition-colors text-sm font-medium"
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;