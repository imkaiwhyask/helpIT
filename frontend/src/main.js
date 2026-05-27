import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import VueApexCharts from 'vue3-apexcharts';
import './styles/md1-tokens.css';
import './assets/theme.css';
import './styles/element-plus-md1-overrides.css';
import './styles/portal-animations.css';
import { md1Ripple } from './directives/md1-ripple.js';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.directive('md1-ripple', md1Ripple);

for (const [name, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, comp);
}

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.use(VueApexCharts);

if (typeof window !== 'undefined') {
  window.Apex = {
    theme: { mode: 'light' },
    chart: { background: 'transparent', foreColor: 'rgba(0,0,0,0.54)', fontFamily: 'Roboto, sans-serif' },
    grid: { borderColor: 'rgba(0,0,0,0.12)' },
    tooltip: { theme: 'light' },
    xaxis: { labels: { style: { colors: 'rgba(0,0,0,0.54)', fontFamily: 'Roboto, sans-serif' } } },
    yaxis: { labels: { style: { colors: 'rgba(0,0,0,0.54)', fontFamily: 'Roboto, sans-serif' } } },
    legend: { labels: { colors: 'rgba(0,0,0,0.54)' } },
  };
}

app.mount('#app');
