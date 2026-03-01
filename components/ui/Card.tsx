interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b-[3px] border-[#2C2C2C]">
          <h2 className="font-extrabold text-lg text-[#1A1A1A]">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
