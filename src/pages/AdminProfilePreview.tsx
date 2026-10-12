import { Navigate, useParams } from "react-router-dom";
import ProfilePage from "./ProfilePage";

const AdminProfilePreview = () => {
  const { profileId } = useParams<{ profileId: string }>();

  if (!profileId) {
    return <Navigate to="/admin" replace />;
  }

  return <ProfilePage previewProfileId={profileId} />;
};

export default AdminProfilePreview;
