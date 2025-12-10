import { useEffect, useRef } from 'react';

interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  video_url?: string | null;
  is_available: boolean;
  is_featured?: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageContainerRef.current) return;

    // Generar delay aleatorio entre 0 y 12 segundos
    const randomDelay = Math.random() * 12;
    // Duración aleatoria entre 12 y 15 segundos
    const randomDuration = 12 + Math.random() * 3;

    // Aplicar a la imagen o video
    const img = imageContainerRef.current.querySelector('img, video');
    if (img) {
      (img as HTMLElement).style.animationDelay = `${randomDelay}s`;
      (img as HTMLElement).style.animationDuration = `${randomDuration}s`;
      (img as HTMLElement).style.willChange = 'transform';
    }

    // Crear o actualizar elemento flash
    if (flashRef.current) {
      flashRef.current.style.animationDelay = `${randomDelay}s`;
      flashRef.current.style.animationDuration = `${randomDuration}s`;
      flashRef.current.style.animation = `flashReflection ${randomDuration}s ease-in-out infinite`;
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  return (
    <div 
      className="menu-card group"
      data-item-id={item.id}
    >
      <div className="relative border-gold-elegant rounded-lg overflow-hidden bg-black/70 backdrop-blur-sm transition-all duration-300">
        {(item.video_url || item.image_url) && (
          <div 
            ref={imageContainerRef}
            className="relative h-48 overflow-hidden menu-image-container"
          >
            {item.video_url ? (
              <video
                src={item.video_url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : null}
            
            {/* Flash overlay */}
            <div 
              ref={flashRef}
              className="flash-overlay absolute pointer-events-none"
              style={{
                top: '-50%',
                left: '-200%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(135deg, transparent 0%, transparent 25%, rgba(255, 255, 255, 0.6) 42%, rgba(255, 255, 255, 0.9) 48%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.9) 52%, rgba(255, 255, 255, 0.6) 58%, transparent 75%, transparent 100%)',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center center',
                zIndex: 10,
                opacity: 0
              }}
            />
            
            {item.is_featured && (
              <div className="absolute top-3 right-3 bg-gold-500 text-black px-2 py-1 rounded text-xs font-bold z-20">
                ⭐ DESTACADO
              </div>
            )}
          </div>
        )}
        <div className="p-4">
          <h3 className="text-gold-400 font-cinzel text-xl font-bold mb-2">{item.name}</h3>
          {item.description && (
            <p className="text-gold-200 text-sm mb-3">{item.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gold-300 font-bold text-lg">{formatPrice(item.price)}</span>
            {!item.is_available && (
              <span className="bg-red-600 text-white px-3 py-1 rounded text-xs">No disponible</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
