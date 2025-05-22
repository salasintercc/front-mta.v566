import { es } from "./es"
import { en } from "./en"
import { de } from "./de"

export type TranslationKey = keyof typeof es

const translations = {
  es,
  en,
  de,
}

export default translations
