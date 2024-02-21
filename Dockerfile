FROM node:20 as build

# Check the versions
RUN node --version &&  \
    npm --version &&  \
    yarn --version

# Install TypeScript globally and check the version
RUN npm install -g typescript &&  \
    tsc --version

WORKDIR /code

COPY . .
RUN npm install -g @stellar/anchor-tests

ENTRYPOINT ["stellar-anchor-tests"]
