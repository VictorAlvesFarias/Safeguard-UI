import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ModalClose, ModalContext, ModalOpen } from 'react-base-components';
import { CirclePlusIcon, PencilIcon, ShieldCheck, TrashIcon } from 'lucide-react';
import Button from '../../../components/button';
import Content from '../../../components/content';
import InputText from '../../../components/input-text';
import ModalRoot from '../../../components/modal-root';
import { USER_ROUTES } from '../../../config/routes-config';
import { AuthenticatorEntity } from '../../../interfaces/entities/authenticator-entity';
import { authenticatorService } from '../../../services/authenticator-service';
import { accountLabel, addressLabel } from '../../../utils/authenticator/accounts';
import { formatCode, generateCode } from '../../../utils/authenticator/otp';
import { copyToClipboard } from '../../../utils/extensions/clipboard';
import { base64ToImage } from '../../../utils/extensions/image';
import { useQuery } from '../../../utils/hooks/query-hooks';
import CardLoading from '../../helpers/loading/card-loading';

function ServiceIcon({ authenticator }: { authenticator: AuthenticatorEntity }) {
    const [failed, setFailed] = useState(false)
    const image = authenticator.email?.platform?.image?.storedFile
    const src = base64ToImage(image?.base64, image?.mimeType)
    const name = authenticator.issuer || authenticator.accountName

    return (
        <div className='w-11 h-11 bg-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden shrink-0'>
            {src && !failed
                ? <img className='w-full h-full object-contain' src={src} alt='' onError={() => setFailed(true)} />
                : <span className='text-zinc-300 font-bold text-lg'>{(name || '?').trim().charAt(0).toUpperCase()}</span>}
        </div>
    )
}

interface AuthenticatorCardProps {
    authenticator: AuthenticatorEntity
    now: number
    onEdit: () => void
    onDelete: () => void
}

