// src/lib/bookApi.ts
export interface APIBookResult {
  id: string;
  title: string;
  author: string;
  genres: string[];
}

export const searchBooks = async (query: string): Promise<APIBookResult[]> => {
  if (!query.trim()) return [];
  
  // Usando a Open Library que é amigável e não bloqueia fácil!
  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`);
  
  if (!response.ok) throw new Error('Erro na rede');
  
  const data = await response.json();
  if (!data.docs) return [];

  return data.docs.map((item: any) => ({
    id: item.key,
    title: item.title,
    author: item.author_name ? item.author_name[0] : 'Desconhecido',
    // A Open Library retorna muitos gêneros, vamos pegar só os 3 primeiros
    genres: item.subject ? item.subject.slice(0, 3) : [], 
  }));
};