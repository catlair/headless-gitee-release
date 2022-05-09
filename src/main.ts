import * as core from '@actions/core'
import {Page} from 'puppeteer'
import input from './input'
import path from 'path'

const puppeteer = require('puppeteer')
async function showHtml(page: Page): Promise<void> {
  core.startGroup('html')
  const html = await page.content()
  core.debug(html)
  core.endGroup()
}

/** 安装浏览器 */
async function installBrowser(): Promise<string> {
  const browserFetcher = puppeteer.createBrowserFetcher()
  const revisionInfo = await browserFetcher.download('950341')

  return revisionInfo.executablePath
}

/** 登录 */
async function login(page: Page): Promise<boolean> {
  try {
    await page.goto('https://gitee.com/login')
    await page.waitForTimeout(5000)
    core.info('navigated to gitee login page')
    await page.type('#user_login', input.username)
    await page.type('#user_password', input.password)
    core.debug('click login button')
    await showHtml(page)
    core.info(((await page.$('.field input[type="submit"]')) || '').toString())
    await Promise.all([
      page.waitForNavigation({timeout: 60000}),
      page.evaluate(() => {
        document
          .querySelector<HTMLButtonElement>('.field input[type="submit"]')
          ?.click()
      })
    ])
    core.info('logged in')
    return true
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    }
    core.setFailed('login failed')
    return false
  }
}

/** 创建 release */
async function createRelease(page: Page): Promise<void> {
  try {
    await page.goto(`https://gitee.com/${input.repo}/releases/new`)
    await page.waitForTimeout(5000)
    core.info('navigated to gitee releases page')
    // 获取最新的版本号
    let tagVer = input.tag
    if (!tagVer) {
      core.info('getting latest tag')
      tagVer = await page.$eval('#git-tags option', el =>
        el ? el.innerHTML : ''
      )
    }
    await page.type('#release_tag_version', tagVer, {delay: 1000})
    await page.type('#release_title', input.title, {delay: 1000})
    await page.type('.md-input', input.description, {delay: 1000})
    if (input.prerelease) {
      core.info('setting prerelease')
      await page.click('#release_prerelease')
    }
    await uploadFile(page)
    await page.waitForTimeout(5000)
    core.debug('uploaded file')
    await page.waitForSelector('#btn-submit-release')
    const btn = await page.$('#btn-submit-release')
    await page.waitForTimeout(5000)
    core.debug('start submitting')
    await Promise.all([
      page.waitForNavigation({timeout: 120000}),
      page.evaluate(sub => sub.click(), btn)
    ])
    core.info('created release')
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    }
    core.setFailed('create release failed')
  }
}

/** 上传文件 */
async function uploadFile(page: Page): Promise<void> {
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('#releaseDropzone')
  ])
  const filePath = path.resolve(process.cwd(), input.file)
  fileChooser && (await fileChooser.accept([filePath]))
}

async function run(): Promise<void> {
  try {
    const browser = await puppeteer.launch({
      executablePath: await installBrowser()
    })
    const page = await browser.newPage()
    core.debug('launched browser')

    core.startGroup('login')
    const isGo = await login(page)
    core.endGroup()

    core.startGroup('create release')
    isGo && (await createRelease(page))
    core.endGroup()

    await browser.close()
    core.debug('closed browser')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
