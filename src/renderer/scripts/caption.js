const caption = document.querySelector('#caption');

window.captionPulse.caption.onUpdate((payload) => {
  caption.textContent = payload.text || '';
  caption.style.fontSize = `${payload.fontSize || 32}px`;
  caption.style.textAlign = payload.alignment || 'center';
  caption.style.background = payload.background || '#000';
  caption.style.opacity = String(payload.opacity ?? 0.72);
});
