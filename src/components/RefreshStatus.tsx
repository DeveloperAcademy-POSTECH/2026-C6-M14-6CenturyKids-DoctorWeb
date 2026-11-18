import { Button } from '@fluentui/react-components';
import { hm } from '../lib/dates.ts';
import Icon from './Icon.tsx';

export interface RefreshInfo {
  /** 마지막으로 기록을 읽어 온 시각 */
  updatedAt: Date;
  status: 'idle' | 'refreshing' | 'failed';
  onRefresh: () => void;
}

/** 상단 바의 마지막 업데이트 시각과 새로고침 버튼 */
export default function RefreshStatus({ updatedAt, status, onRefresh }: RefreshInfo) {
  return (
    <div className="refresh-status">
      {status === 'failed'
        ? <span className="refresh-failed" role="status">업데이트 실패 · {hm(updatedAt)} 기록</span>
        : <span className="refresh-time">{hm(updatedAt)} 업데이트</span>}
      <Button appearance="subtle" size="small" className="refresh-btn" icon={<Icon name="refresh" />}
        aria-label="기록 새로고침" title="기록 새로고침" aria-busy={status === 'refreshing'} onClick={onRefresh} />
    </div>
  );
}
