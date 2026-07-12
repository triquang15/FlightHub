import { PageLoader, SpinnerLoader } from "./LoadingSystem";

export const Loader = ({ message = "Loading...", size = "default" }) => (
  <PageLoader message={message} className={size === "sm" ? "min-h-40" : ""} />
);

export { SpinnerLoader };
