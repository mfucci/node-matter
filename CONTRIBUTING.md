# Contributing

Implementing and maintaining a protocol stack is a lot of work, therefore any
help is appreciated, from creating issues, to contributing documentation, fixing
issues and adding new features.

Please follow the best-practice contribution guidelines as mentioned below when
submitting any changes.

### Contributions License Agreement

Before contributing, please read the [Contributions License Agreement](./CLA.md).
Every contributor must sign this agreement before any code is merged into the
repository.

### Git

Please, do your changes with the develop branch in your forked repo
and send us your pull request from your own forked repo feature-branches
or fix-branches to the develop branch of our repo!

In the case that Commit rights were granted to Contributors the following basic ground-rules should be applied:

* No --force pushes or modifying the Git history in any way.
* Non-master branches ought to be used for ongoing work.
* External API changes and significant modifications ought to be subject to an internal pull-request to solicit feedback from other contributors.
* Internal pull-requests to solicit feedback are encouraged for any other non-trivial contribution but left to the discretion of the contributor.

### Code Style

Currently, there is no tooling in place to maintain code style. This might change in the future.

When contributing code please stick to the Code style you find in the code. If you see places where a reformatting makes sense to increase the readability please create separate commits for these formatting changes; ideally create separate PRs. This will allow reviews to better focus on the functional changes!
Please try to avoid reformatting "just because your IDE settings are in a certain way/you are used to a certain style.". If you like to propose changes to code style please open a discussion about it.

If you find code places that can be enhanced because missing comments, missing documentation, missing tests, missing error handling, missing checks, missing logging, missing ... feel free to provide separate PRs too.
Let's work together to make the code of this library as good as possible and a professional basis for the future with Matter in TypeScript/JavaScript!

### Code documentation
Please add code documentation for new functions and classes. If you change existing code please try to update the documentation as well. The goal of the documentation is to support other developers to understand why the code is written that way, especially when there are some "magic" things happening.

### Building TypeScript
This project uses TypeScript. 

To build the project run

``` sh
npm run test
```

Please make sure that your code builds without warnings or errors.

### Testing

Testing is done using [Mocha](https://mochajs.org/).

Please add tests if you add new features or fix bugs, if affordable. If you are unsure how to test something please ask.

Running the tests can be done locally by executing:

``` sh
npm run test
```

It is expected that new features or fixes do not negatively impact the test
results.
