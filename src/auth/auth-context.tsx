import Cookies from 'js-cookie';
import React from 'react';
import { createContext, useEffect, useState } from 'react';
import { loginService } from '../services/login-service';
import { AUTH } from '../config/auth-config';
import { AuthContextType } from '../interfaces/shared/auth-context';
import { AuthenticationService } from '../services/authentication-service';
import { consumePipelineReturnUrl, savePipelineReturnUrl } from '../utils/pipeline-params';
import { useNavigate } from 'react-router-dom';
import { installSessionInterceptors, refreshSession } from '../services/session-service';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  signIn: () => Promise.resolve(),
  logout: () => { },
  permissions: null
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = Cookies.get('token');
  const permissions = Cookies.get('claims');
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [permissionsContext, setPermissionsContext] = useState(JSON.parse(permissions ?? "{}"));
  // The session lasts as long as the refresh token; the access token is renewed from it.
  const expirationDate: any = Cookies.get("refreshTokenExpirationDateTime") ?? Cookies.get("expectedExpirationTokenDateTime")
  const navigation = useNavigate()

  function endSession() {
    setIsAuthenticated(false)
    savePipelineReturnUrl()
    navigation('/login')
  }

  installSessionInterceptors(endSession)

  function handleLogout() {
    loginService.logout()
    savePipelineReturnUrl()
    navigation('/login')
  }
  function handleSignIn(data: { username: string, password: string }) {
    const result = loginService.loginPost(data)
      .then(e => {
        setIsAuthenticated(true)
        setPermissionsContext(e.claims)
        navigation(consumePipelineReturnUrl() ?? '/')
      })

    return result
  }

  useEffect(() => {
    AuthenticationService.validateSession(
      token,
      window.location.pathname,
      expirationDate,
      AUTH.DISABLE_AUTH,
      AUTH.AUTHORIZE_NOT_REQUIRED,
      (event) => {
        if (event == "logout") {
          // Expiry reached: a valid refresh token still keeps the session going.
          refreshSession().then(newToken => {
            if (!newToken) {
              savePipelineReturnUrl()
              navigation('/login')
              loginService.logout()
            }
          })
        }
        if (event == "not-required") {
          //no events
        }
        if (event == "authenticate") {
          //no events
        }
      })
  }, [])

  return (
    <AuthContext.Provider value={{
      signIn: handleSignIn,
      logout: handleLogout,
      isAuthenticated: isAuthenticated || AUTH.DISABLE_AUTH,
      permissions: permissionsContext
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export {
  AuthContext,
  AuthProvider
}