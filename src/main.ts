import { createApp } from "vue";
import HighchartsVue from "highcharts-vue";

import App from "./App.vue";
import "./style.css";

const app = createApp(App);

app.use(HighchartsVue);

app.mount("#app");