import { useState } from 'react';
import type { Patient } from '../domain/types.ts';
import { relative } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';
import PatientAvatar from './PatientAvatar.tsx';
import Icon from './Icon.tsx';
import { patientMeta } from './PatientHeader.tsx';
import { Button, Input } from '@fluentui/react-components';

interface Props {
  patients: Patient[];
  selectedId: string;
  today: Date;
  onSelect: (id: string) => void;
  onClose: () => void;
  modal?: boolean;
}

export default function PatientList({ patients, selectedId, today, onSelect, onClose, modal = false }: Props) {
  const [query, setQuery] = useState('');
  const shown = patients
    .filter((p) => !query.trim() || (p.name ?? '').includes(query.trim()))
    .sort((a, b) => (lastRecordDate(b)?.getTime() ?? 0) - (lastRecordDate(a)?.getTime() ?? 0));

  return (
    <section className="panel plist" aria-labelledby="h-plist" role={modal ? 'dialog' : undefined} aria-modal={modal || undefined}>
      <div className="panel-head">
        <h2 id="h-plist">환자</h2>
        <span className="hint">{patients.length}명</span>
        <Button className="list-collapse" appearance="subtle" size="small" icon={<Icon name="panel" />} aria-label="환자 목록 접기" onClick={onClose} />
      </div>
      <div className="panel-body">
        <div className="search-field"><label htmlFor="ptSearch">환자 이름</label><Input className="patient-search" contentBefore={<Icon name="search" />} id="ptSearch" name="patient-search" type="search" placeholder="이름으로 찾기" aria-label="환자 이름으로 찾기"
          autoComplete="off" value={query} onChange={(_, data) => setQuery(data.value)} /></div>
        <div className="list-caption"><span>최근 기록순</span></div>
        <div className="ptlist">
          {shown.length === 0 && <div className="search-empty" role="status"><Icon name="search" size={28} /><p>찾는 환자가 없어요</p><span>환자 이름을 다시 확인해 주세요.</span><Button appearance="subtle" size="small" onClick={() => setQuery('')}>검색 초기화</Button></div>}
          {shown.map((p) => {
            const last = lastRecordDate(p);
            return (
              <button key={p.id} type="button" className="pt" aria-current={p.id === selectedId} onClick={() => onSelect(p.id)}>
                <PatientAvatar size={32} />
                <span className="pt-main">
                  <span className="pt-row"><b>{p.name ?? '이름 없음'}</b><small>{last ? relative(last, today) : '기록 없음'}</small></span>
                  <small>{[patientMeta(p), p.cancer].filter(Boolean).join(' / ')}</small>

                </span>
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
}
