/**
 * 환자 이미지: 모든 환자에게 같은 사람 선 그림 (멘토 피드백: 캐릭터를 쓰지 않고, 빈 자리를 남기지 않는다).
 * 둥근 얼굴 + 웃는 표정 + 어깨선, 끝이 둥근 굵은 선 하나로 그린다 (사용자가 준 그림체 참고).
 * 마음 캐릭터는 진료 전 기록의 '환자가 고른 마음'에만 쓴다.
 */
export default function PatientAvatar({ size = 40 }: { size?: 32 | 40 | 48 }) {
  return (
    <svg className="patient-avatar" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="13" r="8" />
      <circle cx="13.2" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18.8" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12.8 15.6c1.8 1.6 4.6 1.6 6.4 0" />
      <path d="M9.6 19.6c-1.6 1.2-3 3.4-3.6 6" />
      <path d="M22.4 19.6c1.6 1.2 3 3.4 3.6 6" />
    </svg>
  );
}
