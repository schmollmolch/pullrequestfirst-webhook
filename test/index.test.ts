// You can import your modules
// import index from '../src/index'

import nock from 'nock'
// Requiring our app implementation
import myProbotApp from '../src'
import { Probot } from 'probot'
// Requiring our fixtures
import push_to_tag from './fixtures/push.tag.json'
import push_to_master from './fixtures/push.master.json'
import push_to_branch from './fixtures/push.branch.json'

const pullRequestCreatedBody = {
  issue: 123,
  head: 'issue-123',
  base: 'master',
  draft: true
}

nock.disableNetConnect()

describe('Pull Request First', () => {
  let probot: any

  beforeEach(() => {
    probot = new Probot({ id: 123, cert: 'test' })
    // Load our app into probot
    const app = probot.load(myProbotApp)

    // just return a test token
    app.app = () => 'test'
  })

  test('does nothing when a push happens on a tag', async (done) => {
    // Report an error if we're called
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .replyWithError({
        message: 'thou shall not call me now',
        code: 'AWFUL_ERROR',
      })

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_tag })
    expect(nock.isDone()).toBe(false);
    done();
  })

  test('does nothing when a push happens on master', async (done) => {
    // Report an error if we're called
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .replyWithError({
        message: 'thou shall not call me now',
        code: 'AWFUL_ERROR',
      })

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_master })
    expect(nock.isDone()).toBe(false);
    done();
  })

  test('checks for existing pull request when an push happens on a branch', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // Test that a comment is posted
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/issues/1/comments', (body: any) => {
        done(expect(body).toMatchObject(pullRequestCreatedBody))
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_branch })
    expect(nock.isDone()).toBe(true)
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
