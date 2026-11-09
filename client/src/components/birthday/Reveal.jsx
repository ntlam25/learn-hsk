import { useEffect, useRef, useState } from 'react';

/** Hiện dần (trượt lên + rõ dần) khi phần tử cuộn vào màn hình. */
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`bd-reveal ${inView ? 'bd-in' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
