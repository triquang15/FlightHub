import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Grid3X3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyCabin = () => {
  const navigate = useNavigate();
  return (
    <Card className="border-2 border-dashed border-border/80 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
          <Grid3X3 className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No cabin inventory available
        </h3>
        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
          This instance has no generated cabin inventory yet. Check the aircraft cabin
          configuration, then regenerate or update the flight instance from the supported flow.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => navigate("/airline/aircraft")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure Aircraft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};




export default EmptyCabin
