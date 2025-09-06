'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaintBrushIcon,
  SwatchIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Theme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const predefinedThemes: Theme[] = [
  {
    name: 'Corporativo Azul',
    primary: '#004AAD',
    secondary: '#0066CC',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B'
  },
  {
    name: 'Elegante Oscuro',
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8'
  },
  {
    name: 'Verde Profesional',
    primary: '#059669',
    secondary: '#10B981',
    background: '#F0FDF4',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280'
  },
  {
    name: 'Gris Minimalista',
    primary: '#374151',
    secondary: '#4B5563',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280'
  },
  {
    name: 'Dorado Legal',
    primary: '#D97706',
    secondary: '#F59E0B',
    background: '#FFFBEB',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280'
  }
];

const chatBubbleStyles = [
  {
    name: 'Redondeado',
    class: 'rounded-2xl',
    preview: 'rounded-2xl'
  },
  {
    name: 'Cuadrado',
    class: 'rounded-md',
    preview: 'rounded-md'
  },
  {
    name: 'Burbujas',
    class: 'rounded-3xl',
    preview: 'rounded-3xl'
  },
  {
    name: 'Minimal',
    class: 'rounded-none border-l-4',
    preview: 'rounded-none border-l-4'
  }
];

export default function ThemeCustomizer({ isOpen, onClose }: ThemeCustomizerProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(predefinedThemes[0]);
  const [customTheme, setCustomTheme] = useState<Theme>({ ...predefinedThemes[0] });
  const [bubbleStyle, setBubbleStyle] = useState(chatBubbleStyles[0]);
  const [fontSize, setFontSize] = useState(14);
  const [darkMode, setDarkMode] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Aplicar tema al documento
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--chat-font-size', `${fontSize}px`);
    
    // Guardar en localStorage
    localStorage.setItem('lexi-theme', JSON.stringify({
      theme,
      bubbleStyle,
      fontSize,
      darkMode
    }));
  };

  // Cargar tema guardado
  useEffect(() => {
    const savedTheme = localStorage.getItem('lexi-theme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setSelectedTheme(parsed.theme);
        setCustomTheme(parsed.theme);
        setBubbleStyle(parsed.bubbleStyle || chatBubbleStyles[0]);
        setFontSize(parsed.fontSize || 14);
        setDarkMode(parsed.darkMode || false);
        applyTheme(parsed.theme);
      } catch (error) {
        console.error('Error loading saved theme:', error);
      }
    }
  }, []);

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    setCustomTheme({ ...theme });
    setIsCustomizing(false);
    applyTheme(theme);
  };

  const handleCustomThemeChange = (property: keyof Theme, value: string) => {
    const newTheme = { ...customTheme, [property]: value };
    setCustomTheme(newTheme);
    setIsCustomizing(true);
    applyTheme(newTheme);
  };

  const handleBubbleStyleChange = (style: typeof chatBubbleStyles[0]) => {
    setBubbleStyle(style);
    
    // Cambiar las clases de los mensajes dinámicamente
    const chatMessages = document.querySelectorAll('.chat-message-user, .chat-message-assistant');
    chatMessages.forEach(msg => {
      // Remover clases de bubble anteriores
      msg.classList.remove('bubble-rounded', 'bubble-square', 'bubble-circular', 'bubble-minimal');
      // Agregar la nueva clase
      switch(style.name) {
        case 'Redondeado':
          msg.classList.add('bubble-rounded');
          break;
        case 'Cuadrado':
          msg.classList.add('bubble-square');
          break;
        case 'Burbujas':
          msg.classList.add('bubble-circular');
          break;
        case 'Minimal':
          msg.classList.add('bubble-minimal');
          break;
      }
    });
    
    // Guardar cambio
    const savedTheme = localStorage.getItem('lexi-theme');
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      localStorage.setItem('lexi-theme', JSON.stringify({
        ...parsed,
        bubbleStyle: style
      }));
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    document.documentElement.style.setProperty('--chat-font-size', `${size}px`);
    // Guardar cambio
    const savedTheme = localStorage.getItem('lexi-theme');
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      localStorage.setItem('lexi-theme', JSON.stringify({
        ...parsed,
        fontSize: size
      }));
    }
  };

  const resetToDefault = () => {
    const defaultTheme = predefinedThemes[0];
    setSelectedTheme(defaultTheme);
    setCustomTheme({ ...defaultTheme });
    setBubbleStyle(chatBubbleStyles[0]);
    setFontSize(14);
    setDarkMode(false);
    setIsCustomizing(false);
    applyTheme(defaultTheme);
    localStorage.removeItem('lexi-theme');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-4 top-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personalizar Tema</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Temas Predefinidos */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Temas Predefinidos</h3>
            <div className="grid grid-cols-1 gap-3">
              {predefinedThemes.map((theme, index) => (
                <div
                  key={index}
                  className={`
                    relative p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedTheme.name === theme.name && !isCustomizing
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                      <div className="flex space-x-1 mt-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: theme.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: theme.surface }}
                        />
                      </div>
                    </div>
                    {selectedTheme.name === theme.name && !isCustomizing && (
                      <CheckIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colores Personalizados */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Personalizar Colores {isCustomizing && <span className="text-blue-600">(Activo)</span>}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color Primario
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customTheme.primary}
                    onChange={(e) => handleCustomThemeChange('primary', e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={customTheme.primary}
                    onChange={(e) => handleCustomThemeChange('primary', e.target.value)}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color Secundario
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customTheme.secondary}
                    onChange={(e) => handleCustomThemeChange('secondary', e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={customTheme.secondary}
                    onChange={(e) => handleCustomThemeChange('secondary', e.target.value)}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color de Fondo
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customTheme.background}
                    onChange={(e) => handleCustomThemeChange('background', e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={customTheme.background}
                    onChange={(e) => handleCustomThemeChange('background', e.target.value)}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estilo de Burbujas */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Estilo de Mensajes</h3>
            <div className="grid grid-cols-2 gap-2">
              {chatBubbleStyles.map((style, index) => (
                <div
                  key={index}
                  className={`
                    p-3 border-2 rounded-lg cursor-pointer transition-all text-center
                    ${bubbleStyle.name === style.name
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handleBubbleStyleChange(style)}
                >
                  <div className={`h-8 bg-blue-100 mb-2 ${style.preview}`} />
                  <p className="text-xs text-gray-700">{style.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tamaño de Fuente */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Tamaño de Fuente: {fontSize}px
            </h3>
            <input
              type="range"
              min="12"
              max="18"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>12px</span>
              <span>15px</span>
              <span>18px</span>
            </div>
          </div>

          {/* Vista Previa */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Vista Previa</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div 
                className={`max-w-xs ml-auto p-3 text-white text-sm ${bubbleStyle.class}`}
                style={{ 
                  backgroundColor: customTheme.primary,
                  fontSize: `${fontSize}px`
                }}
              >
                ¿Cuáles son mis derechos laborales en Panamá?
              </div>
              <div 
                className={`max-w-xs mr-auto p-3 border text-sm ${bubbleStyle.class}`}
                style={{ 
                  backgroundColor: customTheme.surface,
                  color: customTheme.text,
                  fontSize: `${fontSize}px`,
                  borderColor: customTheme.secondary
                }}
              >
                📖 Según el Código de Trabajo de Panamá, tienes derecho a...
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={resetToDefault}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Restaurar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}