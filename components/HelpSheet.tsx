'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ClockIcon, EnvelopeIcon, PhoneIcon, SpinnerIcon } from './icons';
import Sheet from './Sheet';
import { leaveRoute, openRoute, swapRoute, type Route } from '@/lib/use-route';

const EMAIL = 'jack@lecturehat.com';
const Email = () => <a className="email" href={'mailto:' + EMAIL}>{EMAIL}</a>;

const TOPICS: { id: string; label: string; title: string; icon: ReactNode; body: ReactNode }[] = [
  {
    id: 'contact',
    label: 'Contact',
    title: 'Contact',
    icon: <EnvelopeIcon size={56} />,
    body: (
      <>
        <p>Sorry if you are having issues with the website. Technical help is always available through the following email:</p>
        <p className="big-email"><Email /></p>
      </>
    ),
  },
  {
    id: 'wrong-time',
    label: 'Wrong Time',
    title: 'The countdown timer is off',
    icon: <ClockIcon size={56} />,
    body: (
      <>
        <p>
          In some cases, an incorrect entry can happen when a new schedule is inputted. If the schedule
          is ringing 5-15 minutes off, please let me know:
        </p>
        <p><button type="button" className="step-button" onClick={() => openRoute('#report')}>Schedule not correct?</button></p>
        <p>
          Bell Ninja calculates the difference between your time and the time of the next bell ring. In
          some rare cases, if your device time is wrong, the countdown timer will be wrong. Check if your
          tablet has the correct time by comparing it against an atomic clock. An excellent resource is a
          website called <a href="https://time.gov" target="_blank" rel="noreferrer">time.gov</a>. If your
          device&apos;s time is wrong, it might be a good idea to check with the administration to get your
          tablet sorted out. (All Riviera Schools tablets appear to have a restriction on general device
          settings, so fixing your device&apos;s time cannot be done without the help of an administrator.)
        </p>
        <p>
          Seeing &ldquo;NaN aN aN aN&rdquo;? Try reloading the page. If it sticks around, that is a bug and
          I want to hear about it.
        </p>
        <p><i>Have a question that is not listed here? Please allow 1-2 days for a response.</i></p>
        <p className="big-email"><Email /></p>
      </>
    ),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    title: 'Mobile Device Compatibility',
    icon: <PhoneIcon size={56} />,
    body: (
      <>
        <p>
          Bell Ninja works on phones, tablets and laptops, in whatever browser you already use &mdash;
          Safari, Chrome, Edge or Firefox.
        </p>
        <p>
          iPhones, iPads and Macs are fully supported. The countdown used to show &ldquo;aN&rdquo; on those
          devices because it built its target time in a format only Chrome would read; it is built from
          plain numbers now, which every browser handles the same way.
        </p>
        <p>
          If something still looks wrong on your device, please email me &mdash; it is a bug, not something
          you have to put up with.
        </p>
      </>
    ),
  },
  {
    id: 'not-loading',
    label: 'Not Loading',
    title: 'Not Loading?',
    icon: <SpinnerIcon size={56} />,
    body: (
      <>
        <p>
          Check your wifi reception. If it is low, try getting indoors. Stay away from the field when trying
          to get the best wifi reception. Bell Ninja only needs internet to open; once the page is up, the
          countdown keeps running on its own.
        </p>
        <p>
          If the website still doesn&apos;t load, your browser may have some corrupt data that is preventing
          you from accessing certain websites. Try clearing your browsing cookies.
        </p>
        <p>If you are still having trouble, feel free to contact me.</p>
      </>
    ),
  },
];

export default function HelpSheet({ route }: { route: Route }) {
  const index = TOPICS.findIndex((topic) => topic.id === route.topic);
  const topic = index >= 0 ? TOPICS[index] : null;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (route.topic) heading.current?.focus();
  }, [route.topic]);

  const dismiss = () => leaveRoute(topic ? '#help' : '');
  const nextTopic = () => swapRoute('#help/' + TOPICS[(index + 1) % TOPICS.length].id);

  return (
    <Sheet open={route.sheet === 'help'} tone="help" label="Support and Contact" onDismiss={dismiss}>
      <div className="sheet-body">
        <h2>Support and Contact</h2>
        <p>
          These are the most common issues that are encountered when using Bell Ninja. Please select your
          issue. If this cannot be resolved, feel free to send an email.
        </p>
        <ul className="help-grid">
          {TOPICS.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => openRoute('#help/' + item.id)}>
                {item.icon}
                <b>{item.label}</b>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {topic && (
        <section className="topic" key={topic.id}>
          <div className="topic-body">
            <h3 ref={heading} tabIndex={-1}>{topic.title}</h3>
            {topic.body}
          </div>
          <nav className="topic-nav">
            <button type="button" onClick={nextTopic}>&gt; Next Misc.</button>
            <button type="button" onClick={dismiss}>Exit</button>
          </nav>
        </section>
      )}
    </Sheet>
  );
}
