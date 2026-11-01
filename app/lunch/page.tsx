import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bell Ninja - Lunch' };

const LUNCH_MENU = 'https://www.sagedining.com/sites/rivieraday/menu';

export default function Lunch() {
  return (
    <main className="hand-off">
      <script dangerouslySetInnerHTML={{ __html: `location.replace('${LUNCH_MENU}')` }} />
      <p>Finding lunch...</p>
      <a href={LUNCH_MENU}>Open the menu</a>
    </main>
  );
}
