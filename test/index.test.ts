import nock from 'nock'
// Requiring our app implementation
import myProbotApp from '../src'
import { Probot } from 'probot'
// Requiring our fixtures
import pushToTag from './fixtures/push.tag.json'
import pushToMaster from './fixtures/push.master.json'
import pushToBranchIssue from './fixtures/push.branch.issue.json'
import pushToBranchNoissue from './fixtures/push.branch.json'
import getPullrequestExists from './fixtures/get.pullrequest.existing.json'
import getIssueOpen from './fixtures/get.issue.open.json'
import getIssueClosed from './fixtures/get.issue.closed.json'

const pullRequestCreatedForIssueBody = {
  issue: 123,
  head: 'issue-123',
  base: 'master',
  draft: true
}

const pullRequestCreatedForBranchBody = {
  title: 'Merging hotfix_urgent_urgent',
  head: 'hotfix_urgent_urgent',
  base: 'master',
  draft: true
}

const pullRequestCreatedForClosedIssueBody = {
  title: 'Merging issue-123',
  head: 'issue-123',
  base: 'master',
  draft: true
}

nock.disableNetConnect()

describe('Pull Request First', () => {
  let probot: any

  beforeEach(() => {
    probot = new Probot({ id: 123, cert: 'test', githubToken: 'test' })
    // Load our app into probot
    const app = probot.load(myProbotApp)

    // just return a test token
    app.app = () => 'test'
  })

  afterEach(() => nock.cleanAll())

  test('does nothing when a push happens on a tag', async (done) => {
    // nock expects nothing

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToTag })
    done()
  })

  test('does nothing when a push happens on master', async (done) => {
    // nock expects nothing

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToMaster })
    done()
  })

  test('does nothing if existing pull request when an push happens on a branch', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(query => {
        expect(query).toMatchObject({ state: 'open', head: 'hotfix_urgent_urgent', base: 'master' })
        return true
      })
      .reply(200, getPullrequestExists)

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToBranchNoissue })
    done()
  })

  test('create pull request when an push happens on a branch without pull request without issue id in name', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(() => true)
      .reply(200, [])

    // create pull request for branch
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/pulls', (body: any) => {
        expect(body).toMatchObject(pullRequestCreatedForBranchBody)
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToBranchNoissue })
    done()
  })

  test('create pull request when an push happens on a branch without pull request with issue id in name and issue does not exist', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(() => true)
      .reply(200, [])

    // Test query for existing issue
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/issues/123')
      .reply(404, 'not found')

    // create pull request for branch
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/pulls', (body: any) => {
        expect(body).toMatchObject(pullRequestCreatedForClosedIssueBody)
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToBranchIssue })
    done()
  })

  test('create pull request when an push happens on a branch without pull request with issue id in name and issue is closed', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(() => true)
      .reply(200, [])

    // Test query for existing issue
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/issues/123')
      .reply(200, getIssueClosed)

    // create pull request for branch
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/pulls', (body: any) => {
        expect(body).toMatchObject(pullRequestCreatedForClosedIssueBody)
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToBranchIssue })
    done()
  })

  test('create pull request when an push happens on a branch without pull request with issue id in name and issue is open', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(() => true)
      .reply(200, [])

    // Test query for existing issue
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/issues/123')
      .reply(200, getIssueOpen)

    // create pull request for branch
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/pulls', (body: any) => {
        expect(body).toMatchObject(pullRequestCreatedForIssueBody)
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: pushToBranchIssue })
    done()
  })
})
