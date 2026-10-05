// src/components/BookCard.tsx
import { useState } from 'react';

// Definir a tipagem baseada na nossa base de dados
export interface BookType {
  id: string;
  title: string;
  genres: string[];
  available_in_pt: boolean;
  available_in_audio: boolean;
  user_library?: {
    status: string;
    rating: number;
    review: string;
  };
}

export default function BookCard({ book }: { book: BookType }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lib = book.user_library || { status: 'want to read', rating: 0, review: '' };

  return (
    <div 
      className="border-2 border-green-600 p-3 w-40 cursor-pointer transition-all hover:shadow-md bg-white"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <h3 className="font-bold text-sm mb-2">{book.title}</h3>
      
      <p className="text-xs font-medium text-gray-600">
        {lib.status === 'read' ? 'Lido' : 'Não lido'}
      </p>
      
      {lib.status === 'read' && lib.rating > 0 && (
        <div className="text-green-700 text-xs mb-1">
          {'★'.repeat(lib.rating)}{'☆'.repeat(5 - lib.rating)}
        </div>
      )}
      
      {/* Informações Expandidas (Card Interno) */}
      {isExpanded && (
        <div className="mt-3 text-xs border-t border-gray-200 pt-3 flex flex-col gap-2">
           <p className="text-orange-500 font-semibold">{book.genres.join(', ')}</p>
           
           <div className="flex gap-2 font-bold">
             {book.available_in_pt && <span className="text-yellow-600">PT</span>}
             {book.available_in_audio && <span className="text-yellow-600">Áudio</span>}
           </div>
           
           {lib.review && (
             <div className="text-orange-400 mt-1 italic">
               "{lib.review}"
             </div>
           )}
        </div>
      )}
    </div>
  );
}