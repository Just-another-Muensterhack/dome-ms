import type { PropsWithChildren } from 'react'

type OnboardingFrameProps = PropsWithChildren<{
  title: string,
  description: string,
  wide?: boolean,
}>

export const OnboardingFrame = ({
  title,
  description,
  wide = false,
  children,
}: OnboardingFrameProps) => (
  <div className="flex h-dvh w-screen items-center justify-center overflow-auto bg-background px-6 py-10">
    <div className={`flex w-full flex-col gap-8 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
      <div className="flex flex-col gap-2">
        <h1 className="typography-title-lg">{title}</h1>
        <p className="typography-body text-description">{description}</p>
      </div>
      {children}
    </div>
  </div>
)
