FROM ubuntu:20.04 as build

MAINTAINER SDF Ops Team <ops@stellar.org>

ARG SERVER_HOST
ENV REACT_APP_SERVER_HOST=$SERVER_HOST

ARG REACT_APP_AMPLITUDE_KEY
ENV REACT_APP_AMPLITUDE_KEY $REACT_APP_AMPLITUDE_KEY

ARG REACT_APP_SENTRY_KEY
ENV REACT_APP_SENTRY_KEY $REACT_APP_SENTRY_KEY

RUN mkdir -p /app/ui
RUN apt-get update && apt-get install -y gnupg1 libtool build-essential

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y gpg curl git make ca-certificates apt-transport-https && \
    curl -sSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key|gpg --dearmor >/etc/apt/trusted.gpg.d/nodesource-key.gpg && \
    echo "deb https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg |gpg --dearmor >/etc/apt/trusted.gpg.d/yarnpkg.gpg && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y nodejs yarn && apt-get clean

COPY tsconfig.json package.json yarn.lock /app/
COPY ./ui /app/ui/
RUN yarn install
RUN yarn workspace ui build

FROM nginx:1.17

COPY --from=build /app/ui/build/ /usr/share/nginx/html/
COPY --from=build /app/ui/nginx.conf /etc/nginx/conf.d/default.conf
