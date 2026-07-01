import React from "react"
import { componentSelector } from "react-component-selector"

const CardVariations = {
    default: (props: React.HTMLAttributes<HTMLDivElement>) =>
        <div {...props} className={"hover:bg-zinc-800 cursor-pointer transition-all p-6 flex-1 shadow-md h-full rounded border border-zinc-800 flex-col gap-3 flex"} />,
    unselectable: (props: React.HTMLAttributes<HTMLDivElement>) =>
        <div {...props} className={"transition-all p-6 flex-1 shadow-md h-full rounded border border-zinc-800 flex-col gap-3 flex"} />,

}

const Card = componentSelector<keyof typeof CardVariations, React.HTMLAttributes<HTMLDivElement>>(CardVariations)

export default Card
