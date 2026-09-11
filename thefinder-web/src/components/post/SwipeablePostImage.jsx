import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { releaseVelocity, swipeDirection } from './swipeGesture';

export default function SwipeablePostImage({ ref, urls, index, title, contain = false, onSelect, onDrag, onError, onVerticalDrag, onDismiss }) {
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);
  const gestureRef = useRef(null);
  const timerRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const settle = useCallback((direction) => {
    busyRef.current = true;
    setSettling(true);
    setOffset(-direction);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;
    timerRef.current = window.setTimeout(() => {
      if (direction) onSelect((index + direction + urls.length) % urls.length);
      setOffset(0);
      setSettling(false);
      busyRef.current = false;
    }, duration);
  }, [index, onSelect, urls.length]);

  useImperativeHandle(ref, () => ({
    step(direction) {
      if (busyRef.current || gestureRef.current || urls.length < 2) return;
      settle(direction);
    },
  }), [settle, urls.length]);

  function start(event) {
    if (!event.isPrimary) {
      cancel();
      return;
    }
    const canDismiss = Boolean(onDismiss) && window.matchMedia('(max-width: 767px)').matches;
    if ((urls.length < 2 && !canDismiss) || busyRef.current || event.button !== 0) return;
    gestureRef.current = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      width: event.currentTarget.clientWidth, height: event.currentTarget.clientHeight,
      axis: null, canDismiss,
      samples: [{ x: event.clientX, y: event.clientY, time: event.timeStamp }],
    };
    // Capture on the viewport before the first move. Touch screens otherwise
    // implicitly capture on the child, producing a bubbled lostpointercapture
    // when capture is transferred midway through the drag.
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      const vertical = Math.abs(dy) >= Math.abs(dx);
      if ((vertical && !gesture.canDismiss) || (!vertical && urls.length < 2)) {
        gestureRef.current = null;
        return;
      }
      gesture.axis = vertical ? 'y' : 'x';
    }
    gesture.samples = gesture.samples.filter((sample) => event.timeStamp - sample.time <= 100);
    gesture.samples.push({ x: event.clientX, y: event.clientY, time: event.timeStamp });
    onDrag();
    if (gesture.axis === 'y') {
      onVerticalDrag({ x: dx, y: dy, scale: Math.max(0.55, 1 - Math.abs(dy) / gesture.height * 0.8), returning: false });
    } else {
      setOffset(Math.max(-1, Math.min(1, dx / gesture.width)));
    }
  }

  function finish(event) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    gestureRef.current = null;
    if (!gesture.axis) return;
    onDrag();
    if (gesture.axis === 'y') {
      const distance = event.clientY - gesture.y;
      const velocity = releaseVelocity(gesture.samples.map((sample) => ({ x: sample.y, time: sample.time })), event.clientY, event.timeStamp);
      if (Math.abs(distance) > gesture.height * 0.25 || (Math.abs(distance) >= 40 && Math.abs(velocity) >= 0.6 && Math.sign(distance) === Math.sign(velocity))) {
        busyRef.current = true;
        onDismiss();
      } else {
        onVerticalDrag({ x: 0, y: 0, scale: 1, returning: true });
      }
      return;
    }
    const velocity = releaseVelocity(gesture.samples, event.clientX, event.timeStamp);
    settle(swipeDirection(event.clientX - gesture.x, gesture.width, velocity));
  }

  function cancel() {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.axis) {
      onDrag();
      if (gesture.axis === 'y') onVerticalDrag({ x: 0, y: 0, scale: 1, returning: true });
      else settle(0);
    }
  }

  function lostCapture(event) {
    if (event.target !== event.currentTarget || gestureRef.current?.id !== event.pointerId) return;
    cancel();
  }

  return <div
    className={`h-full w-full select-none overflow-hidden ${onDismiss ? 'touch-pinch-zoom md:touch-pan-y' : 'touch-pan-y touch-pinch-zoom'}`}
    style={{ WebkitTouchCallout: 'none' }}
    onPointerDown={start} onPointerMove={move} onPointerUp={finish}
    onPointerCancel={cancel} onLostPointerCapture={lostCapture}
    onDragStart={(event) => event.preventDefault()}
  >
    <div className="relative h-full w-full" style={{
      transform: `translate3d(${offset * 100}%, 0, 0)`,
      transition: settling ? 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
    }}>
      {(urls.length > 1 ? [-1, 0, 1] : [0]).map((slot) => {
        const imageIndex = (index + slot + urls.length) % urls.length;
        return <img key={slot} src={urls[imageIndex]} draggable={false}
          alt={slot === 0 ? `Ảnh ${index + 1} của bài đăng ${title}` : ''}
          aria-hidden={slot !== 0 || undefined}
          onError={slot === 0 ? onError : undefined}
          className={`pointer-events-none absolute inset-0 h-full w-full ${contain ? 'object-contain' : 'object-cover object-center'}`}
          style={{ transform: `translateX(${slot * 100}%)` }} />;
      })}
    </div>
  </div>;
}
