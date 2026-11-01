'use client';

import Link from 'next/link';
import Ninja from './Ninja';
import Sheet from './Sheet';
import { leaveRoute, type Route } from '@/lib/use-route';

export default function AboutSheet({ route }: { route: Route }) {
  return (
    <Sheet open={route.sheet === 'about'} tone="about" label="Bell Ninja 2026" onDismiss={() => leaveRoute('')}>
      <div className="sheet-body about">
        <div className="about-main">
          <h2>Bell Ninja 2026</h2>
          <Link href="/legends/" className="legend-link">
            <Ninja size={120} />
            <span>
              <b>( Click IMG )</b>
              <span>to see the Legendary Ninjas</span>
            </span>
          </Link>
          <p>
            If you have any service project ideas, please contact us at{' '}
            <a className="email" href="mailto:jack@lecturehat.com">jack@lecturehat.com</a>
          </p>
          <p className="callout">There are spots open for free advertising!</p>
        </div>

        <div className="about-side">
          <h3>What is this?</h3>
          <p>
            This is bell.ninja! Yes, &ldquo;ninja&rdquo; is a TLD, or a top-level domain, similar to
            &ldquo;com&rdquo;. Bell Ninja is a website that allows for easier access to information regarding
            Riviera Preparatory Schools&apos; schedules and special events. Most visitors load the website to
            check when the next bell is going to ring. The website can very accurately tell when the next bell
            rings. (Well, most of the time)
          </p>
          <p>
            Unfortunately, the website&apos;s reliability for getting information about school events cannot
            be guaranteed because information is updated on the fly by a human.
          </p>
          <p>
            <i>This website is not owned or operated by Riviera Schools.</i>
          </p>
        </div>
      </div>
    </Sheet>
  );
}
