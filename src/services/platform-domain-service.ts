import { env } from "../environment";
import { BaseService } from "./base-service";

export interface PlatformDomainEntity {
    id: number
    platformId: number
    domain: string
}

/** Sites (domains) of a platform: how a login page is recognized as that platform. */
class PlatformDomainService extends BaseService {
    public async getByPlatform(platformId: number | string) {
        return this.get<PlatformDomainEntity[]>({ api: env, href: "/get-platform-domains", params: { platformId } })
    }

    public async add(platformId: number | string, domain: string) {
        return this.post<PlatformDomainEntity>({ api: env, href: "/create-platform-domain" }, { platformId: Number(platformId), domain })
    }

    public async remove(id: number) {
        return this.delete({ api: env, href: "/delete-platform-domain", params: { id } })
    }
}

const platformDomainService = new PlatformDomainService()

export {
    PlatformDomainService,
    platformDomainService
}
