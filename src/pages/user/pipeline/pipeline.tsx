import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SelectContext, ModalContext, ModalOpen, If, IModalController, ModalClose } from 'react-base-components'
import { GitBranchIcon, NetworkIcon, ChevronLeft } from 'lucide-react'
import Content from '../../../components/content'
import Button from '../../../components/button'
import Card from '../../../components/card'
import Form from '../../../components/form'
import ModalRoot from '../../../components/modal-root'
import CardLoading from '../../helpers/loading/card-loading'
import FilesManagerDialog from '../../../dialogs/files-manager-dialog/files-manager-dialog'
import { USER_ROUTES } from '../../../config/routes-config'
import { emailAddressService } from '../../../services/email-address-service'
import { emailService } from '../../../services/emails-service'
import { providerService } from '../../../services/provider-service'
import { platformService } from '../../../services/platforms-service'
import { useAppDispatch, useAppSelector } from '../../../utils/hooks/redux-hooks'
import { clearPipelineData, setPipelineData } from '../../../slices/pipeline-slice'
import { parseExtensionQueryParams } from '../../../utils/pipeline-params'
import { FileEntity } from '../../../interfaces/entities/file-entity'
import { ProviderEntity } from '../../../interfaces/entities/provider-entity'
import { PlatformEntity } from '../../../interfaces/entities/platform-entity'
import { EmailAddressEntity } from '../../../interfaces/entities/email-address-entity'
import { EmailEntity } from '../../../interfaces/entities/email-entity'
import InputText from '../../../components/input-text'
import SelectRoot from '../../../components/dropdown-root'
import SelectMenu from '../../../components/dropdown-menu'
import DropdownOption from '../../../components/dropdown-option'
import { fileService } from '../../../services/files-service'

function toList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  const wrapped = value as { res?: T[] } | null | undefined

  return wrapped?.res ?? []
}

function findByName<T extends { name?: string; id: number }>(items: T[], name: string | null): T | undefined {
  if (!name) {
    return undefined
  }

  const normalized = name.trim().toLowerCase()

  return items.find((item) => item.name?.trim().toLowerCase() === normalized)
}

export interface PipelineSelectOption {
  id: number
  label: string
}

interface PipelineStepPanelProps {
  title: string
  searchValue: string | null
  resolved: boolean
  requirementHint?: string
  showHint?: boolean
  canCreate?: boolean
  canSelect?: boolean
  selectOptions?: PipelineSelectOption[]
  onCreate?: () => void
  onSelect?: (id: number) => void
}

