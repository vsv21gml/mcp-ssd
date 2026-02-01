# SDisk MCP File Manager (Monorepo)

기업 사용자별 파일을 업로드하고 결재를 통해 활성화한 뒤, MCP 서버로 ChatGPT Apps에 연결되는 구조입니다.

## 구성
- `apps/account-server` (NestJS): SSO(SAML/OIDC) + OAuth 2.1 Authorization Server
- `apps/management-server` (NestJS): 파일 업로드/조회, 결재 연동, 환경설정, Role 관리
- `apps/mcp-server` (Node): MCP 서버(파일 목록/메타데이터 제공)
- `apps/web` (Next.js): 파일 목록/업로드 UI
- `packages/shared`: 공통 타입

## 파일 상태
- `PENDING`: 결재중
- `REJECTED`: 반려
- `ACTIVE`: 결재완료(사용 가능)
- `EXPIRED`: 만료(재결재 필요)

## OAuth 2.1 (ChatGPT Apps 연동 핵심)
ChatGPT Apps SDK의 OAuth 2.1 요구사항을 만족해야 합니다. 주요 포인트:
- MCP 서버에 `/.well-known/oauth-protected-resource` 제공
- Authorization Server에서 OAuth 메타데이터 제공(JWKS, PKCE `S256` 포함)
- `resource` 파라미터를 Authorization/Token 요청에 유지
- ChatGPT 리다이렉트 URI 허용

허용해야 하는 리다이렉트 URI 예시:
- `https://chatgpt.com/connector_platform_oauth_redirect`
- `https://platform.openai.com/apps-manage/oauth`

공식 가이드는 `https://developers.openai.com/apps-sdk/build/auth`를 참고하세요.

## 실행
1. Postgres 실행

```bash
docker compose up -d
```

2. 환경변수 복사

```bash
cp apps/account-server/.env.example apps/account-server/.env
cp apps/management-server/.env.example apps/management-server/.env
cp apps/mcp-server/.env.example apps/mcp-server/.env
cp apps/web/.env.example apps/web/.env
```

3. 의존성 설치

```bash
npm install
```

4. 개발 서버 실행

```bash
npm run dev
```

## Notes
- SSO 연동은 고객사 IdP 정보에 따라 `apps/account-server`의 환경변수(SAML/OIDC)를 채워야 합니다.
- 결재 API는 `APPROVAL_API_BASE`로 연동하며, 콜백은 `POST /files/approvals/callback`입니다.
- 만료일 계산은 `ENV` 테이블의 `FILE_EXPIRY_DAYS` 값(기본 30일)로 계산됩니다.
- MCP 서버는 Streamable HTTP(`/mcp`)로 구성되어 있습니다. ChatGPT Apps 등록 시 `https://<domain>/mcp` 형태로 등록하세요.
