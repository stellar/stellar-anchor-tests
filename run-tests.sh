#!/bin/bash

yarn stellar-anchor-tests --seps 1 --sep-config ./@stellar/anchor-tests/src/tests/config/sep1.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 6 --asset-code USDC --sep-config ./@stellar/anchor-tests/src/tests/config/sep6.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 10 --sep-config ./@stellar/anchor-tests/src/tests/config/sep10.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 12 --sep-config ./@stellar/anchor-tests/src/tests/config/sep12.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 24 --sep-config ./@stellar/anchor-tests/src/tests/config/sep24.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 31 --asset-code USDC --sep-config ./@stellar/anchor-tests/src/tests/config/sep31.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 31 --asset-code USDC --sep-config ./@stellar/anchor-tests/src/tests/config/sep31and38.json --home-domain api-stage.anclap.ar
yarn stellar-anchor-tests --seps 38 --sep-config ./@stellar/anchor-tests/src/tests/config/sep38.json --home-domain api-stage.anclap.ar


