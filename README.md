# pullrequest-first-webhook

> A GitHub App built with [Probot](https://github.com/probot/probot) that creates a pull request for a branch as soon as the first commit is pushed to it.
> This automates a [Pull request first](https://medium.com/practical-blend/pull-request-first-f6bb667a9b6) workflow.

## How?

1. register for [push events](https://developer.github.com/v3/activity/events/types/#pushevent) to the repo.
2. upon push, 
   1. check if push git ref was a branch that not master (```refs/heads/<branchname>```)
   2. check if [branch is already covered by an open pull request](https://developer.github.com/v3/pulls/#list-pull-requests)
   3. [create a new pull request](https://developer.github.com/v3/pulls/#create-a-pull-request) for the branch marked _WIP_.

## Setup

```sh
# Install dependencies
npm install

# Run typescript
npm run build

# Run the bot
npm start
```

## Contributing

If you have suggestions for how pullrequest-first-webhook could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 Christian Scheja <christian@scheja.me> (https://scheja.me)
