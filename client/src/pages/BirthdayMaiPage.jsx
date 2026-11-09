import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/birthday.css';
import api from '../api/client';
import { applyContent, BDAY, SLUG } from '../components/birthday/data';
import { createConfetti } from '../components/birthday/confetti';
import { prefersReducedMotion, setSimulateBirthday } from '../components/birthday/utils';
import GiftIntro from '../components/birthday/GiftIntro';
import LifeClock from '../components/birthday/LifeClock';
import CakeCandles from '../components/birthday/CakeCandles';
import PolaroidLine, { Lightbox } from '../components/birthday/PolaroidLine';
import WishTree from '../components/birthday/WishTree';
import FinalLetter from '../components/birthday/FinalLetter';
import Finale from '../components/birthday/Finale';

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap';

// Trang mừng sinh nhật: không cần đăng nhập; nội dung tải từ /api/birthday/pages/:slug (sửa ở /admin/birthday)
export default function BirthdayMaiPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    api
      .get(`/birthday/pages/${SLUG}`, { timeout: 10000 })
      .then((res) => applyContent(res.data?.content))
      .catch(() => applyContent(null)) // lỗi mạng / server → dùng nội dung mặc định
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  const { search } = useLocation();
  // ?xem-thu=sinh-nhat → xem trước như thể hôm nay là đúng ngày sinh nhật
  useState(() => setSimulateBirthday(new URLSearchParams(search).get('xem-thu') === 'sinh-nhat'));

  const canvasRef = useRef(null);
  const fxRef = useRef(null);
  const fx = useMemo(
    () => ({
      burst: (...a) => fxRef.current?.burst(...a),
      rain: (...a) => fxRef.current?.rain(...a),
    }),
    []
  );
  const [opened, setOpened] = useState(false);
  const [finished, setFinished] = useState(false);
  const [lbIndex, setLbIndex] = useState(null);
  const photos = BDAY.photos;

  // Pháo giấy
  useEffect(() => {
    const c = createConfetti(canvasRef.current);
    fxRef.current = c;
    return () => {
      c.destroy();
      fxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready) document.title = `Chúc mừng sinh nhật ${BDAY.name} 🎂`;
  }, [ready]);

  // noindex, font viết tay, luôn bắt đầu từ đầu trang
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Chúc mừng sinh nhật 🎂';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.append(robots);
    if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = FONT_HREF;
      document.head.append(font);
    }
    const prevRestore = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    return () => {
      document.title = prevTitle;
      robots.remove();
      window.history.scrollRestoration = prevRestore;
    };
  }, []);

  // Khoá cuộn tới khi mở hộp quà
  useEffect(() => {
    document.body.classList.toggle('bd-locked', !opened);
    return () => document.body.classList.remove('bd-locked');
  }, [opened]);

  // Đọc xong thư → pháo giấy bắn liên tục tới khi bấm "Xem lại từ đầu"
  useEffect(() => {
    if (!finished) return undefined;
    const reduce = prefersReducedMotion();
    fx.rain(200);
    let tick = 0;
    const t = setInterval(() => {
      if (document.hidden) return; // tab ẩn thì không dồn hạt
      tick++;
      fx.burst(window.innerWidth * (tick % 2 ? 0.06 : 0.94), window.innerHeight, reduce ? 10 : 70, { speed: 14, lift: 9 });
      if (tick % 3 === 0) fx.rain(60);
    }, 900);
    return () => clearInterval(t);
  }, [finished, fx]);

  const closeLb = useCallback(() => setLbIndex(null), []);
  const navLb = useCallback(
    (d) => setLbIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length]
  );

  function again() {
    setFinished(false);
    window.scrollTo(0, 0);
    window.location.reload();
  }

  return (
    <div className="bd-root">
      <canvas className="bd-fx" ref={canvasRef} />

      {!ready ? (
        <div className="bd-loading" aria-label="Đang tải">🎁</div>
      ) : (
        <>
      <GiftIntro
        fx={fx}
        onOpen={() => setOpened(true)}
        onNext={() => document.getElementById('bd-clock')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <LifeClock id="bd-clock" />
      <div className="bd-divider" />
      <CakeCandles fx={fx} />
      <div className="bd-divider" />
      <PolaroidLine photos={photos} onOpen={setLbIndex} />
      <div className="bd-divider" />
      <WishTree fx={fx} />
      <div className="bd-divider" />
      <FinalLetter fx={fx} onFinish={() => setFinished(true)} />
      {finished && <Finale photos={photos} onOpen={setLbIndex} onAgain={again} />}

      <Lightbox photos={photos} index={lbIndex} onClose={closeLb} onNav={navLb} />
        </>
      )}
    </div>
  );
}
