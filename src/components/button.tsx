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
        className={`${props.className || ''} bg-main-violet-500 hover:bg-main-violet-600 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all px-2 rounded-full  h-9 p-1 `} />
    )
  },
  red: (props: IButtonContainerProps, ref: any) => {
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
  green: (props: IButtonContainerProps, ref: any) => {
    return (
      <ButtonContainer
        {...props}
        ref={ref}
        loadingComponent={
          <LucideLoaderCircle className='flex items-center justify-center w-6 h-6 rotating-div' />
        }
        className={`${props.className || ''} flex items-center justify-center bg-green-600 text-white px-2 shadow hover:bg-opacity-70 rounded transition-all h-9 p-1 font-semibold`} />
    )
  },
}

const Button = componentSelector<keyof typeof buttonVariations, IButtonContainerProps>(buttonVariations)

export default Button
