import Image from "next/image";

export default function AuthBrand() {
  return (
    <div className="flex flex-col items-center text-center mb-8">
      <Image
        src="/logo.png"
        alt="Texx Social"
        width={280}
        height={280}
        priority
        className="w-48 h-auto mb-2"
      />
      <p className="mt-2 text-slate-500">Share your moments. Build your circle.</p>
    </div>
  );
}
