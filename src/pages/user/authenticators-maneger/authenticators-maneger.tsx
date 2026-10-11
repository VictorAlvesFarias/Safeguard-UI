import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { If, SelectContext } from 'react-base-components';
import { ChevronLeft, ImageUp, ShieldCheck } from 'lucide-react';
import Button from '../../../components/button';
import Content from '../../../components/content';
import DropdownMenu from '../../../components/dropdown-menu';
import DropdownOption from '../../../components/dropdown-option';
import DropdownRoot from '../../../components/dropdown-root';
import Form from '../../../components/form';
import InputRoot from '../../../components/input-root';
import InputText from '../../../components/input-text';
import Label from '../../../components/label';
import Span from '../../../components/span';
import { USER_ROUTES } from '../../../config/routes-config';
import { AuthenticatorEntity } from '../../../interfaces/entities/authenticator-entity';
import { EmailEntity } from '../../../interfaces/entities/email-entity';
import { authenticatorService } from '../../../services/authenticator-service';
import { emailService } from '../../../services/emails-service';
import { accountLabel, suggestAccount } from '../../../utils/authenticator/accounts';
import { formatCode, generateCode, isValidSecret, OtpAlgorithm, OtpEntry, parseOtpInput, readQrCode } from '../../../utils/authenticator/otp';
import { useQuery } from '../../../utils/hooks/query-hooks';
import Loading from '../../helpers/loading/loading';

const ALGORITHMS = ['SHA1', 'SHA256', 'SHA512']
const DIGITS = [6, 7, 8]
const PERIODS = [30, 60]

function LiveCode({ entry }: { entry: OtpEntry }) {
    const [, setTick] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(timer)
    }, [])

    if (!entry.secret || !isValidSecret(entry.secret)) {
        return null
    }

    try {
        const { code, remaining } = generateCode(entry)

        return (
            <div className='rounded border border-zinc-800 bg-main-black-900 px-4 py-3 flex items-center justify-between'>
                <span className='text-sm text-zinc-400'>Confira com o app do celular:</span>
                <span className='flex items-baseline gap-3'>
                    <span className='font-mono text-2xl font-bold text-main-violet-100 tracking-wider'>{formatCode(code)}</span>
                    <span className='text-xs text-zinc-500 tabular-nums'>{remaining}s</span>
                </span>
            </div>
        )
    } catch {
        return null
    }
}

