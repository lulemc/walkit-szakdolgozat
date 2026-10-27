import React, { useState } from "react";
import type { RouteSummary } from "@/services/routeService";
import type { GroupWalkDetail } from "@/types/social";
import { CreateGroupWalkForm } from "./CreateGroupWalkForm";
import { SavedRoutePicker } from "./SavedRoutePicker";

interface CreateGroupWalkProps {
  /** A route chosen beforehand, e.g. just generated in the planner */
  initialRoute?: RouteSummary;
  onCreated: (walk: GroupWalkDetail) => void;
  onCancel: () => void;
}

/** Planning a group walk: pick a saved route (unless one was given), then the form */
export const CreateGroupWalk: React.FC<CreateGroupWalkProps> = ({
  initialRoute,
  onCreated,
  onCancel,
}) => {
  const [route, setRoute] = useState<RouteSummary | undefined>(initialRoute);

  if (!route) {
    return <SavedRoutePicker onSelect={setRoute} onBack={onCancel} />;
  }

  return (
    <CreateGroupWalkForm
      route={route}
      onCreated={onCreated}
      onCancel={onCancel}
      onChangeRoute={() => setRoute(undefined)}
    />
  );
};
