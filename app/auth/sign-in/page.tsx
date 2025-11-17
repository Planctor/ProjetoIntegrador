'use client'

import { Suspense } from 'react'
import SignInForm from '@/components/auth/sign-in-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function SignInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="h-8 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  )
}
