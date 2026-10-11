interface CaptureEntity {
    id: string
    createdAt: string
    domain: string | null
    url: string | null
    iconUrl: string | null
    platform: string | null
    username: string | null
    password: string | null
    phone: string | null
    firstName: string | null
    lastName: string | null
}

export {
    CaptureEntity
}

interface CaptureMatchAccount {
    id: number
    username: string
    platformId: number | null
    platformName: string | null
}

interface CaptureMatchEntity {
    capture: CaptureEntity
    email: string | null
    localPart: string | null
    emailDomain: string | null
    platform: { id: number, name: string } | null
    provider: { id: number, name: string, signature: string } | null
    emailAddress: { id: number, username: string, providerSignature: string | null } | null
    account: CaptureMatchAccount | null
    otherAccounts: CaptureMatchAccount[]
}

export {
    CaptureMatchAccount,
    CaptureMatchEntity
}
