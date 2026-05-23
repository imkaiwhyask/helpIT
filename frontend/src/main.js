import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import VueApexCharts from 'vue3-apexcharts';
import './assets/theme.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

for (const [name, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, comp);
}

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.use(VueApexCharts);

if (typeof window !== 'undefined') {
  window.Apex = {
    theme: { mode: 'dark' },
    chart: { background: 'transparent', foreColor: '#94a3b8' },
    grid: { borderColor: 'rgba(255,255,255,0.08)' },
    tooltip: { theme: 'dark' },
    xaxis: { labels: { style: { colors: 'rgba(241,245,249,0.55)' } } },
    yaxis: { labels: { style: { colors: 'rgba(241,245,249,0.55)' } } },
    legend: { labels: { colors: 'rgba(241,245,249,0.7)' } },
  };
}

app.mount('#app');
