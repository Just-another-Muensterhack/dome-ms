import { apiRequest } from '@/api/client'
import type { Webserver, WebserverIn } from '@/api/types/webserver'

const webserversPath = '/api/v1/webservers/'

export const createWebserver = (payload: WebserverIn): Promise<Webserver> => (
  apiRequest<Webserver>(webserversPath, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
)
