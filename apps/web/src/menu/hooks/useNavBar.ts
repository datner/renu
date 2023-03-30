import { startTransition, useCallback, useEffect, useRef, useState } from "react";

function smoothScroll(elem: Element, opts: ScrollIntoViewOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!(elem instanceof Element)) {
      throw new TypeError("Argument 1 must be an Element");
    }
    let same = 0; // a counter
    let lastPos: number | null = null; // last known Y position
    // pass the user defined options along with our default
    const scrollOptions = Object.assign({ behavior: "smooth" }, opts);

    // let's begin
    elem.scrollIntoView(scrollOptions);
    requestAnimationFrame(check);

    // this function will be called every painting frame
    // for the duration of the smooth scroll operation
    function check() {
      // check our current position
      const newPos = elem.getBoundingClientRect().top;

      if (newPos === lastPos) {
        if (same++ > 2) {
          // if it's more than two frames
          return resolve();
        }
      } else {
        same = 0; // reset our counter
        lastPos = newPos; // remember our current position
      }
      // check again next painting frame
      requestAnimationFrame(check);
    }
  });
}
export function useNavBar() {
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);
  const [active, _setActive] = useState<Element | null>(null);
  const isScrollingRef = useRef(false);
  const entryRef = useRef<{
    prev: Element | null;
    current: Element | null;
  }>({
    current: null,
    prev: null,
  });
  const navLinksRef = useRef<Element[]>([]);
  const [rootRef, setRootRef] = useState<HTMLElement | null>(null);
  const setRoot = useCallback((el: HTMLElement | null) => {
    startTransition(() => setRootRef(el));
  }, []);

  const setActive = async (el: Element | null) => {
    if (!el) return;

    _setActive(el);
    entryRef.current = { current: el, prev: el };
    isScrollingRef.current = true;
    await smoothScroll(el);
    isScrollingRef.current = false;
  };

  const observe = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;

      observer?.observe(el);
    },
    [observer],
  );

  const attachNav = useCallback((el: Element | null) => {
    if (!el || navLinksRef.current.some((n) => n.isSameNode(el))) return;

    navLinksRef.current.push(el);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        // due to IntersectionObserver firing in inconvinient times, a lot of checks are required to make sure the flow is not broken
        for (const nextEntry of entries) {
          const target = nextEntry.isIntersecting ? nextEntry.target : entryRef.current.prev ?? null;

          const newPrev = nextEntry.isIntersecting
            ? entryRef.current.current
            : entryRef.current.prev ?? entryRef.current.current;

          const newCurrent = nextEntry.isIntersecting
            ? nextEntry.target
            : entryRef.current.prev ?? entryRef.current.current ?? nextEntry.target;

          if (nextEntry.isIntersecting || nextEntry.target.isSameNode(entryRef.current.current)) {
            startTransition(() => {
              _setActive(target);
              const toFocus = navLinksRef.current.find((n) => {
                return n.ariaLabel === target?.id;
              });
              toFocus?.scrollIntoView({ behavior: "smooth", inline: "start" });
            });
            entryRef.current.prev = newPrev;
            entryRef.current.current = newCurrent;
          }
        }
      },
      { rootMargin: "0px", threshold: 0.1 },
    );
    startTransition(() => {
      setObserver(observer);
    });
    return () => observer.disconnect();
  }, [rootRef]);

  return { setRoot, observe, attachNav, active, setActive };
}
