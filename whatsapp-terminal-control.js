const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
                lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connection opened!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2));
        const msg = m.messages[0];
        if (msg.key.fromMe) return;

        if (msg.message?.documentMessage) {
            await handleFileUpload(msg, sock);
        } else {
            const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            if (messageContent) {
                handleIncomingMessage(messageContent, msg.key.remoteJid, sock);
            }
        }
    });
}

async function handleFileUpload(msg, sock) {
    const fileName = msg.message.documentMessage.fileName;
    const fileBuffer = await sock.downloadMediaMessage(msg);
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFile(filePath, fileBuffer, (err) => {
        if (err) {
            sock.sendMessage(msg.key.remoteJid, { text: `Error uploading file: ${err.message}` });
        } else {
            sock.sendMessage(msg.key.remoteJid, { text: `File uploaded successfully. Path: ${filePath}` });
        }
    });
}

function handleIncomingMessage(messageContent, remoteJid, sock) {
    if (!messageContent) return;
    if (messageContent.startsWith('$')) {
        handleTerminalCommand(messageContent.slice(1), remoteJid, sock);
    } else if (messageContent.startsWith('/')) {
        handleCustomCommand(messageContent.slice(1), remoteJid, sock);
    } else if (messageContent.startsWith('£')) {
        handleMathOperation(messageContent.slice(1), remoteJid, sock);
    } else {
        sock.sendMessage(remoteJid, { text: `Unknown command format. Use $ for terminal commands, / for custom commands, or £ for math operations.` });
    }
}

function handleTerminalCommand(command, remoteJid, sock) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            sock.sendMessage(remoteJid, { text: `Error: ${error.message}` });
            return;
        }
        if (stderr) {
            sock.sendMessage(remoteJid, { text: `Stderr: ${stderr}` });
            return;
        }
        const output = stdout.split('\n').slice(-15).join('\n');
        sock.sendMessage(remoteJid, { text: `Output:\n${output}` });
    });
}

function handleCustomCommand(command, remoteJid, sock) {
    const [subCommand, ...args] = command.split(' ');
    switch (subCommand) {
        case 'sysinfo':
            const sysInfo = {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                uptime: os.uptime(),
                totalMem: os.totalmem(),
                freeMem: os.freemem()
            };
            sock.sendMessage(remoteJid, { text: `System Info:\n${JSON.stringify(sysInfo, null, 2)}` });
            break;
        case 'listfiles':
            const dirPath = args[0] || '.';
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    sock.sendMessage(remoteJid, { text: `Error listing files: ${err.message}` });
                } else {
                    sock.sendMessage(remoteJid, { text: `Files in ${dirPath}:\n${files.join('\n')}` });
                }
            });
            break;
        case 'readfile':
            if (args.length === 0) {
                sock.sendMessage(remoteJid, { text: 'Please provide a file path' });
                return;
            }
            fs.readFile(args[0], 'utf8', (err, data) => {
                if (err) {
                    sock.sendMessage(remoteJid, { text: `Error reading file: ${err.message}` });
                } else {
                    sock.sendMessage(remoteJid, { text: `File contents:\n${data}` });
                }
            });
            break;
        case 'upload':
            sock.sendMessage(remoteJid, { text: 'Please send the file you want to upload.' });
            break;
        case 'download':
            if (args.length === 0) {
                sock.sendMessage(remoteJid, { text: 'Please provide a file path to download' });
                return;
            }
            const filePath = args[0];
            if (fs.existsSync(filePath)) {
                const fileName = path.basename(filePath);
                sock.sendMessage(remoteJid, { 
                    document: { url: filePath }, 
                    fileName: fileName,
                    mimetype: 'application/octet-stream'
                });
            } else {
                sock.sendMessage(remoteJid, { text: `File not found: ${filePath}` });
            }
            break;
        case 'netstat':
            exec('netstat -an', (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(remoteJid, { text: `Error: ${error.message}` });
                    return;
                }
                const connections = stdout.split('\n').filter(line => line.includes('ESTABLISHED')).join('\n');
                sock.sendMessage(remoteJid, { text: `Active connections:\n${connections}` });
            });
            break;
        case 'ping':
            if (args.length === 0) {
                sock.sendMessage(remoteJid, { text: 'Please provide a host to ping' });
                return;
            }
            exec(`ping -c 4 ${args[0]}`, (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(remoteJid, { text: `Error: ${error.message}` });
                    return;
                }
                sock.sendMessage(remoteJid, { text: stdout });
            });
            break;
        default:
            sock.sendMessage(remoteJid, { text: `Unknown custom command: ${subCommand}` });
    }
}

function handleMathOperation(expression, remoteJid, sock) {
    try {
        const result = eval(expression);
        sock.sendMessage(remoteJid, { text: `Result: ${result}` });
    } catch (error) {
        sock.sendMessage(remoteJid, { text: `Error evaluating expression: ${error.message}` });
    }
}

connectToWhatsApp();