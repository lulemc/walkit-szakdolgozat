import { PrimaryButton, ScreenContainer } from "@/components";
import AppSettings from "@/components/Settings/AppSettings";
import ProfileHeader from "@/components/Settings/ProfileHeader";
import ProfileSettings from "@/components/Settings/ProfileSettings";
import { useAuth } from "@/context/AuthProvider";
import { User } from "@/types/User";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Divider } from "react-native-paper";
import { userStorage } from "@/utils/userStorage";

export default function Settings() {
  const { logout } = useAuth();
  const { t } = useTranslation("settings");
  const [user, setUser] = useState<User | null>(null);

  const onLogout = async () => {
    await logout();
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await userStorage.getUser();
      setUser(currentUser ? currentUser : null);
    };

    fetchUser();
    return () => {
      setUser(null);
    };
  }, []);

  return (
    <ScreenContainer scrollable={true}>
      {user && <ProfileHeader {...user} />}
      <Divider />
      {user && (
        <ProfileSettings {...user} onProfileUpdate={handleProfileUpdate} />
      )}
      <Divider />
      <AppSettings />
      <PrimaryButton onPress={() => onLogout()}>{t("logout")}</PrimaryButton>
    </ScreenContainer>
  );
}
