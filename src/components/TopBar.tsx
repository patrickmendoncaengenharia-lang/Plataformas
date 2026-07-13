'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TopBar({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ background: 'rgba(10,10,15,.86)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-6 py-3.5">
        <button
          onClick={() => router.back()}
          aria-label="Voltar"
          title="Voltar"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <Link
          href="/dashboard"
          aria-label="Início"
          title="Início"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11.5L12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sia.png" alt="SIA Planejamento Urbano" className="h-8 w-auto shrink-0" />
          <div className="leading-tight">
            <div className="text-[13.5px] font-bold">Plataforma de Viabilidade</div>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>
            {email}
          </span>
          <button
            onClick={sair}
            className="rounded-[8px] border px-3 py-1.5 text-[12px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
