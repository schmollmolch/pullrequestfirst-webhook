// You can import your modules
// import index from '../src/index'

import nock from 'nock'
// Requiring our app implementation
import myProbotApp from '../src'
import { Probot } from 'probot'
// Requiring our fixtures
import push_to_tag from './fixtures/push.tag.json'
import push_to_master from './fixtures/push.master.json'
import push_to_branch_issue from './fixtures/push.branch.issue.json'
import push_to_branch_noissue from './fixtures/push.branch.json'
import get_pullrequest_exists from './fixtures/get.pullrequest.existing.json';

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

  afterEach(() => nock.cleanAll())

  test('does nothing when a push happens on a tag', async (done) => {
    // nock expects nothing

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_tag })
    done();
  })

  test('does nothing when a push happens on master', async (done) => {
    // nock expects nothing

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_master });
    done();
  })

  test('does nothing if existing pull request when an push happens on a branch', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' });

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(query => {
        //{ state: 'open', head: 'hotfix_urgent_urgent', base: 'master' }
        done(expect(query).toMatchObject({ state: 'open', head: 'hotfix_urgent_urgent', base: 'master' }))
        return true;
      })
      .reply(200, get_pullrequest_exists);

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_branch_noissue });
  });

  test('create pull request when an push happens on a branch without pull request without issue id in name', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' });

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(() => true)
      .reply(200, []);

    // create pull request for branch
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/pulls', (body: any) => {
        done(expect(body).toMatchObject(pullRequestCreatedForBranchBody))
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_branch_noissue });
  });

  test('create pull request when an push happens on a branch without pull request with issue id in name', async (done) => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' });

    // Test query for existing pull request
    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls')
      .query(() => true)
      .reply(200, []);

    // create pull request for branch
    nock('https://api.github.com')
      .post('/repos/hiimbex/testing-things/pulls', (body: any) => {
        done(expect(body).toMatchObject(pullRequestCreatedForIssueBody))
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({ name: 'push', payload: push_to_branch_issue });
  });
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
