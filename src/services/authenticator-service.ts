import { env } from "../environment";
import { BaseService } from "./base-service";
import { AuthenticatorEntity } from "../interfaces/entities/authenticator-entity";
import { OtpEntry } from "../utils/authenticator/otp";

export type AuthenticatorInput = OtpEntry & { emailId: number | null }

class AuthenticatorService extends BaseService {
    public async add(data: AuthenticatorInput) {
        const result = this.post<AuthenticatorEntity>({ api: env, href: "/create-authenticator" }, data)

        return result;
    }

    public async update(data: AuthenticatorInput, id: number) {
        const result = this.put<AuthenticatorEntity>({ api: env, href: "/edit-authenticator", params: { id: id } }, data)

        return result;
    }

    public async remove(id: number) {
        const result = this.delete({ api: env, href: "/delete-authenticator", params: { id: id } })

        return result;
    }

    public async getById(params: { id: string | number | null }) {
        const response = await this.get<AuthenticatorEntity>({ api: env, href: "/get-authenticator-by-id", params: params })
        return response
    }

    public async getAll() {
        const response = await this.get<AuthenticatorEntity[]>({ api: env, href: "/get-authenticators" })
        return response
    }
}

const authenticatorService = new AuthenticatorService()

export {
    AuthenticatorService,
    authenticatorService
}
