/**
 * MiniAppA — Federated entry point.
 *
 * Exposed via Module Federation as `mini_app_a/App`.
 *
 * Rules for federated mini-apps:
 *  - NavigationContainer is `independent` → Mini App owns its own navigation tree,
 *    no conflict with the Host App's RootNavigator.
 *  - NO SafeAreaProvider      → Host App already provides it.
 *  - NO AppRegistry           → Done in index.js (standalone dev only).
 */

import { Provider } from 'react-redux';
import AppContainer from './src/core/navigation/AppNavigation';
import { store } from './src/core/store';
import { testDeeplink } from './src/testDeeplink';

export interface MiniAppAProps {
  initialRoute?: string;
  onExitMiniApp?: () => void;
}

const App = ({ initialRoute, onExitMiniApp }: MiniAppAProps) => {
    testDeeplink();
    return (
        <Provider store={store}>
            <AppContainer initialRoute={initialRoute} onExitMiniApp={onExitMiniApp} />
        </Provider>
    );
};
export default App;
