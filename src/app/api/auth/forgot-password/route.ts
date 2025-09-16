import { NextRequest, NextResponse } from "next/server";
import { PasswordResetService } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const token = await PasswordResetService.createResetToken(email);

    if (!token) {
      // Don't reveal if the email exists or not for security
      return NextResponse.json({
        message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi",
      });
    }

    // In a real application, you would send an email here
    // For now, we'll just return the reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    console.log(`Password reset requested for ${email}`);
    console.log(`Reset URL: ${resetUrl}`);

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: email,
    //   subject: "Şifre Sıfırlama İsteği",
    //   html: `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
    //          <p><a href="${resetUrl}">Şifreyi Sıfırla</a></p>
    //          <p>Bu bağlantı 24 saat geçerlidir.</p>`
    // });

    return NextResponse.json({
      message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi",
      // For development only - remove in production
      debugToken: process.env.NODE_ENV === "development" ? token : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}