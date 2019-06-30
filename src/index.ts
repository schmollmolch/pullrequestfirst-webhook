/* eslint no-unused-vars: "off" */
/* eslint @typescript-eslint/no-unused-vars: "error" */
// see https://github.com/standard/standard/issues/1291
import { debug } from 'debug'
import { Application, Context } from 'probot'
import { WebhookPayloadPush } from '@octokit/webhooks'

const log = debug('create-pullrequest-webhook')
debug.enable('create-pullrequest-webhook')

/**
 * Creates a new pull request for a branch that gets merged into master
 * @param context the webhook context
 * @param branchName the branch name that gets merged
 * @returns the GitHub API createIssue response
 */
const createPullRequestForBranch = async (context: Context<WebhookPayloadPush>, branchName: string) => {
  const newPullRequest = context.issue({ title: 'Merging ' + branchName, head: branchName, base: 'master', draft: true })
  log(`Creating pull request ${JSON.stringify(newPullRequest)} for branch ${branchName}`)
  return context.github.pulls.create(newPullRequest)
}

/**
 * Creates a new pull request that references an issue and gets merged into master
 * @param context the webhook context
 * @param issueNumber the issue number to reference
 * @param branchName the branch name that gets merged
 * @returns the GitHub API createIssue response
 */
const createPullRequestForIssue = async (context: Context<WebhookPayloadPush>, issueNumber: number, branchName: string) => {
  const newPullRequest = context.issue({ issue: issueNumber, head: branchName, base: 'master', draft: true })
  log(`Creating pull request ${JSON.stringify(newPullRequest)} for issue ${issueNumber}`)
  return context.github.pulls.createFromIssue(newPullRequest) // TODO: For some weird reason this call takes 3 second during testing
}

/**
 * checks if branch is already covered by an open pull request
 * @param context the webhook context
 * @param branchName the name of the branch to check
 * @returns true if a pull request was found, false if not
 */
const checkPullRequestExists = async (context: Context<WebhookPayloadPush>, branchName: string) => {
  const existingPullRequests = await context.github.pulls.list(context.issue({
    state: 'open',
    head: context.issue({}).owner + ':' + branchName // hack to get repo owner name from context
  }))
  return existingPullRequests.data && existingPullRequests.data.length > 0
}

/**
 * checks if the pushed git ref was a branch that is not master, @see https://developer.github.com/v3/git/refs/
 * @param context the webhook context
 * @returns the branch name, false otherwise
 */
const checkPushIsForBranch = (context: Context<WebhookPayloadPush>) => {
  const gitRefMatch = (context.payload as WebhookPayloadPush).ref.match(/^refs\/heads\/([\w-]*)$/)
  if (gitRefMatch !== null && gitRefMatch[1] !== 'master') {
    const branchName = gitRefMatch[1]
    log(`Figured out branch name ${branchName}`)
    return branchName
  } else return false
}

/**
 * checks if branch contains numbers. if true, search for corresponding issue. if still open, create pull request for issue
 * @param branchName the branch that might refrence an issue
 * @param context the webhook context
 * @returns the issue number if an open issue was found, false otherwise
 */
const checkBranchReferencesOpenIssue = async (context: Context<WebhookPayloadPush>, branchName: string) => {
  const issueNumberMatch = branchName.match(/\D*(\d{1,}).*/)
  if (issueNumberMatch !== null) {
    const issueNumber = parseInt(issueNumberMatch[1])
    log(`Branch name contains number ${issueNumber}, try to find matching open issue`)

    try {
      const issueQuery = context.issue({ issue_number: issueNumber })
      delete issueQuery.number // to avoid deprecation warning. value is 'undefined' anyways
      const issue = await context.github.issues.get(issueQuery)
      if (issue.status === 200 && issue.data.state === 'open') return issueNumber
      else log(`Issue ${issueNumber} is not open.`)
    } catch (err) {
      // 404 error when issue was not found. or any other error as well, actually.
      log(`Could not find issue number ${issueNumber}: ${err}`)
    }
  } else {
    log(`Branch name does not contains numbers.`)
  }
  return false
}

/**
 * The actual webhook
 */
export = (app: Application) => {
  app.on('push', async (context) => {
    log(`============== New Request ==============`)
    log(`Received push to git ref ${context.payload.ref}`)

    const branchName = checkPushIsForBranch(context)
    if (branchName) {
      const pullRequestExists = await checkPullRequestExists(context, branchName)
      if (!pullRequestExists) {
        log(`No open pull request found for this branch`)
        const issueNumber = await checkBranchReferencesOpenIssue(context, branchName)
        if (issueNumber) {
          log(`Found open issue ${issueNumber} to reference in the pull request`)
          await createPullRequestForIssue(context, issueNumber, branchName)
        } else {
          log(`Found no issue to reference in the pull request`)
          await createPullRequestForBranch(context, branchName)
        }
      } else {
        log(`PullRequest for branch already exists. Won't create a new one.`)
      }
    } else {
      log(`Push did not reference a branch. Nothing to do here.`)
    }
  })
}
