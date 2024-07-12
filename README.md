# WhatsApp Terminal Control

This Node.js application allows you to control your computer's terminal remotely via WhatsApp messages. It's particularly useful when you don't have direct access to your machine but need to execute commands, retrieve information, or manage files.

## Features

- Execute terminal commands remotely
- Get system information
- List files in a directory
- Read file contents
- Perform mathematical operations
- Upload files to the server
- Download files from the server

## Prerequisites

- Node.js
- npm

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file and add your WhatsApp credentials (if required by the Baileys library)

## Usage

Run the script with:

```
node whatsapp-terminal-control.js
```

Scan the QR code with your WhatsApp to log in.

### Commands

- Terminal commands: Start with `$` (e.g., `$ ls -l`)
- Custom commands:
  - `/sysinfo`: Get system information
  - `/listfiles [path]`: List files in a directory
  - `/readfile [filepath]`: Read file contents
  - `/upload`: Prompt to upload a file
  - `/download [filepath]`: Download a file from the server
- Math operations: Start with `£` (e.g., `£ 2 + 2`)

### File Management

- To upload a file, send it directly through WhatsApp or use the `/upload` command and then send the file.
- To download a file, use `/download [filepath]` where `[filepath]` is the path to the file on the server.

## Security Warning

This tool provides remote access to your system and file management capabilities. Use it responsibly and ensure proper security measures are in place.

## Contributing

Feel free to fork this project and submit pull requests for improvements or additional features.

## License

[MIT License](LICENSE)

https://github.com/Zizwar/WhatsApp-Terminal-Control

![WhatsApp-Terminal-Control](https://raw.githubusercontent.com/Zizwar/WhatsApp-Terminal-Control/main/screen/image.png)

![WhatsApp-Terminal-Control](https://raw.githubusercontent.com/Zizwar/WhatsApp-Terminal-Control/main/screen/Screenshot_20240711-030455_WhatsApp.jpg)

![WhatsApp-Terminal-Control](https://raw.githubusercontent.com/Zizwar/WhatsApp-Terminal-Control/main/screen/Screenshot_20240711-153914_WhatsAppBusiness.jpg)