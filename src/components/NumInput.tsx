import { useEffect, useState } from 'react';

const parse = (t: string): number | null => {
  const s = t.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
  decimal?: boolean;
}

/** Number input that tolerates partial typing ("67.", "7,5"). */
export function NumInput({ value, onChange, placeholder, ariaLabel, disabled, decimal = true }: Props) {
  const [text, setText] = useState(value == null ? '' : String(value));

  useEffect(() => {
    if (parse(text) !== value) setText(value == null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      className="num"
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="next"
      aria-label={ariaLabel}
      placeholder={placeholder}
      disabled={disabled}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parse(e.target.value));
      }}
    />
  );
}
