import { MongoMemoryServer } from 'mongodb-memory-server'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const isTextFileBusyError = (error: unknown): error is NodeJS.ErrnoException => {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ETXTBSY'
  )
}

interface CreateMongoMemoryServerOptions {
  retries?: number
  retryDelayMs?: number
}

export async function createMongoMemoryServer(
  options: CreateMongoMemoryServerOptions = {}
): Promise<MongoMemoryServer> {
  const { retries = 3, retryDelayMs = 500 } = options

  let attempt = 0
  let lastError: unknown

  while (attempt < retries) {
    attempt += 1

    try {
      return await MongoMemoryServer.create()
    } catch (error) {
      lastError = error

      if (!isTextFileBusyError(error) || attempt === retries) {
        throw error
      }

      const delay = retryDelayMs * attempt
      await wait(delay)
    }
  }

<<<<<<< ours
=======
  throw lastError ?? new Error('Failed to create MongoMemoryServer instance')
>>>>>>> theirs
}
