import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, onClose, src, alt }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => {
    const newScale = Math.max(prev - 0.5, 1);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
    return newScale;
  });
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `foto-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 text-white z-10">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg hidden md:block">{alt || 'Visualização de Imagem'}</h3>
              <div className="flex items-center bg-white/10 rounded-2xl p-1 border border-white/10">
                <button 
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="px-3 text-sm font-mono w-16 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button 
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button 
                  onClick={handleReset}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title="Resetar"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownload}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
              <button 
                onClick={onClose}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <motion.img
              src={src}
              alt={alt}
              animate={{ 
                scale,
                x: position.x,
                y: position.y,
              }}
              transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-full max-h-full object-contain pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Footer Info */}
          <div className="p-4 text-center text-white/40 text-xs font-medium">
            Use o mouse para arrastar quando houver zoom • Esc para fechar
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
