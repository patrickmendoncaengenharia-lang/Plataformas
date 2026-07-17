'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ImagemHero({ estudoId, imagemUrl }: { estudoId: string; imagemUrl: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErro(null);
    setEnviando(true);

    const ext = file.name.split('.').pop();
    const path = `${estudoId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('estudo-imagens').upload(path, file, {
      upsert: true,
    });

    if (uploadError) {
      setEnviando(false);
      setErro(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('estudo-imagens').getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('estudos')
      .update({ imagem_url: data.publicUrl })
      .eq('id', estudoId);

    setEnviando(false);
    if (updateError) {
      setErro(updateError.message);
      return;
    }
    router.refresh();
  }

  async function remover() {
    setEnviando(true);
    const { error } = await supabase.from('estudos').update({ imagem_url: null }).eq('id', estudoId);
    setEnviando(false);
    if (!error) router.refresh();
  }

  return (
    <div
      className={`print-avoid-break flex h-full flex-col overflow-hidden rounded-[20px] border ${imagemUrl ? '' : 'no-print'}`}
      style={{ background: 'var(--surface-3)', borderColor: 'var(--border)' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {imagemUrl ? (
        <div className="relative flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagemUrl}
            alt="Imagem do projeto"
            className="h-full w-full object-cover print:h-auto print:max-h-[110mm] print:w-full print:object-contain"
            style={{ minHeight: 190 }}
          />
          <div className="no-print absolute right-2 top-2 flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
              className="rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-semibold"
              style={{ background: 'rgba(10,10,15,.75)', color: '#fff' }}
            >
              Trocar
            </button>
            <button
              onClick={remover}
              disabled={enviando}
              className="rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-semibold"
              style={{ background: 'rgba(10,10,15,.75)', color: 'var(--crit)' }}
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="no-print flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center"
          style={{ minHeight: 190, color: 'var(--text-2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="text-[13px] font-semibold">
            {enviando ? 'Enviando…' : '+ Adicionar imagem do projeto'}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            Opcional — foto, render ou planta do empreendimento
          </span>
        </button>
      )}
      {erro && (
        <div className="p-2 text-[11.5px]" style={{ color: 'var(--crit)' }}>
          {erro}
        </div>
      )}
    </div>
  );
}
