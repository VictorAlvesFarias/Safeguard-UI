import { env } from "../environment";
import { BaseService } from "./base-service";
import { saveSession, signOut } from "./session-service";

class LoginService extends BaseService {
  public async loginPost(data) {
    const result = this.post<any>({ api: env, href: "/sign-in", params: {} }, data).then(({ res: data }) => {
      // Cookies last as long as the refresh token: the access token is renewed from it.
      saveSession(data)

      return data
    })

    return result;
  }
  public logout() {
    // Revokes the refresh token on the API and clears the cookies.
    void signOut()
  }
}

const loginService = new LoginService()

export {
  LoginService,
  loginService
}
