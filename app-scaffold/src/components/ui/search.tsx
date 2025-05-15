import { Input } from "./input"
import { Search } from "lucide-react"

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function SearchInput({ value, placeholder = "Search...", onChange, className = "" }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full pl-10 bg-white"
      />
    </div>
  )
}
