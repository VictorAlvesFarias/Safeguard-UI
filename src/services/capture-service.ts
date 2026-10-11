import { env } from "../environment";
import { BaseService } from "./base-service";
import { CaptureEntity, CaptureMatchEntity } from "../interfaces/entities/capture-entity";

class CaptureService extends BaseService {
    public async getById(id: string) {
        const response = await this.get<CaptureEntity>({ api: env, href: "/get-capture", params: { id: id } })
        return response
    }

    public async getMatch(id: string) {
        const response = await this.get<CaptureMatchEntity>({ api: env, href: "/get-capture-match", params: { id: id } })
        return response
    }

    public async complete(id: string, emailId: number | null) {
        const result = this.post<any>({ api: env, href: "/complete-capture" }, { id, emailId })

        return result;
    }
}

const captureService = new CaptureService()

export {
    CaptureService,
    captureService
}
