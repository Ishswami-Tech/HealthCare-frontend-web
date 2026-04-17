"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, Smartphone, CheckCircle2 } from "lucide-react";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import PhoneInput from "@/components/ui/phone-input";

export function PhoneOtpRegisterForm() {
  const { requestOTP, verifyOTP, isRequestingOTP, isVerifyingOTP } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
        showErrorToast("Please enter a valid phone number");
        return;
    }
    try {
        await requestOTP({ identifier: phone, isRegistration: true });
        setStep(2);
    } catch (error) {
        // Error handling is managed by the mutation hook
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
        showErrorToast("Please enter a valid OTP");
        return;
    }
    if (!firstName || !lastName) {
        showErrorToast("Please enter your full name");
        return;
    }
    
    try {
        await verifyOTP({
            identifier: phone,
            otp,
            isRegistration: true,
            firstName,
            lastName
        });
    } catch (error) {
        // Error handling
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={handleRequestOtp} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            disabled={isRequestingOTP}
          />
        </div>
        <Button 
            className="w-full" 
            type="submit" 
            disabled={isRequestingOTP}
        >
            {isRequestingOTP ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Smartphone className="mr-2 h-4 w-4" />
            )}
            Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4 pt-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Enter OTP</Label>
           <div className="flex justify-center">
            <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                disabled={isVerifyingOTP}
            >
                <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            We sent a code to your phone
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isVerifyingOTP}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isVerifyingOTP}
                    required
                />
            </div>
        </div>
      </div>

       <div className="flex gap-2">
        <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            disabled={isVerifyingOTP}
            type="button"
            className="w-1/3"
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Button 
            className="w-2/3" 
            type="submit"
            disabled={isVerifyingOTP}
        >
            {isVerifyingOTP ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Verify & Register
        </Button>
      </div>
    </form>
  );
}
