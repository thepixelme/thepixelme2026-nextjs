"use client";

interface Props {
  onGoHome: () => void;
  disabled: boolean;
}

export default function HomeIndicator({ onGoHome, disabled }: Props) {
  return (
    <button
      type="button"
      aria-label="Return to home screen"
      onClick={onGoHome}
      disabled={disabled}
      className="fixed left-1/2 z-40 grid h-11 w-32 -translate-x-1/2 place-items-end
                 disabled:pointer-events-none
                 bottom-[max(env(safe-area-inset-bottom),0px)]"
    >
      <span
        className={`h-1.5 w-32 rounded-full transition-opacity ${
          disabled ? "bg-white/40" : "bg-white/80"
        }`}
      />
    </button>
  );
}
