import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-8 max-w-[12rem]">
      <Image
        src="/Fennaver-C-Logo.png"
        fill
        sizes="(max-width: 768px) 8rem, 12rem"
        className="object-contain"
        alt="Fennaver Akademi"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
