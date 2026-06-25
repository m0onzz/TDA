import { THEME_STORAGE_KEY } from "@/lib/theme/storage";
import { DEFAULT_THEME, THEME_IDS } from "@/types/theme";

const themeList = JSON.stringify(THEME_IDS);

export function ThemeInitScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var valid=${themeList};if(t&&valid.indexOf(t)!==-1){document.documentElement.setAttribute("data-theme",t);}else{document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_THEME)});}}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_THEME)});}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
