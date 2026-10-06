import { PostDetailScreen } from '@post/presentation/screens/PostDetailScreen';
import { PostManagementScreen } from '@post/presentation/screens/PostManagementScreen';
import {
  getStateFromPath,
  InitialState,
  NavigationContainer,
  NavigationContainerRef,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { RootStackParamList } from './navigation-types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ROOT_SCREEN = 'PostManagementScreen';
const LINKING_CONFIG = {
  screens: {
    PostManagementScreen: '',
    PostDetailScreen: 'post/:id',
  },
};

type TargetRoute = {
  name: keyof RootStackParamList;
  params?: object;
};

const getTargetRoute = (path: string): TargetRoute | undefined => {
  const state = getStateFromPath(path, LINKING_CONFIG);
  const target = state?.routes[state.routes.length - 1];

  if (!target || !(target.name in LINKING_CONFIG.screens)) {
    return undefined;
  }

  return {
    name: target.name as keyof RootStackParamList,
    params: target.params,
  };
};

const buildRoutes = (
  target: TargetRoute,
  currentHome?: { key?: string; params?: object },
) => {
  const home = currentHome
    ? { key: currentHome.key, name: ROOT_SCREEN, params: currentHome.params }
    : { name: ROOT_SCREEN };

  return target.name === ROOT_SCREEN ? [home] : [home, target];
};

// Cold Start: dựng sẵn ngăn xếp ban đầu để tránh chớp màn hình
const buildInitialState = (path?: string): InitialState | undefined => {
  if (!path) return undefined;
  const target = getTargetRoute(path);
  return target ? { routes: buildRoutes(target) } : undefined;
};

interface AppContainerProps {
  /** Deeplink path bên trong Mini App (vd: 'post/42') */
  initialRoute?: string;
  /** Callback dùng thoát khỏi trang chủ Mini App. */
  onExitMiniApp?: () => void;
}

const AppContainer = ({ initialRoute, onExitMiniApp }: AppContainerProps) => {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Cold Start: dựng sẵn ngăn xếp ngay từ lần render đầu
  const [initialState] = useState(() => buildInitialState(initialRoute));
  const handledPath = useRef(initialRoute);

  // Warm Start: Host đổi prop -> Soft Navigation, không unmount Mini App
  useEffect(() => {
    if (!initialRoute || initialRoute === handledPath.current) return;
    if (!navRef.current?.isReady()) return;

    handledPath.current = initialRoute;

    const target = getTargetRoute(initialRoute);
    if (!target) return;

    const currentHome = navRef.current
      .getRootState()
      ?.routes.find(r => r.name === ROOT_SCREEN);
    const routes = buildRoutes(target, currentHome);

    navRef.current.resetRoot({
      index: routes.length - 1,
      routes,
    });
  }, [initialRoute]);

  // Hardware Back (Android): pop nội bộ trước, hết màn hình mới gọi Host đóng container
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
      <NavigationContainer ref={navRef} initialState={initialState}>
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
