import {expect, test, describe} from '@jest/globals'
import {isTag, parseConfig} from '../src/utils'

describe('isTag', () => {
  test('returns true for tags', () => {
    expect(isTag('refs/tags/v1.0.0')).toBe(true)
  })
  test('returns false for other kinds of refs', () => {
    expect(isTag('refs/heads/master')).toBe(false)
  })
})

describe('parseConfig', () => {
  test('empty', () => {
    expect(parseConfig({})).toEqual({
      github_ref: '',
      github_repository: ''
    })
  })
  test('GITHUB_REF', () => {
    expect(parseConfig({GITHUB_REF: 'refs/tags/v1.0.0'})).toEqual({
      github_ref: 'refs/tags/v1.0.0',
      github_repository: ''
    })
  })
})
