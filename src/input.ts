import {getInput} from '@actions/core'
import {parseConfig} from './utils'

const {env} = process
const config = parseConfig(env)

const options = {
  username: getInput('username', {required: true}),
  password: getInput('password', {required: true}),
  repo: getInput('repo') || config.github_repository,
  tag: getInput('tag'),
  title: getInput('title') || getInput('tag'),
  description: getInput('description') || '',
  prerelease: getInput('prerelease') === 'true',
  file: getInput('file')
}

export default options
