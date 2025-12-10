import { useEffect, useState, useRef } from 'react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface NavigationMenuProps {
  categories: Category[];
  currentSlug?: string;
}

export default function NavigationMenu({ categories, currentSlug }: NavigationMenuProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Si hay una categoría activa, mostrar el navbar inmediatamente
    if (currentSlug) {
      setIsScrolled(true);
    } else {
      // Verificar estado inicial
      handleScroll();
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSlug]);

  // Scroll automático a la categoría activa al cargar
  useEffect(() => {
    if (currentSlug && menuRef.current) {
      const activeLink = menuRef.current.querySelector(`a[href="/${currentSlug}"]`);
      if (activeLink) {
        setTimeout(() => {
          activeLink.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
          });
        }, 200);
      }
    }
  }, [currentSlug]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/95 backdrop-blur-md shadow-lg border-b border-gold-600/20 transform ${
        isScrolled || currentSlug ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 py-1.5">
        {/* Logo pequeño y botón imprimir */}
        <div className="flex items-center justify-between mb-1">
          <a
            href="/"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo-cropped.png"
              alt="Gourmet Árabe"
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
            <span className="font-cinzel text-gold-400 text-sm md:text-base font-semibold hidden sm:block">
              GOURMET ÁRABE
            </span>
          </a>
          <a
            href="/menu-imprimible"
            className="text-gold-400/60 hover:text-gold-400 text-xs px-2 py-0.5 border border-gold-600/30 rounded hover:border-gold-600/50 transition-colors"
            title="Versión imprimible"
          >
            📄
          </a>
        </div>

        {/* Menú horizontal con scroll - más compacto */}
        <div className="relative" ref={menuRef}>
          <div 
            className="overflow-x-auto scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="flex gap-1.5 pb-0.5" style={{ minWidth: 'max-content' }}>
              {categories.map((category) => {
                const isActive = currentSlug === category.slug;
                return (
                  <a
                    key={category.id}
                    href={`/${category.slug}`}
                    className={`
                      flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium
                      transition-all duration-200 whitespace-nowrap
                      ${
                        isActive
                          ? 'bg-gold-600 text-black shadow-sm shadow-gold-600/30'
                          : 'bg-gold-600/8 text-gold-300/80 border border-gold-600/15 hover:bg-gold-600/20 hover:border-gold-600/30 hover:text-gold-200'
                      }
                    `}
                  >
                    {category.name}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}
