import { ArrowClockwise, MagnifyingGlass, Users, SidebarSimple, CalendarBlank, SignOut, Pulse, CaretRight, CaretDoubleRight, X, ClipboardText, Pill, ChatCircleDots, NoteBlank, ArrowUp, ArrowDown, ArrowRight, Minus, Question, Circle, CircleDashed, User } from '@phosphor-icons/react';

const icons = {
  refresh: ArrowClockwise, search: MagnifyingGlass, patients: Users, panel: SidebarSimple, calendar: CalendarBlank,
  logout: SignOut, activity: Pulse, chevron: CaretRight, doubleChevron: CaretDoubleRight,
  close: X, records: ClipboardText, medicine: Pill, conversation: ChatCircleDots, note: NoteBlank,
  arrowUp: ArrowUp, arrowDown: ArrowDown, arrowRight: ArrowRight, minus: Minus, question: Question, circle: Circle, circleDashed: CircleDashed, user: User,
};

export default function Icon({ name, size = 18, weight = 'regular' }: { name: keyof typeof icons; size?: number; weight?: 'regular' | 'fill' }) {
  const Glyph = icons[name];
  return <Glyph size={size} weight={weight} aria-hidden="true" />;
}
