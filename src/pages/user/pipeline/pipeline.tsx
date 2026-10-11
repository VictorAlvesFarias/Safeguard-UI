import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SelectContext, If } from 'react-base-components'
import {
  AtSign,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Eye,
  EyeOff,
  Globe,
  Layers,
  Mail,
  Server,
} from 'lucide-react'
import Content from '../../../components/content'
import Button from '../../../components/button'
import CardLoading from '../../helpers/loading/card-loading'
import SelectRoot from '../../../components/dropdown-root'
import SelectMenu from '../../../components/dropdown-menu'
import DropdownOption from '../../../components/dropdown-option'
import { USER_ROUTES } from '../../../config/routes-config'
import { captureService } from '../../../services/capture-service'
import { fileService } from '../../../services/files-service'
import { platformService } from '../../../services/platforms-service'
import { providerService } from '../../../services/provider-service'
import { emailAddressService } from '../../../services/email-address-service'
import { useAppDispatch, useAppSelector } from '../../../utils/hooks/redux-hooks'
import { clearPipelineData, setPipelineData } from '../../../slices/pipeline-slice'
import { captureToPipelineData, getCaptureId } from '../../../utils/pipeline-params'
import { CaptureMatchAccount, CaptureMatchEntity } from '../../../interfaces/entities/capture-entity'
import { PlatformEntity } from '../../../interfaces/entities/platform-entity'
import { ProviderEntity } from '../../../interfaces/entities/provider-entity'
import { EmailAddressEntity } from '../../../interfaces/entities/email-address-entity'

function toList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  return (value as { res?: T[] } | null | undefined)?.res ?? []
}

type StepState = 'found' | 'new' | 'blocked'

function StateBadge({ state }: { state: StepState }) {
  const styles: Record<StepState, { label: string, className: string, icon: React.ReactNode }> = {
    found: { label: 'Encontrado', className: 'bg-green-500/15 text-green-400', icon: <CheckCircle2 className='w-3.5 h-3.5' /> },
    new: { label: 'Novo', className: 'bg-main-violet-500/20 text-purple-300', icon: <CircleDashed className='w-3.5 h-3.5' /> },
    blocked: { label: 'Aguardando', className: 'bg-zinc-700/50 text-zinc-400', icon: <CircleDashed className='w-3.5 h-3.5' /> },
  }
  const style = styles[state]

  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full w-fit ${style.className}`}>
      {style.icon}{style.label}
    </span>
  )
}

interface StepCardProps {
  icon: React.ReactNode
  title: string
  value: string | null
  hint?: string
  state: StepState
  children?: React.ReactNode
}

function StepCard({ icon, title, value, hint, state, children }: StepCardProps) {
  return (
    <div className={`flex-1 min-w-[260px] rounded border p-5 flex flex-col gap-3 transition-all ${state === 'found' ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-800 bg-main-black-800'}`}>
      <div className='flex items-center justify-between gap-2'>
        <span className='flex items-center gap-2 text-sm text-zinc-400'>{icon}{title}</span>
        <StateBadge state={state} />
      </div>
      <p className='text-lg font-semibold text-white break-all'>{value || '—'}</p>
      <If conditional={Boolean(hint)}>
        <p className='text-xs text-zinc-500 -mt-2'>{hint}</p>
      </If>
      <If conditional={Boolean(children)}>
        <div className='flex flex-col gap-2 mt-auto'>{children}</div>
      </If>
    </div>
  )
}

function SectionTitle({ index, title, subtitle }: { index: string, title: string, subtitle: string }) {
  return (
    <div className='flex items-baseline gap-3'>
      <span className='text-main-violet-100 font-bold'>{index}</span>
      <div>
        <h2 className='text-white font-semibold'>{title}</h2>
        <p className='text-sm text-zinc-500'>{subtitle}</p>
      </div>
    </div>
  )
}

