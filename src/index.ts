import { Application } from 'probot'

export = (app: Application) => {
  app.on('push', async (context) => {
    const match = context.payload.ref.match(/^refs\/heads\/(\w*)$/)
    if (match !== null && match[1] !== 'master') {
      console.log('YAY!')

      const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
      await context.github.issues.createComment(issueComment)
    }

  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
