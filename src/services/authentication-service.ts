export type RedirectType = "authenticate" | "not-required" | "logout"

export class AuthenticationService {
    public static timeoutStarted = false

    public static validateSession (
        token: string | undefined,
        currentRoute: string,
        expirationDate: Date,
        disableAuth: boolean,
        unprotectedPaths: string[],
        redirect: (event: RedirectType) => boolean | void | null | undefined
    ) {

        if (disableAuth == true) {
            return redirect("authenticate") ?? true
        }

        if (unprotectedPaths.includes(currentRoute)) {
            return redirect("not-required") ?? true
        }

        else if ((expirationDate == null || expirationDate == undefined) && (token == null || token == undefined)) {
            if (unprotectedPaths.includes(currentRoute)) {
                return redirect("not-required") ?? true
            }

            return redirect("logout") ?? false
        }

        const timeDiference = new Date(expirationDate).getTime() - new Date().getTime()

        if (!this.timeoutStarted) {
            this.timeoutStarted = true
            // setTimeout fires at once for delays over 2^31-1 ms (~24.8 days): cap it. The 30-day
            // refresh token outlives that; at the cap the "logout" handler just renews the session.
            setTimeout(() => {
                return redirect("logout") ?? false
            }, Math.min(Math.max(timeDiference, 0), 2147483647));
        }

        return redirect("authenticate") ?? true
    }
}