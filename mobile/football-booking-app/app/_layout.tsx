import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { isLoading, token, user } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.darkBg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Màn hình luôn khả dụng — kể cả Guest chưa đăng nhập */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: true, title: 'Đặt Sân' }} />

        {/* Màn hình yêu cầu đăng nhập */}
        {token && (
          <>
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="payment" options={{ headerShown: true, title: 'Thanh Toán' }} />
            {user?.role === 'fieldOwner' && (
              <Stack.Screen name="field-owner" options={{ headerShown: false, title: 'Sân Của Tôi' }} />
            )}
            {user?.role === 'admin' && (
              <>
                <Stack.Screen name="admin" options={{ headerShown: false, title: 'Quản Lý Sân' }} />
                <Stack.Screen name="admin-analytics" options={{ headerShown: true, title: 'Thống Kê' }} />
                <Stack.Screen name="admin-users" options={{ headerShown: false, title: 'Quản Lý Tài Khoản' }} />
              </>
            )}
          </>
        )}
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
