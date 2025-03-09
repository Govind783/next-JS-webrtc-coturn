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

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293841/i1_oqf8ms.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293841/i2_hyd59l.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293841/i3_gupwfx.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293842/i4_dldzic.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293842/i5_jbueqa.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293843/i6_ktbmom.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293843/i8_yybmmh.png)

![](https://res.cloudinary.com/dbm0lqxsayooletsgognnnasdnasdn/image/upload/v1741293843/i7_ewe58i.png)

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

# Backend repo, OSS
- a simple flask app used as a signalling server to connect candidates and transmit basic info about ICE
[Backend repo](https://github.com/Govind783/flask-signalling-server-vc)

# Turn server config and details
- learn more the turn config, hosting coturn and traversing restrective NAT's
[Indepth guide](https://govindbuilds/blogs)

Do star the Repo 🌟