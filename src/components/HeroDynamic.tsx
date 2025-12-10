import { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface HeroDynamicProps {
  categories: Category[];
}

export default function HeroDynamic({ categories }: HeroDynamicProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Mapeo de slugs a nombres de archivos de imagen conocidos
    const imageMap: Record<string, string> = {
      'entradas': 'entrada.png',
      'platillos': 'platillos.png',
      'shawarmas': 'shawarmas.png',
      'promociones': 'shawarmas.png', // Usa la misma imagen de shawarmas
      'bebestibles': 'bebestibles.png',
      'postres': 'postre.png',
      'acompañamientos': 'salsas-acomp.png',
      'menu-del-dia': 'menu-del-dia.png',
      'menu-fin-de-ano': 'menu-fin-ano-8.png',
      'sandwich': 'sandwich.png',
      'desayunos': 'desayuno.png',
      'desayuno': 'desayuno.png',
    };

    // Obtener imágenes de las carpetas de categorías
    const categoryImages: string[] = [];
    
    categories.forEach((category) => {
      // Buscar imagen específica para esta categoría
      const imageName = imageMap[category.slug] || `${category.slug}.png`;
      // Si la imagen está en la raíz de public, no incluir la carpeta
      let imagePath: string;
      if (category.slug === 'sandwich' || category.slug === 'desayunos' || category.slug === 'desayuno') {
        imagePath = `/${imageName}`;
      } else if (category.slug === 'menu-del-dia') {
        // menu-del-dia tiene punto en la carpeta, no guión
        imagePath = `/menu-del.dia/${imageName}`;
      } else if (category.slug === 'promociones') {
        // promociones usa la imagen de shawarmas
        imagePath = `/shawarmas/${imageName}`;
      } else {
        imagePath = `/${category.slug}/${imageName}`;
      }
      categoryImages.push(imagePath);
    });

    setImages(categoryImages);
  }, [categories]);

  useEffect(() => {
    if (images.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 2) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Para móvil: mostrar 2 imágenes en carrusel
  const mobileImages = images.slice(currentIndex, currentIndex + 2).concat(
    images.slice(0, Math.max(0, 2 - (images.length - currentIndex)))
  );

  // Posiciones y tamaños para desktop - arriba del logo
  const getImageStyle = (index: number) => {
    const positions = [
      { top: '5%', left: '5%', width: '100px', height: '100px' },
      { top: '8%', right: '8%', width: '90px', height: '90px' },
      { top: '20%', left: '3%', width: '110px', height: '110px' },
      { top: '25%', right: '5%', width: '95px', height: '95px' },
      { top: '35%', left: '8%', width: '105px', height: '105px' },
      { top: '40%', right: '10%', width: '100px', height: '100px' },
    ];
    
    const position = positions[index % positions.length];
    const rotation = (index % 3) * 5 - 5; // Rotación entre -5 y 5 grados
    
    return {
      ...position,
      transform: `rotate(${rotation}deg)`,
      filter: 'drop-shadow(0 10px 20px rgba(212, 175, 55, 0.3))',
    };
  };

  if (images.length === 0) return null;

  return (
    <>
      {/* Hero Desktop: Imágenes flotantes decorativas - arriba del logo */}
      <div className="hidden md:block absolute top-0 left-0 right-0 h-[60vh] overflow-hidden pointer-events-none z-0">
        {images.slice(0, 6).map((image, index) => {
          const style = getImageStyle(index);
          // Extraer el slug de la ruta de la imagen
          const imageSlug = image.split('/')[1] || '';
          return (
            <div
              key={`desktop-${index}`}
              className="absolute animate-float-slow"
              style={style}
            >
              <img
                src={image}
                alt={`Decoración ${index + 1}`}
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(212, 175, 55, 0.3))',
                }}
                loading="lazy"
                onError={(e) => {
                  // Intentar con nombre alternativo
                  const img = e.target as HTMLImageElement;
                  const currentSrc = img.src;
                  const altPaths = [
                    `/${imageSlug}/${imageSlug}.png`,
                    `/${imageSlug}.png`,
                  ];
                  
                  let attemptIndex = 0;
                  const tryNext = () => {
                    if (attemptIndex < altPaths.length) {
                      img.src = altPaths[attemptIndex];
                      attemptIndex++;
                    } else {
                      img.style.opacity = '0.3';
                    }
                  };
                  
                  img.onerror = tryNext;
                  tryNext();
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Hero Mobile: Carrusel de 2 imágenes - arriba del logo */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-[50vh] overflow-hidden pointer-events-none z-0">
        <div className="relative w-full h-full flex items-center justify-center gap-4 pt-8">
          {mobileImages.slice(0, 2).map((image, index) => {
            const imageSlug = image.split('/')[1] || '';
            return (
              <div
                key={`mobile-${currentIndex + index}`}
                className="relative animate-float-slow"
                style={{
                  width: '120px',
                  height: '120px',
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <img
                  src={image}
                  alt={`Plato ${index + 1}`}
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 10px 25px rgba(212, 175, 55, 0.4))',
                  }}
                  loading="lazy"
                  onError={(e) => {
                    // Intentar con nombre alternativo
                    const img = e.target as HTMLImageElement;
                    const currentSrc = img.src;
                    const altPaths = [
                      `/${imageSlug}/${imageSlug}.png`,
                      `/${imageSlug}.png`,
                    ];
                    
                    let attemptIndex = 0;
                    const tryNext = () => {
                      if (attemptIndex < altPaths.length) {
                        img.src = altPaths[attemptIndex];
                        attemptIndex++;
                      } else {
                        img.style.opacity = '0.3';
                      }
                    };
                    
                    img.onerror = tryNext;
                    tryNext();
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-float-slow:nth-child(2n) {
          animation-delay: 1s;
        }

        .animate-float-slow:nth-child(3n) {
          animation-delay: 2s;
        }
      `}</style>
    </>
  );
}

