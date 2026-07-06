interface AvatarProps {
  initial: string;
  size?: number;
}

export function Avatar({ initial, size = 38 }: AvatarProps) {
  return (
    <div
      className="rounded-full bg-accent flex items-center justify-center font-semibold text-[13px] text-white shrink-0"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
