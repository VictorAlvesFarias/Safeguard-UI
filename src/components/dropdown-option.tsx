import React from "react"
import { ISelectOptionContainerProps, SelectOptionContainer } from 'react-base-components'
import { componentSelector } from "react-component-selector"

const optionVaritions = {
    default: (props: ISelectOptionContainerProps) =>
        <SelectOptionContainer {...props} className='min-h-8 text-nowrap  hover:bg-zinc-800 rounded cursor-pointer flex items-center px-3' />,
}

const SelectOption = componentSelector<keyof typeof optionVaritions, ISelectOptionContainerProps>(optionVaritions)

export default SelectOption