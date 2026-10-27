import Link from 'next/link';
import { CBRIN_DIGITAL_SOLUTIONS_URL } from '@/lib/site';

/** The three next steps offered at the end of every Session. CBRIN's program
 *  is pointed to, never sold: CBRIN runs its own triage and picks the adviser. */
export default function ThreeDoors() {
  return (
    <div className="doors">
      <div className="site-card door--lime">
        <h3>Free expert advice</h3>
        <p>
          Up to five hours one-on-one through CBR Innovation Network&apos;s Digital
          Solutions program.
        </p>
        <a className="site-link" href={CBRIN_DIGITAL_SOLUTIONS_URL}>About the program</a>
      </div>
      <div className="site-card">
        <h3>Build Lab</h3>
        <p>Build and publish your website with us in one morning, a week or two later.</p>
        <Link className="site-link" href="/events#build-lab">How a Build Lab works</Link>
      </div>
      <div className="site-card">
        <h3>Stay connected</h3>
        <p>The slides and three next steps, next month&apos;s Session and one email a month.</p>
      </div>
    </div>
  );
}
