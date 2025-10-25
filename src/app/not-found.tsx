'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4"
        suppressHydrationWarning
      >
        <div className="w-full max-w-2xl">
          <Card className="border-2 p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <h1 className="text-9xl font-bold text-primary">404</h1>
              </div>
              <div className="mb-8 space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Página não encontrada
                </h2>
                <p className="text-lg text-muted-foreground">
                  Desculpe, não conseguimos encontrar a página que você está procurando.
                </p>
                <p className="text-sm text-muted-foreground">
                  A página pode ter sido movida, deletada ou nunca existiu.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    Voltar ao Início
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/dashboard/usuarios">
                    <Search className="h-4 w-4" />
                    Ver Usuários
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4"
      suppressHydrationWarning
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            {/* Animated 404 Number */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="absolute -left-4 -top-4 text-6xl opacity-20"
                >
                  <FileQuestion className="h-20 w-20 text-primary" />
                </motion.div>
                <h1 className="text-9xl font-bold text-primary">404</h1>
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-8 space-y-3"
            >
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Página não encontrada
              </h2>
              <p className="text-muted-foreground text-lg">
                Desculpe, não conseguimos encontrar a página que você está procurando.
              </p>
              <p className="text-muted-foreground text-sm">
                A página pode ter sido movida, deletada ou nunca existiu.
              </p>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-8 flex gap-2"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="h-2 w-2 rounded-full bg-primary/50"
                />
              ))}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Voltar ao Início
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/dashboard/usuarios">
                  <Search className="h-4 w-4" />
                  Ver Usuários
                </Link>
              </Button>
            </motion.div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8"
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar à página anterior
              </Button>
            </motion.div>
          </div>
        </Card>

        {/* Footer Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-muted-foreground text-sm">
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
