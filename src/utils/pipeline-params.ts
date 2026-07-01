export interface ExtensionQueryParams {
  domain: string | null
  platform: string | null
  email: string | null
  address: string | null
  iconUrl: string | null
  password: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
}

function extractEmailLocalPart(email: string | null): string | null {
  if (!email) {
    return null
  }

  const atIndex = email.indexOf('@')
  if (atIndex <= 0) {
    return email.trim() || null
  }

  return email.slice(0, atIndex).trim() || null
}

export function parseExtensionQueryParams(searchParams: URLSearchParams): ExtensionQueryParams {
  const email = searchParams.get('email')
  const explicitAddress = searchParams.get('address')

  return {
    domain: searchParams.get('sourceDomain') ?? searchParams.get('domain'),
    platform: searchParams.get('platform'),
    email,
    address: explicitAddress ?? extractEmailLocalPart(email),
    iconUrl: searchParams.get('iconUrl'),
    password: searchParams.get('password'),
    phone: searchParams.get('phone'),
    firstName: searchParams.get('firstName'),
    lastName: searchParams.get('lastName'),
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
