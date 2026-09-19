package com.stevechat.dto;

public class GoogleAuthRequest {
    private String idToken;
    private String email;
    private String displayName;
    private String photoUrl;
    private String firebaseUid;

    public GoogleAuthRequest() {}

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }
}

