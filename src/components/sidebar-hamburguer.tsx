import React from "react"
import { SidebarHamburguerContainer, ISidebarHamburguerContainerProps } from 'react-base-components'
import { componentSelector } from "react-component-selector"

const hamburguerVariations = {
    default: (props: ISidebarHamburguerContainerProps) =>
        <SidebarHamburguerContainer {...props} className="md:hidden cursor-pointer" />
}

const SidebarHamburguer = componentSelector<keyof typeof hamburguerVariations, ISidebarHamburguerContainerProps>(hamburguerVariations)

export default SidebarHamburguer