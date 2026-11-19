import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { ApiService } from '../services/api';

type AgoraRtcSdk = typeof import('agora-rtc-sdk-ng').default;

export type AgoraCallStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export function useAgoraCall(
  consultationId: string,
  initialVideoEnabled = true
) {
  const [status, setStatus] = useState<AgoraCallStatus>('DISCONNECTED');
  const [error, setError] = useState<string | null>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideoEnabled);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<IRemoteVideoTrack | null>(null);
  const rtcSdkRef = useRef<AgoraRtcSdk | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const microphoneTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);

  useEffect(() => {
    if (!consultationId || consultationId === 'CONS-DEFAULT') return;

    let cancelled = false;
    let client: IAgoraRTCClient | null = null;
    let microphoneTrack: IMicrophoneAudioTrack | null = null;
    let cameraTrack: ICameraVideoTrack | null = null;

    const handleUserPublished = async (
      user: IAgoraRTCRemoteUser,
      mediaType: 'audio' | 'video' | 'datachannel'
    ) => {
      if (!client || mediaType === 'datachannel') return;
      try {
        await client.subscribe(user, mediaType);
        if (cancelled) return;
        if (mediaType === 'video' && user.videoTrack) {
          setRemoteVideoTrack(user.videoTrack);
        } else if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      } catch (joinError) {
        console.error('[Agora] Failed to subscribe to participant media:', joinError);
        if (!cancelled) setError('Could not connect to the other participant’s media.');
      }
    };

    const handleUserUnpublished = (
      user: IAgoraRTCRemoteUser,
      mediaType: 'audio' | 'video' | 'datachannel'
    ) => {
      if (mediaType === 'video' && user.videoTrack) {
        user.videoTrack.stop();
        setRemoteVideoTrack(null);
      }
      if (mediaType === 'audio') user.audioTrack?.stop();
    };

    const handleUserLeft = () => {
      setRemoteVideoTrack(null);
    };

    async function joinCall() {
      setStatus('CONNECTING');
      setError(null);
      setIsVideoEnabled(initialVideoEnabled);

      try {
        const response = await ApiService.getAgoraCallCredentials(consultationId);
        const credentials = response.credentials;
        if (!response.success || !credentials) {
          throw new Error(response.message || 'Could not get secure Agora call credentials.');
        }
        if (cancelled) return;

        const agoraModule = await import('agora-rtc-sdk-ng');
        if (cancelled) return;
        const AgoraRTC = agoraModule.default;
        rtcSdkRef.current = AgoraRTC;
        client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-left', handleUserLeft);

        await client.join(
          credentials.appId,
          credentials.channelName,
          credentials.token,
          credentials.uid
        );
        if (cancelled) {
          await client.leave();
          return;
        }

        microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
        if (cancelled) {
          microphoneTrack.close();
          await client.leave();
          return;
        }
        microphoneTrackRef.current = microphoneTrack;
        await client.publish(microphoneTrack);

        if (initialVideoEnabled) {
          cameraTrack = await AgoraRTC.createCameraVideoTrack();
          if (cancelled) {
            cameraTrack.close();
            microphoneTrack.close();
            await client.leave();
            return;
          }
          cameraTrackRef.current = cameraTrack;
          setLocalVideoTrack(cameraTrack);
          await client.publish(cameraTrack);
        }

        if (!cancelled) setStatus('CONNECTED');
      } catch (joinError) {
        if (!cancelled) {
          console.error('[Agora] Failed to join consultation:', joinError);
          setError(joinError instanceof Error ? joinError.message : 'Unable to join the Agora call.');
          setStatus('ERROR');
        }
        cameraTrack?.close();
        microphoneTrack?.close();
        if (client && client.connectionState !== 'DISCONNECTED') {
          try {
            await client.leave();
          } catch (leaveError) {
            console.error('[Agora] Failed to leave after a join error:', leaveError);
          }
        }
      }
    }

    void joinCall();

    return () => {
      cancelled = true;
      setStatus('DISCONNECTED');
      setError(null);
      setLocalVideoTrack(null);
      setRemoteVideoTrack(null);
      rtcSdkRef.current = null;
      clientRef.current = null;
      cameraTrackRef.current = null;
      microphoneTrackRef.current = null;
      cameraTrack?.close();
      microphoneTrack?.close();
      if (client) {
        client.off('user-published', handleUserPublished);
        client.off('user-unpublished', handleUserUnpublished);
        client.off('user-left', handleUserLeft);
        if (client.connectionState !== 'DISCONNECTED') {
          void client.leave().catch((leaveError) => {
            console.error('[Agora] Failed to leave consultation:', leaveError);
          });
        }
      }
    };
  }, [consultationId, initialVideoEnabled]);

  const toggleMicrophone = useCallback(async () => {
    const track = microphoneTrackRef.current;
    if (!track || status !== 'CONNECTED') return;

    try {
      const enabled = !isMicrophoneEnabled;
      await track.setEnabled(enabled);
      setIsMicrophoneEnabled(enabled);
    } catch (toggleError) {
      console.error('[Agora] Failed to toggle microphone:', toggleError);
      setError('Could not change the microphone setting.');
    }
  }, [isMicrophoneEnabled, status]);

  const toggleVideo = useCallback(async () => {
    const client = clientRef.current;
    const AgoraRTC = rtcSdkRef.current;
    if (!client || !AgoraRTC || status !== 'CONNECTED') return;

    try {
      if (cameraTrackRef.current) {
        const enabled = !isVideoEnabled;
        await cameraTrackRef.current.setEnabled(enabled);
        setIsVideoEnabled(enabled);
        return;
      }

      const track = await AgoraRTC.createCameraVideoTrack();
      await client.publish(track);
      cameraTrackRef.current = track;
      setLocalVideoTrack(track);
      setIsVideoEnabled(true);
    } catch (toggleError) {
      console.error('[Agora] Failed to toggle camera:', toggleError);
      setError('Could not change the camera setting.');
    }
  }, [isVideoEnabled, status]);

  return {
    status,
    error,
    isMicrophoneEnabled,
    isVideoEnabled,
    localVideoTrack,
    remoteVideoTrack,
    toggleMicrophone,
    toggleVideo,
  };
}
