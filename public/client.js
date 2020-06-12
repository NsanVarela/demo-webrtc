const socket = io();

const message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    output = document.getElementById('output'),
    typing = document.getElementById('typing'),
    button = document.getElementById('button'),
    videoContainer = document.querySelector('.video-container'),
    recognitionInput = document.getElementById('recognitionInput');

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
        console.log('peer :' , peer)
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

    /* Speech Recognition */

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        videoContainer.insertAdjacentHTML("beforeend", `<button type="button" id"micBtn"><i class="fas fa-microphone"></i></button>`);
        const micBtn = videoContainer.querySelector("button");
        const micIcon = micBtn.querySelector("i");

        const recognition = new SpeechRecognition();
        recognition.continuous = true;

        micBtn.addEventListener("click", micBtnClick);

        function micBtnClick() {
            if (micIcon.classList.contains("fa-microphone")) {
                recognition.start();
            }
            else {
                recognition.stop();
            }
        }
        // console.log("Your browser supports speechrecognition");

        recognition.addEventListener("start", startSpeechRecognition); // <=> recognition.onstart = function() {...}
        function startSpeechRecognition() {
            micIcon.classList.remove("fa-microphone");
            micIcon.classList.add("fa-microphone-slash");
            recognitionInput.focus();
            // console.log("Speech Recognition Active");
        }

        recognition.addEventListener("end", endSpeechRecognition); // <=> recognition.onstart = function() {...}
        function endSpeechRecognition() {
            micIcon.classList.remove("fa-microphone-slash");
            micIcon.classList.add("fa-microphone");
            recognitionInput.focus();
            // console.log("Speech Recognition Disconnected");
        }

        recognition.addEventListener("result", resultOfSpeechRecognition); // <=> recognition.onresult = function(event) {...}
        function resultOfSpeechRecognition(event) {
            const currentResultIndex = event.resultIndex;
            const transcript = event.results[currentResultIndex][0].transcript;
            recognitionInput.value = transcript;
            // console.log('Recording event result : ', event)

            if (transcript.toLowerCase().trim() === "arrêt de l'enregistrement") {
                recognition.stop();
            }
            else if (!recognitionInput.value) {
                recognitionInput.value = transcript;
            }
            else {
                if (transcript.toLowerCase().trim() === "go") {
                }
                else if (transcript.toLowerCase().trim() === "effacer") {
                    recognitionInput.value = "";
                }
                else {
                    recognitionInput.value = transcript;
                }
            }
        }
    }
    else {
        // console.log("Your browser does not support speechrecognition");
    }
