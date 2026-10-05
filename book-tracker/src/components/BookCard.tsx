// src/components/BookCard.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type BookType = {
    id: string;
    title: string;
    genres: string[];
    available_in_pt: boolean;
    available_in_eng?: boolean;
    available_in_audio: boolean;
    user_library: {
        status: string;
        rating: number | null;
        review: string | null;
    };
};

export default function BookCard({ book, onStatusChange }: { book: BookType; onStatusChange: () => void }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados do formulário de edição
    const [editStatus, setEditStatus] = useState(book.user_library?.status || 'want to read');
    const [editRating, setEditRating] = useState<number>(book.user_library?.rating || 0);
    const [editReview, setEditReview] = useState(book.user_library?.review || '');
    const [editPt, setEditPt] = useState(book.available_in_pt);
    const [editEng, setEditEng] = useState(book.available_in_eng || false);
    const [editAudio, setEditAudio] = useState(book.available_in_audio);

    const STATUS_OPTIONS = ['read', 'want to read', 'favorites', 'manga', 'owned'];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error: libError } = await supabase
                .from('user_library')
                .update({
                    status: editStatus,
                    rating: editRating === 0 ? null : editRating,
                    review: editReview.trim() === '' ? null : editReview
                })
                .eq('book_id', book.id);

            if (libError) throw libError;

            const { error: bookError } = await supabase
                .from('books')
                .update({
                    available_in_pt: editPt,
                    available_in_eng: editEng,
                    available_in_audio: editAudio
                })
                .eq('id', book.id);

            if (bookError) throw bookError;

            setIsModalOpen(false);
            onStatusChange();

        } catch (error) {
            console.error('Erro ao guardar alterações:', error);
            alert('Ocorreu um erro ao atualizar o livro.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* Cartão Miniatura */}
            <div className="w-48 bg-white border-2 border-purple-300 rounded-sm p-4 flex flex-col gap-3 shadow-sm hover:border-orange-400 transition-colors">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{book.title}</h3>
                    {book.genres && book.genres.length > 0 && (
                        <p className="text-xs text-gray-500 line-clamp-2 capitalize">
                            {book.genres.join(', ')}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-purple-100 text-purple-700 border-2 border-purple-200 text-xs font-bold py-2 rounded-sm hover:bg-purple-200 hover:border-purple-400 transition-colors"
                >
                    Editar Livro
                </button>
            </div>

            {/* Modal de Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-purple-400 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-6">

                        <div className="flex justify-between items-start border-b-2 border-purple-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 pr-4">{book.title}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl leading-none">
                                &times;
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 py-2">

                            {/* Botões de Status em linha */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Status de Leitura</label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setEditStatus(status)}
                                            className={`px-3 py-2 text-sm font-bold rounded-sm border-2 capitalize transition-colors ${editStatus === status
                                                    ? 'bg-purple-600 border-purple-600 text-white'
                                                    : 'bg-white border-purple-200 text-purple-600 hover:border-purple-400 hover:bg-purple-50'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Estrelas Clicáveis */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Sua Nota</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setEditRating(star === editRating ? 0 : star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill={star <= editRating ? "currentColor" : "none"}
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`w-8 h-8 transition-colors ${star <= editRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                                                    }`}
                                            >
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Resenha / Notas</label>
                                <textarea
                                    value={editReview}
                                    onChange={(e) => setEditReview(e.target.value)}
                                    rows={4}
                                    placeholder="O que achou do livro?"
                                    className="border-2 border-purple-200 p-3 rounded-sm focus:outline-none focus:border-purple-500 bg-gray-50 resize-y"
                                />
                            </div>

                            <div className="flex gap-6 pt-2 border-t-2 border-purple-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editPt}
                                        onChange={(e) => setEditPt(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-gray-700">portugês</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editEng}
                                        onChange={(e) => setEditEng(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-gray-700">inglês</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editAudio}
                                        onChange={(e) => setEditAudio(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Audiobook</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t-2 border-purple-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                                className="px-4 py-2 font-bold text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-orange-500 text-white font-bold py-2 px-6 rounded-sm border-2 border-orange-600 hover:bg-orange-600 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? 'A guardar...' : 'Salvar Alterações'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}