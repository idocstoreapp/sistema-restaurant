interface CategoryHeroProps {
  categoryName: string;
  categorySlug: string;
  categoryImage?: string | null;
}

export default function CategoryHero({ categoryName, categorySlug, categoryImage }: CategoryHeroProps) {
  // Mapeo de slugs a nombres de archivos de imagen conocidos
  const imageMap: Record<string, string> = {
    'entradas': 'entrada.png',
    'platillos': 'platillos.png',
    'shawarmas': 'shawarmas.png',
    'bebestibles': 'bebestibles.png',
    'postres': 'postre.png',
    'acompañamientos': 'salsas-acom.png',
    'menu-del-dia': 'menu-del-dia.png',
    'menu-fin-de-ano': 'menu-fin-ano-2pers.png',
    'sandwich': 'sandwich.png',
    'desayunos': 'desayuno.png',
    'desayuno': 'desayuno.png',
  };

  // Intentar obtener la imagen de la categoría
  let imagePath: string;
  if (categoryImage) {
    imagePath = categoryImage;
  } else {
    const imageName = imageMap[categorySlug] || `${categorySlug}.png`;
    // Si la imagen está en la raíz de public, no incluir la carpeta
    if (categorySlug === 'sandwich' || categorySlug === 'desayunos' || categorySlug === 'desayuno') {
      imagePath = `/${imageName}`;
    } else {
      imagePath = `/${categorySlug}/${imageName}`;
    }
  }

  return (
    <div className="relative w-full py-16 md:py-20 overflow-hidden">
      {/* Fondo con patrón sutil */}
      <div className="absolute inset-0 opacity-5 z-0" style={{ backgroundImage: "url('/fondo.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Imagen de la categoría - más abajo */}
          {imagePath && (
            <div className="relative flex-shrink-0 mt-8 md:mt-12">
              <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72">
                <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-2xl animate-pulse"></div>
                <img
                  src={imagePath}
                  alt={categoryName}
                  className="relative w-full h-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.5)] animate-float"
                  loading="eager"
                  onError={(e) => {
                    // Intentar rutas alternativas
                    const img = e.target as HTMLImageElement;
                    const currentSrc = img.src;
                    const baseUrl = currentSrc.split('/').slice(0, -1).join('/');
                    const altPaths = [
                      `${baseUrl}/${categorySlug}.png`,
                      `/${categorySlug}.png`,
                      `/${categorySlug}/${categorySlug}.png`,
                    ];
                    
                    let attemptIndex = 0;
                    const tryNext = () => {
                      if (attemptIndex < altPaths.length) {
                        img.src = altPaths[attemptIndex];
                        attemptIndex++;
                      } else {
                        // Si todas fallan, hacer la imagen semi-transparente en lugar de ocultarla
                        img.style.opacity = '0.3';
                      }
                    };
                    
                    img.onerror = tryNext;
                    tryNext();
                  }}
                />
              </div>
            </div>
          )}

          {/* Título de la categoría */}
          <div className="text-center md:text-left mt-8 md:mt-12">
            <h1 className="font-cinzel text-gold-400 text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4" style={{ textShadow: '0 0 30px rgba(212,175,55,0.4)' }}>
              {categoryName.toUpperCase()}
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gold-600 to-transparent mx-auto md:mx-0"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

