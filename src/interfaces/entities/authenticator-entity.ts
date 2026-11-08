import { EmailEntity } from "./email-entity"
import { EmailAddressEntity } from "./email-address-entity"
import { OtpAlgorithm } from "../../utils/authenticator/otp"

interface AuthenticatorEntity {
    id: number
    issuer: string
    accountName: string
    secret: string
    algorithm: OtpAlgorithm
    digits: number
    period: number
    emailId: number | null
    email: EmailEntity | null
    emailAddressId: number | null
    emailAddress: EmailAddressEntity | null
}

export {
    AuthenticatorEntity
}
