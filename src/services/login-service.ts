import axios from "axios";
import { env } from "../environment";
import { BaseService } from "./base-service";
import Cookies from "js-cookie";

class LoginService extends BaseService {
  public async loginPost(data) {
    const result = this.post<any>({ api: env, href: "/sign-in", params: {} }, data).then(({ res: data }) => {
      const keys = Object.keys(data)

      // The cookies (token included) expire with the JWT: the API sends when it expires.
      // The Safeguard extension reads this "token" cookie, so it must not outlive the token.
      const expiresAt = new Date(data.expectedExpirationTokenDateTime)
      const fallback = new Date(Date.now() + (Number(data.expirationTokenTime) || 3600) * 1000)
      const expires = isNaN(expiresAt.getTime()) ? fallback : expiresAt

      keys.forEach(e => {
        if (typeof data[e] == "object") {
          Cookies.set(e, JSON.stringify(data[e]), { expires })
        }
        else {
          Cookies.set(e, data[e], { expires })
        }
      })

      return data
    })

    return result;
  }
  public logout() {
    const keys = Object.keys(Cookies.get())
    keys.forEach(e => {
      Cookies.remove(e)
    })
  }
}

const loginService = new LoginService()

export {
  LoginService,
  loginService
}
