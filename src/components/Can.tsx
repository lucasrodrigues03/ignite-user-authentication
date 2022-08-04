import { ReactNode } from 'react'
import { useCan } from '../hooks/useCan'

interface CanRenderProps {
  children: ReactNode
  permissions?: string[]
  roles?: string[]
}

export function Can({ children, permissions, roles }: CanRenderProps) {
  const userCanRenderComponent = useCan({ permissions, roles })

  if (!userCanRenderComponent) return null

  return <>{children}</>
}
