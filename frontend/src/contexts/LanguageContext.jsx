import { createContext, useContext, useMemo, useState } from 'react';

const translations = {
  en: {
    language: 'Language', english: 'English', spanish: 'Spanish', french: 'French', portuguese: 'Portuguese', german: 'German', dutch: 'Dutch', twi: 'Twi',
    welcomeBack: 'Welcome back', createAccount: 'Create your account', username: 'Username', email: 'Email', password: 'Password',
    login: 'Log in', register: 'Register', noAccount: 'No account yet?', haveAccount: 'Already have an account?',
    registrationFailed: 'Registration failed', loginFailed: 'Login failed', friends: 'Friends', settings: 'Settings', logout: 'Log out',
    search: 'Search', clearSearch: 'Clear search', searching: 'Searching...', noFriendsFound: 'No friends found',
    loadingFriends: 'Loading friends...', noConversations: 'No conversations yet — search a username above to start chatting.',
    selectFriend: 'Select a friend on the left to start chatting.', startConversation: 'Start a conversation', newMessage: 'New message',
    typing: 'typing...', lastSeen: 'last seen', openChat: 'Open chat from your', friendsList: 'friends list',
    loadingConversation: 'Loading conversation...', sayHi: 'Say hi to {username}!', typeMessage: 'Type a message...', stopRecording: 'Stop recording',
    recordVoice: 'Record voice', voiceReady: 'Voice note ready ({duration}s)', audioUnsupported: 'Your browser does not support audio playback.',
    sending: 'Sending...', send: 'Send', voiceUploadFailed: 'Voice upload failed. Try again.', voiceUnsupported: 'Voice recording is not supported in this browser.',
    microphoneDenied: 'Microphone permission denied or unavailable.', profile: 'Profile', appearance: 'Appearance', security: 'Security',
    onlineFriends: '{count} friends online • © Steve', uploadAvatar: 'Upload Avatar', uploading: 'Uploading...', preview: 'preview',
    onlyImages: 'Only PNG, JPEG, JPG allowed.', maxFile: 'Max 3MB.', avatarUploaded: 'Avatar uploaded. Click Save to apply.', avatarUploadFailed: 'Avatar upload failed.',
    saveChanges: 'Save changes', saving: 'Saving...', cancel: 'Cancel', avatarUrl: 'Avatar URL', autoFilled: '(auto-filled after upload)',
    currentPassword: 'Current password', newPassword: 'New password', requiredPassword: 'Required only to change password', minPassword: 'Min 6 chars',
    changePassword: 'Change Password', updatePassword: 'Update password', theme: 'Theme', themeDescription: 'Switch between light and dark. Your choice is saved.',
    onlineStatus: 'Online status', onlineDescription: 'Let friends see you are online via WebSocket', activeOnline: 'Active • {count} online',
    profileUpdated: 'Profile updated!', updateFailed: 'Update failed', usernameMin: 'Username must be at least 3 chars.',
    enterCurrent: 'Enter current password to set new password.', crafted: 'Crafted with', allRights: 'All rights reserved.',
    product: 'Product', features: 'Features', support: 'Support', helpCenter: 'Help Center', privacy: 'Privacy', terms: 'Terms', stayConnected: 'Stay connected',
    connectTagline: 'Connect instantly. Chat securely.', friendshipTagline: 'Built for real friendships.',
    toggleTheme: 'Toggle theme', sharedPhoto: 'Shared photo', voiceMessage: 'Voice message', photo: 'Photo', uploadPhoto: 'Upload photo', sendPhoto: 'Send photo', photoReady: 'Photo ready', photoUploadFailed: 'Photo upload failed. Try again.', onlyImagesAllowed: 'Only PNG, JPEG, JPG, WEBP, and GIF images are allowed.', maxImageSize: 'Maximum image size is 10MB.',
    online: 'Online', busy: 'Busy', offline: 'Offline', myStatus: 'My Status', statusOnline: 'Online (Available)', statusBusy: 'Busy (Do Not Disturb)', statusOffline: 'Offline (Invisible)',
    startVoiceCall: 'Start voice call', startVideoCall: 'Start video call', incomingVoiceCall: 'Incoming voice call', incomingVideoCall: 'Incoming video call', voiceCall: 'Voice call', videoCall: 'Video call', ringing: 'Ringing...', calling: 'Calling...', callMissed: 'Missed call', callCompleted: 'Call ended', accept: 'Accept', decline: 'Decline', endCall: 'End call', callError: 'Unable to access the microphone or camera.', acceptCallError: 'Unable to accept this call.', connectionError: 'The call connection failed.', mute: 'Mute microphone', unmute: 'Unmute microphone', turnCameraOff: 'Turn off camera', turnCameraOn: 'Turn on camera', switchCamera: 'Flip camera',
    chats: 'Chats', noChats: 'No chats yet', noChatsDesc: 'Search a username above to start chatting.',
    calls: 'Calls', noCalls: 'No calls yet', noCallsDesc: 'Your recent voice and video calls will appear here.', missed: 'Missed', received: 'Received', outgoing: 'Outgoing', allCalls: 'All', missedCalls: 'Missed', newCall: 'New Call',
    installApp: 'Install GioChat', installAppDesc: 'Install on your home screen for fast access and fullscreen calling.', install: 'Install',
    continueWithGoogle: 'Continue with Google', or: 'OR'
  },
  de: {
    language: 'Sprache', english: 'Englisch', spanish: 'Spanisch', french: 'Französisch', portuguese: 'Portugiesisch', german: 'Deutsch', dutch: 'Niederländisch', twi: 'Twi',
    welcomeBack: 'Willkommen zurück', createAccount: 'Konto erstellen', username: 'Benutzername', email: 'E-Mail', password: 'Passwort',
    login: 'Anmelden', register: 'Registrieren', noAccount: 'Noch kein Konto?', haveAccount: 'Bereits ein Konto?',
    registrationFailed: 'Registrierung fehlgeschlagen', loginFailed: 'Anmeldung fehlgeschlagen', friends: 'Freunde', settings: 'Einstellungen', logout: 'Abmelden',
    search: 'Suchen', clearSearch: 'Suche löschen', searching: 'Suche läuft...', noFriendsFound: 'Keine Freunde gefunden',
    loadingFriends: 'Freunde werden geladen...', noConversations: 'Noch keine Chats. Suche oben nach einem Benutzernamen.',
    selectFriend: 'Wähle links einen Freund aus, um zu chatten.', startConversation: 'Gespräch beginnen', newMessage: 'Neue Nachricht',
    typing: 'schreibt...', lastSeen: 'zuletzt online', openChat: 'Öffne einen Chat aus deiner', friendsList: 'Freundesliste',
    loadingConversation: 'Chat wird geladen...', sayHi: 'Sag Hallo zu {username}!', typeMessage: 'Nachricht schreiben...', stopRecording: 'Aufnahme stoppen',
    recordVoice: 'Sprachnachricht aufnehmen', voiceReady: 'Sprachnachricht bereit ({duration}s)', audioUnsupported: 'Dein Browser unterstützt keine Audiowiedergabe.',
    sending: 'Senden...', send: 'Senden', voiceUploadFailed: 'Sprachnachricht konnte nicht gesendet werden.', voiceUnsupported: 'Sprachaufnahme wird nicht unterstützt.',
    microphoneDenied: 'Mikrofonzugriff verweigert.', profile: 'Profil', appearance: 'Erscheinungsbild', security: 'Sicherheit',
    onlineFriends: '{count} Freunde online • © Steve', uploadAvatar: 'Profilbild hochladen', uploading: 'Wird hochgeladen...', preview: 'Vorschau',
    onlyImages: 'Nur PNG, JPEG und JPG erlaubt.', maxFile: 'Max. 3 MB.', avatarUploaded: 'Profilbild hochgeladen. Klicke auf Speichern.', avatarUploadFailed: 'Hochladen fehlgeschlagen.',
    saveChanges: 'Änderungen speichern', saving: 'Wird gespeichert...', cancel: 'Abbrechen', avatarUrl: 'Profilbild URL', autoFilled: '(nach Upload automatisch ausgefüllt)',
    currentPassword: 'Aktuelles Passwort', newPassword: 'Neues Passwort', requiredPassword: 'Nur zum Ändern des Passworts erforderlich', minPassword: 'Mind. 6 Zeichen',
    changePassword: 'Passwort ändern', updatePassword: 'Passwort aktualisieren', theme: 'Design', themeDescription: 'Zwischen Hell und Dunkel wechseln.',
    onlineStatus: 'Online-Status', onlineDescription: 'Freunden zeigen, dass du online bist', activeOnline: 'Aktiv • {count} online',
    profileUpdated: 'Profil aktualisiert!', updateFailed: 'Aktualisierung fehlgeschlagen', usernameMin: 'Benutzername muss mindestens 3 Zeichen lang sein.',
    enterCurrent: 'Aktuelles Passwort eingeben, um ein neues festzulegen.', crafted: 'Mit Liebe gemacht von', allRights: 'Alle Rechte vorbehalten.',
    product: 'Produkt', features: 'Funktionen', support: 'Hilfe', helpCenter: 'Hilfecenter', privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', stayConnected: 'In Verbindung bleiben',
    connectTagline: 'Sofort verbinden. Sicher chatten.', friendshipTagline: 'Gemacht für echte Freundschaften.',
    toggleTheme: 'Design wechseln', sharedPhoto: 'Geteiltes Foto', voiceMessage: 'Sprachnachricht', photo: 'Foto', uploadPhoto: 'Foto hochladen', sendPhoto: 'Foto senden', photoReady: 'Foto bereit', photoUploadFailed: 'Foto-Upload fehlgeschlagen.', onlyImagesAllowed: 'Nur PNG, JPEG, JPG, WEBP und GIF erlaubt.', maxImageSize: 'Maximale Bildgröße ist 10MB.',
    online: 'Online', busy: 'Beschäftigt', offline: 'Offline', myStatus: 'Mein Status', statusOnline: 'Online (Verfügbar)', statusBusy: 'Beschäftigt (Nicht stören)', statusOffline: 'Offline (Unsichtbar)',
    startVoiceCall: 'Sprachanruf starten', startVideoCall: 'Videoanruf starten', incomingVoiceCall: 'Eingehender Sprachanruf', incomingVideoCall: 'Eingehender Videoanruf', voiceCall: 'Sprachanruf', videoCall: 'Videoanruf', ringing: 'Klingelt...', calling: 'Ruft an...', callMissed: 'Verpasster Anruf', callCompleted: 'Anruf beendet', accept: 'Annehmen', decline: 'Ablehnen', endCall: 'Auflegen', callError: 'Kein Zugriff auf Mikrofon oder Kamera.', acceptCallError: 'Anruf konnte nicht angenommen werden.', connectionError: 'Verbindungsfehler beim Anruf.', mute: 'Stummschalten', unmute: 'Stummschaltung aufheben', turnCameraOff: 'Kamera ausschalten', turnCameraOn: 'Kamera einschalten', switchCamera: 'Kamera wechseln',
    chats: 'Chats', noChats: 'Noch keine Chats', noChatsDesc: 'Suche oben nach einem Namen, um zu chatten.',
    calls: 'Anrufe', noCalls: 'Noch keine Anrufe', noCallsDesc: 'Hier erscheinen deine letzten Sprachanrufe und Videoanrufe.', missed: 'Verpasst', received: 'Empfangen', outgoing: 'Ausgehend', allCalls: 'Alle', missedCalls: 'Verpasst', newCall: 'Neuer Anruf',
    installApp: 'GioChat installieren', installAppDesc: 'Auf dem Startbildschirm installieren für schnellen Zugriff.', install: 'Installieren',
    continueWithGoogle: 'Mit Google fortfahren', or: 'ODER'
  },
  nl: {
    language: 'Taal', english: 'Engels', spanish: 'Spaans', french: 'Frans', portuguese: 'Portugees', german: 'Duits', dutch: 'Nederlands', twi: 'Twi',
    welcomeBack: 'Welkom terug', createAccount: 'Account aanmaken', username: 'Gebruikersnaam', email: 'E-mail', password: 'Wachtwoord',
    login: 'Inloggen', register: 'Registreren', noAccount: 'Nog geen account?', haveAccount: 'Heb je al een account?',
    registrationFailed: 'Registratie mislukt', loginFailed: 'Inloggen mislukt', friends: 'Vrienden', settings: 'Instellingen', logout: 'Uitloggen',
    search: 'Zoeken', clearSearch: 'Zoekopdracht wissen', searching: 'Zoeken...', noFriendsFound: 'Geen vrienden gevonden',
    loadingFriends: 'Vrienden laden...', noConversations: 'Nog geen gesprekken. Zoek hierboven een gebruikersnaam.',
    selectFriend: 'Selecteer links een vriend om te chatten.', startConversation: 'Start een gesprek', newMessage: 'Nieuw bericht',
    typing: 'typt...', lastSeen: 'laatst gezien', openChat: 'Open chat vanuit je', friendsList: 'vriendenlijst',
    loadingConversation: 'Gesprek laden...', sayHi: 'Zeg hallo tegen {username}!', typeMessage: 'Typ een bericht...', stopRecording: 'Stop opname',
    recordVoice: 'Spraakbericht opnemen', voiceReady: 'Spraakbericht klaar ({duration}s)', audioUnsupported: 'Je browser ondersteunt geen audio.',
    sending: 'Verzenden...', send: 'Verzend', voiceUploadFailed: 'Verzenden van spraakbericht mislukt.', voiceUnsupported: 'Spraakopname wordt niet ondersteund.',
    microphoneDenied: 'Microfoontoegang geweigerd.', profile: 'Profiel', appearance: 'Weergave', security: 'Beveiliging',
    onlineFriends: '{count} vrienden online • © Steve', uploadAvatar: 'Avatar uploaden', uploading: 'Uploaden...', preview: 'voorbeeld',
    onlyImages: 'Alleen PNG, JPEG en JPG toegestaan.', maxFile: 'Max. 3 MB.', avatarUploaded: 'Avatar geüpload. Klik op Opslaan.', avatarUploadFailed: 'Uploaden van avatar mislukt.',
    saveChanges: 'Wijzigingen opslaan', saving: 'Opslaan...', cancel: 'Annuleren', avatarUrl: 'Avatar URL', autoFilled: '(automatisch ingevuld na upload)',
    currentPassword: 'Huidig wachtwoord', newPassword: 'Nieuw wachtwoord', requiredPassword: 'Alleen nodig om wachtwoord te wijzigen', minPassword: 'Min. 6 tekens',
    changePassword: 'Wachtwoord wijzigen', updatePassword: 'Wachtwoord bijwerken', theme: 'Thema', themeDescription: 'Wissel tussen licht en donker.',
    onlineStatus: 'Online status', onlineDescription: 'Laat vrienden zien dat je online bent', activeOnline: 'Actief • {count} online',
    profileUpdated: 'Profiel bijgewerkt!', updateFailed: 'Bijwerken mislukt', usernameMin: 'Gebruikersnaam moet minimaal 3 tekens zijn.',
    enterCurrent: 'Voer huidig wachtwoord in om een nieuw wachtwoord in te stellen.', crafted: 'Gemaakt met', allRights: 'Alle rechten voorbehouden.',
    product: 'Product', features: 'Functies', support: 'Ondersteuning', helpCenter: 'Helpcentrum', privacy: 'Privacy', terms: 'Voorwaarden', stayConnected: 'Blijf verbonden',
    connectTagline: 'Direct verbinden. Veilig chatten.', friendshipTagline: 'Gemaakt voor echte vriendschappen.',
    toggleTheme: 'Thema wisselen', sharedPhoto: 'Gedeelde foto', voiceMessage: 'Spraakbericht', photo: 'Foto', uploadPhoto: 'Foto uploaden', sendPhoto: 'Foto versturen', photoReady: 'Foto klaar', photoUploadFailed: 'Foto uploaden mislukt.', onlyImagesAllowed: 'Alleen PNG, JPEG, JPG, WEBP en GIF toegestaan.', maxImageSize: 'Maximale afbeeldingsgrootte is 10MB.',
    online: 'Online', busy: 'Bezet', offline: 'Offline', myStatus: 'Mijn status', statusOnline: 'Online (Beschikbaar)', statusBusy: 'Bezet (Niet storen)', statusOffline: 'Offline (Onzichtbaar)',
    startVoiceCall: 'Spraakoproep starten', startVideoCall: 'Video-oproep starten', incomingVoiceCall: 'Inkomende spraakoproep', incomingVideoCall: 'Inkomende video-oproep', voiceCall: 'Spraakoproep', videoCall: 'Video-oproep', ringing: 'Gaat over...', calling: 'Bellen...', callMissed: 'Gemiste oproep', callCompleted: 'Oproep beëindigd', accept: 'Aannemen', decline: 'Weigeren', endCall: 'Ophangen', callError: 'Geen toegang tot microfoon of camera.', acceptCallError: 'Kan oproep niet aannemen.', connectionError: 'Verbindingsfout.', mute: 'Dempen', unmute: 'Dempen opheffen', turnCameraOff: 'Camera uitschakelen', turnCameraOn: 'Camera inschakelen', switchCamera: 'Camera wisselen',
    chats: 'Chats', noChats: 'Nog geen chats', noChatsDesc: 'Zoek hierboven een gebruiker om te chatten.',
    calls: 'Oproepen', noCalls: 'Nog geen oproepen', noCallsDesc: 'Je recente spraak- en video-oproepen verschijnen hier.', missed: 'Gemist', received: 'Ontvangen', outgoing: 'Uitgaand', allCalls: 'Alles', missedCalls: 'Gemist', newCall: 'Nieuwe oproep',
    installApp: 'GioChat installeren', installAppDesc: 'Installeer op je startscherm voor snelle toegang.', install: 'Installeren',
    continueWithGoogle: 'Doorgaan met Google', or: 'OF'
  },
  tw: {
    language: 'Kasa', english: 'Borɔfo', spanish: 'Spanish', french: 'Franse', portuguese: 'Portuguese', german: 'German', dutch: 'Dutch', twi: 'Twi',
    welcomeBack: 'Akwaaba bio', createAccount: 'Bɔ wo akontaa', username: 'Din / Handle', email: 'Imeel', password: 'Ahyɛnsodeɛ',
    login: 'Wura mu', register: 'Kyerɛw wo din', noAccount: 'Wonni akontaa?', haveAccount: 'Wowɔ akontaa dada?',
    registrationFailed: 'Nkyerɛwee no antumi anyɛ yie', loginFailed: 'Wontumi anwura mu', friends: 'Nnamfonom', settings: 'Nsesamu', logout: 'Pue',
    search: 'Hwehwɛ', clearSearch: 'Popa hwehwɛ', searching: 'Ɛrehwehwɛ...', noFriendsFound: 'Nnamfo biara nni hɔ',
    loadingFriends: 'Ɛrelod nnamfo...', noConversations: 'Nkitahodi biara nni hɔ — Hwehwɛ obi din wɔ atifi.',
    selectFriend: 'Paw adamfo wɔ benkum so na wo ne no nkasa.', startConversation: 'Hyɛ nkɔmmɔbɔ ase', newMessage: 'Nkrasɛm foforɔ',
    typing: 'ɛrekyerɛw...', lastSeen: 'bere a otwa to a ɔbae', openChat: 'Bue nkɔmmɔbɔ fi wo', friendsList: 'nnamfo din mu',
    loadingConversation: 'Ɛrebue nkrasɛm...', sayHi: 'Kyea {username}!', typeMessage: 'Kyerɛw nkrasɛm...', stopRecording: 'Gyae nneɛma a worekɔ so',
    recordVoice: 'Kyere wo nne', voiceReady: 'Nne no ayɛ krado ({duration}s)', audioUnsupported: 'Wo braosa no nntumi nni nne yi.',
    sending: 'Ɛrekɔ...', send: 'Mane', voiceUploadFailed: 'Nne no antumi ankɔ. Sɔ hwɛ bio.', voiceUnsupported: 'Nne kyere nni ha.',
    microphoneDenied: 'Wommma kwan mma maekrofon no.', profile: 'Wo ho nsɛm', appearance: 'Ahosuo', security: 'Bambɔ',
    onlineFriends: 'Nnamfo {count} na wɔwɔ intanɛt so • © Steve', uploadAvatar: 'Fa mfonyin gu so', uploading: 'Ɛregu so...', preview: 'hwɛ anim',
    onlyImages: 'PNG, JPEG ne JPG nkutoo na wɔpene so.', maxFile: 'Ɛnsene 3MB.', avatarUploaded: 'Mfonyin no akɔ so. Klike Save.', avatarUploadFailed: 'Mfonyin no antumi ankɔ so.',
    saveChanges: 'Sie nsesamu', saving: 'Ɛresie...', cancel: 'Twa mu', avatarUrl: 'Mfonyin URL', autoFilled: '(ɛbɛba no ara bere a wode agu so no)',
    currentPassword: 'Ahyɛnsodeɛ a wowɔ mprempren', newPassword: 'Ahyɛnsodeɛ foforɔ', requiredPassword: 'Sɛ worebɛsesa ahyɛnsodeɛ nkoaa na ɛhia', minPassword: 'Nkyerɛwdeɛ 6 anaa nea ɛboro saa',
    changePassword: 'Sesa Ahyɛnsodeɛ', updatePassword: 'Yɛ ahyɛnsodeɛ foforɔ', theme: 'Ahosuo', themeDescription: 'Sesa kɔ kanea anaa sum mu.',
    onlineStatus: 'Intanɛt gyinabea', onlineDescription: 'Ma nnamfo nhu sɛ wowɔ intanɛt so', activeOnline: 'Wɔwɔ so • {count} na wɔwɔ so',
    profileUpdated: 'Wo nsesamu no ayɛ yie!', updateFailed: 'Antumi anyɛ yie', usernameMin: 'Din no nsua nsen nkyerɛwdeɛ 3.',
    enterCurrent: 'Fa wo ahyɛnsodeɛ dada no gu mu ansa na woatumi asesa.', crafted: 'Yɛde ɔdɔ na ɛyɛe', allRights: 'Hwee nni hɔ a obi betumi afa a yɛmma no kwan.',
    product: 'Adeyɛ', features: 'Nneɛma a ɛwɔ mu', support: 'Mmoa', helpCenter: 'Mmoa Bea', privacy: 'Kokoamsɛm', terms: 'Mmara', stayConnected: 'Kɔ so tena ha',
    connectTagline: 'Kasa ntɛm. Kasa wɔ ahotɔ mu.', friendshipTagline: 'Yɛyɛe ma nnamfofa amapa.',
    toggleTheme: 'Sesa ahosuo', sharedPhoto: 'Mfonyin a wɔde ama', voiceMessage: 'Nne nkrasɛm', photo: 'Mfonyin', uploadPhoto: 'Fa mfonyin gu so', sendPhoto: 'Mane mfonyin', photoReady: 'Mfonyin no ayɛ krado', photoUploadFailed: 'Mfonyin no antumi ankɔ. Sɔ hwɛ bio.', onlyImagesAllowed: 'PNG, JPEG, JPG, WEBP ne GIF nkutoo na wɔpene so.', maxImageSize: 'Mfonyin kɛseɛ no nnsene 10MB.',
    online: 'Wɔ so', busy: 'Mprenpren meyɛ adwuma', offline: 'Menni so', myStatus: 'Me Gyinabea', statusOnline: 'Mewɔ so (Mewɔ hɔ)', statusBusy: 'Meyɛ adwuma (Mpopa me)', statusOffline: 'Menni so (Kokoam)',
    startVoiceCall: 'Frɛ no nne nkoaa', startVideoCall: 'Frɛ no video', incomingVoiceCall: 'Nne frɛ foforɔ reba', incomingVideoCall: 'Video frɛ foforɔ reba', voiceCall: 'Nne Frɛ', videoCall: 'Video Frɛ', ringing: 'Ɛrebɔ...', calling: 'Ɛrefrɛ...', callMissed: 'Frɛ a woantumi annye', callCompleted: 'Frɛ no aba awiei', accept: 'Gye', decline: 'Po', endCall: 'Gyae frɛ', callError: 'Wontumi nnya maekrofon anaa kamera.', acceptCallError: 'Wontumi nnye frɛ yi.', connectionError: 'Nkabom no antumi anyɛ yie.', mute: 'Duru maekrofon no', unmute: 'Bue maekrofon no', turnCameraOff: 'Duru kamera no', turnCameraOn: 'Sɔ kamera no', switchCamera: 'Sesa kamera no anim',
    chats: 'Nkɔmmɔ', noChats: 'Nkɔmmɔ biara nni ha', noChatsDesc: 'Hwehwɛ obi din wɔ atifi na wo ne no nkasa.',
    calls: 'Frɛ ahoro', noCalls: 'Frɛ biara nni ha mprempren', noCallsDesc: 'Wo nne ne video frɛ a otwa to no bɛba ha.', missed: 'Wompenee so', received: 'Wogyee', outgoing: 'Wode kɔe', allCalls: 'Ne nyinaa', missedCalls: 'Nea antumi annye', newCall: 'Frɛ Foforɔ',
    installApp: 'Fa GioChat gu wo fon so', installAppDesc: 'Fa gu wo skrin so na woatumi akasa ntɛm.', install: 'Fa gu so',
    continueWithGoogle: 'Fa Google kɔ so', or: 'ANAA'
  },
  es: {
    language: 'Idioma', english: 'Inglés', spanish: 'Español', french: 'Francés', portuguese: 'Portugués', german: 'Alemán', dutch: 'Holandés', twi: 'Twi',
    welcomeBack: 'Bienvenido de nuevo', createAccount: 'Crea tu cuenta', username: 'Nombre de usuario', email: 'Correo electrónico', password: 'Contraseña',
    login: 'Iniciar sesión', register: 'Registrarse', noAccount: '¿Aún no tienes una cuenta?', haveAccount: '¿Ya tienes una cuenta?',
    registrationFailed: 'Registro fallido', loginFailed: 'Inicio de sesión fallido', friends: 'Amigos', settings: 'Configuración', logout: 'Cerrar sesión',
    search: 'Buscar', clearSearch: 'Borrar búsqueda', searching: 'Buscando...', noFriendsFound: 'No se encontraron amigos',
    loadingFriends: 'Cargando amigos...', noConversations: 'Aún no hay conversaciones. Busca un nombre de usuario arriba para comenzar a chatear.',
    selectFriend: 'Selecciona un amigo a la izquierda para comenzar a chatear.', startConversation: 'Iniciar una conversación', newMessage: 'Nuevo mensaje',
    typing: 'escribiendo...', lastSeen: 'última vez', openChat: 'Abre un chat desde tu', friendsList: 'lista de amigos',
    loadingConversation: 'Cargando conversación...', sayHi: '¡Saluda a {username}!', typeMessage: 'Escribe un mensaje...', stopRecording: 'Detener grabación',
    recordVoice: 'Grabar voz', voiceReady: 'Nota de voz lista ({duration}s)', audioUnsupported: 'Tu navegador no admite la reproducción de audio.',
    sending: 'Enviando...', send: 'Enviar', voiceUploadFailed: 'No se pudo subir la voz. Inténtalo de nuevo.', voiceUnsupported: 'La grabación de voz no es compatible con este navegador.',
    microphoneDenied: 'Permiso del micrófono denegado o no disponible.', profile: 'Perfil', appearance: 'Apariencia', security: 'Seguridad',
    onlineFriends: '{count} amigos conectados • © Steve', uploadAvatar: 'Subir avatar', uploading: 'Subiendo...', preview: 'vista previa',
    onlyImages: 'Solo se permiten PNG, JPEG y JPG.', maxFile: 'Máximo 3 MB.', avatarUploaded: 'Avatar subido. Pulsa Guardar para aplicarlo.', avatarUploadFailed: 'No se pudo subir el avatar.',
    saveChanges: 'Guardar cambios', saving: 'Guardando...', cancel: 'Cancelar', avatarUrl: 'URL del avatar', autoFilled: '(se completa tras subirlo)',
    currentPassword: 'Contraseña actual', newPassword: 'Nueva contraseña', requiredPassword: 'Solo se necesita para cambiar la contraseña', minPassword: 'Mínimo 6 caracteres',
    changePassword: 'Cambiar contraseña', updatePassword: 'Actualizar contraseña', theme: 'Tema', themeDescription: 'Cambia entre claro y oscuro. Tu elección se guarda.',
    onlineStatus: 'Estado en línea', onlineDescription: 'Permite que tus amigos vean que estás conectado mediante WebSocket', activeOnline: 'Activo • {count} conectados',
    profileUpdated: '¡Perfil actualizado!', updateFailed: 'No se pudo actualizar', usernameMin: 'El nombre de usuario debe tener al menos 3 caracteres.',
    enterCurrent: 'Introduce la contraseña actual para establecer una nueva.', crafted: 'Creado con', allRights: 'Todos los derechos reservados.',
    product: 'Producto', features: 'Funciones', support: 'Soporte', helpCenter: 'Centro de ayuda', privacy: 'Privacidad', terms: 'Términos', stayConnected: 'Mantente conectado',
    connectTagline: 'Conecta al instante. Chatea con seguridad.', friendshipTagline: 'Creado para amistades reales.',
    toggleTheme: 'Cambiar tema', sharedPhoto: 'Foto compartida', voiceMessage: 'Mensaje de voz', photo: 'Foto', uploadPhoto: 'Subir foto', sendPhoto: 'Enviar foto', photoReady: 'Foto lista', photoUploadFailed: 'Error al subir la foto. Inténtalo de nuevo.', onlyImagesAllowed: 'Solo se permiten imágenes PNG, JPEG, JPG, WEBP y GIF.', maxImageSize: 'El tamaño máximo de imagen es 10MB.',
    online: 'En línea', busy: 'Ocupado', offline: 'Desconectado', myStatus: 'Mi estado', statusOnline: 'En línea (Disponible)', statusBusy: 'Ocupado (No molestar)', statusOffline: 'Desconectado (Invisible)',
    startVoiceCall: 'Iniciar llamada de voz', startVideoCall: 'Iniciar videollamada', incomingVoiceCall: 'Llamada de voz entrante', incomingVideoCall: 'Videollamada entrante', voiceCall: 'Llamada de voz', videoCall: 'Videollamada', ringing: 'Sonando...', calling: 'Llamando...', callMissed: 'Llamada perdida', callCompleted: 'Llamada finalizada', accept: 'Aceptar', decline: 'Rechazar', endCall: 'Finalizar', callError: 'No se pudo acceder al micrófono o cámara.', acceptCallError: 'No se pudo aceptar esta llamada.', connectionError: 'Error en la conexión de la llamada.', mute: 'Silenciar micrófono', unmute: 'Activar micrófono', turnCameraOff: 'Apagar cámara', turnCameraOn: 'Encender cámara', switchCamera: 'Cambiar cámara',
    chats: 'Chats', noChats: 'Aún no hay chats', noChatsDesc: 'Busca un usuario arriba para comenzar a chatear.',
    calls: 'Llamadas', noCalls: 'Aún no hay llamadas', noCallsDesc: 'Tus llamadas de voz y video recientes aparecerán aquí.', missed: 'Perdida', received: 'Recibida', outgoing: 'Saliente', allCalls: 'Todas', missedCalls: 'Perdidas', newCall: 'Nueva llamada',
    installApp: 'Instalar GioChat', installAppDesc: 'Instala en tu pantalla de inicio para acceso rápido y llamadas a pantalla completa.', install: 'Instalar',
    continueWithGoogle: 'Continuar con Google', or: 'O'
  },
  fr: {
    language: 'Langue', english: 'Anglais', spanish: 'Espagnol', french: 'Français', portuguese: 'Português', german: 'Allemand', dutch: 'Néerlandais', twi: 'Twi',
    welcomeBack: 'Bon retour', createAccount: 'Créez votre compte', username: "Nom d'utilisateur", email: 'E-mail', password: 'Mot de passe',
    login: 'Se connecter', register: "S'inscrire", noAccount: "Pas encore de compte ?", haveAccount: 'Vous avez déjà un compte ?',
    registrationFailed: "Échec de l'inscription", loginFailed: 'Échec de la connexion', friends: 'Amis', settings: 'Paramètres', logout: 'Se déconnecter',
    search: 'Rechercher', clearSearch: 'Effacer la recherche', searching: 'Recherche...', noFriendsFound: 'Aucun ami trouvé',
    loadingFriends: 'Chargement des amis...', noConversations: 'Aucune conversation. Recherchez un nom d’utilisateur ci-dessus pour commencer.',
    selectFriend: 'Sélectionnez un ami à gauche pour commencer à discuter.', startConversation: 'Commencer une conversation', newMessage: 'Nouveau message',
    typing: 'écrit...', lastSeen: 'vu récemment', openChat: 'Ouvrez une discussion depuis votre', friendsList: "liste d'amis",
    loadingConversation: 'Chargement de la conversation...', sayHi: 'Dites bonjour à {username} !', typeMessage: 'Écrivez un message...', stopRecording: "Arrêter l'enregistrement",
    recordVoice: 'Enregistrer un message vocal', voiceReady: 'Note vocale prête ({duration}s)', audioUnsupported: "Votre navigateur ne prend pas en charge la lecture audio.",
    sending: 'Envoi...', send: 'Envoyer', voiceUploadFailed: "Échec de l'envoi vocal. Réessayez.", voiceUnsupported: "L'enregistrement vocal n'est pas pris en charge.",
    microphoneDenied: 'Permission du microphone refusée ou indisponible.', profile: 'Profil', appearance: 'Apparence', security: 'Sécurité',
    onlineFriends: '{count} amis en ligne • © Steve', uploadAvatar: "Télécharger l'avatar", uploading: 'Téléchargement...', preview: 'aperçu',
    onlyImages: 'Seuls PNG, JPEG et JPG sont autorisés.', maxFile: 'Max 3 Mo.', avatarUploaded: "Avatar téléchargé. Cliquez sur Enregistrer pour l'appliquer.", avatarUploadFailed: "Échec du téléchargement de l'avatar.",
    saveChanges: 'Enregistrer', saving: 'Enregistrement...', cancel: 'Annuler', avatarUrl: "URL de l'avatar", autoFilled: '(remplie après téléchargement)',
    currentPassword: 'Mot de passe actuel', newPassword: 'Nouveau mot de passe', requiredPassword: 'Requis uniquement pour changer le mot de passe', minPassword: '6 caractères minimum',
    changePassword: 'Changer le mot de passe', updatePassword: 'Mettre à jour le mot de passe', theme: 'Thème', themeDescription: 'Passez du clair au sombre. Votre choix est enregistré.',
    onlineStatus: 'Statut en ligne', onlineDescription: 'Permettez à vos amis de voir que vous êtes en ligne via WebSocket', activeOnline: 'Actif • {count} en ligne',
    profileUpdated: 'Profil mis à jour !', updateFailed: 'Échec de la mise à jour', usernameMin: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    enterCurrent: 'Saisissez le mot de passe actuel pour en définir un nouveau.', crafted: 'Créé avec', allRights: 'Tous droits réservés.',
    product: 'Produit', features: 'Fonctionnalités', support: 'Assistance', helpCenter: "Centre d'aide", privacy: 'Confidentialité', terms: 'Conditions', stayConnected: 'Restez connecté',
    connectTagline: 'Connectez-vous instantanément. Discutez en toute sécurité.', friendshipTagline: 'Conçu pour de vraies amitiés.',
    toggleTheme: 'Changer de thème', sharedPhoto: 'Photo partagée', voiceMessage: 'Message vocal', photo: 'Photo', uploadPhoto: 'Télécharger photo', sendPhoto: 'Envoyer photo', photoReady: 'Photo prête', photoUploadFailed: 'Échec du téléchargement de la photo. Réessayez.', onlyImagesAllowed: 'Seules les images PNG, JPEG, JPG, WEBP et GIF sont autorisées.', maxImageSize: "La taille maximale de l'image est de 10 Mo.",
    online: 'En ligne', busy: 'Occupé', offline: 'Hors ligne', myStatus: 'Mon statut', statusOnline: 'En ligne (Disponible)', statusBusy: 'Occupé (Ne pas déranger)', statusOffline: 'Hors ligne (Invisible)',
    startVoiceCall: 'Démarrer appel vocal', startVideoCall: 'Démarrer appel vidéo', incomingVoiceCall: 'Appel vocal entrant', incomingVideoCall: 'Appel vidéo entrant', voiceCall: 'Appel vocal', videoCall: 'Appel vidéo', ringing: 'Sonnerie...', calling: 'Appel en cours...', callMissed: 'Appel manqué', callCompleted: 'Appel terminé', accept: 'Accepter', decline: 'Refuser', endCall: 'Raccrocher', callError: 'Impossible d’accéder au micro ou à la caméra.', acceptCallError: 'Impossible d’accepter cet appel.', connectionError: 'La connexion de l’appel a échoué.', mute: 'Couper micro', unmute: 'Activer micro', turnCameraOff: 'Couper caméra', turnCameraOn: 'Activer caméra', switchCamera: 'Changer de caméra',
    chats: 'Discussions', noChats: 'Aucune discussion', noChatsDesc: 'Recherchez un utilisateur ci-dessus pour commencer à discuter.',
    calls: 'Appels', noCalls: 'Aucun appel pour le moment', noCallsDesc: 'Vos appels vocaux et vidéo récents apparaîtront ici.', missed: 'Manqué', received: 'Reçu', outgoing: 'Sortant', allCalls: 'Tous', missedCalls: 'Manqués', newCall: 'Nouvel appel',
    installApp: 'Installer GioChat', installAppDesc: 'Installez sur votre écran d’accueil pour un accès rapide et des appels plein écran.', install: 'Installer',
    continueWithGoogle: 'Continuer avec Google', or: 'OU'
  },
  pt: {
    language: 'Idioma', english: 'Inglês', spanish: 'Espanhol', french: 'Francês', portuguese: 'Português', german: 'Alemão', dutch: 'Holandês', twi: 'Twi',
    welcomeBack: 'Bem-vindo de volta', createAccount: 'Crie sua conta', username: 'Nome de usuário', email: 'E-mail', password: 'Senha',
    login: 'Entrar', register: 'Cadastrar', noAccount: 'Ainda não tem uma conta?', haveAccount: 'Já tem uma conta?',
    registrationFailed: 'Falha no cadastro', loginFailed: 'Falha ao entrar', friends: 'Amigos', settings: 'Configurações', logout: 'Sair',
    search: 'Pesquisar', clearSearch: 'Limpar pesquisa', searching: 'Pesquisando...', noFriendsFound: 'Nenhum amigo encontrado',
    loadingFriends: 'Carregando amigos...', noConversations: 'Ainda não há conversas. Pesquise um nome de usuário acima para começar a conversar.',
    selectFriend: 'Selecione um amigo à esquerda para começar a conversar.', startConversation: 'Iniciar uma conversa', newMessage: 'Nova mensagem',
    typing: 'digitando...', lastSeen: 'visto por último', openChat: 'Abra uma conversa pela sua', friendsList: 'lista de amigos',
    loadingConversation: 'Carregando conversa...', sayHi: 'Diga oi para {username}!', typeMessage: 'Digite uma mensagem...', stopRecording: 'Parar gravação',
    recordVoice: 'Gravar voz', voiceReady: 'Nota de voz pronta ({duration}s)', audioUnsupported: 'Seu navegador não suporta reprodução de áudio.',
    sending: 'Enviando...', send: 'Enviar', voiceUploadFailed: 'Falha ao enviar voz. Tente novamente.', voiceUnsupported: 'A gravação de voz não é compatível com este navegador.',
    microphoneDenied: 'Permissão do microfone negada ou indisponível.', profile: 'Perfil', appearance: 'Aparência', security: 'Segurança',
    onlineFriends: '{count} amigos online • © Steve', uploadAvatar: 'Enviar avatar', uploading: 'Enviando...', preview: 'visualização',
    onlyImages: 'Somente PNG, JPEG e JPG são permitidos.', maxFile: 'Máximo 3 MB.', avatarUploaded: 'Avatar enviado. Clique em Salvar para aplicar.', avatarUploadFailed: 'Falha ao enviar avatar.',
    saveChanges: 'Salvar alterações', saving: 'Salvando...', cancel: 'Cancelar', avatarUrl: 'URL do avatar', autoFilled: '(preenchida após o envio)',
    currentPassword: 'Senha atual', newPassword: 'Nova senha', requiredPassword: 'Obrigatória apenas para mudar a senha', minPassword: 'Mínimo de 6 caracteres',
    changePassword: 'Alterar senha', updatePassword: 'Atualizar senha', theme: 'Tema', themeDescription: 'Alterne entre claro e escuro. Sua escolha é salva.',
    onlineStatus: 'Status online', onlineDescription: 'Permita que seus amigos vejam que você está online via WebSocket', activeOnline: 'Ativo • {count} online',
    profileUpdated: 'Perfil atualizado!', updateFailed: 'Falha na atualização', usernameMin: 'O nome de usuário deve ter pelo menos 3 caracteres.',
    enterCurrent: 'Digite a senha atual para definir uma nova.', crafted: 'Feito com', allRights: 'Todos os direitos reservados.',
    product: 'Produto', features: 'Recursos', support: 'Suporte', helpCenter: 'Central de ajuda', privacy: 'Privacidade', terms: 'Termos', stayConnected: 'Fique conectado',
    connectTagline: 'Conecte-se instantaneamente. Converse com segurança.', friendshipTagline: 'Feito para amizades reais.',
    toggleTheme: 'Alternar tema', sharedPhoto: 'Foto compartilhada', voiceMessage: 'Mensagem de voz', photo: 'Foto', uploadPhoto: 'Enviar foto', sendPhoto: 'Enviar foto', photoReady: 'Foto pronta', photoUploadFailed: 'Falha ao enviar foto. Tente novamente.', onlyImagesAllowed: 'Somente imagens PNG, JPEG, JPG, WEBP e GIF são permitidas.', maxImageSize: 'O tamanho máximo da imagem é de 10MB.',
    online: 'Online', busy: 'Ocupado', offline: 'Offline', myStatus: 'Meu status', statusOnline: 'Online (Disponível)', statusBusy: 'Ocupado (Não perturbe)', statusOffline: 'Offline (Invisível)',
    startVoiceCall: 'Iniciar chamada de voz', startVideoCall: 'Iniciar chamada de vídeo', incomingVoiceCall: 'Chamada de voz recebida', incomingVideoCall: 'Chamada de vídeo recebida', voiceCall: 'Chamada de voz', videoCall: 'Chamada de vídeo', ringing: 'Chamando...', calling: 'Ligando...', callMissed: 'Chamada perdida', callCompleted: 'Chamada encerrada', accept: 'Aceitar', decline: 'Recusar', endCall: 'Encerrar', callError: 'Não foi possível acessar o microfone ou a câmera.', acceptCallError: 'Não foi possível aceitar esta chamada.', connectionError: 'A conexão da chamada falhou.', mute: 'Mutar microfone', unmute: 'Desmutar microfone', turnCameraOff: 'Desligar câmera', turnCameraOn: 'Ligar câmera', switchCamera: 'Alternar câmera',
    chats: 'Conversas', noChats: 'Nenhuma conversa ainda', noChatsDesc: 'Pesquise um usuário acima para começar a conversar.',
    calls: 'Chamadas', noCalls: 'Nenhuma chamada ainda', noCallsDesc: 'Suas chamadas de voz e vídeo recentes aparecerão aqui.', missed: 'Perdida', received: 'Recebida', outgoing: 'Efetuada', allCalls: 'Todas', missedCalls: 'Perdidas', newCall: 'Nova chamada',
    installApp: 'Instalar GioChat', installAppDesc: 'Instale na sua tela inicial para acesso rápido e chamadas em tela cheia.', install: 'Instalar',
    continueWithGoogle: 'Continuar com o Google', or: 'OU'
  }
};

