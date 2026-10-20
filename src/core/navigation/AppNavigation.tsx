import { PostDetailScreen } from '@post/presentation/screens/PostDetailScreen';
import { PostManagementScreen } from '@post/presentation/screens/PostManagementScreen';
import {
  LinkingOptions,
  NavigationContainer,
  NavigationContainerRef,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef } from 'react';
import { BackHandler } from 'react-native';
import { RootStackParamList } from './navigation-types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ROOT_SCREEN = 'PostManagementScreen';

const LINKING_CONFIG: LinkingOptions<RootStackParamList>['config'] = {
  initialRouteName: ROOT_SCREEN,
  screens: {
    PostManagementScreen: '',
    PostDetailScreen: 'post/:id',
  },
};

interface AppContainerProps {
  /** Deeplink path bên trong Mini App (vd: 'post/42') */
  initialRoute?: string;
  /** Callback dùng thoát khỏi trang chủ Mini App. */
  onExitMiniApp?: () => void;
}

const AppContainer = ({ initialRoute, onExitMiniApp }: AppContainerProps) => {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeListenerRef = useRef<((url: string) => void) | null>(null);
  const handledRouteRef = useRef<string | undefined>(initialRoute);

  // Warm Start: Khi Host App truyền initialRoute mới vào lúc Mini App đang mở
  useEffect(() => {
    if (
      initialRoute &&
      initialRoute !== handledRouteRef.current &&
      routeListenerRef.current
    ) {
      handledRouteRef.current = initialRoute;
      routeListenerRef.current(initialRoute);
    }
  }, [initialRoute]);

  // Cấu hình LinkingOptions chính thống cho NavigationContainer
  const linking = useMemo<LinkingOptions<RootStackParamList>>(
    () => ({
      prefixes: ['/'],
      config: LINKING_CONFIG,
      // Cold start: lấy đường dẫn từ prop initialRoute ban đầu
      getInitialURL: () => initialRoute ?? null,
      // Warm start: đăng ký listener để nhận URL khi prop initialRoute thay đổi
      subscribe: (listener: (url: string) => void) => {
        routeListenerRef.current = listener;
        return () => {
          routeListenerRef.current = null;
        };
      },
    }),
    [],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        const nav = navRef.current;
        if (nav?.isReady() && nav.canGoBack()) {
          nav.goBack();
          return true;
        }
        if (onExitMiniApp) {
          onExitMiniApp();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [onExitMiniApp]);

  return (
    <NavigationIndependentTree>
      <NavigationContainer ref={navRef} linking={linking}>
        <Stack.Navigator
          initialRouteName={ROOT_SCREEN}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="PostManagementScreen"
            component={PostManagementScreen}
          />
          <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default AppContainer;

