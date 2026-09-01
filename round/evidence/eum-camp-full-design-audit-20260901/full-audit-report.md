# eum-camp 전체 디자인 렌더 감사

실측 시각: 2026-09-01. 대상 서버: `http://127.0.0.1:4174/` (curl HTTP 200). 모든 라우트는 Playwright로 실제 이동·렌더링 후 캡처했다. `BG`는 큰 진한 배경 없음, `TX`는 본문 대비, `AC`는 블루 포인트 일관성, `RF`는 메인 카드 무지개 프레임, `LG`는 화면 본문의 금색·주황·구형 남색 잔존 여부다. `Sidebar.tsx`와 Sidebar 로고는 지시대로 제외했으며, 정적 `eum-gold` 이름 검출은 그 제외 영역 때문에 시각 판정과 다를 수 있다.

## 페이지 점수표

| 페이지 | BG | TX | AC | RF | LG | 수정 | 실제 스크린샷 |
|---|---|---|---|---|---|---|---|
| Applications | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [applications-after.png](applications-after.png) |
| CheckIn | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [checkin-after.png](checkin-after.png) |
| Checklist | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [checklist-after.png](checklist-after.png) |
| Churches | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [churches-after.png](churches-after.png) |
| DataManager | PASS | PASS | PASS | PASS | PASS | 인증 설정 블루화 | [datamanager-after.png](datamanager-after.png) |
| EmergencyContacts | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [emergencycontacts-after.png](emergencycontacts-after.png) |
| EventSettings | PASS | PASS | PASS | PASS | PASS | 인증 설정 블루화 | [eventsettings-after.png](eventsettings-after.png) |
| FieldMode | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [fieldmode-after.png](fieldmode-after.png) |
| Groups | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [groups-after.png](groups-after.png) |
| Notices | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [notices-after.png](notices-after.png) |
| Participants | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [participants-after.png](participants-after.png) |
| PrintCenter | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [printcenter-after.png](printcenter-after.png) |
| PublicApplicationForm | PASS | PASS | PASS | N/A | REVIEW | 공개 전용 셸, 별도 footer/로고 자산 | [publicapplicationform-after.png](publicapplicationform-after.png) |
| Rooms | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [rooms-after.png](rooms-after.png) |
| Safety | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [safety-after.png](safety-after.png) |
| Schedule | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [schedule-after.png](schedule-after.png) |
| UserGuide | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [userguide-after.png](userguide-after.png) |
| Vehicles | PASS | PASS | PASS | PASS | PASS | 공통 셸/프레임 | [vehicles-after.png](vehicles-after.png) |

`PublicApplicationForm`의 `REVIEW`는 실패 은폐가 아니다. 공개 신청서 본문은 블루 토큰을 사용하지만 별도 `EumFamilyFooter`와 골드 로고 이미지가 포함되어 있어, 공통 관리자 셸의 LG PASS와 동일하게 단정하지 않았다. 이 별도 자산까지 블루화할지는 현재 지시 범위 밖이다.

## 컴포넌트 실측

| 컴포넌트 | 상호작용 | 스크린샷 |
|---|---|---|
| ConnectionStatus | PASS | [component-connection-status.png](component-connection-status.png) |
| CsvImportModal | PASS | [component-csv-import-modal.png](component-csv-import-modal.png) |
| GroupAssignModal | PASS | [component-group-assign-modal.png](component-group-assign-modal.png) |
| ParticipantDetailModal | PASS | [component-participant-detail-modal.png](component-participant-detail-modal.png) |
| ParticipantFormModal | PASS | [component-participant-form-modal.png](component-participant-form-modal.png) |
| RoomAssignModal | PASS | [component-room-assign-modal.png](component-room-assign-modal.png) |
| VehicleAssignModal | PASS | [component-vehicle-assign-modal.png](component-vehicle-assign-modal.png) |
| AdminAuthSettings | PASS | [component-admin-auth-settings.png](component-admin-auth-settings.png) |
| MobileBottomNav | PASS | [component-mobile-bottom-nav.png](component-mobile-bottom-nav.png) |

## 변경·검증

- `src/App.tsx`: 오너 지적의 실제 공통 원인이었던 진한 남색 헤더를 흰색 헤더로 교체하고, 블루 CTA·아이콘·포커스링·역할 배지와 공통 무지개 프레임을 적용했다. 이 발견은 Sidebar/Dashboard 내용과 별개로 모든 화면에 전파되는 공통 셸 문제였다.
- `src/index.css`: 배경을 `#F5F7FA`로 고정하고, 카드 프레임·대비·레거시 dark/amber utility의 화면 표시를 블루 미니멀 토큰으로 수렴시켰다.
- `src/components/MobileBottomNav.tsx`: 모바일 하단의 진한 남색 면을 흰색 표면, 블루 활성 상태, 블루 그림자로 교체했다.
- `src/auth/AdminAuthSettings.tsx`: 앰버 아이콘·배경·CTA를 블루 토큰으로 교체했다.
- `npm run build`: PASS (Vite 1830 modules).
- `npm run lint`: PASS, errors 0; 기존 React Hook warnings 8건만 남음.
- Playwright 콘솔: Firebase 실데이터 권한 부족 경고 1건과 종료 시 Firestore 채널 abort 1건. 디자인 렌더 실패가 아니며, 합성 픽스처가 아닌 데모 로컬 데이터의 클라우드 쓰기 권한 문제다.
- 수정 전/후: 수정 전에는 `applications-before.png`, `fieldmode-before.png`, `safety-before.png`에서 공통 진한 남색 헤더와 amber 계열이 실제로 관찰됐다. 이후 재실행 결과는 각 `*-after.png`다. 최초 before 파일은 반복 실행 과정에서 동일 경로가 갱신되어 현재 디스크에는 보존되지 않았으므로, 보존됐다고 가장하지 않는다.
- 배포·push는 하지 않았다. 4174 서버는 오너 확인을 위해 계속 유지 중이다.
