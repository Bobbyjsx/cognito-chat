# Cognito-Chat Frontend Project Standards & Architecture

Cognito-Chat is the Next.js App Router frontend for the FastAPI backend (`nifty-archimedes`).

## 🏗️ Architecture & Data Access Layer (DAL) Pattern

All data fetching and mutations strictly follow the **KeySentry DAL Pattern**:

1. **UI Components (`components/modules` & `components/ui`):**
   - Never call server actions or fetch directly.
   - Consume custom TanStack React Query hooks.
   - Use Sonner toasts (`toast.success` / `notifyServerError`) for feedback.

2. **Custom Hooks (`hooks/data/use[Domain]/[resource].ts`):**
   - Use TanStack React Query (`useQuery`, `useMutation`) for caching, refetching, and state management.
   - Wrap Server Actions.

3. **Server Actions (`lib/actions/[domain].ts`):**
   - "use server" functions that serve as the bridge to the Python backend API (`nifty-archimedes`).
   - Catch errors via `throwServerActionError(err)`.

4. **Global API Client (`lib/axios.ts`):**
   - Server Actions ONLY use the globally configured `api` Axios instance.
   - Automatically injects Auth Bearer tokens (via NextAuth session).
   - Transforms payloads: request parameters/body converted to `snake_case`, response objects converted to `camelCase`.
   - Intercepts 401s to handle session refresh / logout.

---

## 🔄 Case Transformation Standards

- **Backend / Database API:** `snake_case` (e.g. `session_id`, `tokens_used`, `token_limit`).
- **Frontend / Application Code:** `camelCase` (e.g. `sessionId`, `tokensUsed`, `tokenLimit`).
- Server actions return `camelCase` automatically via `keysToCamel` in the Axios interceptor.

---

## 📁 Directory Structure

```
/src
  ├── app/
  │   ├── (auth)/
  │   │   ├── login/
  │   │   ├── register/
  │   │   └── forgot-password/
  │   ├── api/auth/[...nextauth]/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── providers.tsx
  ├── components/
  │   ├── ui/               # Primitive UI components (button, input, card, avatar, badge, etc.)
  │   └── modules/          # Feature components (auth forms, chat window, chat sidebar, token card, navbar)
  ├── hooks/
  │   └── data/
  │       ├── useAuth/      # Query/Mutation hooks for auth & profile
  │       └── useChats/     # Query/Mutation hooks for chat sessions & messaging
  ├── lib/
  │   ├── actions/          # Next.js Server Actions (auth.ts, chats.ts)
  │   ├── axios.ts          # Global Axios instance with interceptors
  │   ├── case-transform.ts # Utility for snake_case <-> camelCase conversions
  │   ├── server-error.ts   # Server action error parser and Sonner toast notifier
  │   └── utils.ts          # Tailwind class merger (cn)
  ├── types/                # TypeScript interface definitions (camelCase)
  ├── auth.ts               # NextAuth setup with CredentialsProvider
  └── middleware.ts         # NextAuth route protection middleware
```
