import { Inter } from "next/font/google";
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Copy, Github, LockIcon, UnlockIcon, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import copy from "copy-to-clipboard";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

const SIGNING_KEY = "8ieFzC7WvOzu1MW";
// vercel test
export default function Home() {
  const [roomTitle, setRoomTitle] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [otp, setOtp] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generateRoom = () => {
    if (!roomTitle) {
      toast({
        title: "Please enter a room name",
      });
      return;
    }

    if (otp.length < 4 && isPasswordProtected) {
      toast({
        title: "Please enter a 4 digit OTP",
      });
      return;
    }
    const roomId = uuidv4();
    const protectionStatus = isPasswordProtected ? `has_password--${otp}` : "does_not_have_password";

    const encryptedToken = CryptoJS.AES.encrypt(protectionStatus, SIGNING_KEY).toString();
    const link = `${window.location.href}${roomId}?token=${encodeURIComponent(encryptedToken)}`;
    setGeneratedLink(link);
  };

  return (
    <div className={`min-h-screen bg-black p-4 ${inter.className}`}>
      <div className="min-h-[90vh] flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-900 text-gray-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create a Meeting Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="roomTitle">Room Name</Label>
              <input
                id="roomTitle"
                ref={inputRef}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="text-gray-100 flex h-10 w-full bg-black rounded-3xl border border-gray-500 px-3 pl-5 py-2 text-base ring-offset-white focus-visible:ring-neutral-300 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="passwordProtection"
                checked={isPasswordProtected}
                onCheckedChange={setIsPasswordProtected}
              />
              <div className="flex items-center space-x-2">
                <Label htmlFor="passwordProtection">Password Protected</Label>
                {isPasswordProtected ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
              </div>
            </div>

            {isPasswordProtected && (
              <div className="space-y-4">
                <InputOTP value={otp} onChange={(e) => setOtp(e)} className="w-full !mt-4" maxLength={4}>
                  <InputOTPGroup className="govind gap-8 justify-center w-full">
                    <InputOTPSlot className="border !border-gray-500 rounded-md" index={0} />
                    <InputOTPSlot className="border !border-gray-500 rounded-md" index={1} />
                    <InputOTPSlot className="border !border-gray-500 rounded-md" index={2} />
                    <InputOTPSlot className="border !border-gray-500 rounded-md" index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
            <Button onClick={generateRoom} className="w-full rounded-3xl">
              Generate Room
            </Button>
            {generatedLink && (
              <div className="pt-4 flex items-center gap-2">
                <p className="w-[23rem] whitespace-nowrap overflow-hidden mr-4">{generatedLink}</p>
                <Copy
                  className="cursor-pointer"
                  onClick={() => {
                    copy(generatedLink);
                    toast({
                      title: "Copied successfully!",
                    });
                  }}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className='md:!p-6 !p-0'>
            <div className="p-0 w-full">
              <div className="md:text-sm text-[13px] p-4 md:p-0 text-slate-400/85 w-full">
                All data stays on your device. There&apos;s no server involved. we do &quot;NOT&quot; access your
                <li className="mt-1">video streams</li>
                <li>audio streams</li>
                <li>store any messages</li>
                <li>or intercept any web rtc offers</li>
                <li className="mb-1">
                  The code is{" "}
                  <Link
                    href={"https://github.com/Govind783/nextjs-video-call-and-chat"}
                    target="_blank"
                    className="mx-[2px] underline"
                  >
                    open source
                  </Link>
                </li>
                Feel free to inspect the network tab :)
              </div>

              <div className="mt-8 md:flex-row flex-col flex w-full mb-5 md:mb-0 justify-between gap-2 items-center">
                <Button className="flex-1 w-[90%] rounded-3xl" variant="outline">
                  <Link className="flex items-center gap-2" href={"https://github.com/Govind783/nextjs-video-call-and-chat"} target="_blank">
                    View On Github
                    <Github />
                  </Link>
                </Button>
                <Button className="flex-1 w-[90%] rounded-3xl" variant="outline">
                  <Link className="flex items-center gap-2" href={"https://govindbuilds.com"} target="_blank">
                    Developed By
                    <User />
                  </Link>
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
