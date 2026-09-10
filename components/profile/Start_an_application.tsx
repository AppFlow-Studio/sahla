import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

const Start_an_application = ({ supabase }: { supabase: SupabaseClient }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const masjidConfig = useMasjidConfig();
  console.log(masjidConfig);
  return (
    <View className="flex-col justify-start items-start">
      <Text className="text-3xl font-bold text-primary-foreground">
        {t('profile.advertiseToCommunity')}
      </Text>
      <Text className="text-sm text-primary-foreground">
        {t('profile.advertiseToCommunityBody', { masjid: masjidConfig.displayName })}
      </Text>
      <View className="mt-2 w-full min-h-20 flex-row items-center justify-center rounded-xl bg-[#E8DCC4] p-4" />
    
    </View>
  );
};

export default Start_an_application;
