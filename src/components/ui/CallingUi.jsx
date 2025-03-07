import React, { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users } from "lucide-react";
import UniversalTooltip from "./TooltipUniversal";
import { toast } from "@/hooks/use-toast";

const VideoCallScreen = memo(
  ({ local_video, participantsInCall, setParticipantsInCall, nameofUser, socket, roomID }) => {
    const videoRefs = useRef({});

    useEffect(() => {
      participantsInCall.forEach((participant) => {
        const videoElement = videoRefs.current[participant.name];
        if (!videoElement) return;

        const streamToUse = participant.name === nameofUser ? local_video : participant.stream;

        if (streamToUse && videoElement.srcObject !== streamToUse) {
          console.log(`Setting ${participant.name === nameofUser ? "local" : "remote"} stream for ${participant.name}`);
          videoElement.srcObject = streamToUse;
        }

        videoElement.volume = 0.7;
      });
    }, [participantsInCall, local_video, nameofUser]);

    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const toggleVideo = () => {
      if (local_video) {
        const videoTrack = local_video.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          setIsVideoEnabled(videoTrack.enabled);
          setParticipantsInCall((prev) =>
            prev.map((p) => (p.name === nameofUser ? { ...p, videoOn: videoTrack.enabled } : p))
          );

          socket.emit("mediaStateChange", {
            roomID,
            userName: nameofUser,
            enabled: videoTrack.enabled,
            mediaType: "video",
          });
        }
      }
    };

    const toggleAudio = () => {
      if (local_video) {
        const audioTrack = local_video.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          setIsAudioEnabled(audioTrack.enabled);
          setParticipantsInCall((prev) =>
            prev.map((p) => (p.name === nameofUser ? { ...p, micOn: audioTrack.enabled } : p))
          );

          socket.emit("mediaStateChange", {
            roomID,
            userName: nameofUser,
            enabled: audioTrack.enabled,
            mediaType: "audio",
          });
        }
      }
    };

    useEffect(() => {
      socket.on("userDisconnected", ({ name }) => {
        setParticipantsInCall((prev) => {
          const prevState = [...prev];
          console.log(prevState);

          return prevState.filter((i) => i.name !== name);
        });
        toast({
          title: `${name} left the call`,
        });
      });

      socket.on("mediaStateChanged", ({ userName, enabled, mediaType }) => {
        setParticipantsInCall((prev) =>
          prev.map((p) =>
            p.name === userName
              ? {
                  ...p,
                  [mediaType === "video" ? "videoOn" : "micOn"]: enabled,
                }
              : p
          )
        );
      });

      return () => {
        socket.off("userDisconnected");
        socket.off("mediaStateChanged");
      };
    }, []);

    const handleLeaveCall = () => {
      socket?.disconnect();
      window.location.href = "/";
    };

    return (
      <div className="flex h-screen bg-gray-950 text-gray-100 lg:w-full w-[90%]">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative p-4 lg:px-24">
            <div className="grid lg:grid-cols-2 lg:gap-4 gap-10 p-4 grid-cols-1">
              {participantsInCall.map((participant) => (
                <div key={participant.name} className="relative">
                  {participant.videoOn ? (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current[participant.name] = el;
                      }}
                      autoPlay
                      playsInline
                      muted={participant.name === nameofUser || participant.stream === local_video}
                      className="w-full lg:h-[363px] h-[200px] rounded-lg bg-gray-900 object-cover"
                    />
                  ) : (
                    <div className="w-full lg:h-[363px] h-[200px] rounded-lg bg-gray-900 flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                    {participant.name} {participant.name === nameofUser ? "(You)" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 flex justify-center gap-9 bg-gray-950 border-t-gray-700 border-t-[1px]">
            <UniversalTooltip
              trigger={
                <Button variant="destructive" size="icon" onClick={handleLeaveCall}>
                  <PhoneOff className="h-6 w-6" />
                </Button>
              }
              content={"Leave call"}
            />

            <div
              className="flex justify-center items-center border border-gray-600 p-2 rounded-md"
              onClick={toggleVideo}
            >
              <UniversalTooltip
                trigger={!isVideoEnabled ? <VideoOff className="h-6 w-5" /> : <Video className="h-5 w-6" />}
                content={`Turn video ${!isVideoEnabled ? "off" : "on"}`}
              />
            </div>
            <div
              className="flex justify-center items-center border border-gray-600 p-2 rounded-md"
              onClick={toggleAudio}
            >
              <UniversalTooltip
                trigger={!isAudioEnabled ? <MicOff className="h-6 5-6" /> : <Mic className="h-5 w-6" />}
                content={`Turn Audio ${!isAudioEnabled ? "off" : "on"}`}
              />
            </div>

            <ChatComponentForVC nameofUser={nameofUser} socket={socket} roomID={roomID} />
          </div>
        </div>
      </div>
    );
  }
);
VideoCallScreen.displayName = "VideoCallScreen";

export default VideoCallScreen;

const ChatComponentForVC = memo(({ nameofUser, socket, roomID }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMSG_Object = { user: nameofUser, message: newMessage };
      socket.emit("newMessageFromSender", { newMSG_Object, roomID });
      setMessages([...messages, newMSG_Object]);
      setNewMessage("");
    }
  };

  useEffect(() => {
    socket.on("newMessageFromReciever", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("newMessageFromReciever");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <Sheet modal={false}>
      <SheetTrigger>
        <UniversalTooltip
          trigger={
            <div className="flex justify-center items-center border border-gray-600 p-2 rounded-md hover:bg-gray-800 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
          }
          content="Send Message"
        />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 bg-gray-900 text-white border-l border-gray-700">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b border-gray-800 bg-gray-900">
            <SheetTitle className="text-white text-xl font-semibold">Chat</SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto px-4 py-2">
            {messages.map((msg, index) => (
              <div key={index} className={`flex mb-4 ${msg.user === nameofUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.user === nameofUser ? "bg-blue-800" : "bg-gray-900 border border-gray-700"
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                  {/* <div className="flex gap-1 items-center mt-1">
                    <span className="text-xs text-gray-300"> - {msg.user}</span>
                  </div> */}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="!border-gray-500 bg-black text-gray-100 flex md:h-10 h-9 w-full md:placeholder:text-sm placeholder:text-xs rounded-md border px-3 py-2 lg:text-base text-sm"
              />
              {/* <Button
              onClick={sendMessage}
              className="!bg-transparent border border-gray-600 rounded-md"
            >
              <Send className="!h-8 !w-[1.92rem] flex-shrink-0 text-white" />
            </Button> */}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

ChatComponentForVC.displayName = "chat-comp";
