import { Edit, Eye, LayoutGrid, Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatName = (value) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Unnamed cabin";

const CabinCard = ({ cabin, onViewSeatmap, onEdit, onCreateSeatMap }) => {
  const seatMap = cabin?.seatMap;
  const totalSeats = seatMap?.totalSeats ?? cabin.seatCount ?? 0;
  const mapReady = Boolean(cabin.seatMapId || seatMap?.id);

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{formatName(cabin.name)}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Cabin ID {cabin.id}</p>
          </div>
          <Badge variant={cabin.isActive === false ? "secondary" : "outline"}>
            {cabin.isActive === false ? "Inactive" : "Active"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Seats</div>
            <p className="mt-1 text-lg font-semibold">{totalSeats.toLocaleString()}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><LayoutGrid className="h-3.5 w-3.5" /> Seat map</div>
            <p className="mt-1 text-sm font-medium">{mapReady ? "Configured" : "Required"}</p>
          </div>
        </div>

        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Rows</dt><dd className="font-medium">{seatMap?.totalRows || "Not configured"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Seats per row</dt><dd className="font-medium">{seatMap?.seatsPerRow || cabin.seatsPerRow || "Varies"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bookable</dt><dd className="font-medium">{cabin.isBookable === false ? "No" : "Yes"}</dd></div>
        </dl>

        <div className="mt-auto flex gap-2 pt-2">
          {mapReady ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewSeatmap(cabin)}>
              <Eye /> Seat map
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={() => onCreateSeatMap(cabin)}>
              <Plus /> Create map
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit(cabin)} aria-label={`Edit ${formatName(cabin.name)}`}>
            <Edit />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CabinCard;
