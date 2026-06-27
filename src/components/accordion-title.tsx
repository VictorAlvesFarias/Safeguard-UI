import React from "react"
import { AccordionTitleContainer, IAccordionTitleContainerProps } from 'react-base-components'
import { componentSelector } from "react-component-selector"

const AccordionTitleVariations = {
    default: (props: IAccordionTitleContainerProps, ref: any) => {
        return (
            <AccordionTitleContainer
                {...props}
                ref={ref}
                className='' />
        )
    }
}

const AccordionTitle = componentSelector<keyof typeof AccordionTitleVariations, IAccordionTitleContainerProps>(AccordionTitleVariations)

export default AccordionTitle
