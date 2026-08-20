# Steve Chat

Full-stack real-time chat app: Spring Boot + H2 backend, React (Vite) frontend, JWT auth, WebSocket messaging.

## Project layout

```
steve-chat/
├── backend/     Spring Boot app (Java 17, Maven)
├── frontend/    React app (Vite)
└── database/    schema.sql — reference schema for MySQL/PostgreSQL
```

## Running the backend

```
cd backend
mvn spring-boot:run
```

Starts on **http://localhost:8080**. Uses an in-memory H2 database (data resets every restart) — console at `/h2-console` (JDBC URL: `jdbc:h2:mem:stevechat`).

## Running the frontend

```
cd frontend
npm install
npm run dev
```

Starts on **http://localhost:5173**.

## International voice and video calls

WebRTC can connect directly when both users' networks allow it. For reliable calls between different countries, mobile carriers, and restrictive Wi-Fi networks, configure a public TURN relay before building the frontend. Use a managed TURN provider or run coturn on a server with a public IP.

Copy `frontend/.env.example` to `frontend/.env.production` and set:

```
VITE_TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:5349
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-credential
```

The TURN server must allow UDP/TCP port `3478` and TLS port `5349` when using `turns:`. Rebuild and redeploy the frontend after changing these values. Never commit real TURN credentials; browser builds expose these values to users by design, so use short-lived or restricted TURN credentials from your provider.

For this repository's single-image Fly deployment, pass the provider values as Docker build arguments:

```
fly deploy \
	--build-arg VITE_TURN_URLS="turn:turn.example.com:3478,turns:turn.example.com:5349" \
	--build-arg VITE_TURN_USERNAME="your-username" \
	--build-arg VITE_TURN_CREDENTIAL="your-credential"
```

The values come from your TURN provider dashboard. Common options include Metered, Twilio Network Traversal, Xirsys, or a coturn server on a public VPS. A normal app server URL, database password, or Fly secret is not a TURN URL and will not work here.

## How it works

1. **Register/Login** → `/auth/register`, `/auth/login` return a JWT, stored in `localStorage`.
2. **Friends list** → `/users/all` lists every other user. Click one to start (or reopen) a conversation via `/conversations/start`.
3. **Chat** → history loads once via `GET /conversations/{id}/messages`, then a STOMP-over-SockJS connection to `/ws` subscribes to `/topic/conversation.{id}` for live updates. Sending publishes to `/app/chat.send`; the server saves the message and broadcasts it to both participants.
4. **Settings** → `PUT /users/me` updates username, avatar URL, and (with current password) the password.

## Moving off H2

When you're ready for a real database, point `application.properties` at MySQL/PostgreSQL and run `database/schema.sql` against it (it has a one-line note for the Postgres identity-column syntax difference). Set `spring.jpa.hibernate.ddl-auto=validate` once the schema is in place.

## Notes

- Controllers talk directly to repositories — no service layer, matching the simple-architecture style used in Steve Forms / Fox Admin.
- JWT secret in `application.properties` is a dev placeholder — replace it before deploying anywhere real.
- CORS and the WebSocket's allowed origin are both hardcoded to `http://localhost:5173`; update both if you deploy the frontend elsewhere.