function AuthenticatorCard({ authenticator, now, onEdit, onDelete }: AuthenticatorCardProps) {
    const [copied, setCopied] = useState(false)
    const { code, remaining } = generateCode(authenticator, now)
    const ending = remaining <= 5

    function handleCopy() {
        copyToClipboard(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
    }

    return (
        <ModalContext>
            <div className='group rounded border border-zinc-800 bg-main-black-800 p-4 flex flex-col gap-3 hover:border-zinc-700 transition-all'>
                <div className='flex items-center gap-3'>
                    <ServiceIcon authenticator={authenticator} />
                    <div className='flex-1 min-w-0'>
                        <p className='text-white font-semibold truncate'>{authenticator.issuer || 'Sem serviço'}</p>
                        <p className='text-sm text-zinc-400 truncate'>{authenticator.accountName || '—'}</p>
                    </div>
                    <div className='flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all'>
                        <button onClick={onEdit} className='p-2 text-zinc-400 hover:text-main-violet-100' title='Editar'>
                            <PencilIcon className='w-4 h-4' />
                        </button>
                        <ModalOpen>
                            <button className='p-2 text-zinc-400 hover:text-red-400' title='Excluir'>
                                <TrashIcon className='w-4 h-4' />
                            </button>
                        </ModalOpen>
                    </div>
                </div>
                <button onClick={handleCopy} title='Copiar código' className='flex items-end justify-between text-left'>
                    <span className={`font-mono text-3xl font-bold tracking-wider transition-colors ${ending ? 'text-red-400' : 'text-main-violet-100'}`}>
                        {copied ? 'copiado!' : formatCode(code)}
                    </span>
                    <span className={`text-sm tabular-nums ${ending ? 'text-red-400' : 'text-zinc-500'}`}>{remaining}s</span>
                </button>
                <div className='h-1 rounded-full bg-zinc-800 overflow-hidden'>
                    <div
                        className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${ending ? 'bg-red-400' : 'bg-main-violet-500'}`}
                        style={{ width: `${(remaining / authenticator.period) * 100}%` }}
                    />
                </div>
                {(authenticator.email || authenticator.emailAddress) &&
                    <p className='text-xs text-zinc-500 truncate'>
                        Vinculado a {[authenticator.email && accountLabel(authenticator.email), authenticator.emailAddress && addressLabel(authenticator.emailAddress)].filter(Boolean).join(' e ')}
                    </p>
                }
            </div>
            <ModalRoot>
                <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white max-w-md'>
                    <p>Excluir o código de {authenticator.issuer || authenticator.accountName}? Ele não poderá ser recuperado.</p>
                    <div className='flex justify-between w-full mt-6 gap-3'>
                        <ModalClose callback={onDelete} className='flex justify-between flex-1'>
                            <Button variation='warning'>Excluir</Button>
                        </ModalClose>
                        <ModalClose className='flex justify-between flex-1'>
                            <Button>Cancelar</Button>
                        </ModalClose>
                    </div>
                </div>
            </ModalRoot>
        </ModalContext>
    )
}

function Authenticators() {
    const [finished, setQuerys] = useQuery()
    const [addButtomHovered, setAddButtomHovered] = useState(false)
    const [authenticators, setAuthenticators] = useState<AuthenticatorEntity[]>([])
    const [filters, setFilters] = useState({ searchTerm: "" })
    const [now, setNow] = useState(Date.now())
    const navigate = useNavigate()

    function handleGetAuthenticators() {
        return authenticatorService.getAll()
            .then(({ res }: any) => {
                setAuthenticators(res)
            })
    }

    function handleDeleteAuthenticator(id: number) {
        return authenticatorService.remove(id)
            .then(() => {
                setQuerys(() => handleGetAuthenticators())
            })
    }

    useEffect(() => {
        setQuerys(() => handleGetAuthenticators())
    }, [])

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    const term = filters.searchTerm.trim().toLowerCase()
    const visible = authenticators.filter(e =>
        !term || [e.issuer, e.accountName, e.email?.platform?.name, e.emailAddress && addressLabel(e.emailAddress)].some(value => value?.toLowerCase().includes(term))
    )

    return (
        <Content >
            <div className=' w-full h-full flex-col overflow-auto rounded'>
                <div aria-selected={addButtomHovered} className={`transition-all bg-gradient-to-t from-main-black-800 to-transparent duration-500 aria-selected:bg-main-violet-700 bg-main-violet-900 flex-wrap flex items-end p-3 pl-6 py-6 gap-6`}>
                    <div className='flex gap-6 items-end'>
                        <div className='w-28 h-28 bg-tertiary rounded center'>
                            <ShieldCheck className='w-12 h-12' />
                        </div>
                        <div className='flex gap-1 flex-col'>
                            <h1 className='font-bold text-white sm:text-3xl font-sans text-2xl'>Autenticador</h1>
                            <div className='flex gap-3'>
                                <Link
                                    to={USER_ROUTES.MANAGER_AUTHENTICATORS}
                                    title='Adicionar código'
                                    onMouseLeave={() => setAddButtomHovered(false)}
                                    onMouseEnter={() => setAddButtomHovered(true)}
                                >
                                    <CirclePlusIcon className='text-main-violet-500 w-6 h-6 hover:text-main-violet-100 transition-all duration-300' />
                                </Link>
                                <p className='text-md font-semibold'>Quantity: {authenticators.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='overflow-auto w-full p-6 gap-6 flex flex-col'>
                    <div className='w-full max-w-3xl'>
                        <InputText onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })} placeholder='Pesquisar' variation='ultra-rounded'></InputText>
                    </div>
                    <CardLoading loading={!finished}>
                        {authenticators.length === 0 ?
                            <div className='rounded border border-dashed border-zinc-700 p-10 flex flex-col items-center gap-3 text-center'>
                                <ShieldCheck className='w-10 h-10 text-main-violet-100' />
                                <p className='text-white font-semibold'>Nenhum código cadastrado</p>
                                <p className='text-sm text-zinc-400 max-w-md'>Adicione pelo QR code (cole a imagem com Ctrl+V) ou pela chave secreta.</p>
                                <Link to={USER_ROUTES.MANAGER_AUTHENTICATORS} className='mt-2 bg-main-violet-500 hover:bg-main-violet-600 text-white rounded-full h-11 px-8 font-semibold transition-all flex items-center'>
                                    Adicionar código
                                </Link>
                            </div>
                            :
                            <div className='grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'>
                                {visible.map(e =>
                                    <AuthenticatorCard
                                        key={e.id}
                                        authenticator={e}
                                        now={now}
                                        onEdit={() => navigate(`${USER_ROUTES.MANAGER_AUTHENTICATORS}?id=${e.id}`)}
                                        onDelete={() => setQuerys(() => handleDeleteAuthenticator(e.id))}
                                    />
                                )}
                                {visible.length === 0 &&
                                    <p className='text-zinc-400'>Nada encontrado para "{filters.searchTerm}".</p>
                                }
                            </div>
                        }
                    </CardLoading>
                </div>
            </div>
        </Content>
    )
}

export default Authenticators
