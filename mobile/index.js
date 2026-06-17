import { AppRegistry } from 'react-native'
import App from './src/App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName || 'EcoLinkAfrica', () => App)

// Expo SDK 54+ expects the default export or a "main" registration
AppRegistry.registerComponent('main', () => App)
