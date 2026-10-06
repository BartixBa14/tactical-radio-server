const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Zamiast sztywnego 3000, pozwalamy chmurze przydzielić własny port
const PORT = process.env.PORT || 3000;

console.log("Inicjalizacja serwera Tactical Radio z obsługą sesji...");

io.on('connection', (socket) => {
    let currentRoom = null;

    console.log(`Połączono: ${socket.id}`);

    // Gracz żąda dołączenia do konkretnej sesji / kodu
    socket.on('join-room', (roomCode) => {
        // Jeśli gracz był w innym pokoju, najpierw go opuszcza
        if (currentRoom) {
            socket.leave(currentRoom);
            console.log(`Gracz ${socket.id} opuścił pokój ${currentRoom}`);
        }

        currentRoom = roomCode.trim().toUpperCase(); // Standaryzacja do wielkich liter
        socket.join(currentRoom);
        console.log(`Gracz ${socket.id} dołączył do sesji: ${currentRoom}`);
        
        // Potwierdzamy graczowi, że pomyślnie wszedł do pokoju
        socket.emit('room-joined', currentRoom);
    });

    // Odbieranie audio i wysyłanie TYLKO do osób w tym samym pokoju
    socket.on('audio-stream', (audioData) => {
        if (currentRoom) {
            // .to(currentRoom) sprawia, że dźwięk trafia tylko do danej sesji
            socket.to(currentRoom).emit('audio-receive', {
                sender: socket.id,
                buffer: audioData
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Rozłączono: ${socket.id}`);
    });
});

http.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` SERWER OBSŁUGI SESJI RADIOWYCH DZIAŁA!`);
    console.log(` Port: ${PORT}`);
    console.log(`=============================================`);
});
