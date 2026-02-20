import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  href?: string;
}

export function Logo({ size = 'md', showName = true, href = '/' }: LogoProps) {
  // The Bluestock logo is wide/landscape — use width-based sizing
  const imgDims = {
    sm: { w: 100, h: 22 },
    md: { w: 130, h: 28 },
    lg: { w: 180, h: 40 },
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const { w, h } = imgDims[size];

  const content = (
    <div className="flex flex-col gap-1 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
      {/* Brand logo image — full width landscape */}
      <div className="group-data-[collapsible=icon]:hidden">
        <Image
          src="/logo.png"
          alt="Bluestock logo"
          width={w}
          height={h}
          className="object-contain"
          priority
        />
      </div>
      {/* Collapsed icon — just initial letter */}
      <div className="hidden group-data-[collapsible=icon]:flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
        L
      </div>

      {/* Game name below logo */}
      {showName && (
        <div className="group-data-[collapsible=icon]:hidden pl-0.5">
          <span className={`font-extrabold tracking-tight ${textSizes[size]} bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent leading-none`}>
            Logic Looper
          </span>
          <span className="block text-[10px] text-muted-foreground font-medium tracking-widest uppercase mt-0.5">
            Daily Puzzles
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="focus:outline-none">{content}</Link>;
  }
  return content;
}
