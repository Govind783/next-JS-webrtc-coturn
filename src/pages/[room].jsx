"use client";

import { useState, useRef, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Camera, Loader2, Lock, RefreshCw, Settings } from "lucide-react";
import CryptoJS from "crypto-js";
import { useRouter } from "next/router";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { io } from "socket.io-client";
import VideoCallScreen from "@/components/ui/CallingUi";
import axios from "axios";
import { dekryptTurnUserAndPass } from "@/helpers";

const SIGNING_KEY = "8ieFzC7WvOzu1MW";
const backendDomain = "https://api-vc2.govindbuilds.com";
const decryptToken = (encryptedToken) => {
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedToken), SIGNING_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    return decryptedData;
  } catch (error) {
    console.error("Invalid token or decryption failed:", error);
    return null;
  }
};

const peerConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "stun:api-vc2.govindbuilds.com:3478",
    },
    {
      urls: "turn:api-vc2.govindbuilds.com:3478?transport=tcp",
      username: null,
      credential: null,
    },
    {
      urls: "turns:api-vc2.govindbuilds.com:5349",
      username: null,
      credential: null,
    },
  ],
};

export default function IndividualMeetingRoom() {
  const router = useRouter();
  const [stream, setStream] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userName, setUserName] = useState("");
  const [protectionStatus, setProtectionStatus] = useState({
    hasPassword: false, // false or the OTP
  });
  const [inputOTP, setInputOTP] = useState("");
  const [roomID, setRoomID] = useState();
  const [isInCall_OR_ON_PreCallUI, setIsInCall_OR_ON_PreCallUI] = useState(false);
  const [dekryptionFailed, setDekrypttionFailed] = useState(false);
  const [loadingForJoiningCall, setLoadingForJoiningCall] = useState(false);
  const [participantsInCall, setParticipantsInCall] = useState([]);
  const socketRef = useRef();
  const dekryptionKeyForCreds = useRef(null);
  const [secretMessage, setSecretMessage] = useState(
    "37zaSMVwMJgCunp0CZKnL19yTAUfPooUKw9DM8pYVFuPn5wZ12wzlxiwLnsK+d4HWg=="
  );
  const remoteVideoRef = useRef();
  const local_videoRef = useRef(null);
  const localUserNameRef = useRef(null);

  const peerConnectionRef = useRef();
  const peerConnectionsRef = useRef({});
  const pendingIceCandidates = useRef({});

  const requestMediaPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setStream(mediaStream);

      if (local_videoRef.current) {
        local_videoRef.current.srcObject = mediaStream;
      }
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setPermissionDenied(true);
    }
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("getDekryptionKeyAndMessage", ({ message, credsKey }) => {
        dekryptionKeyForCreds.current = credsKey;
      });
      socketRef.current.on("receiveOffer", async ({ offer, senderName, remoteUsersName }) => {
        await handleIncomingOffer({ offer, senderName, remoteUsersName });
      });

      socketRef.current.on("receiveAnswer", async ({ answer, senderName }) => {
        // 'senderName' is the remote user who created this answer
        const pc = peerConnectionsRef.current[senderName];
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processPendingCandidates(senderName);
        setIsInCall_OR_ON_PreCallUI(true);
      });

      socketRef.current.on("receiveIceCandidate", async ({ candidate, senderName }) => {
        const pc = peerConnectionsRef.current[senderName];
        if (!pc) {
          // if the peer connection doesn't exist yet, store the candidate for later
          if (!pendingIceCandidates.current[senderName]) {
            pendingIceCandidates.current[senderName] = [];
          }
          pendingIceCandidates.current[senderName].push(candidate);
        } else {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });
    }
  }, [socketRef.current]);

  useEffect(() => {
    if (router.query.room) setRoomID(router.query.room);
  }, [router.query]);

  useEffect(() => {
    if (roomID) {
      socketRef.current = io(backendDomain);

      return () => {
        socketRef.current?.disconnect();
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      };
    }
  }, [roomID]);

  const requestTurnCreds = async () => {
    try {
      const turnCreds = await axios.post(`${backendDomain}/get-creds`, {
        domain: window.location.hostname,
        message: secretMessage, 
      });
      return turnCreds.data;
    } catch (e) {
      toast({
        title: "Failed to load valid credentials",
      });
      setLoadingForJoiningCall(false);
      return null;
    }
  };

  const pingBackendToStartCallProcessAndTransferCreds = () => {
    return new Promise((resolve) => {
      socketRef.current.emit("request_call_credentials");
      resolve({ success: true });
    });
  };

  const handleJoin = async () => {
    if (!userName.trim()) {
      toast({
        title: "Please enter your name to join",
      });
      return;
    }

    if (protectionStatus.hasPassword) {
      if (protectionStatus.hasPassword !== inputOTP) {
        toast({
          title: "Wrong password, please try again",
        });
        return;
      }
    }

    if (!stream) {
      toast({
        title: "Please grant mic and camera access to join the call",
      });
      try {
        await requestMediaPermissions();
      } catch (e) {
        toast({
          title: "Permission for mic and vidoe not given",
        });
        return;
      }
    }
    setLoadingForJoiningCall(true);

    const gotCredsKeyAndMessage = await pingBackendToStartCallProcessAndTransferCreds();

    if (!gotCredsKeyAndMessage?.success) {
      setLoadingForJoiningCall(false);
      return toast({
        title: "Failed to communicate with turn server",
      });
    }
    const turnServerCreds = await requestTurnCreds();

    if (!(turnServerCreds.userName && turnServerCreds.password)) {
      return toast({
        title: "Failed to communicate with turn server",
      });
    }

    try {
      const dekryptedUserName = await dekryptTurnUserAndPass(turnServerCreds.userName, dekryptionKeyForCreds.current);
      const dekryptedPassword = await dekryptTurnUserAndPass(turnServerCreds.password, dekryptionKeyForCreds.current);
      if (!(dekryptedUserName || dekryptedPassword)) {
        return toast({
          title: "Failed to communicate with turn server",
        });
      }

      peerConfiguration.iceServers.forEach((server) => {
        if (server.username === null) server.username = dekryptedUserName;
        if (server.credential === null) server.credential = dekryptedPassword;
      });
    } catch (e) {
      toast({
        title: "Failed to dekrypt credientials",
      });
      setLoadingForJoiningCall(false);
      return;
    }
    const trimmedUserName = userName.trim().toLowerCase().replace(/ /g, "_");

    localUserNameRef.current = trimmedUserName;
    socketRef.current.emit(
      "basicInfoOFClientOnConnect",
      {
        roomID,
        name: trimmedUserName,
      },
      async (serverACK) => {
        if (serverACK.sameName) {
          toast({
            title: `A person named '${serverACK.existingName}' is already in the room. Please join with a different name.`,
          });
          setLoadingForJoiningCall(false);
          return;
        }
        if (serverACK.isFirstInTheCall && !serverACK.roomFull) {
          setParticipantsInCall((prev) => [...prev, { name: trimmedUserName, videoOn: true, micOn: true, stream }]);
          setIsInCall_OR_ON_PreCallUI(true);
        } else if (!serverACK.isFirstInTheCall && !serverACK.roomFull) {
          setParticipantsInCall((prev) => [...prev, { name: trimmedUserName, videoOn: true, micOn: true, stream }]);
          if (serverACK.existingUsers && serverACK.existingUsers.length > 0) {
            for (const remoteUser of serverACK.existingUsers) {
              await createAndSendOffer(remoteUser);
            }
          }
        } else if (serverACK.roomFull) {
          toast({
            title: "This room is already full",
          });
          setLoadingForJoiningCall(false);
          return;
        }
      }
    );
  };

  const createAndSendOffer = async (targetName) => {
    if (!peerConnectionsRef.current[targetName]) {
      peerConnectionsRef.current[targetName] = createPeerConnection(targetName);
    }
    const pc = peerConnectionsRef.current[targetName];

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);

      // one use at a time
      socketRef.current.emit("sendOffer", {
        offer,
        roomID,
        senderName: userName.trim().toLowerCase().replace(/ /g, "_"),
        targetName,
      });
    } catch (err) {
      // console.error("Error in createAndSendOffer:", err);
      toast({
        title: "Error in creating and sending offer",
      });
    }
  };

  useEffect(() => {
    if (router.isReady) {
      if (router.query && router.query?.token) {
        const enkryptedToken = router.query?.token;
        if (enkryptedToken) {
          const dekryptedToken = decryptToken(enkryptedToken);
          // possibe value has_password--1256 ( 1256 being the OTP ) || does_not_have_password
          if (dekryptedToken) {
            if (dekryptedToken.startsWith("has_password")) {
              const OTP = dekryptedToken.split("--")[1];
              setProtectionStatus({
                hasPassword: OTP || false,
              });
            }
          } else {
            setDekrypttionFailed(true);
          }
        }
      } else {
        setDekrypttionFailed(true);
        // toast({
        //   title: "Token not found"
        // })
        return;
      }
    }
  }, [router.query]);

  const createPeerConnection = (remoteUserName) => {
    const pc = new RTCPeerConnection(peerConfiguration);

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      const [incomingStream] = event.streams;

      setParticipantsInCall((prevList) => {
        const existing = prevList.find((p) => p.name === remoteUserName);
        if (!existing) {
          return [
            ...prevList,
            {
              name: remoteUserName,
              videoOn: true,
              micOn: true,
              stream: incomingStream,
            },
          ];
        }
        // If they're already in, update the stream
        return prevList.map((p) => (p.name === remoteUserName ? { ...p, stream: incomingStream } : p));
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // const candidate = event.candidate;
        // console.log(`ICE candidate (${remoteUserName}):`, {
        //   type: candidate.type,
        //   protocol: candidate.protocol,
        //   address: candidate.address,
        //   port: candidate.port,
        //   relatedAddress: candidate.relatedAddress,
        //   relatedPort: candidate.relatedPort,
        // });

        socketRef.current?.emit("sendIceCandidateToSignalingServer", {
          iceCandidate: event.candidate,
          roomID,
          senderName: localUserNameRef.current,
          targetName: remoteUserName,
        });
      } else {
        console.log(
          " this has to be NULLL the last packet after successful or failed ice transfer ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️",
          event.candidate
        );
      }
    };

    // pc.onicegatheringstatechange = () => {
    //   console.log("ICE gathering state:", pc.iceGatheringState);
    // };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      //   if (pc.connectionState === 'failed') {
      //     console.log('Connection failed details:', {
      //         iceState: pc.iceConnectionState,
      //         signalingState: pc.signalingState,
      //         connectionState: pc.connectionState
      //     });
      // }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    // pc.addEventListener("selectedcandidatepairchange", (event) => {
    //   const currentPair = pc.getSelectedCandidatePair();
    //   console.log("Selected candidate pair:", currentPair);
    // });
    return pc;
  };

  const handleIncomingOffer = async ({ offer, senderName, remoteUsersName }) => {
    if (!stream) {
      await requestMediaPermissions();
    }

    if (!peerConnectionsRef.current[senderName]) {
      peerConnectionsRef.current[senderName] = createPeerConnection(senderName);
    }
    const pc = peerConnectionsRef.current[senderName];

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates(senderName);

      // create ANSWER
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("sendAnswer", {
        answer,
        roomID,
        senderName: remoteUsersName, // your local name
        receiverName: senderName, // the original offerer/rmote dude
      });

      setIsInCall_OR_ON_PreCallUI(true);
    } catch (err) {
      console.error("Error in handleIncomingOffer:", err);
      toast({
        title: "failed to get WEB-RTC offer",
      });
      return;
    }
  };

  const processPendingCandidates = async (senderName) => {
    if (pendingIceCandidates.current[senderName]) {
      for (const candidate of pendingIceCandidates.current[senderName]) {
        await peerConnectionsRef.current[senderName].addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingIceCandidates.current[senderName] = [];
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      {isInCall_OR_ON_PreCallUI ? (
        <VideoCallScreen
          local_video={stream}
          participantsInCall={participantsInCall}
          setParticipantsInCall={setParticipantsInCall}
          nameofUser={userName}
          socket={socketRef.current}
          roomID={roomID}
        />
      ) : (
        <div className={`container mx-auto px-4 ${!stream ? "lg:px-56" : "lg:px-20"} py-8`}>
          <div className={`grid ${stream ? "lg:grid-cols-2 grid-cols-1" : "grid-cols-1"} gap-8`}>
            {/* Left Side */}
            <div className="border border-gray-600 p-6 rounded-lg flex flex-col items-center justify-center lg:min-h-[350px] min-h-[250px]">
              {!stream && !permissionDenied && (
                <div className="text-center">
                  <h2 className="text-xl mb-2">Grant mic and camera access</h2>
                  <p className="text-sm text-gray-500 w-[300px] mb-7">
                    We do not access your audio or video streams all data stays on your device.
                  </p>
                  <Button onClick={requestMediaPermissions} className="rounded-3xl px-7">
                    Grant Access
                  </Button>
                </div>
              )}

              {permissionDenied && <PermissionDenied />}

              {
                <video
                  ref={local_videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`rounded-lg ${
                    local_videoRef.current?.srcObject ? "w-full lg:h-[386px] h-[187px] block" : "hidden"
                  }`}
                />
              }
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full bg-black hidden" />
            </div>

            {stream && (
              <div className=" self-center p-6 rounded-lg flex lg:w-[450px] flex-col justify-self-center space-y-6">
                <h2 className="text-3xl font-semibold text-center">Ready to join</h2>
                <Input
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                  }}
                  className="!border-gray-700 text-white border"
                />
                {protectionStatus.hasPassword && (
                  <div className="flex items-center flex-col">
                    <InputOTP value={inputOTP} onChange={(e) => setInputOTP(e)} className="w-full !mt-4" maxLength={4}>
                      <InputOTPGroup className="govind gap-8 justify-center w-full">
                        <InputOTPSlot className="border !border-gray-500 rounded-md" index={0} />
                        <InputOTPSlot className="border !border-gray-500 rounded-md" index={1} />
                        <InputOTPSlot className="border !border-gray-500 rounded-md" index={2} />
                        <InputOTPSlot className="border !border-gray-500 rounded-md" index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="md:text-xs text-[11px] text-gray-500 mt-4">
                      this meeting is protected, Please enter the OTP to join
                    </p>
                  </div>
                )}
                <Button disabled={loadingForJoiningCall} onClick={handleJoin} className="rounded-3xl">
                  Join {loadingForJoiningCall && <Loader2 className="animate-spin w-4 h-4 ml-2" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <DecryptionFailedModal open={dekryptionFailed} setOpen={setDekrypttionFailed} />
    </div>
  );
}

const PermissionDenied = memo(() => {
  return (
    <div className="max-w-md mx-auto p-4 space-y-6 bg-gray-950 rounded-xl">
      <Alert variant="destructive" className="border-red-900/50 bg-red-950/50 border-2">
        <div className="flex text-white items-center gap-4 justify-center">
          <Camera className="h-5 w-5 " />
          <AlertTitle className="text-lg !mb-0 font-semibold">Camera and Mic Access Required</AlertTitle>
        </div>
      </Alert>

      <div className="rounded-lg p-2">
        <h3 className="text-lg font-medium text-gray-100 mb-4">Follow these steps to grant access:</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-md bg-gray-800/50 border border-gray-700/50 transition-all hover:bg-gray-800 hover:border-gray-700 group">
            <Lock className="h-5 w-5 '0" />
            <div>
              <p className="font-medium text-gray-100 group-hover:text-white">Click the lock icon</p>
              <p className="text-sm text-gray-400 group-hover:text-gray-300">
                Located in your browser&apos;s address bar
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md bg-gray-800/50 border border-gray-700/50 transition-all hover:bg-gray-800 hover:border-gray-700 group">
            <Settings className="h-5 w-5 '0" />
            <div>
              <p className="font-medium text-gray-100 group-hover:text-white">Open Site Settings</p>
              <p className="text-sm text-gray-400 group-hover:text-gray-300">Find Camera and Microphone permissions</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md bg-gray-800/50 border border-gray-700/50 transition-all hover:bg-gray-800 hover:border-gray-700 group">
            <Camera className="h-5 w-5 '0" />
            <div>
              <p className="font-medium text-gray-100 group-hover:text-white">Allow access</p>
              <p className="text-sm text-gray-400 group-hover:text-gray-300">Enable both camera and microphone</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md bg-gray-800/50 border border-gray-700/50 transition-all hover:bg-gray-800 hover:border-gray-700 group">
            <RefreshCw className="h-5 w-5 '0" />
            <div>
              <p className="font-medium text-gray-100 group-hover:text-white">Refresh the page</p>
              <p className="text-sm text-gray-400 group-hover:text-gray-300">Try your action again</p>
            </div>
          </div>
        </div>

        <Button onClick={() => window.location.reload()} className="mt-6 w-full  rounded-3xl">
          <RefreshCw className="h-4 w-4" />
          Refresh Now
        </Button>
      </div>
    </div>
  );
});
PermissionDenied.displayName = "PermissionDenied";

const DecryptionFailedModal = ({ open, setOpen }) => {
  return (
    <Dialog open={open}>
      <DialogTrigger></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>The Decryption has failed</DialogTitle>
          <DialogDescription>
            <p className="mt-5">
              You cannot join this meeting now with a failed token. Please ask the host to share a new link.
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
