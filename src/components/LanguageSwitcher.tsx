import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Language, languageNames } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  const languages = Object.entries(languageNames) as [Language, string][];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {languages.map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code)}
            className={language === code ? "bg-muted" : ""}
          >
            <span className="mr-2">{getFlagEmoji(code)}</span>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getFlagEmoji = (lang: Language): string => {
  const flags: Record<Language, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ar: '🇸🇦',
    hi: '🇮🇳',
    pt: '🇧🇷',
    ru: '🇷🇺',
    ur: '🇵🇰',
  };
  return flags[lang] || '🌍';
};

export default LanguageSwitcher;
