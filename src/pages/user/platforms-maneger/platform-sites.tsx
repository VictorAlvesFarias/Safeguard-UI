import { Globe, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PlatformDomainEntity, platformDomainService } from '../../../services/platform-domain-service';

/**
 * Sites of a platform. A login page on one of them (or a subdomain: acesso.gov.br covers
 * sso.acesso.gov.br) is this platform for the capture and the extension's autofill.
 */
function PlatformSites({ platformId }: { platformId: string }) {
    const [domains, setDomains] = useState<PlatformDomainEntity[]>([])
    const [value, setValue] = useState('')
    const [busy, setBusy] = useState(false)

    function load() {
        platformDomainService.getByPlatform(platformId)
            .then(({ res }: any) => setDomains(res ?? []))
            .catch(() => undefined)
    }

    useEffect(load, [platformId])

    async function add(event: React.FormEvent) {
        event.preventDefault()
        if (!value.trim()) return
        setBusy(true)
        try {
            await platformDomainService.add(platformId, value.trim())
            setValue('')
            load()
        }
        catch {
            // The API's message ("já está na plataforma X") is shown as a toast.
        }
        finally {
            setBusy(false)
        }
    }

    async function remove(id: number) {
        await platformDomainService.remove(id).catch(() => undefined)
        load()
    }

    return (
        <div className='w-full max-w-3xl rounded border border-zinc-800 bg-main-black-800 p-6 flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
                <h2 className='text-white font-semibold text-lg m-0'>Sites</h2>
                <p className='text-sm text-zinc-400 m-0'>
                    Domínios desta plataforma. Vale também para os subdomínios (acesso.gov.br cobre sso.acesso.gov.br).
                    A extensão e a captura usam esta lista para reconhecer a plataforma.
                </p>
            </div>

            <form onSubmit={add} className='flex gap-2'>
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder='ex.: acesso.gov.br'
                    className='flex-1 h-10 px-3 rounded border border-zinc-700 bg-transparent text-white text-sm outline-none focus:border-main-violet-500'
                />
                <button
                    type='submit'
                    disabled={busy || !value.trim()}
                    className='h-10 px-4 rounded bg-main-violet-500 hover:bg-main-violet-400 disabled:opacity-50 text-white text-sm flex items-center gap-1'
                >
                    <Plus className='w-4 h-4' /> Adicionar
                </button>
            </form>

            {domains.length === 0
                ? <p className='text-sm text-zinc-500 m-0'>Nenhum site ainda. Concluir uma captura ou atrelar pela extensão também adiciona.</p>
                : (
                    <div className='flex flex-wrap gap-2'>
                        {domains.map(domain => (
                            <span key={domain.id} className='flex items-center gap-2 rounded-full border border-zinc-700 pl-3 pr-1 py-1 text-sm text-white'>
                                <Globe className='w-4 h-4 text-main-violet-100' />
                                {domain.domain}
                                <button type='button' onClick={() => remove(domain.id)} title='Remover' className='rounded-full p-1 text-zinc-400 hover:text-white hover:bg-white/10'>
                                    <X className='w-3.5 h-3.5' />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
        </div>
    )
}

export default PlatformSites
