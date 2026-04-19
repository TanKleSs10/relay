import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";

type Props = {
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function MessagePagination({ canGoPrev, canGoNext, onPrev, onNext }: Props) {
  return (
    <div className="u-flex u-gap-1" style={{ marginTop: "1rem" }}>
      <Button variant="secondary" size="small" disabled={!canGoPrev} onClick={onPrev}>
        <ChevronLeft /> Anterior
      </Button>
      <Button variant="secondary" size="small" disabled={!canGoNext} onClick={onNext}>
        Siguiente <ChevronRight />
      </Button>
    </div>
  );
}
