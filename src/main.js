import { createApp } from 'vue';
import App from './App.vue';
import SettingsWindow from './SettingsWindow.vue';
import WelcomeWindow from './WelcomeWindow.vue';
import './styles/main.css';

import { marked } from 'marked';
marked.setOptions({
  breaks: true,
  gfm: true
});

const urlParams = new URLSearchParams(window.location.search);
const windowType = urlParams.get('window');

let component;
switch (windowType) {
  case 'settings':
    component = SettingsWindow;
    break;
  case 'welcome':
    component = WelcomeWindow;
    break;
  default:
    component = App;
}

const app = createApp(component);
app.mount('#app');
