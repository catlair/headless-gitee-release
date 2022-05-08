export interface Config {
  github_ref: string
  github_repository: string
}

type Env = {[key: string]: string | undefined}

export const parseConfig = (env: Env): Config => {
  return {
    github_ref: env.GITHUB_REF || '',
    github_repository: env.INPUT_REPOSITORY || env.GITHUB_REPOSITORY || ''
  }
}

export const isTag = (ref: string): boolean => {
  return ref.startsWith('refs/tags/')
}
