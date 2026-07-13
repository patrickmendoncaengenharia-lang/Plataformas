'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } =
      mode === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha, options: { data: { nome } } });

    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[13px] font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg,var(--accent),#7A5CFA)' }}
          >
            PV
          </div>
          <div>
            <div className="text-[14px] font-bold">Plataforma de Viabilidade</div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              Estudos economico-financeiros
            </div>
          </div>
        </div>

        <div
          className="rounded-[16px] border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="mb-5 flex gap-1 rounded-[10px] p-1" style={{ background: 'var(--surface-3)' }}>
            <button
              type="button"
              onClick={() => setMode('entrar')}
              className="flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition"
              style={
                mode === 'entrar'
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-2)' }
              }
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('criar')}
              className="flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition"
              style={
                mode === 'criar'
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-2)' }
              }
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'criar' && (
              <div>
                <label className="mb-1 block text-[12px]" style={{ color: 'var(--text-2)' }}>
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-[12px]" style={{ color: 'var(--text-2)' }}>
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px]" style={{ color: 'var(--text-2)' }}>
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            {erro && (
              <div
                className="rounded-[8px] px-3 py-2 text-[12.5px]"
                style={{ background: 'var(--crit-soft)', color: 'var(--crit)' }}
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 rounded-[10px] py-2.5 text-[13.5px] font-semibold text-white transition disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {carregando ? 'Aguarde…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11.5px]" style={{ color: 'var(--text-3)' }}>
          Autenticacao via Supabase — configure as chaves em .env.local
        </p>
      </div>
    </div>
  );
}
