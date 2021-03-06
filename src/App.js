import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState } from 'react';
import SignUp from './frontPage';

const App = () => {
    const apiRef = useRef();
    const [ logItems, updateLog ] = useState([]);
    const [ showNew, toggleShowNew ] = useState(false);
    const [ knockingParticipants, updateKnockingParticipants ] = useState([]);
    const [form, setForm] = useState({
        subject: "", pass: ""
    })

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        
        setForm((prev) => ({...prev,
            subject: data.get('subject'),
            pass: data.get('pass')
        }))

        window.history.pushState(form, "jitsi", "/rem-jitsi/jitsi")
      };

    const printEventOutput = payload => {
        updateLog(items => [ ...items, JSON.stringify(payload) ]);
    };

    const handleAudioStatusChange = (payload, feature) => {
        if (payload.muted) {
            updateLog(items => [ ...items, `${feature} off` ])
        } else {
            updateLog(items => [ ...items, `${feature} on` ])
        }
    };

    const handleChatUpdates = payload => {
        if (payload.isOpen || !payload.unreadCount) {
            return;
        }
        apiRef.current.executeCommand('toggleChat');
        updateLog(items => [ ...items, `you have ${payload.unreadCount} unread messages` ])
    };

    const handleKnockingParticipant = payload => {
        updateLog(items => [ ...items, JSON.stringify(payload) ]);
        updateKnockingParticipants(participants => [ ...participants, payload?.participant ])
    };

    const resolveKnockingParticipants = condition => {
        knockingParticipants.forEach(participant => {
            apiRef.current.executeCommand('answerKnockingParticipant', participant?.id, condition(participant));
            updateKnockingParticipants(participants => participants.filter(item => item.id === participant.id));
        });
    };

    const handleJitsiIFrameRef1 = iframeRef => {
        iframeRef.style.border = '10px solid #3d3d3d';
        iframeRef.style.background = '#3d3d3d';
        iframeRef.style.height = '400px';
    };

    const handleJitsiIFrameRef2 = iframeRef => {
        iframeRef.style.marginTop = '10px';
        iframeRef.style.border = '10px dashed #df486f';
        iframeRef.style.padding = '5px';
        iframeRef.style.height = '400px';
    };

    const handleApiReady = apiObj => {
        apiRef.current = apiObj;
        apiRef.current.on('knockingParticipant', handleKnockingParticipant);
        apiRef.current.addEventListeners({
            // Listening to events from the external API
            audioMuteStatusChanged: payload => handleAudioStatusChange(payload, 'audio'),
            videoMuteStatusChanged: payload => handleAudioStatusChange(payload, 'video'),
            raiseHandUpdated: printEventOutput,
            tileViewChanged: printEventOutput,
            chatUpdated: handleChatUpdates,
            knockingParticipant: handleKnockingParticipant
        });

        apiRef.current.addEventListener('participantRoleChanged', function(event) {
            if (event.role === "moderator") {
                apiRef.current.executeCommand('password', form.pass);
            }
        })

        apiRef.current.on('passwordRequired', function () {
            apiRef.current.executeCommand('password', form.pass);
        })
    };

    const handleReadyToClose = () => {
        window.history.pushState("", "jitsi", "/rem-jitsi/")
        window.location.reload()
    };

    const generateRoomName = () => `JitsiMeetRoomNo${Math.random() * 100}-${Date.now()}`;

    // Multiple instances demo
    const renderNewInstance = () => {
        if (!showNew) {
            return null;
        }

        return (
            <JitsiMeeting
                roomName = { generateRoomName() }
                getIFrameRef = { handleJitsiIFrameRef2 } />
        );
    };

    const renderButtons = () => (
        <div style = {{ margin: '15px 0' }}>
            <div style = {{
                display: 'flex',
                justifyContent: 'center'
            }}>
                <button
                    type = 'text'
                    title = 'Click to execute toggle raise hand command'
                    style = {{
                        border: 0,
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: '#f8ae1a',
                        color: '#040404',
                        padding: '12px 46px',
                        margin: '2px 2px'
                    }}
                    onClick = { () => apiRef.current.executeCommand('toggleRaiseHand') }>
                    Raise hand
                </button>
                <button
                    type = 'text'
                    title = 'Click to approve/reject knocking participant'
                    style = {{
                        border: 0,
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: '#0056E0',
                        color: 'white',
                        padding: '12px 46px',
                        margin: '2px 2px'
                    }}
                    onClick = { () => resolveKnockingParticipants(({ name }) => !name.includes('test')) }>
                    Resolve lobby
                </button>
                <button
                    type = 'text'
                    title = 'Click to execute subject command'
                    style = {{
                        border: 0,
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: '#df486f',
                        color: 'white',
                        padding: '12px 46px',
                        margin: '2px 2px'
                    }}
                    onClick = { () => apiRef.current.executeCommand('subject', 'New Subject')}>
                    Change subject
                </button>
                <button
                    type = 'text'
                    title = 'Click to create a new JitsiMeeting instance'
                    style = {{
                        border: 0,
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: '#3D3D3D',
                        color: 'white',
                        padding: '12px 46px',
                        margin: '2px 2px'
                    }}
                    onClick = { () => toggleShowNew(!showNew) }>
                    Toggle new instance
                </button>
            </div>
        </div>
    );

    const renderLog = () => logItems.map(
        (item, index) => (
            <div
                style = {{
                    fontFamily: 'monospace',
                    padding: '5px'
                }}
                key = { index }>
                {item}
            </div>
        )
    );

    const renderSpinner = () => (
        <div style = {{
            fontFamily: 'sans-serif',
            textAlign: 'center'
        }}>
            Loading..
        </div>
    );

    const showFront = () => {
        if (window.location.pathname === "/rem-jitsi/") {
            return <SignUp handleSubmit={handleSubmit} />
        }
    }

    const showJitsi = () => {
        if (window.location.pathname === "/rem-jitsi/jitsi") {
            return (
                <JitsiMeeting
                roomName = { generateRoomName() }
                spinner = { renderSpinner }
                config = {{
                    subject: form.subject,
                    hideConferenceSubject: false
                }}
                configOverwrite={{
                    openSharedDocumentOnJoin: true
                }}
                onApiReady = { externalApi => handleApiReady(externalApi) }
                onReadyToClose = { handleReadyToClose }
                getIFrameRef = { handleJitsiIFrameRef1 } />
            )
        }
    }


    return (
        <>
            <h1 style = {{
                fontFamily: 'sans-serif',
                textAlign: 'center'
            }}>
                JitsiMeeting Demo App
            </h1>
            <div>
                {showJitsi()}
            </div>
            {window.location.pathname === "/rem-jitsi/jitsi" && renderButtons()}
            {window.location.pathname === "/rem-jitsi/jitsi" && renderNewInstance()}
            {window.location.pathname === "/rem-jitsi//jitsi" && renderLog()}
            <div>
                {showFront()}
            </div>
        </>
    );
};

export default App;