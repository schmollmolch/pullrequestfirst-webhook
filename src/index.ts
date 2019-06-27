import { Application } from 'probot'

export = (app: Application) => {
  app.on('push', async (context) => {
    const match = context.payload.ref.match(/^refs\/heads\/(\w*)$/)
    if (match !== null && match[1] !== 'master') {
      const branchName = match[1];

      const existingPullRequests = await context.github.pullRequests.list(context.issue(({ state: 'open', head: branchName, base: 'master' })));

      if (existingPullRequests.data && existingPullRequests.data.length === 0) {
        const newPullRequest = context.issue({ title: 'Merging ' + branchName, head: branchName, base: 'master', draft: true })
        await context.github.pullRequests.create(newPullRequest)
      }
    }
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
