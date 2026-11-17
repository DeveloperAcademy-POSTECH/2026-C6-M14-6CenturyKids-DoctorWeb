import { MagnifyingGlass, Users, SidebarSimple, CalendarBlank, SignOut, Pulse, CaretRight, CaretDoubleRight, X, ClipboardText, Pill, ChatCircleDots, NoteBlank, ArrowUp, ArrowDown, ArrowRight, Minus, Question, Circle, CircleDashed } from '@phosphor-icons/react';

const icons = {
  search: MagnifyingGlass, patients: Users, panel: SidebarSimple, calendar: CalendarBlank,
  logout: SignOut, activity: Pulse, chevron: CaretRight, doubleChevron: CaretDoubleRight,
  close: X, records: ClipboardText, medicine: Pill, conversation: ChatCircleDots, note: NoteBlank,
  arrowUp: ArrowUp, arrowDown: ArrowDown, arrowRight: ArrowRight, minus: Minus, question: Question, circle: Circle, circleDashed: CircleDashed,
};

export default function Icon({ name, size = 18 }: { name: keyof typeof icons; size?: number }) {
  const Glyph = icons[name];
  return <Glyph size={size} weight="regular" aria-hidden="true" />;
}
