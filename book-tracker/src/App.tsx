// src/App.tsx
import { useState, useEffect } from 'react';
import BookCard from './components/BookCard';
import type { BookType } from './components/BookCard';
import SearchBar from './components/SearchBar';
import { supabase } from './lib/supabase';

// Nova tipagem para o nosso agrupamento por autor
type GroupedLibrary = {
  authorName: string;
  books: BookType[];
};

export default function App() {
  const [topFilter, setTopFilter] = useState('read');
  const [sideFilter, setSideFilter] = useState('standalone');

  // Estado que vai guardar os livros reais
  const [libraryData, setLibraryData] = useState<GroupedLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const topNavItems = ['Read', 'Want to read', 'Favorites', 'Manga', 'Owned'];

  // Busca os dados ao Supabase quando a página carrega
  useEffect(() => {
    fetchMyLibrary();
  }, []);

  const fetchMyLibrary = async () => {
    setIsLoading(true);

    // O !inner garante que só trazemos livros que estão na SUA biblioteca
    const { data, error } = await supabase
      .from('books')
      .select(`
        id,
        title,
        genres,
        available_in_pt,
        available_in_audio,
        authors ( name ),
        user_library!inner ( status, rating, review )
      `);

    if (error) {
      console.error('Erro a buscar livros:', error);
      setIsLoading(false);
      return;
    }

    // Agrupar os livros por Autor para encaixar no seu layout
    const grouped = data.reduce((acc: any, curr: any) => {
      // O Supabase pode retornar a relação num array ou objeto. Tratamos ambos:
      const author = Array.isArray(curr.authors) ? curr.authors[0]?.name : curr.authors?.name || 'Desconhecido';
      const lib = Array.isArray(curr.user_library) ? curr.user_library[0] : curr.user_library;

      if (!acc[author]) acc[author] = [];

      acc[author].push({
        id: curr.id,
        title: curr.title,
        genres: curr.genres || [],
        available_in_pt: curr.available_in_pt,
        available_in_audio: curr.available_in_audio,
        user_library: lib
      });
      return acc;
    }, {});

    // Converter o objeto num array para o React conseguir mapear
    const formattedData = Object.keys(grouped).map(author => ({
      authorName: author,
      books: grouped[author]
    }));

    setLibraryData(formattedData);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl border-4 border-purple-400 bg-white p-6 rounded-lg shadow-sm">

        {/* Barra de Pesquisa */}
        <SearchBar onBookAdded={fetchMyLibrary} />
        {/* Top Navigation */}
        <div className="border-4 border-purple-400 p-4 mb-6 flex gap-8 justify-center items-center rounded-sm">
          {topNavItems.map(item => (
            <button
              key={item}
              onClick={() => setTopFilter(item.toLowerCase())}
              className={`font-bold capitalize hover:text-purple-600 transition-colors ${topFilter === item.toLowerCase() ? 'text-purple-600 underline decoration-2 underline-offset-4' : 'text-black'
                }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-32 border-4 border-purple-400 p-4 flex flex-col gap-4 rounded-sm h-fit">
            <button
              onClick={() => setSideFilter('series')}
              className={`font-bold text-left hover:text-purple-600 ${sideFilter === 'series' ? 'text-purple-600' : 'text-black'}`}
            >
              Series
            </button>
            <button
              onClick={() => setSideFilter('standalone')}
              className={`font-bold text-left hover:text-purple-600 ${sideFilter === 'standalone' ? 'text-purple-600' : 'text-black'}`}
            >
              Standalone
            </button>
          </div>

          {/* Main Content Area (Renderização Dinâmica) */}
          <div className="flex-1 flex flex-col gap-8">
            {isLoading ? (
              <p className="text-gray-500 font-medium animate-pulse">Carregando a sua biblioteca...</p>
            ) : (() => {
              // Filtra os dados em tempo real com base na aba que você clicou no topo
              const displayData = libraryData
                .map(group => ({
                  ...group,
                  books: group.books.filter(book => book.user_library?.status === topFilter)
                }))
                .filter(group => group.books.length > 0);

              if (displayData.length === 0) {
                return <p className="text-gray-500 font-medium">Nenhum livro nesta aba ainda.</p>;
              }

              return displayData.map((group, index) => (
                <div key={index} className="flex flex-col gap-4">
                  {/* Header do Autor */}
                  <div className="flex items-center gap-2 text-orange-500 font-bold">
                    <span className="text-black">→</span>
                    <span>Obras de</span>
                    <button className="underline hover:text-orange-600 cursor-pointer">
                      {group.authorName}
                    </button>
                    <span className="text-black">-</span>
                    <span className="text-orange-400">{group.books.length} livros</span>
                  </div>

                  {/* Lista de Livros do Autor */}
                  <div className="flex flex-wrap gap-4 pl-0 md:pl-6">
                    {group.books.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onStatusChange={fetchMyLibrary} // Faz a mágica de recarregar a lista quando o status muda
                      />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}