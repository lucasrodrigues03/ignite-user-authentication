import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext'
import { AuthTokenError } from './errors/AuthTokenError'

interface AxiosErrorResponse {
  code?: string
}

let isRefreshing = false
let failedRequestedQueue = []

export function setupAPIClient(ctx = undefined) {
  const cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['auth.token']}`,
    },
  })

  api.interceptors.response.use(
    (response) => {
      return response
    },
    (error: AxiosError<AxiosErrorResponse>) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === 'token.expired') {
          const refreshToken = cookies['auth.refreshToken']
          const originalConfig = error.config

          if (!isRefreshing) {
            isRefreshing = true

            api
              .post('/refresh', { refreshToken })
              .then((response) => {
                const { token } = response.data

                setCookie(ctx, 'auth.token', token, {
                  maxAge: 30 * 24 * 60 * 60, // 30 days
                  path: '/',
                })

                setCookie(
                  ctx,
                  'auth.refreshToken',
                  response.data.refreshToken,
                  {
                    maxAge: 30 * 24 * 60 * 60, // 30 days
                    path: '/',
                  },
                )

                // eslint-disable-next-line dot-notation
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`

                failedRequestedQueue.forEach((request) =>
                  request.onSuccess(token),
                )
                failedRequestedQueue = []
              })
              .catch((err) => {
                failedRequestedQueue.forEach((request) =>
                  request.onFailure(err),
                )
                failedRequestedQueue = []

                if (process.browser) {
                  signOut()
                }
              })
              .finally(() => (isRefreshing = false))
          }

          return new Promise((resolve, reject) => {
            failedRequestedQueue.push({
              onSuccess: (token: string) => {
                originalConfig.headers.Authorization = `Bearer ${token}`
                resolve(api(originalConfig))
              },
              onFailure: (err: AxiosError) => reject(err),
            })
          })
        } else {
          if (process.browser) {
            signOut()
          } else {
            return Promise.reject(new AuthTokenError())
          }
        }
      }

      return Promise.reject(error)
    },
  )

  return api
}
