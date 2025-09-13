interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: "default" | "outline";
}

export function Button({ children, className = "", isLoading = false, variant = "default", ...props }: ButtonProps) {
  const baseClasses = "w-full max-w-xs mx-auto block py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    default: "bg-[#7C65C1] text-white hover:bg-[#6952A3] disabled:hover:bg-[#7C65C1]",
    outline: "border-2 border-gray-600 text-white bg-transparent hover:bg-gray-800"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
