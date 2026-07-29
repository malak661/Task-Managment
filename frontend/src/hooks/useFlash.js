import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_FOR = 4000;

/**
 * A short confirmation that clears itself after a few seconds.
 *
 * Success messages are the one kind of feedback nobody acts on, so leaving them
 * on screen just collects stale "saved!" banners. Errors stay put; these do not.
 */
export function useFlash(visibleFor = VISIBLE_FOR) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  const flash = useCallback(
    (text) => {
      // A second save should restart the countdown, not inherit the old one.
      clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(''), visibleFor);
    },
    [visibleFor]
  );

  // Never leave a timer pointing at a page that has gone away.
  useEffect(() => () => clearTimeout(timer.current), []);

  return { message, flash };
}

export default useFlash;
