# Solana Paper Trading

## Overview

This NestJS backend utilizes free Solana blockchain ecosystem APIs to accurately track prices, calculate slippage and provide the user with an ability to simulate realistic trading scenarios and actions without using real Solana tokens. The system is for Paper Trading, just like Stock Market tools like **Webull** or **IBKR**.

## Tech

- NestJS 10
- Type ORM 10
- PostgreSQL

## Architecture

This is a simple monolith. This is mostly for personal use, and use within inner circles of friends. This is an open source tool, so you will need to host it yourself to use it.

## Setup guide

1) Clone the repo
2) Create a .env file in root with following vars:
  - PORT
  - DB_PORT
  - DB_HOST
  - DB_USERNAME
  - DB_PASSWORD
  - DB_NAME
  - JWT_SECRET <- base 32 preferred
  - QUICKNODE_RPC_URL <- your quicknode RPC endpoint. [Learn more](https://www.quicknode.com/)
  - DATABASE_URL <- url to your DB
2) Run `npm i` in root(Readme.MD level)
3) Run `npm build` to build TS into JS (files in /dist)
4) Run `npm start` to start the server
4) Connect to frontend by creating `.env` there with the following variable:
  - REACT_APP_BACKEND_ENDPOINT=http://localhost:8080 [Frontend repo](https://github.com/princeVegeta2/sol-frontend)
5) Sign up and trade

# Conclusion

This is a tool I use myself, therefore anyone can use it to improve their trading skills on volatile Solana markets.