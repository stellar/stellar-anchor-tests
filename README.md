# Stellar Anchor Tests Monorepo

This repository is a container for three applications

- [@stellar/anchor-tests](./@stellar/anchor-tests)
	- A library and CLI for testing stellar anchors. Will be published to npm.
- [ui](./ui)
	- A [react-redux](https://react-redux.js.org/) web interface for running anchor tests. Connects to the server via websockets.
- [server](./server)
	- An [socket.io](socket.io) server. Depends on `@stellar/anchor-tests`.

See each project for more information. To install and run all applications:

```sh
git clone git@github.com:stellar/stellar-anchor-tests.git
cd stelar-anchor-tests
yarn build:all
yarn start:all
```