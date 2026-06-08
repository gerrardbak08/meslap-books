# PWA 정적 자산 (www/)

이 폴더의 PWA 파일들은 `scripts/sync-web.js`가 덮어쓰지 않습니다
(sync-web.js는 `index.html`과 책 HTML만 복사). 따라서 빌드/동기화 후에도 보존됩니다.

## 파일
- `manifest.json` — 설치 매니페스트 (name/short_name/theme/아이콘)
- `sw.js` — 서비스워커 (앱 셸 cache-first + 네트워크 폴백, 캐시 키 `meslap-v1`)
- `icon.svg` — 마스터 벡터 아이콘 (금색 책 모티프 + M 모노그램, 딥그린 배경)
- `icon-maskable.svg` — maskable 안전영역용 벡터
- `icon-192.png`, `icon-512.png` — manifest `purpose:any`
- `icon-192-maskable.png`, `icon-512-maskable.png` — manifest `purpose:maskable`
- `icon-180.png` — iOS `apple-touch-icon`

## 아이콘 재생성
SVG를 수정한 뒤 PNG를 다시 만들려면 (rsvg-convert 필요):

```sh
cd www
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
rsvg-convert -w 180 -h 180 icon.svg -o icon-180.png
rsvg-convert -w 192 -h 192 icon-maskable.svg -o icon-192-maskable.png
rsvg-convert -w 512 -h 512 icon-maskable.svg -o icon-512-maskable.png
```

rsvg-convert가 없으면 `sips`(macOS) 또는 온라인 변환 도구로 동일 크기 PNG를 생성해
같은 파일명으로 교체하면 됩니다.

## 캐시 갱신
앱 셸을 갱신하려면 `sw.js`의 `CACHE_VERSION`을 올리세요 (예: `meslap-v1` → `meslap-v2`).
