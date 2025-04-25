import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Asistente Legal
        </Link>
        <div className="space-x-4">
          <Link href="/documentos" className="hover:text-gray-300">
            Documentos Legales
          </Link>
          {/* Agrega más enlaces aquí si es necesario */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 