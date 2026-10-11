import { CaptureEntity } from '../interfaces/entities/capture-entity'
import { PipelineData } from '../slices/pipeline-slice'

export function getCaptureId(searchParams: URLSearchParams): string | null {
  const id = searchParams.get('capture')
  return id && /^[a-f0-9]{32}$/i.test(id) ? id : null
}

function extractEmailLocalPart(value: string | null): string | null {
  if (!value) {
    return null
  }

  const atIndex = value.indexOf('@')
  if (atIndex <= 0) {
    return value.trim() || null
  }

  return value.slice(0, atIndex).trim() || null
}

function extractEmailDomain(value: string | null): string | null {
  const atIndex = value?.indexOf('@') ?? -1
  if (!value || atIndex <= 0) {
    return null
  }

  return value.slice(atIndex + 1).trim().toLowerCase() || null
}

export function captureToPipelineData(capture: CaptureEntity): Partial<PipelineData> {
  return {
    captureId: capture.id,
    domain: extractEmailDomain(capture.username),
    platform: capture.platform,
    email: capture.username,
    address: extractEmailLocalPart(capture.username),
    iconUrl: capture.iconUrl,
    password: capture.password,
    phone: capture.phone,
    firstName: capture.firstName,
    lastName: capture.lastName,
  }
}

export const PIPELINE_RETURN_URL_KEY = 'safeguard:returnUrl'

export function savePipelineReturnUrl(): void {
  const returnUrl = `${window.location.pathname}${window.location.search}`
  if (returnUrl.startsWith('/pipeline')) {
    sessionStorage.setItem(PIPELINE_RETURN_URL_KEY, returnUrl)
  }
}

export function consumePipelineReturnUrl(): string | null {
  const returnUrl = sessionStorage.getItem(PIPELINE_RETURN_URL_KEY)
  if (returnUrl) {
    sessionStorage.removeItem(PIPELINE_RETURN_URL_KEY)
  }

  return returnUrl
}
