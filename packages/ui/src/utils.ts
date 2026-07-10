import { type ClassValue, clsx } from 'clsx'
import { PureComponent } from 'react'
import { PureComponent as ReactPureComponent } from 'react'
import { Symbol } from 'typescript'
import { clsx as clsxHelper } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
