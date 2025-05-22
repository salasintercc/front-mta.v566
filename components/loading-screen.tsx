"use client"

import { useLanguage } from "@/contexts/language-context"

export default function LoadingScreen() {
  const { t } = useLanguage()

  return (
    <div className="fixed inset-0 bg-rich-black/80 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">{t("common.loading")}</p>
      </div>
    </div>
  )
}
