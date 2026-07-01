import React from "react"
import { componentSelector } from "react-component-selector"
import { ISelectMenuContainerProps, SelectMenuContainer } from 'react-base-components'

const dropdownMenuVariations = {
    default: (props: ISelectMenuContainerProps) =>
        <SelectMenuContainer
            {...props}
            className='rounded bg-zinc-900 text-zinc-100 p-1 gap-2 mt-1 shadow-lg max-h-40 overflow-auto flex flex-col'
        />
}

const SelectMenu = componentSelector<keyof typeof dropdownMenuVariations, ISelectMenuContainerProps>(dropdownMenuVariations)

export default SelectMenu
