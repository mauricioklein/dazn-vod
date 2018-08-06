[![Build Status](https://travis-ci.org/mauricioklein/dazn-vod.svg?branch=master)](https://travis-ci.org/mauricioklein/dazn-vod)
[![codecov](https://codecov.io/gh/mauricioklein/dazn-vod/branch/master/graph/badge.svg)](https://codecov.io/gh/mauricioklein/dazn-vod)

# DAZN VoD

A simple video on demand system written in NodeJS.

## Dependencies

- Node v8.0 or superior
- Redis v4.0 or superior
- Docker client v18.03 or superior (_only if running via Docker_)
- Docker server v18.03 or superior (_only if running via Docker_)
- Docker compose v1.21 or superior (_only if running via Docker_)

## Setup

### Running locally

1. Make sure you've a Redis instance running on your local environment
2. Set the following environment variables. These variables will be used by the system to connect on the Redis storage:
  - `REDIS_URL` (_default: 127.0.0.1_)
  - `REDIS_PORT` (_default: 6379_)
  - `PORT` (_default: 3000_)
3. Install the project dependencies:
  - `npm install`
4. Start the server:
  - `npm start`

The server is now running on `http://localhost:[PORT]`

### Running with Docker

An easier and more convenient way of running the system is using Docker. All the setup, including Redis preparation, is done automatically, using Docket compose:

1. Start the system:
  - `docker-compose run --service-ports app`

> The first execution of docker-compose run may take some time, since the Redis image needs to be pulled from Docker Register and the app image needs to be created. The subsequent calls to "run" will run faster.

## How to use

Access the system via url `http://localhost:[PORT]`. The video stream should start immediately.

The authentication is provided via the query parameter `username`. If this parameter is suppressed, username `annonymous` is used by default.

Example (assuming server running on port 3000):

```ruby
http://localhost:3000 # (authenticates as "annonymous")
http://localhost:3000?username=john # (authenticates as "john")
http://localhost:3000?username=peter # (authenticates as "peter")
```

Each user is authorised to hold a maximum of **3 concurrent connections**. In case the user has already 3 open connections and try to open a forth one, the connection is denied and an alert message is present informing that the maximum number of concurrent streams was reached. Closing the browser tab disconnects the user from the system and, thus, remove this connection from the user's quota.

A list of all active connections is available under `http://localhost:[PORT]/connections`. This route requires no authentication and shows the currently connected users in the system and the respective number of open connections.

## Technical details

The system is developed using [Socket.io](https://socket.io/). All the interaction between client and server is done using sockets, available in basically all modern technologies in the marker

### Connection

The workflow begins with the client connecting to the server: the client emits an `connection` event to the server, which replies with a `connect` event, informing the client that the connection is established. At this point, the client is connected to the server but still can't start a stream, since the authentication process isn't done yet.

### Authentication

The authentication starts with the client emiting an `authentication` event to the server, passing the username (informed via the `username` query parameter) as parameter. At this point, the server checks for the number of active connections for the user on the Redis storage. If the user already holds 3 open connections, the server refuses to establish a new one and emits back to the client an `unauthorized` event, informing the client that the authentication failed. Otherwise, if the user quota isn't reached yet, the server emits back an `authenticated` event, informing the client that the authentication succeeded. At this point, the client is allowed to start streaming a content from the server.

### Stream

The stream begins with the client emitting a `stream` event to the server. As parameter, the client must provide a stream where the server content will be stored. The server receives such request and opens a read stream for the requested video. This read stream is, thus, piped to the stream sent by the client, which will receive the video's frames in chunks over the time.

### Disconnect

Finally, in order to release its session and free a slot in the quota, the user must disconnect from the server. This is done by the client emitting a `disconnect` event to the server, which closes the connection with the client and decrement the number of active connections for the user on Redis storage. In the current implementation, the `disconnect` is automatically emitted when the user closes the browser tab.

## Project structure:

- `client/`: contains all JS files related to the client.
- `server/`: contains all the JS files related to the server. The files are separated in two sub-directories:
  - `server/src/`: contains the source code for the server logic implementation
  - `server/test/`: contains the automated tests for the server's resources
- `videos/`: contains the videos available for stream (files are placed here for convenience. In a real world application, these files should be placed in an external storage, such as `Amazon S3`).
- `public/`: contains the HTML file served when user access the system in the browser. Also, we can find a file called `bundle.js`, which is the bundle generated from `client/index.js` using [Browserify](http://browserify.org/)
- `index.js`: the entrypoint of the system. This file implements the HTTP server, connects it to the Socket.io system and serves all files.

## Code quality

The server side is fully covered with automated tests, placed under `server/test/`.

To run the tests, simply execute `npm test`.

Running the tests run all specs under `server/test/` and generate the code coverage using [Istanbul](https://istanbul.js.org/). The coverage files are stored in `coverage/` and the full report can be accessed opening `coverage/lcov-report/index.html` on any web browser.

Code lint is available using [ESLint](https://eslint.org/). The lint can be executed with `npm run lint`.

Finally, the specs execution, code coverage report and code lint are automatically executed in the CI system. [Travis](https://travis-ci.org/mauricioklein/dazn-vod) is the CI chosen for this project. Once the build is green, the coverage report is send automatically to [Codecov](https://codecov.io/gh/mauricioklein/dazn-vod). Badges for both Travis build status and Codecov coverage are available on the header of this `README` file.

## Next steps

Due the limited time to implement the solution, some useful features were left behind, some of them mandatory in a real world application. Here they are:

- Videos today are stored inside the project (under `videos/` directory). This is impracticable in a real world application, considering the number of medias available and also because each instance of the application would have a copy of the same resource. The right way to store the files would be place them in a dedicated storage, available for all the app instances to stream these files. Also, considering an application available across the world, a CDN system would be necessary, to reduce the latency to delivery the content to the customer.

- Authentication today is simple and not secure, enough for a code challenge but not OK for a real world application. The system today already uses `socketio-auth`, which controls the authentication of the user on the server side and, since uses websockets under the hoods, holds a secure connection. A proper authentication system would require a dedicated database to store the user's encrypted credentials and authenticate the same at every new connection.

- No deployment method is provided in the application today due the lack of time to prepare one. However, since the system today is _dockerized_, a proper solution would be deploy the application + Redis server using _Kubernates_, which guarantees the availability via health check and can be easily scaled to multiple app instances according the current load.
