const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils2/messages");
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require("./utils2/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//SET STATIC FOLDER
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatVerse Bot";

//run when client connects
io.on("connection", socket => {

    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome current user
        socket.emit("message", formatMessage(botName, "Welcome to ChatVerse!"));

        //broadcast when a user connects
        socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} has joined the chat`));

        //send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    //listen for chatMessage
    socket.on("chatMessage", msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    //runs when client disconnects
    socket.on("disconnect", () => {
        const user = userLeaves(socket.id);

        if (user) {
            io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat`));

            //send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            });

        }

    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log("Server running on port ${PORT}"));