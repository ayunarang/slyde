import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../Context/SocketProvider.jsx';

const VideoChat = () => {
    const { room } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef(null);
    const [isCaller, setIsCaller] = useState(false);
    const [isRemoteDescriptionSet, setIsRemoteDescriptionSet] = useState(false);
    const pendingICECandidates = useRef([]);

    useEffect(() => {
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:global.stun.twilio.com:3478",
                    ]
                }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { candidate: event.candidate, room });
            }
        };

        pc.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnectionRef.current = pc;

        socket.on('offer', async ({ sdp }) => {
            console.log('Received offer');
            if (peerConnectionRef.current.signalingState === 'stable' || peerConnectionRef.current.signalingState === 'have-local-offer') {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                    setIsRemoteDescriptionSet(true);
                    const answer = await peerConnectionRef.current.createAnswer();
                    await peerConnectionRef.current.setLocalDescription(answer);
                    socket.emit('answer', { sdp: answer, room });
                } catch (error) {
                    console.error('Error setting remote description for offer:', error);
                }
            } else {
                console.error('Cannot set remote offer in state:', peerConnectionRef.current.signalingState);
            }
        });

        socket.on('answer', async ({ sdp }) => {
            console.log('Received answer');
            if (peerConnectionRef.current.signalingState === 'have-local-offer') {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                } catch (error) {
                    console.error('Error setting remote description for answer:', error);
                }
            } else {
                console.error('Cannot set remote answer in state:', peerConnectionRef.current.signalingState);
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (peerConnectionRef.current.signalingState === 'closed') {
                console.error('Cannot add ICE candidate in state:', peerConnectionRef.current.signalingState);
                return;
            }
            if (peerConnectionRef.current.remoteDescription) {
                try {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                } catch (error) {
                    console.error('Error adding received ice candidate', error);
                }
            } else {
                console.log('Storing ICE candidate as remote description is not yet set');
                pendingICECandidates.current.push(candidate);
            }
        });

        socket.on('disconnect-call', handleDisconnect);

        const getUserMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach(track => {
                        if (peerConnectionRef.current.signalingState !== 'closed') {
                            peerConnectionRef.current.addTrack(track, stream);
                        }
                    });
                }
            } catch (error) {
                console.error('Error accessing media devices.', error);
            }
        };

        getUserMedia();

        return () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                const tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                localVideoRef.current.srcObject = null;
            }
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                const tracks = remoteVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                remoteVideoRef.current.srcObject = null;
            }
            socket.off('disconnect-call', handleDisconnect);
        };
    }, [room, socket]);

    useEffect(() => {
        if (isRemoteDescriptionSet) {
            while (pendingICECandidates.current.length) {
                const candidate = pendingICECandidates.current.shift();
                peerConnectionRef.current.addIceCandidate(candidate).catch(error => {
                    console.error('Error adding stored ICE candidate', error);
                });
            }
        }
    }, [isRemoteDescriptionSet]);

    const handleCall = async () => {
        setIsCaller(true);
        if (peerConnectionRef.current.signalingState === 'stable') {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            socket.emit('offer', { sdp: offer, room });
        } else {
            console.error('Cannot create offer in state:', peerConnectionRef.current.signalingState);
        }
    };

    const handleDisconnect = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        socket.emit('disconnect-call', { room });

        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            const tracks = remoteVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            remoteVideoRef.current.srcObject = null;
        }
        if(peerConnectionRef.current === null && localVideoRef.current.srcObject===null && remoteVideoRef.current.srcObject===null){
        navigate('/');

        }
    };
    

    return (
        <div>
            <video ref={localVideoRef} autoPlay muted />
            <video ref={remoteVideoRef} autoPlay />
            <button onClick={handleCall}>Call</button>
            <button onClick={handleDisconnect}>Disconnect</button>
        </div>
    );
};

export default VideoChat;
