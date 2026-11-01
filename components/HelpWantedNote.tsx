import { marker } from '@/lib/fonts';

/* Pinned to the page until someone takes the job. It steps aside while the
   schedule is open. */
export default function HelpWantedNote({ hidden }: { hidden: boolean }) {
  return (
    <aside className={'help-note' + (hidden ? ' help-note-hidden' : '')} inert={hidden} aria-label="Help wanted">
      <h2 className={marker.className}>HELP WANTED!</h2>
      <p>Bell Ninja needs a computer savvy person to take over maintaining the website schedule.</p>
      <p className="help-note-aside">
        (The site is visited by students every school day and it can be great as an extracurricular!)
      </p>
      <a href="mailto:jack@lecturehat.com?subject=Bell%20Ninja%20help%20wanted">Interested? jack@lecturehat.com</a>
    </aside>
  );
}
