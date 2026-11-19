import AgoraToken from 'agora-token';

const TOKEN_LIFETIME_SECONDS = 60 * 60;
const { RtcRole, RtcTokenBuilder } = AgoraToken;

export interface AgoraCallCredentials {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  expiresAt: string;
}

export class AgoraService {
  public static isConfigured(): boolean {
    return Boolean(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE);
  }

  public static createCallCredentials(consultationId: string, role: 'PATIENT' | 'DOCTOR'): AgoraCallCredentials {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials are not configured');
    }

    const channelId = consultationId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
    if (!channelId) {
      throw new Error('Invalid consultation ID for Agora channel');
    }

    const channelName = `ruralcare-${channelId}`;
    const uid = role === 'DOCTOR' ? 2 : 1;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      TOKEN_LIFETIME_SECONDS,
      TOKEN_LIFETIME_SECONDS
    );

    return {
      appId,
      channelName,
      token,
      uid,
      expiresAt: new Date(Date.now() + TOKEN_LIFETIME_SECONDS * 1000).toISOString()
    };
  }
}
