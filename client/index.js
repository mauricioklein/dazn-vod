(() => {
  const ss = require('socket.io-stream');
  const MediaSourceStream = require('mediasource')
  const queryString = require("query-string")

  // Check MediaSource API
  const hasMediaSource = () => (
  	!!(window.MediaSource || window.WebKitMediaSource)
  )

  if (hasMediaSource()) {
  	console.log('MediaSource API available.');
  } else {
  	alert("Your browser doesn't support the MediaSource API!");
  }

  const createVideoElement = () => {
    const elem = document.createElement("video")
	  elem.controls = true
	  document.body.appendChild(elem)
    return elem
  }

  const params = queryString.parse(window.location.search)
  const username = params.username || "anonymous"

  const socket = io();
  const stream = ss.createStream();

  socket.on("connect", () => {
    socket.emit("authentication", { username: username })

    socket.on("authenticated", () => {
      const video = createVideoElement()
      const writable = new MediaSourceStream(video, { extname: '.webm' });

      ss(socket).emit('stream', stream);
      stream.pipe(writable);
    })

    socket.on("unauthorized", (err) => {
      alert(`Authorization failed: ${err.message}`)
    })
  })
})()
