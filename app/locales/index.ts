import en from "./en";
import cn, { LocaleType } from "./cn";

const ALL_LANGS = {
  cn,
  en,
};

export type Lang = keyof typeof ALL_LANGS;
const LANG_KEY = "lang";
const DEFAULT_LANG = "cn";

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

const fallbackLang = cn;
const targetLang = ALL_LANGS[getLang()] as LocaleType;

export default fallbackLang as LocaleType;

export function getISOLang() {
  const isoLangString: Record<string, string> = {
    cn: "zh-Hans",
    tw: "zh-Hant",
  };

  const lang = getLang();
  return isoLangString[lang] ?? lang;
}

