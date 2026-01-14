import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Loader2, Globe, Monitor, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getSystemFonts } from "@/lib/file-manager/fonts-api";
import { GOOGLE_FONTS, GENERIC_FONTS, WEB_SAFE_FONTS, buildGoogleImport, formatFontFamily, type FontOption } from "./font-data";

function buildGoogleFontsPreviewUrl(fonts: string[]): string {
  const families = fonts.map(f => f.replace(/ /g, '+')).join('&family=');
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}

export interface FontSelection {
  fontFamily: string;
  googleImport?: string;
}

interface FontPickerProps {
  onSelect: (selection: FontSelection) => void;
  disabled?: boolean;
}

// Additional fonts to check on the client
const CLIENT_FONTS_TO_CHECK = [
  "Segoe UI", "Helvetica Neue", "Helvetica", "Apple Color Emoji", "SF Pro",
  "Lucida Grande", "Menlo", "Monaco", "Consolas", "Liberation Mono",
  "DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono", "Cantarell", "Droid Sans"
];

export function FontPicker({ onSelect, disabled }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [serverFonts, setServerFonts] = useState<string[]>([]);
  const [clientFonts, setClientFonts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const linkRef = useRef<HTMLLinkElement | null>(null);

  // Load Google Fonts for preview when popover opens
  useEffect(() => {
    if (open && !fontsLoaded) {
      const googleFontNames = GOOGLE_FONTS.map(f => f.family);
      if (googleFontNames.length > 0) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = buildGoogleFontsPreviewUrl(googleFontNames);
        document.head.appendChild(link);
        linkRef.current = link;
        setFontsLoaded(true);
      }
    }
  }, [open, fontsLoaded]);

  useEffect(() => {
    const loadFonts = async () => {
      setIsLoading(true);
      try {
        const result = await getSystemFonts();
        setServerFonts(result.fonts.map(f => f.family));
      } catch (err) {
        console.error("Failed to load server fonts:", err);
      }
      
      // Detect fonts available on the client
      const detected: string[] = [];
      for (const font of CLIENT_FONTS_TO_CHECK) {
        if (document.fonts.check(`12px "${font}"`)) {
          detected.push(font);
        }
      }
      setClientFonts(detected);
      
      setIsLoading(false);
    };
    loadFonts();
  }, []);

  const allFonts = useMemo(() => {
    const seen = new Set<string>();
    const fonts: FontOption[] = [];
    
    // Generic fonts first
    for (const f of GENERIC_FONTS) {
      fonts.push({ family: f.family, category: f.category, source: "generic" });
      seen.add(f.family.toLowerCase());
    }
    
    // Google Fonts (embeddable)
    for (const f of GOOGLE_FONTS) {
      const key = f.family.toLowerCase();
      if (!seen.has(key)) {
        fonts.push({ family: f.family, category: f.category, source: "google" });
        seen.add(key);
      }
    }
    
    // Web-safe fonts
    for (const f of WEB_SAFE_FONTS) {
      const key = f.family.toLowerCase();
      if (!seen.has(key)) {
        fonts.push({ family: f.family, category: f.category, source: "web-safe" });
        seen.add(key);
      }
    }
    
    // Client-detected fonts
    for (const family of clientFonts) {
      const key = family.toLowerCase();
      if (!seen.has(key)) {
        fonts.push({ family, category: "sans-serif", source: "web-safe" });
        seen.add(key);
      }
    }
    
    // Server system fonts
    for (const family of serverFonts) {
      const key = family.toLowerCase();
      if (!seen.has(key)) {
        fonts.push({ family, category: "sans-serif", source: "system" });
        seen.add(key);
      }
    }
    
    return fonts;
  }, [serverFonts, clientFonts]);

  const handleSelect = (font: FontOption) => {
    const fontFamily = formatFontFamily(font);
    const googleImport = font.source === "google" ? buildGoogleImport(font.family) : undefined;
    onSelect({ fontFamily, googleImport });
    setOpen(false);
  };

  const genericFonts = allFonts.filter(f => f.source === "generic");
  const googleFonts = allFonts.filter(f => f.source === "google");
  const webSafeFonts = allFonts.filter(f => f.source === "web-safe");
  const systemFonts = allFonts.filter(f => f.source === "system");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isLoading} className="gap-2" data-testid="button-font-picker">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Insert Font</>}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search fonts..." />
          <CommandList className="max-h-[350px]">
            <CommandEmpty>No fonts found.</CommandEmpty>
            <CommandGroup heading="Generic (Always Available)">
              {genericFonts.map((font) => (
                <CommandItem key={font.family} value={font.family} onSelect={() => handleSelect(font)} data-testid={`font-option-${font.family}`}>
                  <span style={{ fontFamily: font.family }}>{font.family}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Google Fonts (Free to Embed)">
              {googleFonts.map((font) => (
                <CommandItem key={font.family} value={font.family} onSelect={() => handleSelect(font)} data-testid={`font-option-${font.family}`}>
                  <Globe className="h-3 w-3 mr-2 text-blue-500" />
                  <span style={{ fontFamily: `"${font.family}", ${font.category}` }}>{font.family}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {webSafeFonts.length > 0 && (
              <CommandGroup heading="Web-Safe (Most Systems)">
                {webSafeFonts.map((font) => (
                  <CommandItem key={font.family} value={font.family} onSelect={() => handleSelect(font)} data-testid={`font-option-${font.family}`}>
                    <Monitor className="h-3 w-3 mr-2 text-green-500" />
                    <span style={{ fontFamily: `"${font.family}", ${font.category}` }}>{font.family}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {systemFonts.length > 0 && (
              <CommandGroup heading="Server System Fonts">
                {systemFonts.map((font) => (
                  <CommandItem key={`sys-${font.family}`} value={`sys-${font.family}`} onSelect={() => handleSelect(font)} data-testid={`font-option-system-${font.family}`}>
                    <Server className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">{font.family}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
