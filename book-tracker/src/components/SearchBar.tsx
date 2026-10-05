// src/components/SearchBar.tsx
import { useState } from 'react';
import { searchBooks, type APIBookResult } from '../lib/bookApi';
import { supabase } from '../lib/supabase';

export default function SearchBar({ onBookAdded }: { onBookAdded?: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<APIBookResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Só pesquisa na API quando VOCÊ clica em buscar ou dá Enter
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault(); // Evita recarregar a página
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const data = await searchBooks(query);
            setResults(data);
        } catch (error) {
            console.error('Erro na API:', error);
            alert('Erro ao procurar livros.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectBook = async (book: APIBookResult) => {
        setIsSaving(true);
        try {
            // 1. Autor
            let authorId;
            const { data: existingAuthor } = await supabase.from('authors').select('id').ilike('name', book.author).maybeSingle();
            if (existingAuthor) authorId = existingAuthor.id;
            else {
                const { data: newAuthor, error: aErr } = await supabase.from('authors').insert([{ name: book.author }]).select('id').single();
                if (aErr) throw aErr;
                authorId = newAuthor.id;
            }

            // 2. Livro
            let bookId;
            const { data: existingBook } = await supabase.from('books').select('id').eq('title', book.title).maybeSingle();
            if (existingBook) bookId = existingBook.id;
            else {
                const { data: newBook, error: bErr } = await supabase.from('books').insert([{
                    title: book.title, author_id: authorId, genres: book.genres, available_in_pt: false, available_in_audio: false
                }]).select('id').single();
                if (bErr) throw bErr;
                bookId = newBook.id;
            }

            // 3. Biblioteca
            const { error: lErr } = await supabase.from('user_library').insert([{
                book_id: bookId,
                status: 'want to read'
            }]); if (lErr && lErr.code !== '23505') throw lErr;

            if (lErr?.code === '23505') alert('Este livro já está na biblioteca!');

            // Limpar resultados após adicionar
            setQuery('');
            setResults([]);
            if (onBookAdded) onBookAdded(); // Atualiza a lista do App.tsx

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Ocorreu um erro ao guardar o livro.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto mb-8">
            {/* Formulário Manual */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 border-2 border-purple-400 p-3 rounded-sm focus:outline-none focus:border-purple-600"
                    placeholder="Digite o título do livro..."
                />
                <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-purple-600 text-white font-bold py-3 px-6 rounded-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                    {isSearching ? 'A buscar...' : 'Buscar'}
                </button>
            </form>

            {/* Lista suspensa com os resultados da API */}
            {results.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border-2 border-purple-200 mt-1 rounded-sm shadow-xl max-h-60 overflow-y-auto">
                    {results.map(book => (
                        <li key={book.id} className="p-3 border-b hover:bg-purple-50 flex justify-between items-center transition-colors">
                            <div>
                                <p className="font-bold text-gray-800">{book.title}</p>
                                <p className="text-sm text-gray-600">{book.author}</p>
                            </div>
                            <button
                                onClick={() => handleSelectBook(book)}
                                disabled={isSaving}
                                className="bg-orange-400 text-white text-sm font-bold py-1 px-3 rounded-sm hover:bg-orange-500 disabled:opacity-50"
                            >
                                + Adicionar
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}