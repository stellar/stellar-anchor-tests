FROM ubuntu:20.04 as build

MAINTAINER SDF Ops Team <ops@stellar.org>

RUN mkdir -p /app/server
RUN mkdir -p /app/@stellar/anchor-tests
RUN apt-get update && apt-get install -y gnupg1 libtool build-essential

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y gpg curl git make ca-certificates apt-transport-https && \
    curl -sSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key|gpg --dearmor >/etc/apt/trusted.gpg.d/nodesource-key.gpg && \
    echo "deb https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg |gpg --dearmor >/etc/apt/trusted.gpg.d/yarnpkg.gpg && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y nodejs yarn && apt-get clean

COPY tsconfig.json package.json yarn.lock /app/
COPY ./server /app/server/
COPY ./@stellar/anchor-tests /app/@stellar/anchor-tests/
RUN yarn install
RUN yarn build:server

EXPOSE 8000
CMD ["yarn", "workspace", "server", "start"]