const friendCountLabels = {
  en: '{count} friends',
  de: '{count} Freunde',
  nl: '{count} vrienden',
  tw: 'nnamfo {count}',
  es: '{count} amigos',
  fr: '{count} amis',
  pt: '{count} amigos'
};

const validLanguages = ['en', 'de', 'nl', 'tw', 'es', 'fr', 'pt'];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return validLanguages.includes(saved) ? saved : 'en';
  });

  const value = useMemo(() => {
    const currentLang = validLanguages.includes(language) ? language : 'en';
    const activeDict = translations[currentLang] || translations.en;

    return {
      language: currentLang,
      setLanguage: (nextLanguage) => {
        const validated = validLanguages.includes(nextLanguage) ? nextLanguage : 'en';
        setLanguage(validated);
        localStorage.setItem('language', validated);
      },
      t: (key, values = {}) => {
        if (!key) return '';
        const raw = key === 'friendsCount'
          ? (friendCountLabels[currentLang] || friendCountLabels.en)
          : (activeDict?.[key] ?? translations.en?.[key] ?? key);

        if (typeof raw !== 'string') {
          return typeof raw === 'number' ? String(raw) : '';
        }
        return raw.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
      },
      languageOptions: [
        { value: 'en', flag: '🇬🇧', label: '🇬🇧 English' },
        { value: 'de', flag: '🇩🇪', label: '🇩🇪 Deutsch' },
        { value: 'nl', flag: '🇳🇱', label: '🇳🇱 Nederlands' },
        { value: 'tw', flag: '🇬🇭', label: '🇬🇭 Twi (Akan)' },
        { value: 'es', flag: '🇪🇸', label: '🇪🇸 Español' },
        { value: 'fr', flag: '🇫🇷', label: '🇫🇷 Français' },
        { value: 'pt', flag: '🇵🇹', label: '🇵🇹 Português' }
      ]
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, values = {}) => {
        if (!key) return '';
        const raw = translations.en?.[key] ?? key;
        if (typeof raw !== 'string') return String(raw);
        return raw.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
      },
      languageOptions: [
        { value: 'en', flag: '🇬🇧', label: '🇬🇧 English' },
        { value: 'de', flag: '🇩🇪', label: '🇩🇪 Deutsch' },
        { value: 'nl', flag: '🇳🇱', label: '🇳🇱 Nederlands' },
        { value: 'tw', flag: '🇬🇭', label: '🇬🇭 Twi (Akan)' },
        { value: 'es', flag: '🇪🇸', label: '🇪🇸 Español' },
        { value: 'fr', flag: '🇫🇷', label: '🇫🇷 Français' },
        { value: 'pt', flag: '🇵🇹', label: '🇵🇹 Português' }
      ]
    };
  }
  return ctx;
};
