import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundFX } from '../audio/AudioManager';

/**
 * Magnification is explicitly a telescope view. The Earth in the station sky
 * remains approximately two degrees wide, rather than being made fantastically
 * large for visual impact. This viewer uses NASA Blue Marble ground imagery.
 */
export const ObservationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const mount = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1.25);
  const [autoRotate, setAutoRotate] = useState(true);
  const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'received'>('idle');
  const zoomRef = useRef(zoom);
  const autoRef = useRef(autoRotate);
  zoomRef.current = zoom;
  autoRef.current = autoRotate;

  // A simple *simulated* Earth-Moon round trip, not a live network request.
  useEffect(() => {
    if (messageStatus !== 'sending') return;
    const timer = window.setTimeout(() => { soundFX.playSuccessChord(); setMessageStatus('received'); }, 2600);
    return () => window.clearTimeout(timer);
  }, [messageStatus]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      el.classList.add('observation-fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(0, 0, 5.6);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.48, 64, 48),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0 })
    );
    scene.add(sphere);
    scene.add(new THREE.AmbientLight(0x7799c0, 0.14));
    const sunlight = new THREE.DirectionalLight(0xfff6e3, 2.9);
    sunlight.position.set(-4, 3, 7);
    scene.add(sunlight);
    const loader = new THREE.TextureLoader();
    loader.load('/assets/earth-blue-marble.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      (sphere.material as THREE.MeshStandardMaterial).map = texture;
      (sphere.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
    sphere.rotation.y = -1.10;
    sphere.rotation.z = -0.17;

    let pointerDown = false;
    let priorX = 0;
    let last = performance.now();
    let id = 0;
    const down = (event: PointerEvent) => {
      pointerDown = true;
      priorX = event.clientX;
      el.setPointerCapture?.(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!pointerDown) return;
      sphere.rotation.y += (event.clientX - priorX) * 0.007;
      priorX = event.clientX;
    };
    const up = () => { pointerDown = false; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    const resize = () => {
      const w = el.clientWidth || 400;
      const h = el.clientHeight || 380;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (autoRef.current && !pointerDown) sphere.rotation.y += dt * 0.055;
      camera.position.z = 5.6 / zoomRef.current;
      renderer.render(scene, camera);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      sphere.geometry.dispose();
      (sphere.material as THREE.Material).dispose();
      const map = (sphere.material as THREE.MeshStandardMaterial).map;
      map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#03070c]/95 p-3 sm:p-8 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Earth observation telescope">
      <div className="moon-observation relative flex w-full max-w-5xl max-h-[94vh] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#111b27] shadow-[0_45px_130px_rgba(0,0,0,.85)] lg:flex-row">
        <div className="relative h-[46vh] min-h-[285px] flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#142c45_0%,#09111f_45%,#05080f_78%)] lg:h-[570px]">
          <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#bfd9e9]">LUNA-7 · Observation telescope</div>
          <div ref={mount} className="h-full w-full cursor-grab active:cursor-grabbing" aria-label="Drag to rotate the Earth" />
          <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-10 flex justify-between text-[11px] text-white/55"><span>NASA BLUE MARBLE · EARTH</span><span>OPTICAL MAGNIFICATION</span></div>
        </div>
        <aside className="flex w-full flex-col justify-between gap-6 p-6 sm:p-8 lg:w-[340px] lg:p-9">
          <div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#79b6d2]">PIX'S FIELD NOTES</span>
              <button type="button" onClick={onClose} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:bg-white/10">Close ✕</button>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Our blue home.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#b7c9d5]">"Whoa! That's Earth. Everyone we know is over there. Want a closer look?" — PIX</p>
            <p className="mt-4 text-sm leading-6 text-[#d0dce4]">From the Moon, Earth looks about <strong>two degrees wide</strong> in the sky. This telescope lets us magnify it without pretending it's enormous outside.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xl font-bold text-white">~384,400</div><div className="text-[11px] text-[#9eb0bd]">km average distance</div></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xl font-bold text-white">~1.3 sec</div><div className="text-[11px] text-[#9eb0bd]">one-way light travel</div></div>
            </div>
            <div className="mt-6">
              <label htmlFor="observation-zoom" className="mb-2 flex justify-between text-xs text-[#b7c9d5]"><span>Telescope magnification</span><span>{zoom.toFixed(1)}×</span></label>
              <input id="observation-zoom" type="range" min="0.8" max="1.8" step="0.1" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="w-full accent-[#87c3d9]" />
            </div>
            <button type="button" onClick={()=>setAutoRotate(!autoRotate)} className="mt-4 text-sm text-[#8dc8e1] hover:text-white">{autoRotate ? 'Pause rotation' : 'Resume rotation'} · Drag the planet to explore</button>
            <div className="mt-6 rounded-xl border border-[#8abdd0]/25 bg-[#1c3445]/50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#98cbd9]">TRY A SCIENCE EXPERIMENT</div>
              <p className="mt-2 text-sm text-white">How long does it take to hear back from Earth?</p>
              <button type="button" disabled={messageStatus === 'sending'} onClick={() => setMessageStatus('sending')} className="mt-3 rounded-lg bg-[#d3eaf0] px-4 py-2.5 text-xs font-bold text-[#172935] disabled:opacity-60">{messageStatus === 'sending' ? 'Waiting for the signal…' : messageStatus === 'received' ? 'Send another hello ↗' : 'Send hello to Earth ↗'}</button>
              {messageStatus === 'received' && <p role="status" className="mt-3 text-sm leading-5 text-[#a8ddba]">"Hello, LUNA-7! We hear you!" The shortest possible light-speed round trip takes about 2.6 seconds.</p>}
              {messageStatus === 'sending' && <p role="status" className="mt-3 text-xs text-[#adc5d6]">Our message is traveling across space and back. Even light needs time!</p>}
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 text-[11px] leading-5 text-[#8297a7]">NASA Blue Marble imagery (public NASA source); telescope is an educational magnified rendering, not a live camera feed. Average distance and delay vary with orbit.</div>
        </aside>
      </div>
    </div>
  );
};