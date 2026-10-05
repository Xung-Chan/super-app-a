import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getStateFromPath, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './navigation-types';
import { PostDetailScreen } from '@post/presentation/screens/PostDetailScreen';
import { PostManagementScreen } from '@post/presentation/screens/PostManagementScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 1. Khai báo bảng ánh xạ URL (Declarative Route Map)
// Cực kỳ gọn: Thêm màn hình mới chỉ cần khai báo 1 dòng ở đây!
const MINI_APP_LINKING = {
  screens: {
    PostManagementScreen: '',
    PostDetailScreen: 'post/:id',
    // Sau này có màn hình mới:
    // UserProfileScreen: 'user/:userId',
  },
};

// 2. Custom Hook điều hướng tự động (Deep Link Navigator)
const useDeepLinkNavigator = (initialRoute?: string) => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!initialRoute) return;

    // React Navigation tự động parse path và gộp params
    const state = getStateFromPath(initialRoute, MINI_APP_LINKING);
    const targetRoute = state?.routes[state.routes.length - 1];

    if (targetRoute && targetRoute.name !== 'PostManagementScreen') {
      // Ép kiểu params nếu cần (ví dụ id: string -> number)
      const params = targetRoute.params as any;
      if (params?.id) {
        params.id = Number(params.id);
      }
      navigation.navigate(targetRoute.name, params);
    }
  }, [initialRoute, navigation]);
};

// 3. Navigator chính: Cực kỳ sạch, không có bất kỳ ternary operator nào!
const AppContainer = ({ initialRoute }: { initialRoute?: string }) => {
  useDeepLinkNavigator(initialRoute);

  return (
    <Stack.Navigator
      initialRouteName="PostManagementScreen" // Gốc của stack luôn là màn hình chính
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="PostManagementScreen" component={PostManagementScreen} />
      <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
      {/* Thêm bao nhiêu Screen tùy thích, không cần bất kỳ initialParams nào! */}
    </Stack.Navigator>
  );
};

export default AppContainer;
