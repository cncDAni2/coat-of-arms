import { h } from './dom';

export interface RangeOptions {
  min: number;
  max: number;
  step: number;
  title: string;
}

/**
 * Range slider with -/+ buttons and a numeric input.
 * onChange is throttled (200 ms) so dragging doesn't re-render the canvas on every pixel.
 */
export function rangeSlider(options: RangeOptions, initialValue: number, onChange: (value: number) => void): HTMLElement {
  let value = initialValue;
  let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

  const clamp = (v: number) => parseFloat(Math.max(options.min, Math.min(options.max, v)).toFixed(2));

  const emitChange = () => {
    if (throttleTimeout) clearTimeout(throttleTimeout);
    throttleTimeout = setTimeout(() => {
      onChange(value);
      throttleTimeout = null;
    }, 200);
  };

  const setValue = (v: number, source?: HTMLInputElement) => {
    value = v;
    if (source !== range) range.value = String(value);
    if (source !== numberInput) numberInput.value = String(value);
    emitChange();
  };

  const range = h('input', {
    type: 'range',
    class: 'input-range',
    min: options.min,
    max: options.max,
    step: options.step,
    value,
    oninput: () => setValue(parseFloat(range.value), range),
  });
  const numberInput = h('input', {
    type: 'number',
    class: 'range-input',
    value,
    oninput: () => {
      const parsed = parseFloat(numberInput.value);
      if (!isNaN(parsed)) setValue(clamp(parsed), numberInput);
    },
    onchange: () => setValue(clamp(parseFloat(numberInput.value) || 0)),
  });

  return h('div', { class: 'range-slider' }, [
    h('div', { class: 'slider-container-legend' }, [options.title]),
    h('div', { class: 'slider-container' }, [
      h('button', { type: 'button', onclick: () => setValue(clamp(value - options.step)) }, ['-']),
      range,
      h('button', { type: 'button', onclick: () => setValue(clamp(value + options.step)) }, ['+']),
      numberInput,
    ]),
  ]);
}
