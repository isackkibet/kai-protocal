'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Exact image list from the original photogallery.html JS array
const IMAGE_PATHS = [
  "act0.jpeg","act1.jpeg","act10.jpeg","act11.jpeg","act12.jpeg","act13.jpeg","act14.jpeg","act15.jpeg","act16.jpeg","act2.jpeg","act20.jpeg","act21.jpeg","act22.jpeg","act23.jpeg","act24.jpeg","act25.jpeg","act26.jpeg","act27.jpeg","act28.jpeg","act3.jpeg","act30.jpeg","act31.jpeg","act34.jpeg","act35.jpeg","act36.jpeg","act37.jpeg","act38.jpeg","act39.jpeg","act4.jpeg","act40.jpeg","act41.jpeg","act42.jpeg","act44.jpeg","act45.jpeg","act5.jpeg","act6.jpeg","act7.jpeg","act8.jpeg","act9.jpeg",
  "tur1.jpeg","tur10.jpeg","tur11.jpeg","tur12.jpeg","tur13.jpeg","tur15.jpeg","tur16.jpeg","tur17.jpeg","tur18.jpeg","tur19.jpeg","tur2.jpeg","tur20.jpeg","tur21.jpeg","tur22.jpeg","tur23.jpeg","tur24.jpeg","tur25.jpeg","tur26.jpeg","tur27.jpeg","tur28.jpeg","tur29.jpeg","tur3.jpeg","tur30.jpeg","tur31.jpeg","tur32.jpeg","tur33.jpeg","tur34.jpeg","tur35.jpeg","tur36.jpeg","tur37.jpeg","tur39.jpeg","tur4.jpeg","tur40.jpeg","tur41.jpeg","tur42.jpeg","tur43.jpeg","tur44.jpeg","tur45.jpeg","tur46.jpeg","tur47.jpeg","tur48.jpeg","tur49.jpeg","tur5.jpeg","tur50.jpeg","tur51.jpeg","tur53.jpeg","tur54.jpeg","tur55.jpeg","tur56.jpeg","tur57.jpeg","tur58.jpeg","tur59.jpeg","tur6.jpeg","tur60.jpeg","tur61.jpeg","tur62.jpeg","tur64.jpeg","tur65.jpeg","tur66.jpeg","tur67.jpeg","tur68.jpeg","tur69.jpeg","tur7.jpeg","tur70.jpeg","tur71.jpeg","tur72.jpeg","tur73.jpeg","tur75.jpeg","tur76.jpeg","tur79.jpeg","tur8.jpeg","tur80.jpeg","tur82.jpeg","tur9.jpeg",
  "fin1.jpeg","fin10.jpeg","fin11.jpeg","fin12.jpeg","fin13.jpeg","fin14.jpeg","fin15.jpeg","fin16.jpeg","fin17.jpeg","fin18.jpeg","fin2.jpeg","fin20.jpeg","fin21.jpeg","fin22.jpeg","fin23.jpeg","fin24.jpeg","fin25.jpeg","fin26.jpeg","fin27.jpeg","fin28.jpeg","fin29.jpeg","fin3.jpeg","fin30.jpeg","fin31.jpeg","fin32.jpeg","fin33.jpeg","fin34.jpeg","fin36.jpeg","fin37.jpeg","fin38.jpeg","fin4.jpeg","fin40.jpeg","fin5.jpeg","fin6.jpeg","fin7.jpeg","fin8.jpeg","fin9.jpeg",
  "gal1.jpeg","gal10.jpeg","gal12.jpeg","gal13.jpeg","gal14.jpeg","gal15.jpeg","gal16.jpeg","gal17.jpeg","gal18.jpeg","gal19.jpeg","gal2.jpeg","gal20.jpeg","gal21.jpeg","gal22.jpeg","gal23.jpeg","gal24.jpeg","gal25.jpeg","gal26.jpeg","gal27.jpeg","gal28.jpeg","gal29.jpeg","gal3.jpeg","gal31.jpeg","gal33.jpeg","gal34.jpeg","gal36.jpeg","gal37.jpeg","gal38.jpeg","gal4.jpeg","gal41.jpeg","gal42.jpeg","gal43.jpeg","gal44.jpeg","gal45.jpeg","gal46.jpeg","gal47.jpeg","gal48.jpeg","gal49.jpeg","gal50.jpeg","gal51.jpeg","gal52.jpeg","gal53.jpeg","gal54.jpeg","gal55.jpeg","gal56.jpeg","gal57.jpeg","gal58.jpeg","gal59.jpeg","gal6.jpeg","gal60.jpeg","gal61.jpeg","gal62.jpeg","gal64.jpeg","gal65.jpeg","gal66.jpeg","gal67.jpeg","gal68.jpeg","gal69.jpeg","gal70.jpeg","gal71.jpeg","gal72.jpeg","gal73.jpeg","gal74.jpeg","gal75.jpeg","gal76.jpeg","gal77.jpeg","gal78.jpeg","gal8.jpeg","gal80.jpeg","gal81.jpeg","gal82.jpeg","gal83.jpeg","gal84.jpeg","gal85.jpeg","gal86.jpeg","gal87.jpeg","gal88.jpeg","gal89.jpeg","gal90.jpeg","gal91.jpeg","gal92.jpeg","gal93.jpeg","gal94.jpeg","gal95.jpeg","gal96.jpeg",
  "acacia.jpg","african_cherry.jpg","avocado.JPG","chestnut.jpg","croton_megalocarpus.jpg","drypetes.jpg","jackfruit.jpg","makhamia.jpg","matomoko.jpg","pepper_bark.jpg","silver_oak.jpg","sisal.jpg","teclea.jpg","thika_palm.jpg","toothbrush_tree.jpg",
  "future1.jpeg","future11.jpeg","future12.jpeg","future13.jpeg","future14.jpeg","future15.jpeg","future16.jpeg","future2.jpeg","future4.jpeg","future5.jpeg","future6.jpeg","future7.jpeg","future8.jpeg","future9.jpeg",
];

