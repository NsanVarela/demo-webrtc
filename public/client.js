const socket = io();

const message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    output = document.getElementById('output'),
    typing = document.getElementById('typing'),
    button = document.getElementById('button');

    message.addEventListener('keypress', () => {
        socket.emit('userTyping', handle.value)
    })

    button.addEventListener('click', () => {
        socket.emit('userMessage', {
            handle: handle.value,
            message: message.value
        })
        document.getElementById('message').value = ''
    })

    socket.on('userMessage', (data) => {
        typing.innerHTML = ''
        output.innerHTML += `<p> <strong>${data.handle}: </strong>${data.message}</p>`
    })

    socket.on('userTyping', (data) => {
        typing.innerHTML = `<p><em>${data}: est en train d'écrire ...</em></p>`
    })

    /* Video */

    function getLocalVideo(callbacks) {
        navigator.mediaDevices.getUserMedia = ( navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);
        const constraints = {
            audio: true,
            video: { facingMode: "user" }
        }
        navigator.mediaDevices.getUserMedia(constraints, callbacks.success, callbacks.error)
    }

    function receiveStream(stream, elemId) {
        const video = document.getElementById(elemId)
        video.srcObject = stream
        window.peer_stream = stream
    }

    getLocalVideo({
        success: (stream) => {
            window.localstream = stream
            receiveStream(stream, 'localVideo')
        },
        error: (err) =>{
            alert(`Impossible d'accéder à votre caméra`)
            console.log(err)
        }
    })

    let conn;
    let peer_id;

    const peer = new Peer(); 

    peer.on('open', (id) => {
        document.getElementById('displayId').innerHTML = peer.id
        // console.log('My peer ID is: ' + id)
    })

    peer.on('connection', (connection) => {
        conn = connection
        peer_id = connection.peer

        document.getElementById('connectionId').value = peer_id
    })
    peer.on('error', (err) => {
        alert('an error has happened: ' + err)
        console.log(err)
    })
    document.getElementById('conn_button').addEventListener('click', () => {
        peer_id = document.getElementById('connectionId').value

        if (peer_id) {
            conn = peer.connect(peer_id)
        } else {
            alert('Saisissez un ID')
            return false
        }
    })

    peer.on("call", (call) => {
        const acceptCall = confirm("Voulez-vous répondre à cet appel ?");
        if (acceptCall) {
            call.answer(window.localstream);
            
            call.on("stream", (stream) => {
                window.peer_stream = stream;
                receiveStream(stream, "remoteVideo")
            });

            call.on("close", () => {
                alert("L'appel est terminé");
            })
        } else {
            console.log("Appel rejeté")
        }
    });

    document.getElementById("call_button").addEventListener("click", () => {
        console.log("Appeler un contact: "+ peer_id);
        console.log(peer);

        let call = peer.call(peer_id, window.localstream)
        call.on("stream", (stream) => {
            window.peer_stream = stream;
            receiveStream(stream, 'remoteVideo');
        })
    })



