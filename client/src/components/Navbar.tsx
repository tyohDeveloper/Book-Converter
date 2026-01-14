import { Link } from "wouter";
import { BookOpen, Settings } from "lucide-react";

export function Navbar() {
  return (
    <nav className="w-full h-16 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform">
            <BookOpen size={18} />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight">Binder</span>
        </Link>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
