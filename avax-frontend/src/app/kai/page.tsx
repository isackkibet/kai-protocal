import { redirect } from 'next/navigation';

/**
 * /kai opens the KAI website (public/kaiweb) full screen.
 *
 * It used to show the site inside an iframe next to a sidebar; the security
 * headers (X-Frame-Options: DENY) block framing, so the frame was empty, and
 * on tablets the split layout broke. The site now has its own menu with
 * "Open the app" to come back.
 */
export default function KaiWebPage() {
  redirect('/kaiweb/index.html');
}