function AuthenticatorsManeger() {
    const [finished, setQuery, setFinished] = useQuery(false)
    const [isEditable, setIsEditable] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [accounts, setAccounts] = useState<EmailEntity[]>([])
    const [choices, setChoices] = useState<OtpEntry[]>([])
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [reading, setReading] = useState(false)
    const [dragging, setDragging] = useState(false)
    const fileInput = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const urlParams = {
        id: searchParams.get("id")
    }
    const schema = z.object({
        issuer: z.string(),
        accountName: z.string(),
        secret: z.string().min(1, 'Informe a chave secreta'),
        algorithm: z.enum(['SHA1', 'SHA256', 'SHA512']),
        digits: z.number(),
        period: z.number(),
        emailId: z.number(),
    }).refine(e => e.issuer.trim() || e.accountName.trim(), {
        message: 'Informe o serviço ou a conta',
        path: ['issuer'],
    })
    const { register, handleSubmit, formState: { errors }, setValue, setError, reset, control, watch } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { issuer: '', accountName: '', secret: '', algorithm: 'SHA1', digits: 6, period: 30, emailId: 0 },
    })

    function fill(entry: OtpEntry) {
        setChoices([])
        reset({ ...entry, emailId: suggestAccount(entry, accounts) ?? 0 })
        setShowAdvanced(entry.algorithm !== 'SHA1' || entry.digits !== 6 || entry.period !== 30)
    }

    function handleScanned(found: OtpEntry[]) {
        if (found.length === 1) {
            fill(found[0])
        }
        else {
            setChoices(found)
        }
    }

    async function handleImage(image: Blob) {
        setReading(true)
        try {
            handleScanned(parseOtpInput(await readQrCode(image)))
        } catch (error) {
            toast.error((error as Error).message)
        } finally {
            setReading(false)
        }
    }

    function handleGetAuthenticator() {
        return authenticatorService.getById({ id: urlParams.id })
            .then(({ res }: { res: AuthenticatorEntity }) => {
                reset({ ...res, emailId: res.emailId ?? 0 })
                setIsEditable(true)
                setShowAdvanced(res.algorithm !== 'SHA1' || res.digits !== 6 || res.period !== 30)
            })
    }

    function handleAddAuthenticator(data: OtpEntry & { emailId: number | null }) {
        return authenticatorService.add(data)
            .then(() => {
                navigate(USER_ROUTES.AUTHENTICATORS)
            })
    }

    function handleUpdateAuthenticator(data: OtpEntry & { emailId: number | null }) {
        return authenticatorService.update(data, Number(urlParams.id))
            .then(() => {
                setIsEditing(false)
            })
    }

    function handleAddOrUpdate(data: z.infer<typeof schema>) {
        let entry: OtpEntry

        try {
            const [parsed] = parseOtpInput(data.secret, data)
            entry = {
                ...parsed,
                issuer: data.issuer.trim() || parsed.issuer,
                accountName: data.accountName.trim() || parsed.accountName,
            }
        } catch (error) {
            setError('secret', { message: (error as Error).message })
            return
        }

        const request = { ...entry, emailId: data.emailId || null }

        if (isEditable) {
            setQuery(() => handleUpdateAuthenticator(request))
        }
        else {
            setQuery(() => handleAddAuthenticator(request))
        }
    }

    useEffect(() => {
        emailService.getAll()
            .then(({ res }: any) => setAccounts(res ?? []))

        if (urlParams.id != null) {
            setQuery(() => handleGetAuthenticator())
        }
        else {
            setFinished(true)
            setIsEditing(true)
        }
    }, [urlParams.id])

    useEffect(() => {
        if (urlParams.id != null) {
            return
        }

        function handlePaste(event: ClipboardEvent) {
            const image = [...(event.clipboardData?.items ?? [])].find(item => item.type.startsWith('image/'))?.getAsFile()
            const text = event.clipboardData?.getData('text') ?? ''

            if (image) {
                event.preventDefault()
                handleImage(image)
            }
            else if (/^otpauth(-migration)?:\/\//i.test(text.trim())) {
                event.preventDefault()
                try {
                    handleScanned(parseOtpInput(text))
                } catch (error) {
                    toast.error((error as Error).message)
                }
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [urlParams.id, accounts])

    const values = watch()

    return (
        <Content >
            <div className='bg-fort w-full h-full overflow-auto relative transition-all bg-gradient-to-t from-main-black-800 to-transparent duration-500 bg-main-violet-900'>
                <div className='flex w-full gap-3 items-center p-6'>
                    <Link className='cursor-pointer bg-white bg-opacity-5 hover:bg-opacity-15 w-10 h-10 flex items-center justify-center border-2 border-zinc-400 rounded-full top-0 left-0' to={USER_ROUTES.AUTHENTICATORS}>
                        <ChevronLeft />
                    </Link>
                    <h1 className='font-bold text-white text-3xl font-sans'>{urlParams.id ? "Código" : "Novo código"}</h1>
                </div>
                <Loading loading={!finished} />
                <If conditional={finished}>
                    <div className='flex gap-6 w-full my-12 rounded items-center justify-center flex-col p-3 center'>
                        <div className='w-48 h-48 bg-tertiary rounded center'>
                            <ShieldCheck className='w-16 h-16' />
                        </div>
                        <div className='w-full flex-1 rounded center max-w-3xl flex-col gap-6'>
                            <If conditional={!isEditable}>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        setDragging(false)
                                        const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'))
                                        if (file) handleImage(file)
                                    }}
                                    onClick={() => fileInput.current?.click()}
                                    className={`w-full cursor-pointer rounded border-2 border-dashed p-8 flex flex-col items-center gap-2 text-center transition-all ${dragging ? 'border-main-violet-500 bg-main-violet-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-main-black-800/40'}`}
                                >
                                    <ImageUp className='w-10 h-10 text-main-violet-100' />
                                    <p className='text-white font-semibold'>{reading ? 'Lendo o QR code…' : 'Cole a imagem do QR code (Ctrl+V)'}</p>
                                    <p className='text-sm text-zinc-400'>ou arraste / clique para escolher. O QR preenche os campos abaixo; você também pode digitar a chave.</p>
                                    <input
                                        ref={fileInput}
                                        type='file'
                                        accept='image/*'
                                        className='hidden'
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImage(file)
                                            e.target.value = ''
                                        }}
                                    />
                                </div>
                            </If>
                            <If conditional={choices.length > 0}>
                                <div className='w-full flex flex-col gap-2'>
                                    <p className='text-sm text-zinc-300'>Esse QR tem {choices.length} contas. Escolha qual adicionar:</p>
                                    {choices.map(choice => (
                                        <button
                                            key={choice.secret}
                                            type='button'
                                            onClick={() => fill(choice)}
                                            className='rounded border border-zinc-700 hover:border-main-violet-500 hover:bg-purple-600/15 px-4 py-3 text-left transition-all'
                                        >
                                            <p className='text-white font-semibold'>{choice.issuer || 'Sem serviço'}</p>
                                            <p className='text-sm text-zinc-400'>{choice.accountName || '—'}</p>
                                        </button>
                                    ))}
                                </div>
                            </If>
                            <Form variation='card' onSubmit={handleSubmit(handleAddOrUpdate)}>
                                <InputRoot>
                                    <Label>Serviço</Label>
                                    <InputText
                                        placeholder='Google, GitHub, Steam…'
                                        {...register('issuer', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.issuer?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Conta</Label>
                                    <InputText
                                        placeholder='voce@gmail.com'
                                        {...register('accountName', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.accountName?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Chave secreta ou link otpauth://</Label>
                                    <InputText
                                        placeholder='JBSW Y3DP EHPK 3PXP'
                                        {...register('secret', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.secret?.message}</Span>
                                </InputRoot>
                                <button type='button' className='text-xs text-purple-400 hover:text-purple-300 w-fit px-1' onClick={() => setShowAdvanced(!showAdvanced)}>
                                    {showAdvanced ? 'Ocultar opções avançadas' : 'Opções avançadas (algoritmo, dígitos, período)'}
                                </button>
                                <If conditional={showAdvanced}>
                                    <div className='flex gap-3'>
                                        <InputRoot>
                                            <Label>Algoritmo</Label>
                                            <Controller
                                                name='algorithm'
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectContext onChange={field.onChange}>
                                                        <DropdownRoot {...field} disabled={!isEditing} placeholder='Algoritmo'>
                                                            <DropdownMenu>
                                                                {ALGORITHMS.map(e => <DropdownOption key={e} label={e} value={e} />)}
                                                            </DropdownMenu>
                                                        </DropdownRoot>
                                                    </SelectContext>
                                                )}
                                            />
                                        </InputRoot>
                                        <InputRoot>
                                            <Label>Dígitos</Label>
                                            <Controller
                                                name='digits'
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectContext onChange={field.onChange}>
                                                        <DropdownRoot {...field} disabled={!isEditing} placeholder='Dígitos'>
                                                            <DropdownMenu>
                                                                {DIGITS.map(e => <DropdownOption key={e} label={String(e)} value={e} />)}
                                                            </DropdownMenu>
                                                        </DropdownRoot>
                                                    </SelectContext>
                                                )}
                                            />
                                        </InputRoot>
                                        <InputRoot>
                                            <Label>Período (s)</Label>
                                            <Controller
                                                name='period'
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectContext onChange={field.onChange}>
                                                        <DropdownRoot {...field} disabled={!isEditing} placeholder='Período'>
                                                            <DropdownMenu>
                                                                {PERIODS.map(e => <DropdownOption key={e} label={String(e)} value={e} />)}
                                                            </DropdownMenu>
                                                        </DropdownRoot>
                                                    </SelectContext>
                                                )}
                                            />
                                        </InputRoot>
                                    </div>
                                </If>
                                <InputRoot>
                                    <Label>Vincular à conta</Label>
                                    <Controller
                                        name='emailId'
                                        control={control}
                                        render={({ field }) => (
                                            <SelectContext onChange={field.onChange}>
                                                <DropdownRoot {...field} disabled={!isEditing} placeholder='Selecione a conta'>
                                                    <DropdownMenu>
                                                        {[{ id: 0, label: 'Nenhuma' }, ...accounts.map(e => ({ id: e.id, label: accountLabel(e) }))].map(e => (
                                                            <DropdownOption key={e.id} label={e.label} value={e.id} />
                                                        ))}
                                                    </DropdownMenu>
                                                </DropdownRoot>
                                            </SelectContext>
                                        )}
                                    />
                                </InputRoot>
                                <LiveCode entry={values as OtpEntry} />
                                <div className='flex w-full center mt-3'>
                                    {isEditing && isEditable &&
                                        <Button>Save</Button>
                                    }
                                    {!isEditable &&
                                        <Button>Add</Button>
                                    }
                                    {!isEditing && isEditable &&
                                        <Button type='button' onClick={() => setIsEditing(true)}>Edit</Button>
                                    }
                                </div>
                            </Form>
                        </div>
                    </div>
                </If>
            </div>
        </Content>
    )
}

export default AuthenticatorsManeger
