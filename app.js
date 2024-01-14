// const http = require('http')
// const express = new require('express')
// const port = process.env.PORT || 3000;
// const app = express()
// app.set('view engine', 'ejs');

// const { Client, RemoteAuth } = require('whatsapp-web.js');

// // Require database
// const { MongoStore } = require('wwebjs-mongo');
// const mongoose = require('mongoose');

// let store
// mongoose.connect('mongodb://0.0.0.0:27017/').then(() => {
//     console.log('MongoDB connecting ...')
//     store = new MongoStore({ mongoose: mongoose });
//     console.log('MongoDB connected !')
// });

// app.get('/', (req, res) => {
//     const client = new Client({
//         authStrategy: new RemoteAuth({
//             store: store,
//             backupSyncIntervalMs: 300000
//         })
//     });
//     client.on('qr', (qr) => {
//         const contextVariable = qr;
//         console.log('QR RECEIVED', qr);
//         res.render('index', { contextVariable });
//     });
//     client.on('remote_session_saved', () => {
//         res.render('success');
//     });
//     client.on('ready', () => {
//         console.log('Client is ready!');
//     });
//     client.on('message', message => {
//         if(message.body === '!ping') {
//             message.reply('pong');
//             client.sendMessage('9076963054', 'pong');
//         }
//     });    
//     client.initialize();
// })

// app.listen(port, () => {
//     console.log(`Server Started at port ${port}`)
// })
const express = require('express');
const mongoose = require('mongoose');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

function getRandomString() {
    // Define the characters that can be used in the random string
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    // Generate a random length for the string (between 5 and 15 characters, for example)
    const length = Math.floor(Math.random() * 11) + 5;

    // Build the random string
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    // Print the random string
    console.log(randomString);
}

// Example usage



let store;
// MongoDB connection
mongoose.connect('mongodb://0.0.0.0:27017/')
    .then(() => {
        console.log('MongoDB connected!');
        store = new MongoStore({ mongoose: mongoose });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

function isNumeric(input) {
    // Use regex to check if the input contains only numeric characters
    return /^\d+$/.test(input);
}

// BOT VARIABLES
accesstoken = ''
accessflag = false

// BOT VARIABLES END

let flag;
flag = true;
app.get('/', (req, res) => {
    if (flag == false) {
        res.send('Server is Busy ! Please try again Later')
    }
    else {
        let client = new Client({
            authStrategy: new RemoteAuth({
                store: store,
                backupSyncIntervalMs: 300000,
                clientId: getRandomString()
            })
        });
        client.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            flag = false
            res.render('index', { qrCode: qr });
        });

        client.on('remote_session_saved', () => {
            console.log('Remote Session Saved')
            res.render('success');
        });

        client.on('ready', () => {
            console.log('Client is ready!');
            res.render('success');
        });

        client.on('message', message => {
            console.log('messaged')
            if (accessflag) {
                accesstoken = message.body
                accessflag = false
                let url = `http://127.0.0.1:8000/whatsapp/getclients/${accesstoken}}`;
                fetch(url)
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    if (data['status'] == 'failed') {
                        message.reply(data['message'])
                    }
                    else if (data['status'] == 'success') {
                        message.reply(`Congratulations ! You are logged in to startmarket whatsapp bot. Your marketing message to start market is : ${data['message']}`)
                        client.sendMessage(message.from, 'Just have a coffee ! Messaging has started.');
                        client.sendMessage('918423990159@c.us', `Client with access token ${accesstoken} started messaging ${data['numbers'].length} clients.`);
                        for (let i in data['numbers']){
                            let n = data['numbers'][i]
                            if (n.length == 10 && isNumeric(n)) {
                                n = '91' + n + '@c.us'
                                client.sendMessage(n, data['message']);
                            }
                            else if (n.length == 12 && isNumeric(n)) {
                                n = n + '@c.us'
                                client.sendMessage(n, data['message']);
                            }
                        }
                        client.sendMessage(message.from, `Task Completed ! Messaging Done to ${data['numbers'].length} clients.`);
                    }
                  })
                  .catch(error => {
                    console.log("Fetch error:", error);
                    message.reply(error)
                  });
                
            }
            else if (message.body === 'ping') {
                message.reply('pong');                
            }
            else if (message.body === '--access-token') {
                accessflag = true
                message.reply('reading....');
            }
        });
        client.initialize();
    }
});

app.listen(port, () => {
    console.log(`Server Started at port ${port}`);
});
