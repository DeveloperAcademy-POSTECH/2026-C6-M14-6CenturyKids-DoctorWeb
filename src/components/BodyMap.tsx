import { BODY_REGIONS, locationName, scoreColor } from '../domain/labels.ts';
import type { PainRecord } from '../domain/types.ts';
// 피그마 디자인 시스템 Body Map (앞·뒤 한 장, 투명 바탕). 환자 앱 부위 고르기와 같은 그림이라 좌표가 같다
import bodyImage from '../assets/body.png';

/**
 * 몸 그림: 연회색 무대 위 흰 몸, 발밑 그림자(피그마 Body Map의 Shadow).
 * 표시 = 피그마 Body Map Marker 모양(흰 테 + 같은 색 번짐). 숫자 = 기록 횟수, 색 = 그 부위의 가장 높은 약 먹기 전 점수
 */
export default function BodyMap({ records, compact }: { records: PainRecord[]; compact?: boolean }) {
  const pins = new Map<string, { region: (typeof BODY_REGIONS)[number]; count: number; max: number }>();
  for (const r of records) {
    for (const loc of r.location) {
      const view = loc.bodyView === 'back' ? 'back' : 'front';
      const sides = loc.bodySide === 'both' ? ['left', 'right'] : [loc.bodySide];
      let hits = BODY_REGIONS.filter((g) => g.part === loc.bodyPart && g.view === view && sides.includes(g.side));
      if (!hits.length) hits = BODY_REGIONS.filter((g) => g.part === loc.bodyPart && g.view === view);
      for (const region of hits) {
        const key = `${region.part}.${region.side}.${region.view}`;
        const pin = pins.get(key) ?? { region, count: 0, max: 0 };
        pin.count += 1;
        pin.max = Math.max(pin.max, r.painBefore);
        pins.set(key, pin);
      }
    }
  }
  const list = [...pins.values()];
  return (
    <figure className={`map ${compact ? 'compact' : ''}`}>
      <div className="stage">
        <div className="body-map" role="img"
          aria-label={`통증 부위: ${list.map((p) => `${locationName(p.region.part, p.region.side)} ${p.count}건`).join(', ') || '없음'}`}>
          {/* 그림자는 그림 속 발끝 좌표(앞 27%, 뒤 73.5%, 아래 94%)에 맞춘다 */}
          <span className="floor" style={{ left: '27%' }} aria-hidden="true" />
          <span className="floor" style={{ left: '73.5%' }} aria-hidden="true" />
          <img src={bodyImage} alt="" />
          {list.map(({ region, count, max }) => (
            <span key={`${region.part}.${region.side}.${region.view}`} className="pin"
              style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, '--pin': scoreColor(max) } as React.CSSProperties}
              title={`${locationName(region.part, region.side)} ${count}건 기록, 가장 높을 때 ${max}점`}>{count}</span>
          ))}
        </div>
        <div className="faces" aria-hidden="true"><span>앞면</span><span>뒷면</span></div>
      </div>
      {/* 한눈에 보기에서는 옆 슬로프 그래프의 세로 눈금이 점수 색 설명을 대신한다 */}
      {!compact && (
        <figcaption className="map-legend">
          <div className="scale"><span>0점</span><span className="bar" /><span>10점</span></div>
          <p className="hint">원 안 숫자는 기록 횟수예요. 원 색은 그 부위에서 가장 높았던 약 먹기 전 점수예요.</p>
        </figcaption>
      )}
    </figure>
  );
}
