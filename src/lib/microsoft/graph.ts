import { Client } from '@microsoft/microsoft-graph-client'
import 'isomorphic-fetch'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data: TokenResponse = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000 // Refresh 1 min early

  return cachedToken
}

export function getGraphClient(): Client {
  return Client.init({
    authProvider: async (done) => {
      try {
        const token = await getAccessToken()
        done(null, token)
      } catch (error) {
        done(error as Error, null)
      }
    },
  })
}

export async function createFolder(folderName: string): Promise<{ id: string; webUrl: string }> {
  const client = getGraphClient()
  const basePath = process.env.ONEDRIVE_FOLDER_PATH || '/SampleLibrary'

  // First, ensure the base folder exists
  try {
    await client.api(`/me/drive/root:${basePath}`).get()
  } catch {
    // Create base folder if it doesn't exist
    await client.api('/me/drive/root/children').post({
      name: basePath.replace('/', ''),
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    })
  }

  // Create the sample folder
  const folder = await client.api(`/me/drive/root:${basePath}:/children`).post({
    name: folderName,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'rename',
  })

  return {
    id: folder.id,
    webUrl: folder.webUrl,
  }
}

export async function uploadFileToFolder(
  folderId: string,
  fileName: string,
  fileContent: Buffer
): Promise<{ id: string; webUrl: string }> {
  const client = getGraphClient()

  // For files larger than 4MB, use upload session
  if (fileContent.length > 4 * 1024 * 1024) {
    const uploadSession = await client
      .api(`/me/drive/items/${folderId}:/${fileName}:/createUploadSession`)
      .post({
        item: {
          '@microsoft.graph.conflictBehavior': 'rename',
        },
      })

    // Upload in chunks
    const chunkSize = 320 * 1024 * 10 // ~3.2MB chunks
    let offset = 0

    while (offset < fileContent.length) {
      const chunk = fileContent.slice(offset, offset + chunkSize)
      const contentRange = `bytes ${offset}-${offset + chunk.length - 1}/${fileContent.length}`

      const response = await fetch(uploadSession.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': contentRange,
        },
        body: chunk,
      })

      if (!response.ok && response.status !== 202) {
        throw new Error(`Upload failed: ${await response.text()}`)
      }

      offset += chunkSize

      // If upload is complete, return the file info
      if (response.status === 200 || response.status === 201) {
        const file = await response.json()
        return { id: file.id, webUrl: file.webUrl }
      }
    }
  }

  // For smaller files, use simple upload
  const file = await client
    .api(`/me/drive/items/${folderId}:/${fileName}:/content`)
    .put(fileContent)

  return {
    id: file.id,
    webUrl: file.webUrl,
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const client = getGraphClient()
  await client.api(`/me/drive/items/${folderId}`).delete()
}

export async function getFolderContents(folderId: string): Promise<any[]> {
  const client = getGraphClient()
  const response = await client.api(`/me/drive/items/${folderId}/children`).get()
  return response.value
}
