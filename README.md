# pullrequest-first-webhook

A GitHub App built with [Probot](https://github.com/probot/probot) that creates a pull request for a branch as soon as the first commit is pushed to it.
This automates a [Pull request first](https://medium.com/practical-blend/pull-request-first-f6bb667a9b6) workflow.

## How does it work?

1. It registers for [push events](https://developer.github.com/v3/activity/events/types/#pushevent) to the repo.
2. Upon push, 
   1. it checks if the push git ref was a branch that is not master (```refs/heads/<branchname>```). if true,
   2. it checks if the [branch is not yet covered by an open pull request](https://developer.github.com/v3/pulls/#list-pull-requests). if true,
      * it checks if branch contains numbers. if true, it searches for a corresponding open issue and creates a pull request solving the issue (marked _WIP_) if not, 
      * *it creates [create a new pull request](https://developer.github.com/v3/pulls/#create-a-pull-request) for the branch, marked _WIP_.

## Use

The app is currently not public but if it was, [install it in your repo](https://github.com/settings/apps/pullrequest-first/installations).

## Development

```sh
# Install dependencies
yarn

# Run typescript
yarn build

# Run the bot
npm start
```

## Contributing

If you have suggestions for how pullrequest-first-webhook could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 Christian Scheja <christian@scheja.me> (https://scheja.me)
