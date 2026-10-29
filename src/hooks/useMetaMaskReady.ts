import { useEffect, useState } from 'react';

type Eip6963AnnounceEvent = CustomEvent<{ info?: { rdns?: string } }>;

export function useMetaMaskReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleAnnounce = (event: Event): void => {
      if ((event as Eip6963AnnounceEvent).detail?.info?.rdns?.includes('io.metamask')) {
        setReady(true);
      }
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounce);
    };
  }, []);

  return ready;
}
