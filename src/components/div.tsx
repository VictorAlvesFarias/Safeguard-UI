import React from "react"
import { componentSelector } from "react-component-selector"

const divVariations = {
  "default": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={props.className} />,
  "router-root": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`flex flex-col md:flex-row w-screen h-screen bg-gradient-to-t from-main-black-800 to-main-black-900 text-white ${props.className ?? ''}`} />,
  "limiter": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <section {...props} className={`max-w-7xl w-11/12 h-full lg:px-0 px-5 py-16 ${props.className ?? ''}`} />,
  "in-center": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`flex-[1] h-full flex flex-col overflow-auto ${props.className ?? ''}`} />,
  "in-center-content": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`flex justify-center flex-col flex-1 items-center ${props.className ?? ''}`} />,
  "in-start": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`p-6 flex-[1] h-full flex flex-col overflow-auto ${props.className ?? ''}`} />,
  "accordion-title-root": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`rounded flex justify-between items-center hover:bg-zinc-800 border border-zinc-700 ${props.className ?? ''}`} />,
  "accordion-content-grid": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`grid grid-cols-2 justify-between items-center gap-6 ${props.className ?? ''}`} />,
  "accordion-content": (props: React.HTMLAttributes<HTMLDivElement>) =>
    <div {...props} className={`p-6 flex flex-col gap-6 ${props.className ?? ''}`} />
}

const Div = componentSelector<keyof typeof divVariations, React.HTMLAttributes<HTMLDivElement>>(divVariations)

export default Div
