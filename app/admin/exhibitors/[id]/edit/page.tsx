"use client"

import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StandOptionBuilder from "@/components/admin/stand-option-builder"

export default function EditStandOptionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const standOptionId = params.id

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gold">Edit Stand Option</h1>
            <p className="text-gray-300">Modify the configuration wizard for exhibitors to customize their booth.</p>
          </div>

          <StandOptionBuilder
            standOptionId={standOptionId}
            onSuccess={() => router.push("/admin/dashboard?tab=exhibitors")}
          />
        </div>
      </section>

      <Footer />
    </main>
  )
}
