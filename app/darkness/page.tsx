import type { Metadata } from 'next';
import { THEME_KEY } from '@/lib/theme-key';

export const metadata: Metadata = { title: 'Bell Ninja - Darkness' };

/* The dark theme used to be a whole second copy of the site at this address.
   It is a toggle now, and old bookmarks switch it on. */
export default function Darkness() {
  return (
    <main className="hand-off hand-off-dark">
      <script
        dangerouslySetInnerHTML={{
          __html: `try{localStorage.setItem('${THEME_KEY}','dark')}catch(e){}location.replace('/')`,
        }}
      />
      <p>Entering the darkness...</p>
      <a href="/">Continue</a>
    </main>
  );
}
