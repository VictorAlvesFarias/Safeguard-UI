import * as OTPAuth from 'otpauth'
import jsQR from 'jsqr'

export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512'

export interface OtpEntry {
    issuer: string
    accountName: string
    secret: string
    algorithm: OtpAlgorithm
    digits: number
    period: number
}

const ALGORITHMS: OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512']

export function normalizeSecret(secret: string): string {
    return secret.replace(/[\s=-]/g, '').toUpperCase()
}

export function isValidSecret(secret: string): boolean {
    return /^[A-Z2-7]{8,}$/.test(normalizeSecret(secret))
}

export function generateCode(entry: Pick<OtpEntry, 'secret' | 'algorithm' | 'digits' | 'period'>, now = Date.now()) {
    const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(normalizeSecret(entry.secret)),
        algorithm: entry.algorithm,
        digits: entry.digits,
        period: entry.period,
    })
    return {
        code: totp.generate({ timestamp: now }),
        remaining: entry.period - (Math.floor(now / 1000) % entry.period),
    }
}

export function formatCode(code: string): string {
    return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code
}

function fromOtpAuthUri(uri: string): OtpEntry {
    const parsed = OTPAuth.URI.parse(uri)
    if (!(parsed instanceof OTPAuth.TOTP)) {
        throw new Error('Este código é do tipo HOTP (por contador), que não é suportado.')
    }
    const algorithm = (parsed.algorithm.toUpperCase().replace('-', '') as OtpAlgorithm)
    return {
        issuer: parsed.issuer,
        accountName: parsed.label,
        secret: parsed.secret.base32,
        algorithm: ALGORITHMS.includes(algorithm) ? algorithm : 'SHA1',
        digits: parsed.digits,
        period: parsed.period,
    }
}

function readProtobuf(bytes: Uint8Array): Map<number, Array<number | Uint8Array>> {
    const fields = new Map<number, Array<number | Uint8Array>>()
    let pos = 0

    const varint = () => {
        let result = 0
        let shift = 0
        while (pos < bytes.length) {
            const byte = bytes[pos++]
            result += (byte & 0x7f) * 2 ** shift
            if (!(byte & 0x80)) return result
            shift += 7
        }
        throw new Error('protobuf truncado')
    }

    while (pos < bytes.length) {
        const key = varint()
        const field = Math.floor(key / 8)
        const wireType = key % 8
        let value: number | Uint8Array
        if (wireType === 0) value = varint()
        else if (wireType === 2) {
            const length = varint()
            value = bytes.slice(pos, pos + length)
            pos += length
        } else if (wireType === 1) { pos += 8; continue }
        else if (wireType === 5) { pos += 4; continue }
        else throw new Error('protobuf inválido')
        fields.set(field, [...(fields.get(field) ?? []), value])
    }
    return fields
}

function fromMigrationUri(uri: string): OtpEntry[] {
    const raw = uri.match(/[?&]data=([^&]+)/)?.[1]
    if (!raw) {
        throw new Error('Exportação do Google Authenticator sem dados.')
    }
    const base64 = decodeURIComponent(raw).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const text = new TextDecoder()
    const algorithms: Record<number, OtpAlgorithm> = { 0: 'SHA1', 1: 'SHA1', 2: 'SHA256', 3: 'SHA512' }

    const entries: OtpEntry[] = []
    let skippedHotp = 0
    for (const item of readProtobuf(bytes).get(1) ?? []) {
        const p = readProtobuf(item as Uint8Array)
        const type = (p.get(6)?.[0] as number | undefined) ?? 2
        if (type === 1) { skippedHotp++; continue }
        const secretBytes = p.get(1)?.[0] as Uint8Array
        const name = text.decode((p.get(2)?.[0] as Uint8Array) ?? new Uint8Array())
        const issuer = text.decode((p.get(3)?.[0] as Uint8Array) ?? new Uint8Array())
        const [nameIssuer, ...accountParts] = name.includes(':') ? name.split(':') : ['', name]
        entries.push({
            issuer: issuer || nameIssuer.trim(),
            accountName: (accountParts.join(':') || name).trim(),
            secret: new OTPAuth.Secret({ buffer: secretBytes.slice().buffer }).base32,
            algorithm: algorithms[(p.get(4)?.[0] as number) ?? 1] ?? 'SHA1',
            digits: (p.get(5)?.[0] as number) === 2 ? 8 : 6,
            period: 30,
        })
    }

    if (!entries.length) {
        throw new Error(skippedHotp ? 'A exportação só tem códigos HOTP (por contador), que não são suportados.' : 'Nenhuma conta na exportação.')
    }
    return entries
}

export function parseOtpInput(input: string, fallback?: Partial<OtpEntry>): OtpEntry[] {
    const text = input.trim()
    if (/^otpauth-migration:\/\//i.test(text)) {
        return fromMigrationUri(text)
    }
    if (/^otpauth:\/\//i.test(text)) {
        return [fromOtpAuthUri(text)]
    }
    if (!isValidSecret(text)) {
        throw new Error('Chave inválida: use a chave em base32 (letras A-Z e números 2-7) ou um link otpauth://.')
    }
    return [{
        issuer: fallback?.issuer ?? '',
        accountName: fallback?.accountName ?? '',
        secret: normalizeSecret(text),
        algorithm: fallback?.algorithm ?? 'SHA1',
        digits: fallback?.digits ?? 6,
        period: fallback?.period ?? 30,
    }]
}

export async function readQrCode(image: Blob): Promise<string> {
    const url = URL.createObjectURL(image)
    try {
        const element = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Não consegui abrir a imagem.'))
            img.src = url
        })

        for (const scale of [1, 0.5, 2]) {
            const width = Math.max(1, Math.round(element.naturalWidth * scale))
            const height = Math.max(1, Math.round(element.naturalHeight * scale))
            if (width * height > 25_000_000) continue
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const context = canvas.getContext('2d', { willReadFrequently: true })!
            context.fillStyle = '#fff'
            context.fillRect(0, 0, width, height)
            context.drawImage(element, 0, 0, width, height)
            const result = jsQR(context.getImageData(0, 0, width, height).data, width, height, { inversionAttempts: 'attemptBoth' })
            if (result?.data) {
                return result.data
            }
        }
        throw new Error('Não encontrei um QR code nessa imagem.')
    } finally {
        URL.revokeObjectURL(url)
    }
}
