type KeyframeLike = Keyframe[] | PropertyIndexedKeyframes;

export function safeAnimate(el: Element, keyframes: KeyframeLike, options?: number | KeyframeAnimationOptions) {
  const canAnimate = typeof (el as any).animate === 'function';
  if (canAnimate) return (el as any).animate(keyframes as any, options as any);
  return undefined;
}

export function appear(el: Element) {
  return safeAnimate(el, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
}

export function press(el: Element) {
  return safeAnimate(el, [{ transform: 'scale(1)' }, { transform: 'scale(0.98)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
}

export function hover(el: Element) {
  return safeAnimate(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1px)' }], { duration: 150, easing: 'ease-out' });
}