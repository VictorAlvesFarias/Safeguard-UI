import { EmailEntity } from "./email-entity"
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
}

export {
    AuthenticatorEntity
}
