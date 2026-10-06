import React, { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import {
  CommonActions,
  getStateFromPath,
  InitialState,
  NavigationContainer,
  NavigationContainerRef,
  NavigationIndependentTree,
  PathConfig,
  PathConfigMap,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigation-types';
import { PostDetailScreen } from '@post/presentation/screens/PostDetailScreen';
import { PostManagementScreen } from '@post/presentation/screens/PostManagementScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

type ScreenName = keyof RootStackParamList;

// path/parse lấy trực tiếp từ type của React Navigation, không khai báo lại
type ScreenDefinition = Pick<PathConfig<object>, 'path' | 'parse'> & {
  component: React.ComponentType<any>;
};

// 1. Registry khai báo (Declarative): thêm màn hình mới chỉ cần thêm 1 entry ở đây!
//    - path:  URL ánh xạ tới màn hình
//    - parse: ép kiểu param từ URL
const SCREENS: Record<ScreenName, ScreenDefinition> = {
  PostManagementScreen: {
    component: PostManagementScreen,
    path: '',
  },
  PostDetailScreen: {
    component: PostDetailScreen,
    path: 'post/:id',
    parse: { id: Number },
  },
};

const SCREEN_ENTRIES = Object.entries(SCREENS) as [ScreenName, ScreenDefinition][];

// Màn home của Mini App: luôn nằm đáy ngăn xếp khi vào bằng deeplink
const ROOT_SCREEN: ScreenName = 'PostManagementScreen';

// 2. Cấu hình linking được sinh ra từ registry (không phải viết tay lần 2)
const LINKING_CONFIG: { screens: PathConfigMap<object> } = {
  screens: Object.fromEntries(
    SCREEN_ENTRIES.map(([name, { path, parse }]) => [name, { path, parse }]),
  ),
};

// Parse URL -> route đích (getStateFromPath tự gộp path/query params + parse)
const resolveTargetRoute = (path: string) => {
  const state = getStateFromPath(path, LINKING_CONFIG);
  const target = state?.routes[state.routes.length - 1];
  return target && target.name in SCREENS ? target : undefined;
};

// 3. Ngăn xếp khi nhận deeplink luôn chỉ gồm: [Home của Mini App, màn đích]
//    (đích chính là Home thì chỉ có [Home]). Không cần lưu phả hệ từng màn hình.
const isRoot = (name: string) => name === ROOT_SCREEN;

// Cold Start: dựng sẵn ngăn xếp ngay từ lần render đầu (initialState), không chớp màn hình
const buildInitialState = (path?: string): InitialState | undefined => {
  if (!path) return undefined;

  const target = resolveTargetRoute(path);
  if (!target) return undefined;

  return {
    routes: isRoot(target.name)
      ? [{ name: ROOT_SCREEN }]
      : [{ name: ROOT_SCREEN }, { name: target.name, params: target.params }],
  };
};

// 4. Warm Start: mỗi lần nhận deeplink RESET ngăn xếp về [Home, đích].
//    Home đang có được GIỮ NGUYÊN key -> không remount, không mất dữ liệu/không chớp.
//    Màn đích luôn là route mới để tải dữ liệu theo params mới.
const navigateToPath = (
  nav: NavigationContainerRef<RootStackParamList>,
  path: string,
) => {
  const target = resolveTargetRoute(path);
  if (!target) return;

  const currentHome = (nav.getRootState()?.routes ?? [])[0];
  const home =
    currentHome?.name === ROOT_SCREEN
      ? { key: currentHome.key, name: ROOT_SCREEN, params: currentHome.params }
      : { name: ROOT_SCREEN };

  const routes = isRoot(target.name)
    ? [home]
    : [home, { name: target.name, params: target.params }];

  nav.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
};

interface AppContainerProps {
  /** Deeplink path bên trong Mini App (vd: 'post/42'). Host đổi prop này khi có deeplink mới. */
  initialRoute?: string;
  /** Host cung cấp để đóng container Mini App khi người dùng thoát khỏi trang chủ Mini App. */
  onExitMiniApp?: () => void;
}

const AppContainer = ({ initialRoute, onExitMiniApp }: AppContainerProps) => {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Cold Start: dựng sẵn ngăn xếp [Home, đích] ngay từ lần render đầu, không chớp màn hình
  const initialState = useRef(buildInitialState(initialRoute)).current;
  const handledPath = useRef(initialRoute);

  // Warm Start: Host chỉ đổi prop -> Soft Navigation, KHÔNG unmount Mini App
  useEffect(() => {
    if (!initialRoute || initialRoute === handledPath.current) return;
    if (!navRef.current?.isReady()) return;

    handledPath.current = initialRoute;
    navigateToPath(navRef.current, initialRoute);
  }, [initialRoute]);

  // Hardware Back (Android): pop nội bộ trước, hết màn hình mới trả quyền cho Host đóng container
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
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
    });
    return () => subscription.remove();
  }, [onExitMiniApp]);

  return (
    <NavigationIndependentTree>
      <NavigationContainer ref={navRef} initialState={initialState}>
        <Stack.Navigator
          initialRouteName={ROOT_SCREEN}
          screenOptions={{ headerShown: false }}
        >
          {SCREEN_ENTRIES.map(([name, { component }]) => (
            <Stack.Screen key={name} name={name} component={component} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default AppContainer;
