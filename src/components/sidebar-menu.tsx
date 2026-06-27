import React from "react"
import { componentSelector } from "react-component-selector"
import { MenuContainer, IMenuContainerProps } from 'react-base-components'

const menuVariations = {
    default: (props: IMenuContainerProps) =>
        <MenuContainer
            {...props}
            className="max-w-60 flex-col flex-1 m-1 rounded-lg p-2 gap-2 bg-fort "
        />
}

const SidebarMenu = componentSelector<keyof typeof menuVariations, IMenuContainerProps>(menuVariations)

export default SidebarMenu
