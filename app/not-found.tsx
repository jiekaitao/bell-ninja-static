import type { Metadata } from 'next';
import { Bevan } from 'next/font/google';
import Link from 'next/link';
import TypedCode from '@/components/TypedCode';
import './not-found.css';

export const metadata: Metadata = { title: 'Bell Ninja - Not Found' };

const bevan = Bevan({ subsets: ['latin'], weight: '400', display: 'swap' });

const LINES = [
  '<span>this_page</span>.<em>not_found</em> = true;',
  '<span>if</span> (<b>you_spelt_it_wrong</b>) {<span>please_try_again()</span>;}',
  '<span>else if (<b>we_screwed_up_or_something_blew_up_back_here</b>)</span> {<em>alert</em>(<i>"We\'re really sorry about that."</i>); <span>window</span>.<em>location</em> = home;}',
];

export default function NotFound() {
  return (
    <main className="not-found">
      <p className={bevan.className}>HTTP: <span>404</span></p>
      <TypedCode lines={LINES} />
      <Link href="/">Back to home</Link>
    </main>
  );
}
