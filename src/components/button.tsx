import React from "react"
import { IButtonContainerProps, ButtonContainer } from 'react-base-components'
import { LucideLoaderCircle } from "lucide-react"
import { componentSelector } from "react-component-selector"

const buttonVariations = {
  default: (props: IButtonContainerProps, ref: any) => {
    return (
      <ButtonContainer
        {...props}
        ref={ref}
        loadingComponent={
          <LucideLoaderCircle className='flex items-center justify-center w-6 h-6 rotating-div' />
        }
        className={`${props.className || ''} bg-main-violet-500 hover:bg-main-violet-600 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all rounded-full h-12 p-1 px-9 cursor-pointer `} />
    )
  },
  warning: (props: IButtonContainerProps, ref: any) => {
    return (
      <ButtonContainer
        {...props}
        ref={ref}
        loadingComponent={
          <LucideLoaderCircle className='flex items-center justify-center w-6 h-6 rotating-div' />
        }
        className={`${props.className || ''} flex items-center justify-center bg-red-500 text-white px-2 w-full shadow hover:bg-opacity-70 rounded transition-all h-9 p-1 font-semibold`} />
    )
  },
  outline: (props: IButtonContainerProps, ref: any) => {
    return (
      <ButtonContainer
        {...props}
        ref={ref}
        loadingComponent={
          <LucideLoaderCircle className='flex items-center justify-center w-6 h-6 rotating-div' />
        }
        className={`${props.className || ''} text-zinc-200 rounded border border-zinc-700 bg-transparent min-h-12 flex items-center justify-center gap-2 px-3 hover:bg-purple-600/15 transition-all cursor-pointer`}
      />
    )
  },
  text: (props: IButtonContainerProps, ref: any) => {
    return (
      <ButtonContainer
        {...props}
        ref={ref}
        className={`${props.className || ''} text-sm hover:text-purple-300 text-purple-400 bg-transparent transition-all cursor-pointer`}
      />
    )
  }
}

const Button = componentSelector<keyof typeof buttonVariations, IButtonContainerProps>(buttonVariations)

export default Button
