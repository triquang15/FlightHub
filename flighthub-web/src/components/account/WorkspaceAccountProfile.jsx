import UserProfile from "@/pages/traveler/Profile/UserProfile";

const profileCopy = {
  admin: {
    eyebrow: "Platform administration",
    title: "Account profile",
    description: "Manage your administrator identity, contact details, and sign-in security.",
  },
  owner: {
    eyebrow: "Airline workspace",
    title: "Account profile",
    description: "Manage your owner identity, contact details, and sign-in security.",
  },
};

const WorkspaceAccountProfile = ({ variant = "admin" }) => (
  <UserProfile embedded {...profileCopy[variant]} />
);

export default WorkspaceAccountProfile;
