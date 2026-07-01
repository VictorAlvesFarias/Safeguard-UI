import { componentSelector } from "react-component-selector"
import React from "react"

const spanVariations = {
  default: (props: React.HTMLAttributes<HTMLSpanElement>) =>
    <span {...props} className='mb-1 font-semibold px-1' />,
  error: (props: React.HTMLAttributes<HTMLSpanElement>) =>
    <span {...props} className='text-red-400' />
}

const Span = componentSelector<keyof typeof spanVariations, React.HTMLAttributes<HTMLSpanElement>>(spanVariations)

export default Span