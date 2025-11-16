# MotiMates

Social accountability for better focus. Lock in together.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app (SDK 54) for physical device

## Context

MotiMates is a focus-management app designed for students who struggle with procrastination and staying focused while studying alone. The app is used when students want to work on assignments, study for exams, or complete any focused work with the support of peers.

### Primary Tasks

**Simple Task – Join a Focus Session**
Goal: Find a focus session and join it!
- Home → Tap Quick Start
- Quick Start → Choose duration + enter goal
- Show people who are studying
- Active Timer → Countdown begins (pause/stop available)
- End Summary → Review time + streak, optional reflection

**Moderate Task – Host a Focus Session**
Goal: Host a focus session and invite friends!
- Home → Host Focus Session
- Choose duration + enter goal
- Open Study Invite → Invite list of friends
- Start Session
- End Summary → Review time + streak, optional reflection

**Complex Task – Reject a Request to End Session**
Goal: Reject an alert to exit locked focus session (accessing distracting app / leaving session)
- Alert → "Friend is trying to access [distracting app]" / "Friend is trying to leave session"
- Review reason
- Unlock for friend → Hold 5s to confirm
- Reject unlock request

## Limitations

- Authentication system is not fully implemented (simulated login)
- Database is hard-coded with sample data rather than connected to a live backend
- Real-time synchronization between users is simulated
- Push notifications require additional platform-specific setup
- Session history displays placeholder data
- Analytics tracking is configured but not capturing real events yet

## Accessibility Considerations

- High contrast text and backgrounds for readability
- Poppins font family for clear legibility
- Minimum touch target sizes of 44x44 points
- Clear visual hierarchy with consistent heading sizes
- Simple navigation structure with tab-based layout

### Accessibility Limitations

- Screen reader support not yet implemented
- No alternative text for images
- Color is currently the only indicator for some states
- No dark mode support
- Haptic feedback not implemented
