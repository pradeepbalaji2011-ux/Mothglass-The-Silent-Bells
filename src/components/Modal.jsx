import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { Ornament } from './Emblems';

export default function Modal({ children, title, eyebrow, onClose, className = '' }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    const trap = event => {
      if (event.key !== 'Tab') return;
      const focusable = [...panel.current.querySelectorAll('button:not(:disabled), [href], input, [tabindex="0"]')];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    };
    panel.current.addEventListener('keydown', trap);
    const el = panel.current;
    return () => { el.removeEventListener('keydown', trap); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, [title]);

  return createPortal(<div className="modal-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
    <section className={`modal-panel ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={panel}>
      <div className="panel-grain" />
      {onClose && <button className="icon-button modal-close" aria-label="Close panel" onClick={onClose}><X size={20} weight="light" /></button>}
      <div className="modal-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2 id="modal-title">{title}</h2>
        <Ornament className="heading-ornament" />
      </div>
      {children}
    </section>
  </div>, document.fullscreenElement || document.body);
}
