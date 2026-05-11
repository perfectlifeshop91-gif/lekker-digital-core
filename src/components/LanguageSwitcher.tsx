import { Globe } from "lucide-react";
import { LANGS, useLang, type Lang } from "@/lib/i18n";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ size = "sm" }: { size?: "sm" | "default" | "icon" }) {
  const { lang, setLang } = useLang();
  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size}>
          <Globe className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">{current.flag} {current.label}</span>
          <span className="ml-1 sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map(l => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code as Lang)} className={lang === l.code ? "bg-muted" : ""}>
            <span className="mr-2">{l.flag}</span> {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
