import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, Heart, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'email' | 'otp';

export function LoginPage() {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { sendOTP, verifyOTP, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to continue."
      });
      return;
    }

    try {
      await sendOTP(email);
      setStep('otp');
      toast({
        title: "Verification code sent",
        description: `Check your email at ${email} for the verification code.`
      });
    } catch (error) {
      console.error('Send OTP error:', error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!otp) {
      toast({
        variant: "destructive",
        title: "Verification code required",
        description: "Please enter the verification code from your email."
      });
      return;
    }

    try {
      await verifyOTP(email, otp);
      toast({
        title: "Welcome to your Smart AI Diary!",
        description: "Your secure space for reflection and growth awaits.",
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    clearError();
  };

  return (
    <div className="min-h-screen diary-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <Heart className="w-8 h-8 text-accent emotional-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Smart AI Diary
          </h1>
          <p className="text-muted-foreground">
            Your personal space for reflection, growth, and emotional insights
          </p>
          <div className="flex items-center justify-center mt-3 gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Private • Secure • AI-Powered</span>
          </div>
        </div>

        <Card className="gentle-shadow border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {step === 'email' ? 'Begin Your Journey' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter your email to create your secure diary space'
                : `We sent a verification code to ${email}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'email' ? (
              <div key="email">
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      'Send verification code'
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div key="otp">
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="mt-1 text-center text-lg tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Enter diary'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToEmail}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Back to email
                  </Button>
                </form>
              </div>
            )}
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Your diary entries are encrypted and private.</p>
              <p>Only you can access your thoughts and memories.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}