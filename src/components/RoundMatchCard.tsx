import { formatWeekdayDateTimeBR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { IMatch } from "@/types/championship-match";
import type { ISlots } from "@/types/slot";
import type { ITeam } from "@/types/team";

function slotTeam(slot: ISlots): ITeam | null {
  if (!slot.team || typeof slot.team === "string") return null;
  return slot.team;
}

export function slotTeamLabel(slot: ISlots): string {
  const team = slotTeam(slot);
  return team?.shortName || team?.name || slot.label || "A definir";
}

interface RoundMatchCardProps {
  match: IMatch;
  active: boolean;
  onSelect: (id: string) => void;
}

export function RoundMatchCard({ match, active, onSelect }: RoundMatchCardProps) {
  const home = slotTeam(match.slotHome);
  const away = slotTeam(match.slotAway);

  return (
    <button
      type="button"
      onClick={() => onSelect(match._id)}
      className={cn(
        "flex gap-1 h-full min-h-0 shrink-0 flex-col justify-center overflow-hidden rounded-2xl border px-3 py-1 text-center",
        active ? "border-primary bg-primary/15" : "border-border bg-card"
      )}
    >
      <span className="text-[8px] text-muted-foreground">
        {match.matchDateTime ? formatWeekdayDateTimeBR(match.matchDateTime) : "A definir data e hora"}
      </span>
      <div className="flex items-center justify-center gap-2">
        {home?.image?.url ? (
          <img src={home.image.url} alt={home.name || ""} className="h-6 w-6 rounded-full" />
        ) : null}
        <span className="truncate text-xs font-bold">{slotTeamLabel(match.slotHome)}</span>
        <span className="text-xs font-black tabular-nums text-highlight">
          {match.homeScore ?? ""} × {match.awayScore ?? ""}
        </span>
        <span className="truncate text-xs font-bold">{slotTeamLabel(match.slotAway)}</span>
        {away?.image?.url ? (
          <img src={away.image.url} alt={away.name || ""} className="h-6 w-6 rounded-full" />
        ) : null}
      </div>
    </button>
  );
}
