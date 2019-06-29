// see https://github.com/standard/standard/issues/1291
/* eslint no-unused-vars: "off" */
/* eslint @typescript-eslint/no-unused-vars: "error" */
import { debug } from 'debug'
import { Application, Context } from 'probot'
import { WebhookPayloadPush } from '@octokit/webhooks'

const log = debug('create-pullrequest-webhook')
debug.enable('create-pullrequest-webhook')

const createPullRequestForBranch = (context: Context, branchName: string) => {
  const newPullRequest = context.issue({ title: 'Merging ' + branchName, head: branchName, base: 'master', draft: true })
  log(`Creating pull request ${JSON.stringify(newPullRequest)} for branch ${branchName}`)
  return context.github.pulls.create(newPullRequest)
}

const createPullRequestForIssue = (context: Context, issueNumber: number, branchName: string) => {
  const newPullRequest = context.issue({ issue: issueNumber, head: branchName, base: 'master', draft: true })
  log(`Creating pull request ${JSON.stringify(newPullRequest)} for issue ${issueNumber}`)
  return context.github.pulls.createFromIssue(newPullRequest)
}

export = (app: Application) => {
  app.on('push', async (context) => {
    log(`============== New Request ==============`)
    log(`Received push to git ref ${context.payload.ref}`)

    // check if push git ref was a branch that is not master, see https://developer.github.com/v3/git/refs/
    const gitRefMatch = (context.payload as WebhookPayloadPush).ref.match(/^refs\/heads\/([\w-]*)$/)
    if (gitRefMatch !== null && gitRefMatch[1] !== 'master') {
      const branchName = gitRefMatch[1]
      log(`Figured out branch name ${branchName}`)

      // check if branch is not yet covered by an open pull request]
      const existingPullRequests = await context.github.pulls.list(context.issue(({ state: 'open', head: branchName, base: 'master' })))
      if (existingPullRequests.data && existingPullRequests.data.length === 0) {
        log(`No open pull request found for this branch`)

        // check if branch contains numbers. if true, search for corresponding issue. if still open, create pull request for issue
        const issueNumberMatch = branchName.match(/\D*(\d{1,}).*/)
        if (issueNumberMatch !== null) {
          const issueNumber = parseInt(issueNumberMatch[1])
          log(`Branch name contains number ${issueNumber}, try to find matching issue`)

          try {
            const issue = await context.github.issues.get(context.issue({ number: issueNumber }))
            if (issue.status === 200 && issue.data.state === 'open') {
              log(`Found issue number ${issueNumber} and it's open.`)
              await createPullRequestForIssue(context, issueNumber, branchName)
            } else {
              log(`Found issue number ${issueNumber} but it's not open.`)
              await createPullRequestForBranch(context, branchName)
            }
          } catch (err) {
            // 404 when issue not found throws error. Going to create pull request for the branch then.
            log(`Could not find issue number ${issueNumber}: ${err}. `)
            await createPullRequestForBranch(context, branchName)
          }
        } else {
          log(`Branch name does not contains numbers.`)
          await createPullRequestForBranch(context, branchName)
        }
      }
    }
  })
}
