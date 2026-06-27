import { componentSelector } from "react-component-selector"
import { Link, LinkProps } from "react-router-dom";
import React from "react"

type HrefProps = React.ComponentProps<typeof Link> &
    React.HTMLAttributes<HTMLAnchorElement>;

const HrefVariations = {
    default: (props: HrefProps) =>
        <Link {...props} className='border-violet-500 p-2 px-3 rounded-full border text-sm bg-violet-500 bg-opacity-20 w-fit text-violet-500 hover:bg-opacity-30 transition-all' />,
}

const Href = componentSelector<keyof typeof HrefVariations, HrefProps>(HrefVariations)

export default Href