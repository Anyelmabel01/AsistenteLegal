export default function Loading() {
  return (
    <div className="fixed inset-0 bg-secondary-50 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-bounce-subtle flex space-x-2">
          <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animation-delay-200"></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animation-delay-400"></div>
        </div>
        <p className="text-secondary-600 font-medium animate-pulse">Cargando...</p>
      </div>
    </div>
  );
} 