export default function PhotoGalleryPage() {
  const [current, setCurrent] = useState(0);
  const total = IMAGE_PATHS.length;

  const next = useCallback(() => setCurrent(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + total) % total), [total]);

  // Keyboard support from original HTML
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  return (
    <div style={{ background: '#000', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {/* Back button */}
      <Link
        href="/"
        style={{
          position: 'fixed', top: 30, left: 30, zIndex: 1001,
          color: 'white', textDecoration: 'none',
          background: 'rgba(0,0,0,0.6)', padding: '10px 20px',
          borderRadius: 30, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10,
          transition: 'background 0.3s',
        }}
      >
        ← Back to Home
      </Link>

      {/* Nav controls */}
      <div style={{ position: 'fixed', top: '50%', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', pointerEvents: 'none', zIndex: 1000, transform: 'translateY(-50%)', boxSizing: 'border-box' }}>
        <button
          onClick={prev}
          style={{ pointerEvents: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: '2rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
        >‹</button>
        <button
          onClick={next}
          style={{ pointerEvents: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: '2rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
        >›</button>
      </div>

      {/* Current slide */}
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={`/assets/images/${IMAGE_PATHS[current]}`}
          alt="Oloolua Photo"
          style={{ maxWidth: '95%', maxHeight: '90vh', objectFit: 'contain', boxShadow: '0 0 50px rgba(0,0,0,0.5)', borderRadius: 8, background: '#111' }}
        />
      </div>

      {/* Counter */}
      <div style={{
        position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        color: 'white', background: 'rgba(0,0,0,0.6)', padding: '8px 20px', borderRadius: 30, backdropFilter: 'blur(5px)',
        fontFamily: 'Roboto, sans-serif', zIndex: 1000,
      }}>
        {current + 1} / {total}
      </div>
    </div>
  );
}
