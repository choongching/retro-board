import { ColumnsSurface } from './ColumnsSurface';
import { SailboatSurface } from './SailboatSurface';
import type { Participant } from './StickyCard';
import type { Card, ColumnId, Format } from '../data';
import type { Profile } from '../lib/profile';

export function BoardSurface(props: {
  fmt: Format;
  cards: Card[];
  profile: Profile;
  participants: Participant[];
  accent?: string;
  onAdd: (col: ColumnId, text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onMove: (id: string, col: ColumnId, beforeId?: string) => void;
}) {
  if (props.fmt.id === 'sailboat') return <SailboatSurface {...props} />;
  return <ColumnsSurface {...props} />;
}
