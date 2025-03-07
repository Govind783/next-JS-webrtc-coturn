# Next.js Video Calling Application

A secure, privacy-focused video calling application built with Next.js and WebRTC, featuring real-time chat and room management capabilities. with self hosted coturn on ec2.

## Features ✨

### Room Management
- Create public or password-protected rooms 
- Share room URLs with participants
- Set maximum participants per room
- Mesh architecture for peer-to-peer connections
- TODO: Implement SFU for better scalability

### Video & Audio Features
- Toggle audio and video streams anytime
- High-quality real-time video communication
- Instant notifications when participants leave
- Client-side only data processing - we never access your streams

### Chat Functionality 
- Real-time chat alongside video calls
- No message storage - complete privacy
- Instant message delivery

### Privacy & Security
- Client-side only data processing
- No storage of participant information
- No interception or access to audio/video streams
- No chat message persistence
- Optional password protection for rooms

### Tech stack
- Next JS
- shad CN
- tailwind
- raw web RTC API's
- socket-io
- flask as a simple signalling server and for socket
- EC2
- self hosted coturn

### UI/UX
- Dark mode support using shadcn
- Responsive design
- Intuitive controls
- Toast notifications for important events

---


## UI Preview 📸

![](https://github.com/user-attachments/assets/0293e75f-333f-4376-8ff5-fccaae0ab138)


![](https://github.com/user-attachments/assets/2cbf16d6-7c7f-41c4-9bf0-b74994d224f4)


![](https://github.com/user-attachments/assets/6ccbbcdd-be4d-43d2-9927-0b415a7d4904)


![](https://github.com/user-attachments/assets/283720b2-5ad9-4766-b848-ad80e9e59d04)


![](https://github.com/user-attachments/assets/577fc971-2c04-4b2d-a428-fbc64a090001)



![](https://github.com/user-attachments/assets/21b31f9a-991b-4cf0-8e7f-8f5fa1262508)


![](https://github.com/user-attachments/assets/648df3d4-7b52-4bb4-a939-07a02ec87262)


![](https://github.com/user-attachments/assets/d5ead8fe-fda8-4584-a939-cef1126a0f9c)

---

We take your privacy seriously:
- No storage of personal information
- No recording or interception of audio/video streams 
- No persistence of chat messages
- All communication is peer-to-peer
- No server-side processing of media streams



## TODO 
- the app follows a mesh architecture for connecting the calls which is decent for 3-4 people but does not scale so well and puts extreme load on the users device for  <4 people in a call, so implement SFU

- add screen sharing

## note
coturn helps with NAT, and we are able to by pass most NATs and ISP's! even the super strict ones in India. if you find the call not working on any specific ISP or behind a very specific nat of FW feel free to drop a message