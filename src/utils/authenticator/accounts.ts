import { EmailEntity } from '../../interfaces/entities/email-entity'
import { OtpEntry } from './otp'

const normalize = (value: string | null | undefined) =>
    (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const addressOf = (account: EmailEntity) =>
    account.emailAddress ? `${account.emailAddress.username}@${account.emailAddress.provider?.signature}` : ''

export function accountLabel(account: EmailEntity) {
    return `${account.platform?.name ?? 'Sem plataforma'} · ${addressOf(account) || account.username}`
}

export function suggestAccount(entry: OtpEntry, accounts: EmailEntity[]): number | null {
    const issuer = normalize(entry.issuer)
    const name = entry.accountName.trim().toLowerCase()
    const match = accounts.find(account => {
        const platform = normalize(account.platform?.name)
        const samePlatform = platform.length > 0 && (platform === issuer || (issuer.length >= 4 && (issuer.includes(platform) || platform.includes(issuer))))
        const sameUser = name.length > 0 && (name === account.username?.toLowerCase() || name === addressOf(account).toLowerCase() || name === account.emailAddress?.username?.toLowerCase())
        return samePlatform && (sameUser || !name)
    })
    return match?.id ?? null
}