export function PipelineImagePanel({ iconUrl, resolved, onUpload }: { iconUrl: string | null, resolved: boolean, onUpload: (fileId: number) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState(iconUrl ?? '')

  async function handleUpload() {
    if (!url) return

    setUploading(true)
    setError(null)

    try {
      const result = await fileService.addFromUrl(url)
      onUpload(result.res.id)
    }
    catch (e) {
      setError('Falha ao enviar imagem. Tente novamente.')
      throw e
    }
    finally {
      setUploading(false)
    }
  }

  return (
    <Card variation='unselectable'>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex flex-col gap-3">
          {resolved
            ? <p className="text-sm bg-green-500 w-fit p-1 px-3 rounded text-white">Enviada</p>
            : <p className="text-sm bg-red-500 w-fit p-1 px-3 rounded text-white">Pendente</p>
          }
          <h2 className="font-semibold text-zinc-200 text-base">Ícone da Plataforma</h2>
          <If conditional={Boolean(url)}>
            <div className="flex items-center gap-4">
              <div className="flex  gap-1 flex-1">
                <InputText
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="URL da imagem"
                />
                <Button type="button" variation='outline' onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Enviando...' : 'Upload'}
                </Button>
                <If conditional={Boolean(error)}>
                  <p className="text-xs text-red-400">{error}</p>
                </If>
              </div>
            </div>
          </If>
        </div>
      </div>
    </Card>
  )
}

export function PipelineStepPanel({
  title,
  searchValue,
  resolved,
  requirementHint,
  showHint = true,
  canCreate = true,
  canSelect = false,
  selectOptions = [],
  onCreate,
  onSelect,
}: PipelineStepPanelProps) {
  const modalRef = useRef<IModalController>(null)
  const [filter, setFilter] = useState('')

  const filteredOptions = selectOptions.filter((option) =>
    option.label.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <Card variation='unselectable'>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex flex-col gap-3">

          {resolved && <p className="text-sm bg-green-500 w-fit p-1 px-3 rounded text-white">Encontrado</p>}
          {!resolved && <p className="text-sm bg-red-500 w-fit p-1 px-3 rounded text-white">Pendente</p>}

          <h2 className="font-semibold text-zinc-200 text-base">{title}</h2>
          <p className="text-sm text-zinc-400">Buscando por: {searchValue || 'N/A'}</p>
          <If conditional={Boolean(showHint && requirementHint)}>
            <p className="text-xs text-red-400">{requirementHint}</p>
          </If>
          <If conditional={canSelect && selectOptions.length > 0}>
            <SelectContext onChange={(value) => onSelect?.(Number(value))}>
              <SelectRoot placeholder={`Selecionar ${title.toLowerCase()}`}>
                <SelectMenu>
                  {selectOptions.map(option => (
                    <DropdownOption
                      key={option.id}
                      value={option.id}
                      label={option.label}
                    />
                  ))}
                </SelectMenu>
              </SelectRoot>
            </SelectContext>
          </If>
          <If conditional={canCreate}>
            <div>
              <Button type="button" variation='text' onClick={onCreate}>
                Or create new item
              </Button>
            </div>
          </If>
        </div>
      </div>
    </Card >
  )
}

export default function Pipeline() {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const pipeline = useAppSelector((state) => {
    return {
      ...state.pipeline.value,
      iconUrl: 'https://cdn-images.dzcdn.net/images/artist/b18856da7850c8b8cb10476fefc15657/1900x1900-000000-80-0-0.jpg'
    }
  })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<ProviderEntity[]>([])
  const [platforms, setPlatforms] = useState<PlatformEntity[]>([])
  const [addresses, setAddresses] = useState<EmailAddressEntity[]>([])
  const [emails, setEmails] = useState<EmailEntity[]>([])

  const providerOptions: PipelineSelectOption[] = providers.map((item) => ({
    id: item.id,
    label: item.name,
  }))

  const platformOptions: PipelineSelectOption[] = platforms.map((item) => ({
    id: item.id,
    label: item.name,
  }))

  const addressOptions: PipelineSelectOption[] = addresses.map((item) => ({
    id: item.id,
    label: `${item.username}@${item.provider.signature}`,
  }))

  const emailOptions: PipelineSelectOption[] = emails.map((item) => ({
    id: item.id,
    label: `${item.username} (${item.platform?.name ?? 'Plataforma'})`,
  }))

  function handleFinish(event: React.FormEvent) {
    event.preventDefault()
    dispatch(clearPipelineData())
    navigate(USER_ROUTES.EMAILS)
  }

  function handleSelectImage(file: FileEntity) {
    dispatch(setPipelineData({ iconId: file.id }))
  }

  useEffect(() => {
    if (pipeline.isActive) {
      setLoading(false)
      return
    }

    const params = parseExtensionQueryParams(searchParams)

    async function initPipeline() {
      setLoading(true)

      try {
        const [providersResult, platformsResult, addressesResult, emailsResult] = await Promise.all([
          providerService.getAll(),
          platformService.getAll(),
          emailAddressService.getAll(),
          emailService.getAll(),
        ])

        const providerList = toList<ProviderEntity>(providersResult)
        const platformList = toList<PlatformEntity>(platformsResult)
        const addressList = toList<EmailAddressEntity>(addressesResult)
        const emailList = toList<EmailEntity>(emailsResult)

        setProviders(providerList)
        setPlatforms(platformList)
        setAddresses(addressList)
        setEmails(emailList)

        let providerId: number | null = null
        let platformId: number | null = null
        let emailAddressId: number | null = null
        let emailId: number | null = null

        const foundEmail = emailList.find((item) => {
          const platformMatch = item.platform?.name?.toLowerCase() === params.platform?.toLowerCase()
          const usernameMatch =
            item.username?.toLowerCase() === params.email?.toLowerCase() ||
            item.username?.toLowerCase() === params.address?.toLowerCase() ||
            item.emailAddress?.username?.toLowerCase() === params.address?.toLowerCase()

          return platformMatch && usernameMatch
        })

        if (foundEmail) {
          emailId = foundEmail.id
          platformId = foundEmail.platform?.id ?? null
          emailAddressId = foundEmail.emailAddress?.id ?? null
          providerId = foundEmail.emailAddress?.provider?.id ?? null
        }
        else {
          const foundProvider = findByName(providerList, params.domain)
          const foundPlatform = findByName(platformList, params.platform)

          const foundAddress = addressList.find(
            (item) => item.username?.toLowerCase() === params.address?.toLowerCase(),
          )

          providerId = foundProvider?.id ?? null
          platformId = foundPlatform?.id ?? null
          emailAddressId = foundAddress?.id ?? null

          if (emailAddressId != null && platformId != null) {
            const foundAccount = emailList.find(
              (item) => item.platform?.id === platformId && item.emailAddress?.id === emailAddressId,
            )

            emailId = foundAccount?.id ?? null
          }
        }

        dispatch(
          setPipelineData({
            domain: params.domain,
            iconUrl: params.iconUrl,
            platform: params.platform,
            email: params.email,
            address: params.address,
            password: params.password,
            phone: params.phone,
            firstName: params.firstName,
            lastName: params.lastName,
            providerId,
            platformId,
            emailAddressId,
            emailId,
          }),
        )
      }
      catch (error) {
        console.error(error)
      }
      finally {
        setLoading(false)
      }
    }

    initPipeline()
  }, [pipeline.isActive, searchParams, dispatch])

  useEffect(() => {
    if (!pipeline.isActive || providers.length > 0) {
      return
    }

    async function loadListsForSelection() {
      const [providersResult, platformsResult, addressesResult, emailsResult] = await Promise.all([
        providerService.getAll(),
        platformService.getAll(),
        emailAddressService.getAll(),
        emailService.getAll(),
      ])

      setProviders(toList(providersResult))
      setPlatforms(toList(platformsResult))
      setAddresses(toList(addressesResult))
      setEmails(toList(emailsResult))
    }

    loadListsForSelection()
  }, [pipeline.isActive, providers.length])

  return (
    <Content>
      <div className="bg-fort w-full h-full overflow-auto relative transition-all bg-gradient-to-t from-main-black-800 to-transparent duration-500 bg-main-violet-900">
        <div className="flex w-full gap-3 items-center p-6">
          <Link
            className="cursor-pointer bg-white bg-opacity-5 hover:bg-opacity-15 w-10 h-10 flex items-center justify-center border-2 border-zinc-400 rounded-full top-0 left-0"
            to={-1 as any}
          >
            <ChevronLeft />
          </Link>
          <h1 className="font-bold text-white text-3xl font-sans">Criação rápida</h1>
        </div>
        <div className='flex gap-3 w-full my-28 rounded items-center justify-center flex-col p-3 center'>
          <div className="w-48 h-48 bg-tertiary rounded flex items-center justify-center overflow-hidden">
            {pipeline.iconUrl ? (
              <img className="w-16 min-h-16 object-contain" src={pipeline.iconUrl} alt="Ícone da plataforma" />
            ) : (
              <NetworkIcon className="w-16 h-16 text-zinc-300" />
            )}
          </div>
          <div className="w-full flex-1 rounded flex flex-col max-w-3xl gap-4 mt-6">
            <Form variation="card" onSubmit={handleFinish}>
              <If conditional={Boolean(pipeline.iconUrl)}>
                <PipelineImagePanel
                  iconUrl={pipeline.iconUrl}
                  resolved={Boolean(pipeline.iconId)}
                  onUpload={(fileId) => dispatch(setPipelineData({ iconId: fileId }))}
                />
              </If>

              <PipelineStepPanel
                title="Domínio (Provedor)"
                searchValue={pipeline.domain}
                resolved={Boolean(pipeline.providerId)}
                selectOptions={providerOptions}
                canSelect={true}
                canCreate={true}
                onSelect={(id) => dispatch(setPipelineData({ providerId: id }))}
                onCreate={() => navigate(USER_ROUTES.MANAGER_DOMAINS)}
              />
              <PipelineStepPanel
                title="Plataforma"
                searchValue={pipeline.platform}
                resolved={Boolean(pipeline.platformId)}
                selectOptions={platformOptions}
                canSelect={true}
                canCreate={true}
                onSelect={(id) => dispatch(setPipelineData({ platformId: id }))}
                onCreate={() => navigate(USER_ROUTES.MANAGER_PLATFORMS)}
              />
              <PipelineStepPanel
                title="Endereço de Email"
                searchValue={pipeline.address}
                resolved={Boolean(pipeline.emailAddressId)}
                canCreate={Boolean(pipeline.providerId)}
                canSelect={Boolean(pipeline.providerId)}
                showHint={Boolean(!pipeline.providerId)}
                requirementHint={'Requer domínio (provedor)'}
                selectOptions={addressOptions}
                onSelect={(id) => dispatch(setPipelineData({ emailAddressId: id }))}
                onCreate={() => navigate(USER_ROUTES.MANAGER_EMAIL_ADDRESS)}
              />
              <PipelineStepPanel
                title="Conta (Email Final)"
                searchValue={pipeline.email}
                resolved={Boolean(pipeline.emailId)}
                canCreate={Boolean(pipeline.platformId && pipeline.emailAddressId)}
                canSelect={Boolean(pipeline.platformId && pipeline.emailAddressId)}
                showHint={Boolean(!pipeline.platformId || !pipeline.emailAddressId)}
                requirementHint={'Requer plataforma e endereço de email'}
                selectOptions={emailOptions}
                onSelect={(id) => dispatch(setPipelineData({ emailId: id }))}
                onCreate={() => navigate(USER_ROUTES.MANAGER_EMAILS)}
              />

              <div className="w-full justify-center flex items-center mt-4">
                <Button>Save</Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </Content>
  )
}