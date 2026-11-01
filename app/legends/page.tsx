import type { Metadata } from 'next';
import { Fira_Mono, Permanent_Marker } from 'next/font/google';
import Link from 'next/link';
import { ROCKET_SVG } from './rocket';
import './legends.css';

export const metadata: Metadata = { title: 'Bell Ninja - Supporters' };

const marker = Permanent_Marker({ subsets: ['latin'], weight: '400', display: 'swap' });
const mono = Fira_Mono({ subsets: ['latin'], weight: '500', display: 'swap' });

const LEGENDS = [
  {
    name: 'Diego N.',
    note: "Donated $50, that's 7.66 x 10^20 copper atoms, to keep the site afloat for the 2023-2027 school year! Some of this money will also go toward a non-profit click-to-deploy peer-tutoring site that serves everything from schools to orphanages families! Thank you Diego!!",
  },
  {
    name: 'Evan G.',
    note: "Donated $21, that's 14.39 pounds in US copper coins, to keep the site afloat for the 2022 school year! Thank you Evan!",
  },
  { name: 'Jamsai', note: 'Donated $-1; Chronic gaslighter and dictator of Scientology National Honor Society' },
  { name: 'Ms. Morales', note: 'Donated $+100000000 in emotional damage' },
  {
    name: 'Jack/Jie Tao',
    note: 'The most Legendary Space-Time Ninja Bulldog, the GOAT and creator of this website (note: this edit was not made by Jack)',
  },
];

export default function Legends() {
  return (
    <main className={'legends ' + mono.className}>
      <div dangerouslySetInnerHTML={{ __html: ROCKET_SVG }} />
      <div className="legends-text">
        <h1 className={marker.className}>Bell Ninja</h1>
        <h2>Meet the Legendary Space-Time Ninja Bulldogs</h2>
        <h3>GO <Link href="/">BACK</Link></h3>
        {LEGENDS.map((legend) => (
          <section key={legend.name}>
            <h2>{legend.name}</h2>
            <i>{legend.note}</i>
          </section>
        ))}
      </div>
    </main>
  );
}
