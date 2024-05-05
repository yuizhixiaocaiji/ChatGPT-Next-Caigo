import en from "./en";
import zh, { LocaleType } from "./zh";

const ALL_LANGS = {
  zh,
  en,
};

export type Lang = keyof typeof ALL_LANGS;
const LANG_KEY = "lang";
const DEFAULT_LANG = "zh";

export const AllLangs = Object.keys(ALL_LANGS) as Lang[];

function getItem(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getLanguage() {
  try {
    return navigator.language.toLowerCase();
  } catch {
    return DEFAULT_LANG;
  }
}

export function getLang(): Lang {
  const savedLang = getItem(LANG_KEY);

  if (AllLangs.includes((savedLang ?? "") as Lang)) {
    return savedLang as Lang;
  }

  const lang = getLanguage();

  for (const option of AllLangs) {
    if (lang.includes(option)) {
      return option;
    }
  }

  return DEFAULT_LANG;
}

const fallbackLang = zh;
const targetLang = ALL_LANGS[getLang()] as LocaleType;

export default fallbackLang as LocaleType;
