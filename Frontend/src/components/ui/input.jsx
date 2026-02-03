import * as React from "react"

const Input = React.forwardRef(({ className = "", type = "text", ...props }, ref) => (
  <input
    type={type}
    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/5 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
