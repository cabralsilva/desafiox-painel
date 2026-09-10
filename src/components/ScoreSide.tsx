import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { ISlots } from "@/types/slot";
import { ITeam } from "@/types/team";

interface ScoreSideProps {
  disabled: boolean;
  slot: ISlots;
  name: string;
  score: number;
  onMinus: () => void;
  onPlus: () => void;
}

export function ScoreSide({
  disabled,
  slot,
  name,
  score,
  onMinus,
  onPlus }: ScoreSideProps) {
  const team = slot.team as ITeam | undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-[clamp(0.15rem,1.2vh,0.75rem)] overflow-hidden">
      {team?.image?.url ? (
        <img
          src={team.image.url}
          alt={team.name || ""}
          className="h-[clamp(1.25rem,8vh,2.5rem)] w-[clamp(1.25rem,8vh,2.5rem)] shrink-0 rounded-full object-contain"
        />
      ) : null}
      <p className="max-w-full shrink-0 truncate text-center text-[clamp(0.7rem,2.4vh,1.25rem)] font-black leading-tight">
        {name}
      </p>
      <div className="flex shrink-0 items-center gap-[clamp(0.25rem,1.5vh,0.75rem)]">
        <Button
          type="button"
          variant="secondary"
          className="h-[clamp(1.75rem,10vh,3.5rem)] w-[clamp(1.75rem,10vh,3.5rem)] p-0 [&_svg]:size-[45%]"
          onClick={onMinus}
          aria-label="Diminuir"
          disabled={disabled}
        >
          <Minus className="h-[45%] w-[45%]" />
        </Button>
        <span className="min-w-[2.25rem] text-center text-[clamp(1.75rem,8vh,3.75rem)] font-black leading-none tabular-nums text-highlight">
          {score}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="h-[clamp(1.75rem,10vh,3.5rem)] w-[clamp(1.75rem,10vh,3.5rem)] p-0 [&_svg]:size-[45%]"
          onClick={onPlus}
          aria-label="Adicionar"
          disabled={disabled}
        >
          <Plus className="h-[45%] w-[45%]" />
        </Button>
      </div>
    </div>
  );
}
