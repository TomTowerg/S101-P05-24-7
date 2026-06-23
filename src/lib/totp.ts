import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export function generateTOTPSecret(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: "Loombox",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret(),
  });
  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export async function generateQRCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri);
}

export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: "Loombox",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
