export function Wordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      DESAFIO <span className="text-primary">X</span>
    </span>
  );
}
