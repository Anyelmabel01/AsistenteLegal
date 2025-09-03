export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-steel-50 via-white to-royal-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-steel-200"></div>
          <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-royal"></div>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2 text-gold">⚖️</div>
          <p className="text-navy font-semibold text-lg">Cargando Lexi</p>
          <p className="text-navy-600 text-sm animate-pulse">Preparando tu experiencia jurídica...</p>
        </div>
      </div>
    </div>
  );
} 