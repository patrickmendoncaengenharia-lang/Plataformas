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
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] text-[11px] font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg,var(--accent),#7A5CFA)' }}
          >
            PV
          </div>
          <span className="text-[13.5px] font-bold">Plataforma de Viabilidade</span>
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
