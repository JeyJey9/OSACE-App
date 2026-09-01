// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ExplorerView from '../views/ExplorerView.vue';
import LogsView from '../views/LogsView.vue';
import TrashView from '../views/TrashView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'root-explorer',
    component: ExplorerView,
    meta: { requiresAuth: true },
  },
  {
    path: '/folder/:id',
    name: 'folder-explorer',
    component: ExplorerView,
    meta: { requiresAuth: true },
  },
  {
    path: '/trash',
    name: 'trash',
    component: TrashView,
    meta: { requiresAuth: true },
  },
  {
    path: '/logs',
    name: 'audit-logs',
    component: LogsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('userToken');
  const userStr = localStorage.getItem('userData');
  let user = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {}
  }

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' });
  }

  if (to.meta.guestOnly && token) {
    return next({ name: 'root-explorer' });
  }

  if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    return next({ name: 'root-explorer' });
  }

  next();
});

export default router;
