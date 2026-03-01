interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-[#1A1A1A] mb-1.5">{label}</label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border-[3px] ${error ? 'border-[#E4000F]' : 'border-[#2C2C2C]'} rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#009AC7] transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-bold text-[#E4000F]">{error}</p>}
    </div>
  );
}