function Picker({ placeholder, options, onSelect }: { placeholder: string, options: { id: number, label: string }[], onSelect: (id: number) => void }) {
  if (!options.length) {
    return null
  }

  return (
    <SelectContext onChange={(value) => onSelect(Number(value))}>
      <SelectRoot placeholder={placeholder}>
        <SelectMenu>
          {options.map(option => <DropdownOption key={option.id} value={option.id} label={option.label} />)}
        </SelectMenu>
      </SelectRoot>
    </SelectContext>
  )
}

export default function Pipeline() {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const pipeline = useAppSelector((state) => state.pipeline.value)
  const captureId = getCaptureId(searchParams) ?? pipeline.captureId

  const [match, setMatch] = useState<CaptureMatchEntity | null>(null)
  const [platforms, setPlatforms] = useState<PlatformEntity[]>([])
  const [providers, setProviders] = useState<ProviderEntity[]>([])
  const [addresses, setAddresses] = useState<EmailAddressEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [iconFailed, setIconFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!captureId) {
      setError('Nenhuma captura informada. Abra esta página pela extensão do Safeguard.')
      setLoading(false)
      return
    }

    async function load(id: string) {
      setLoading(true)
      setError(null)

      try {
        const [matchResult, platformList, providerList, addressList] = await Promise.all([
          captureService.getMatch(id).catch(() => null),
          platformService.getAll(),
          providerService.getAll(),
          emailAddressService.getAll(),
        ])

        setPlatforms(toList(platformList))
        setProviders(toList(providerList))
        setAddresses(toList(addressList))

        const found = matchResult?.res
        if (!found) {
          setError('A captura não foi encontrada ou expirou (elas valem 15 minutos). Salve de novo pela extensão.')
          return
        }

        setMatch(found)

        const sameCapture = pipeline.captureId === id
        if (!sameCapture) {
          dispatch(clearPipelineData())
        }
        dispatch(setPipelineData({
          ...captureToPipelineData(found.capture),
          platform: found.platform?.name ?? found.capture.platform,
          platformId: (sameCapture && pipeline.platformId) || found.platform?.id || null,
          providerId: (sameCapture && pipeline.providerId) || found.provider?.id || null,
          emailAddressId: (sameCapture && pipeline.emailAddressId) || found.emailAddress?.id || null,
          emailId: (sameCapture && pipeline.emailId) || found.account?.id || null,
          iconId: sameCapture ? pipeline.iconId : null,
        }))
      }
      finally {
        setLoading(false)
      }
    }

    load(captureId)
  }, [captureId])

  const capture = match?.capture
  const isEmail = Boolean(match?.email)
  const identities: CaptureMatchAccount[] = match ? [...(match.account ? [match.account] : []), ...match.otherAccounts] : []
  const platformId = pipeline.platformId
  const accountHere = identities.find(account => account.platformId === platformId) ?? null
  const emailId = pipeline.emailId ?? accountHere?.id ?? null
  const otherAccounts = identities.filter(account => account.id !== emailId)
  const platformName = platforms.find(item => item.id === platformId)?.name ?? match?.platform?.name ?? capture?.platform ?? capture?.domain ?? ''
  const provider = providers.find(item => item.id === pipeline.providerId)
  const address = addresses.find(item => item.id === pipeline.emailAddressId)

  async function registerPlatform() {
    setBusy(true)
    try {
      if (capture?.iconUrl && !pipeline.iconId) {
        const uploaded = await fileService.addFromUrl(capture.iconUrl).catch(() => null)
        if (uploaded?.res?.id) {
          dispatch(setPipelineData({ iconId: uploaded.res.id }))
        }
      }
      navigate(USER_ROUTES.MANAGER_PLATFORMS)
    }
    finally {
      setBusy(false)
    }
  }

  async function finish(event?: React.FormEvent) {
    event?.preventDefault()
    if (!captureId || !emailId) {
      return
    }

    setBusy(true)
    try {
      await captureService.complete(captureId, emailId)
      dispatch(clearPipelineData())
      navigate(USER_ROUTES.EMAILS)
    }
    finally {
      setBusy(false)
    }
  }

  function discard() {
    dispatch(clearPipelineData())
    navigate(USER_ROUTES.EMAILS)
  }

  return (
    <Content>
      <div className="bg-fort w-full h-full overflow-auto relative bg-gradient-to-t from-main-black-800 to-transparent bg-main-violet-900">
        <div className="flex w-full gap-3 items-center p-6">
          <Link
            className="cursor-pointer bg-white bg-opacity-5 hover:bg-opacity-15 w-10 h-10 flex items-center justify-center border-2 border-zinc-400 rounded-full"
            to={-1 as any}
          >
            <ChevronLeft />
          </Link>
          <h1 className="font-bold text-white text-3xl font-sans">Criação rápida</h1>
        </div>

        <div className='w-full max-w-4xl mx-auto px-6 pb-16 flex flex-col gap-8'>
          <If conditional={loading}>
            <div className="h-48 flex">
              <CardLoading loading={loading} />
            </div>
          </If>

          <If conditional={!loading && Boolean(error)}>
            <div className='rounded border border-zinc-800 bg-main-black-800 p-6 flex flex-col gap-2'>
              <p className="text-sm bg-red-500/15 text-red-400 w-fit px-3 py-1 rounded-full font-semibold">Captura indisponível</p>
              <p className="text-zinc-300">{error}</p>
            </div>
          </If>

          <If conditional={!loading && !error && Boolean(match)}>
            <div className='rounded border border-zinc-800 bg-main-black-800 p-6 flex flex-col sm:flex-row sm:items-center gap-5'>
              <div className="w-20 h-20 shrink-0 bg-tertiary rounded flex items-center justify-center overflow-hidden">
                {capture?.iconUrl && !iconFailed
                  ? <img className="w-12 h-12 object-contain" src={capture.iconUrl} alt="" onError={() => setIconFailed(true)} />
                  : <Globe className="w-10 h-10 text-zinc-400" />}
              </div>
              <div className='flex-1 min-w-0 flex flex-col gap-1'>
                <p className='text-2xl font-bold text-white truncate'>{platformName}</p>
                <p className='text-sm text-zinc-400 truncate'>{capture?.domain}</p>
              </div>
              <div className='flex flex-col gap-1 sm:items-end min-w-0'>
                <p className='text-white font-semibold truncate max-w-full'>{capture?.username || 'usuário não identificado'}</p>
                <p className='text-zinc-400 text-sm flex items-center gap-2 font-mono'>
                  {showPassword ? capture?.password : '•'.repeat(Math.min(capture?.password?.length ?? 0, 12))}
                  <button type='button' className='text-zinc-500 hover:text-white' onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Ocultar' : 'Mostrar'}>
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </p>
              </div>
            </div>

            <If conditional={Boolean(emailId)}>
              <div className='rounded border border-green-500/30 bg-green-500/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4'>
                <CheckCircle2 className='w-8 h-8 text-green-400 shrink-0' />
                <div className='flex-1'>
                  <p className='text-white font-semibold'>Esta conta já está no Safeguard</p>
                  <p className='text-sm text-zinc-300'>
                    {capture?.username} em {platformName}. Conclua para a extensão não oferecer de novo.
                  </p>
                </div>
                <Link to={`${USER_ROUTES.MANAGER_EMAILS}?id=${emailId}`} className='text-sm text-purple-400 hover:text-purple-300'>
                  Ver conta
                </Link>
              </div>
            </If>

            <div className='flex flex-col gap-4'>
              <SectionTitle index='1' title='Identificação' subtitle='Plataforma do site + usuário/e-mail usado no login' />
              <div className='flex flex-wrap gap-4'>
                <StepCard
                  icon={<Globe className='w-4 h-4' />}
                  title='Plataforma'
                  value={platformName}
                  hint={platformId ? undefined : `Nenhuma plataforma reconhecida para ${capture?.domain}`}
                  state={platformId ? 'found' : 'new'}
                >
                  <If conditional={!platformId}>
                    <Picker
                      placeholder='Escolher plataforma existente'
                      options={platforms.map(item => ({ id: item.id, label: item.name }))}
                      onSelect={(id) => dispatch(setPipelineData({ platformId: id, emailId: null }))}
                    />
                    <Button type='button' variation='outline' onClick={registerPlatform} disabled={busy}>
                      Cadastrar {capture?.platform || 'plataforma'}
                    </Button>
                  </If>
                </StepCard>

                <StepCard
                  icon={<AtSign className='w-4 h-4' />}
                  title='Conta'
                  value={capture?.username ?? null}
                  hint={emailId ? `Já cadastrada em ${platformName}` : platformId ? `Ainda não existe em ${platformName}` : 'Defina a plataforma primeiro'}
                  state={emailId ? 'found' : platformId ? 'new' : 'blocked'}
                >
                  <If conditional={!emailId && Boolean(platformId)}>
                    <Button type='button' variation='outline' onClick={() => navigate(USER_ROUTES.MANAGER_EMAILS)}>
                      Cadastrar conta
                    </Button>
                  </If>
                </StepCard>
              </div>
            </div>

            <If conditional={isEmail}>
              <div className='flex flex-col gap-4'>
                <SectionTitle index='2' title='Pelo e-mail' subtitle={`O provedor sai do @${match?.emailDomain ?? ''} e o endereço da parte antes dele`} />
                <div className='flex flex-wrap gap-4'>
                  <StepCard
                    icon={<Server className='w-4 h-4' />}
                    title='Provedor'
                    value={provider ? `${provider.name} (${provider.signature})` : match?.emailDomain ?? null}
                    state={provider ? 'found' : 'new'}
                  >
                    <If conditional={!provider}>
                      <Picker
                        placeholder='Escolher provedor existente'
                        options={providers.map(item => ({ id: item.id, label: `${item.name} (${item.signature})` }))}
                        onSelect={(id) => dispatch(setPipelineData({ providerId: id }))}
                      />
                      <Button type='button' variation='outline' onClick={() => navigate(USER_ROUTES.MANAGER_DOMAINS)}>
                        Cadastrar {match?.emailDomain}
                      </Button>
                    </If>
                  </StepCard>

                  <StepCard
                    icon={<Mail className='w-4 h-4' />}
                    title='Endereço'
                    value={match?.email ?? null}
                    hint={provider ? undefined : 'Defina o provedor primeiro'}
                    state={address ? 'found' : provider ? 'new' : 'blocked'}
                  >
                    <If conditional={!address && Boolean(provider)}>
                      <Button type='button' variation='outline' onClick={() => navigate(USER_ROUTES.MANAGER_EMAIL_ADDRESS)}>
                        Cadastrar endereço
                      </Button>
                    </If>
                  </StepCard>
                </div>
              </div>
            </If>

            <If conditional={otherAccounts.length > 0}>
              <div className='flex flex-col gap-4'>
                <SectionTitle index={isEmail ? '3' : '2'} title='Também usado em' subtitle='Outras plataformas com este usuário/e-mail' />
                <div className='flex flex-wrap gap-2'>
                  {otherAccounts.map(account => (
                    <Link
                      key={account.id}
                      to={`${USER_ROUTES.MANAGER_EMAILS}?id=${account.id}`}
                      className='flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 hover:bg-purple-600/15 transition-all'
                    >
                      <Layers className='w-4 h-4 text-main-violet-100' />
                      <span className='text-white text-sm font-semibold'>{account.platformName ?? 'Sem plataforma'}</span>
                      <span className='text-zinc-400 text-sm'>{account.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </If>

            <form onSubmit={finish} className='flex flex-col sm:flex-row items-center justify-end gap-4 pt-2 border-t border-zinc-800'>
              <If conditional={!emailId}>
                <p className='text-sm text-zinc-500 mr-auto'>Cadastre a conta para concluir.</p>
              </If>
              <Button type='button' variation='text' onClick={discard}>Descartar</Button>
              <Button disabled={!emailId || busy}>{busy ? 'Concluindo...' : 'Concluir'}</Button>
            </form>
          </If>
        </div>
      </div>
    </Content>
  )
}
