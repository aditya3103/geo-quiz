// src/utils/sound.js
export const playCorrectSound = () => {
  try {
    const a = new Audio("/sounds/correct.mp3");
    a.volume = 0.9;
    a.play().catch(() => {}); // ignore play() promise rejections
  } catch (e) {}
};

export const playWrongSound = () => {
  try {
    const a = new Audio("/sounds/wrong.mp3");
    a.volume = 0.85;
    a.play().catch(() => {});
  } catch (e) {}
};

export const vibrate = (duration = 120) => {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate(duration);
  } catch (e) {}
};
